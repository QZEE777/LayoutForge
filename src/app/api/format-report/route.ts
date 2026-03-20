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

    let meta = await getStored(id);
    let report = await buildReportFromStored(meta);

    // Defensive fallback: if `id` is actually a `print_ready_checks.id` (check id),
    // then follow result_download_id to find the real stored metadata.
    if (!report) {
      try {
        const { data: prcRow } = await supabase
          .from("print_ready_checks")
          .select("result_download_id")
          .eq("id", id)
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
    return NextResponse.json({
      success: true,
      report,
    });
  } catch (e) {
    console.error("[format-report]", e);
    return NextResponse.json(
      { error: "Internal error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
