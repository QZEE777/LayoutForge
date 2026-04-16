import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import { getStored, updateAnnotatedState } from "@/lib/storage";
import { getFileByKey, uploadFile, getSignedDownloadUrl } from "@/lib/r2Storage";
import { sendAnnotatedEmailIfReady } from "@/lib/annotatedEmail";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type PageIssue = {
  page: number;
  severity?: string;
  rule_id?: string;
  message?: string;
  bbox?: number[] | null;
};

type EnrichedIssue = {
  page?: number;
  severity?: string;
  rule_id?: string;
  humanMessage?: string;
};

type CriticalIssue = {
  page: number;
  severity: "blocker" | "critical";
  ruleId: string;
  message: string;
  bbox: number[] | null;
};

const MAX_ANNOTATIONS_TOTAL = 10;

function isCriticalSeverity(raw?: string): boolean {
  const s = String(raw ?? "").toLowerCase().trim();
  return s === "blocker" || s === "critical";
}

function severityRank(severity: "blocker" | "critical"): number {
  return severity === "blocker" ? 0 : 1;
}

function normalizeCriticalIssues(
  pageIssues: PageIssue[],
  enrichedIssues: EnrichedIssue[],
  pageCount: number
): CriticalIssue[] {
  const out: CriticalIssue[] = [];

  for (const issue of pageIssues) {
    if (!isCriticalSeverity(issue.severity)) continue;
    const page = Number(issue.page);
    if (!Number.isFinite(page) || page < 1 || page > pageCount) continue;
    out.push({
      page,
      severity: String(issue.severity).toLowerCase() === "blocker" ? "blocker" : "critical",
      ruleId: String(issue.rule_id ?? "critical_issue").trim() || "critical_issue",
      message: issue.message?.trim() || "Formatting issue detected",
      bbox: Array.isArray(issue.bbox) && issue.bbox.length >= 4 ? issue.bbox : null,
    });
  }

  // Fallback path: enriched issues when preflight page_issues lacks entries.
  for (const issue of enrichedIssues) {
    if (!isCriticalSeverity(issue.severity)) continue;
    const page = Number(issue.page);
    if (!Number.isFinite(page) || page < 1 || page > pageCount) continue;
    out.push({
      page,
      severity: String(issue.severity).toLowerCase() === "blocker" ? "blocker" : "critical",
      ruleId: String(issue.rule_id ?? "critical_issue").trim() || "critical_issue",
      message: issue.humanMessage?.trim() || "Formatting issue detected",
      bbox: null,
    });
  }

  return out;
}

function drawIssueMarkers(
  doc: PDFDocument,
  criticalIssues: CriticalIssue[],
) : { globalBannerCount: number; boxCount: number } {
  const pages = doc.getPages();
  const pageCount = pages.length;
  if (!pageCount) return { globalBannerCount: 0, boxCount: 0 };

  const bySignature = new Map<string, { issue: CriticalIssue; pages: Set<number> }>();
  for (const issue of criticalIssues) {
    const signature = `${issue.ruleId}::${issue.message.toLowerCase()}`;
    const existing = bySignature.get(signature) ?? { issue, pages: new Set<number>() };
    existing.pages.add(issue.page);
    // Keep highest severity exemplar.
    if (severityRank(issue.severity) < severityRank(existing.issue.severity)) existing.issue = issue;
    bySignature.set(signature, existing);
  }

  const globalThreshold = Math.max(1, Math.ceil(pageCount * 0.8));
  const globalSignatures = new Set(
    [...bySignature.entries()]
      .filter(([, data]) => data.pages.size >= globalThreshold)
      .map(([sig]) => sig),
  );

  let globalBannerCount = 0;
  if (globalSignatures.size > 0) {
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    let y = Math.max(18, height - 48);
    for (const sig of globalSignatures) {
      const data = bySignature.get(sig);
      if (!data) continue;
      firstPage.drawRectangle({
        x: 18,
        y,
        width: Math.max(120, width - 36),
        height: 24,
        borderColor: rgb(1, 0, 0),
        borderWidth: 2,
      });
      firstPage.drawText(`WARN: Issue affects all pages: ${data.issue.message}`, {
        x: 24,
        y: y + 7,
        size: 9,
        color: rgb(1, 0, 0),
      });
      y = Math.max(18, y - 28);
      globalBannerCount += 1;
    }
  }

  const individual = criticalIssues
    .filter((i) => {
      const sig = `${i.ruleId}::${i.message.toLowerCase()}`;
      return !globalSignatures.has(sig);
    })
    .filter((i) => Array.isArray(i.bbox) && i.bbox.length >= 4)
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .slice(0, MAX_ANNOTATIONS_TOTAL);

  let boxCount = 0;
  for (const issue of individual) {
    const page = pages[issue.page - 1];
    if (!page || !issue.bbox) continue;
    const { width, height } = page.getSize();
    const [xRaw, yRaw, wRaw, hRaw] = issue.bbox;
    const x = Math.max(0, Number(xRaw) || 0);
    const y = Math.max(0, Number(yRaw) || 0);
    const w = Math.max(8, Number(wRaw) || 0);
    const h = Math.max(8, Number(hRaw) || 0);
    page.drawRectangle({
      x,
      y,
      width: Math.min(w, width - x),
      height: Math.min(h, height - y),
      borderColor: rgb(1, 0, 0),
      borderWidth: 2,
    });
    boxCount += 1;
  }

  return { globalBannerCount, boxCount };
}

