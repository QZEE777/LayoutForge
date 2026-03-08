/**
 * POST { jobId, fileSizeMB? } — fetch report from preflight API and save as checker result.
 * Used when the client uploaded directly to preflight (files > 4 MB) to avoid Vercel body limit.
 */
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { saveUpload, updateMeta, type StoredManuscript } from "@/lib/storage";
import { getGutterInches } from "@/lib/kdpConfig";

interface PreflightReport {
  status: string;
  errors: Array<{ page: number; rule_id: string; severity: string; message: string; bbox?: number[] | null }>;
  warnings: Array<{ page: number; rule_id: string; severity: string; message: string; bbox?: number[] | null }>;
  summary: { total_pages: number; error_count: number; warning_count: number; rules_checked: number };
  page_issues?: Array<{ page: number; rule_id: string; severity: string; message: string; bbox: number[] | null }>;
}

function buildReportFromPreflightOnly(preflight: PreflightReport, fileSizeMB?: number) {
  const issues = [
    ...preflight.errors.map((e) => `[p.${e.page}] ${e.message}`),
    ...preflight.warnings.map((w) => `[p.${w.page}] ${w.message}`),
  ];
  const recommendations =
    preflight.status === "PASS"
      ? ["Full KDP preflight (26 rules) passed. No errors found."]
      : ["Fix the issues above before uploading to KDP."];
  const page_issues = preflight.page_issues ?? [
    ...preflight.errors.map((e) => ({ page: e.page, rule_id: e.rule_id, severity: e.severity, message: e.message, bbox: e.bbox ?? null })),
    ...preflight.warnings.map((w) => ({ page: w.page, rule_id: w.rule_id, severity: w.severity, message: w.message, bbox: w.bbox ?? null })),
  ];
  return {
    outputType: "checker" as const,
    chaptersDetected: 0,
    issues,
    fontUsed: "",
    trimSize: "",
    pageCount: preflight.summary.total_pages,
    trimDetected: "—",
    trimMatchKDP: false,
    kdpTrimName: null as string | null,
    recommendations,
    fileSizeMB: fileSizeMB ?? undefined,
    recommendedGutterInches: getGutterInches(preflight.summary.total_pages),
    page_issues,
  };
}

export async function POST(request: NextRequest) {
  try {
    const baseUrl = process.env.KDP_PREFLIGHT_API_URL?.trim();
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Preflight not configured", message: "KDP_PREFLIGHT_API_URL is not set." },
        { status: 503 }
      );
    }
    let body: { jobId?: string; fileSizeMB?: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid body", message: "Send JSON with jobId (preflight job id)." },
        { status: 400 }
      );
    }
    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    if (!jobId) {
      return NextResponse.json(
        { error: "Missing jobId", message: "Send JSON with jobId." },
        { status: 400 }
      );
    }
    const fileSizeMB = typeof body.fileSizeMB === "number" ? body.fileSizeMB : undefined;
    const url = baseUrl.replace(/\/$/, "");
    const res = await fetch(`${url}/report/${encodeURIComponent(jobId)}`);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Preflight report failed", message: `Could not get report (${res.status}).` },
        { status: 502 }
      );
    }
    const preflight = (await res.json()) as PreflightReport;
    const report = buildReportFromPreflightOnly(preflight, fileSizeMB);
    report.hasPdfPreview = true;
    report.pdfSourceUrl = `${url}/file/${encodeURIComponent(jobId)}`;
    const doc = await PDFDocument.create();
    doc.addPage([612, 792]);
    const minimalPdf = Buffer.from(await doc.save());
    const stored = await saveUpload(minimalPdf, "preflight-report.pdf", "application/pdf");
    await updateMeta(stored.id, { processingReport: report as StoredManuscript["processingReport"] });
    return NextResponse.json({ success: true, id: stored.id });
  } catch (e) {
    console.error("[kdp-pdf-check-from-preflight]", e);
    return NextResponse.json(
      { error: "Internal error", message: e instanceof Error ? e.message : "Failed to save report." },
      { status: 500 }
    );
  }
}
