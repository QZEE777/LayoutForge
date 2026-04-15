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
  message?: string;
  bbox?: number[] | null;
};

type EnrichedIssue = {
  page?: number;
  humanMessage?: string;
};

function normalizeIssueGroups(
  pageIssues: PageIssue[],
  enrichedIssues: EnrichedIssue[],
  pageCount: number,
): Map<number, Array<{ message: string; bbox: number[] | null }>> {
  const byPage = new Map<number, Array<{ message: string; bbox: number[] | null }>>();

  for (const issue of pageIssues) {
    const page = Number(issue.page);
    if (!Number.isFinite(page) || page < 1 || page > pageCount) continue;
    const arr = byPage.get(page) ?? [];
    arr.push({
      message: issue.message?.trim() || "Formatting issue detected",
      bbox: Array.isArray(issue.bbox) && issue.bbox.length >= 4 ? issue.bbox : null,
    });
    byPage.set(page, arr);
  }

  // Fallback path: issuesEnriched contains page + message but no bbox.
  for (const issue of enrichedIssues) {
    const page = Number(issue.page);
    if (!Number.isFinite(page) || page < 1 || page > pageCount) continue;
    const arr = byPage.get(page) ?? [];
    arr.push({
      message: issue.humanMessage?.trim() || "Formatting issue detected",
      bbox: null,
    });
    byPage.set(page, arr);
  }

  return byPage;
}

function drawIssueMarkers(
  doc: PDFDocument,
  byPage: Map<number, Array<{ message: string; bbox: number[] | null }>>,
) {
  const pages = doc.getPages();
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const pageNumber = pageIndex + 1;
    const issues = byPage.get(pageNumber);
    if (!issues || issues.length === 0) continue;

    const page = pages[pageIndex];
    const { width, height } = page.getSize();

    let fallbackY = height - 48;
    for (const issue of issues) {
      if (issue.bbox) {
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
          borderColor: rgb(0.9, 0.12, 0.12),
          borderWidth: 2,
          color: rgb(1, 0.9, 0.9),
          opacity: 0.18,
        });
      } else {
        // If bbox is unavailable, place a compact marker ribbon near top.
        const markerWidth = Math.min(width - 36, 320);
        const markerHeight = 20;
        const markerY = Math.max(18, fallbackY);
        page.drawRectangle({
          x: 18,
          y: markerY,
          width: markerWidth,
          height: markerHeight,
          borderColor: rgb(0.9, 0.12, 0.12),
          borderWidth: 1.5,
          color: rgb(1, 0.9, 0.9),
          opacity: 0.25,
        });
        fallbackY = markerY - 24;
      }
    }
  }
}

async function resolveSourcePdfKey(downloadId: string): Promise<string | null> {
  const meta = await getStored(downloadId);
  const annotatedJobMatch = meta?.annotatedPdfUrl?.match(/\/file\/([^/]+)\/annotated\/?$/);
  const annotatedJobId = annotatedJobMatch?.[1]?.trim();
  if (annotatedJobId) {
    return `uploads/${annotatedJobId}.pdf`;
  }

  const { data: row } = await supabase
    .from("print_ready_checks")
    .select("our_job_id")
    .eq("result_download_id", downloadId)
    .maybeSingle();

  const ourJobId = row?.our_job_id;
  if (typeof ourJobId === "string" && ourJobId.trim()) {
    return `uploads/${ourJobId.trim()}.pdf`;
  }

  // Fallback: use file stored on this download record.
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
    const doc = await PDFDocument.load(sourcePdf);
    const pageCount = doc.getPageCount();

    const pageIssues = Array.isArray(meta.processingReport.page_issues)
      ? meta.processingReport.page_issues
      : [];
    const enrichedIssues = Array.isArray(meta.processingReport.issuesEnriched)
      ? meta.processingReport.issuesEnriched
      : [];
    const byPage = normalizeIssueGroups(pageIssues, enrichedIssues, pageCount);

    drawIssueMarkers(doc, byPage);
    const annotatedBytes = await doc.save();
    const annotatedBuffer = Buffer.from(annotatedBytes);

    const annotatedFilename = "annotated-local.pdf";
    await uploadFile(downloadId, annotatedFilename, annotatedBuffer);
    const annotatedPdfDownloadUrl = await getSignedDownloadUrl(downloadId, annotatedFilename);

    await updateAnnotatedState(downloadId, {
      status: "ready",
      annotatedPdfDownloadUrl,
    });

    const sentNow = await sendAnnotatedEmailIfReady(downloadId).catch(() => false);

    return NextResponse.json({
      success: true,
      downloadId,
      status: sentNow ? "delivered" : "ready",
      sentNow,
      annotatedPdfDownloadUrl,
      sourceKey,
      markersApplied: byPage.size,
    });
  } catch (e) {
    console.error("[annotate-local]", e);
    return NextResponse.json(
      { error: "Local annotation failed", message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
