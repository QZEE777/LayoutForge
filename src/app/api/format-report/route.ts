import { NextRequest, NextResponse } from "next/server";
import { getStored } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

async function buildReportFromStored(meta: Awaited<ReturnType<typeof getStored>>) {
  if (!meta) return null;

  const report = meta.processingReport
    ? {
        ...meta.processingReport,
        outputFilename: meta.outputFilename,
        ...(meta.annotatedPdfDownloadUrl != null && { annotatedPdfDownloadUrl: meta.annotatedPdfDownloadUrl }),
        ...(meta.annotatedPdfStatus != null && { annotatedPdfStatus: meta.annotatedPdfStatus }),
      }
    : meta.outputFilename
      ? {
          chaptersDetected: 0,
          issues: [],
          fontUsed: "",
          trimSize: "",
          outputFilename: meta.outputFilename,
          outputType: meta.mimeType?.includes("epub") ? "epub" : "pdf",
        }
      : null;

  if (!report) return null;
  return report;
}

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing id", message: "Provide ?id=..." },
        { status: 400 }
      );
    }

    // Validate UUID shape before interpolating into PostgREST .or() filter
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { error: "Invalid id", message: "id must be a valid UUID." },
        { status: 400 }
      );
    }

    let meta = await getStored(id);
    let report = await buildReportFromStored(meta);

    // Defensive fallback: `id` may be print_ready_checks.id (check row) or result_download_id (stored report id).
    // Resolve to result_download_id, then load metadata.
    if (!report) {
      try {
        const { data: prcRow } = await supabase
          .from("print_ready_checks")
          .select("result_download_id")
          .or(`id.eq.${id},result_download_id.eq.${id}`)
          .maybeSingle();

        const resultDownloadId = prcRow?.result_download_id;
        if (typeof resultDownloadId === "string" && resultDownloadId) {
          meta = await getStored(resultDownloadId);
          report = await buildReportFromStored(meta);
        }
      } catch {
        // ignore fallback errors; preserve original 404 behavior
      }
    }

    if (!report) {
      return NextResponse.json(
        { error: "Not found", message: "No processing report for this file." },
        { status: 404 }
      );
    }
    // Strip outputFilename for unpaid downloads — the download route enforces
    // payment_confirmed independently, but no need to leak the filename to unpaid callers.
    const isPaid = meta?.payment_confirmed === true;
    const safeReport = isPaid ? report : { ...report, outputFilename: undefined };

    return NextResponse.json({
      success: true,
      report: safeReport,
    });
  } catch (e) {
    console.error("[format-report]", e);
    return NextResponse.json(
      { error: "Internal error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
