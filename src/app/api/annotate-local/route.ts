import { NextRequest, NextResponse } from "next/server";
import { getStored } from "@/lib/storage";
import { annotateCheckerPdf } from "@/lib/annotatePdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { downloadId?: string } | null;
    const downloadId = body?.downloadId?.trim() ?? "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(downloadId)) {
      return NextResponse.json({ error: "Invalid downloadId" }, { status: 400 });
    }

    const meta = await getStored(downloadId);
    if (!meta) return NextResponse.json({ error: "Download not found" }, { status: 404 });
    if (!meta.processingReport || meta.processingReport.outputType !== "checker") {
      return NextResponse.json({ error: "Not a checker report" }, { status: 400 });
    }

    console.log("ANNOTATED URL BEFORE:", meta.annotatedPdfDownloadUrl ?? "none");

    const result = await annotateCheckerPdf(downloadId);
    if (!result) {
      return NextResponse.json({ error: "Annotation failed or source PDF not found" }, { status: 500 });
    }

    console.log("ANNOTATED URL AFTER:", result.annotatedPdfDownloadUrl);

    return NextResponse.json({
      success: true,
      downloadId,
      status: "ready",
      annotatedPdfDownloadUrl: result.annotatedPdfDownloadUrl,
    });
  } catch (e) {
    console.error("[annotate-local]", e);
    return NextResponse.json(
      { error: "Local annotation failed", message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
