import { NextRequest, NextResponse } from "next/server";
import { getStored } from "@/lib/storage";

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

    const meta = await getStored(id);
    if (!meta) {
      return NextResponse.json(
        { error: "Not found", message: "No processing report for this file." },
        { status: 404 }
      );
    }

    const report = meta.processingReport
      ? {
          ...meta.processingReport,
          outputFilename: meta.outputFilename,
          ...(meta.annotatedPdfUrl != null && { annotatedPdfUrl: meta.annotatedPdfUrl }),
          ...(meta.annotatedPdfStatus != null && { annotatedPdfStatus: meta.annotatedPdfStatus }),
        }
      : meta.outputFilename
        ? { chaptersDetected: 0, issues: [], fontUsed: "", trimSize: "", outputFilename: meta.outputFilename, outputType: meta.mimeType?.includes("epub") ? "epub" : "pdf" }
        : null;
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