async function resolveSourcePdfKey(downloadId: string): Promise<string | null> {
  const { data: row } = await supabase
    .from("print_ready_checks")
    .select("our_job_id")
    .eq("result_download_id", downloadId)
    .maybeSingle();

  const ourJobId = row?.our_job_id;
  if (typeof ourJobId === "string" && ourJobId.trim()) {
    return `uploads/${ourJobId.trim()}.pdf`;
  }

  // Fallback: use sourcePdfKey saved at scan time (the original uploaded PDF in R2).
  const meta = await getStored(downloadId);
  if (meta?.sourcePdfKey) return meta.sourcePdfKey;
  if (!meta?.storedPath) return null;
  return meta.storedPath;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { downloadId?: string } | null;
    const downloadId = body?.downloadId?.trim() ?? "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(downloadId)) {
      return NextResponse.json({ error: "Invalid downloadId" }, { status: 400 });
    }

    const meta = await getStored(downloadId);
    if (!meta) return NextResponse.json({ error: "Download not found" }, { status: 404 });
    if (!meta.processingReport || (meta.processingReport.outputType !== "checker")) {
      return NextResponse.json({ error: "Not a checker report" }, { status: 400 });
    }

    const sourceKey = await resolveSourcePdfKey(downloadId);
    if (!sourceKey) {
      return NextResponse.json({ error: "Source PDF key not found" }, { status: 404 });
    }

    await updateAnnotatedState(downloadId, { status: "processing" });

    const sourcePdf = await getFileByKey(sourceKey);
    const doc = await PDFDocument.load(sourcePdf, { updateMetadata: false });
    const pageCount = doc.getPageCount();

    const pageIssues = Array.isArray(meta.processingReport.page_issues)
      ? meta.processingReport.page_issues
      : [];
    const enrichedIssues = Array.isArray(meta.processingReport.issuesEnriched)
      ? meta.processingReport.issuesEnriched
      : [];
    const criticalIssues = normalizeCriticalIssues(pageIssues, enrichedIssues, pageCount);

    const applied = drawIssueMarkers(doc, criticalIssues);
    const annotatedBytes = await doc.save();
    const annotatedBuffer = Buffer.from(annotatedBytes);

    const annotatedFilename = "annotated-local.pdf";
    await uploadFile(downloadId, annotatedFilename, annotatedBuffer);
    const annotatedPdfDownloadUrl = await getSignedDownloadUrl(downloadId, annotatedFilename);

    await updateAnnotatedState(downloadId, {
      status: "ready",
      annotatedPdfDownloadUrl,
    });

    let sentNow = false;
    // Force email send with error handling
    try {
      const emailResult = await sendAnnotatedEmailIfReady(downloadId);
      sentNow = emailResult;
      console.log("[annotate-local] Email send result:", emailResult);
    } catch (emailError) {
      console.error("[annotate-local] Email send failed:", emailError);
      // Still mark as ready so user can access via download page if email fails
    }

    return NextResponse.json({
      success: true,
      downloadId,
      status: sentNow ? "delivered" : "ready",
      sentNow,
      annotatedPdfDownloadUrl,
      sourceKey,
      markersApplied: applied.boxCount + applied.globalBannerCount,
      globalBannerCount: applied.globalBannerCount,
      boxedIssueCount: applied.boxCount,
    });
  } catch (e) {
    console.error("[annotate-local]", e);
    return NextResponse.json(
      { error: "Local annotation failed", message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
