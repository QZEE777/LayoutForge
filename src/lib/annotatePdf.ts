/**
 * Shared annotation logic — called at payment time (webhook + credit redemption)
 * so the annotated PDF exists before the delivery email is sent.
 */
import { PDFDocument, rgb } from "pdf-lib";
import { getStored, updateAnnotatedState } from "@/lib/storage";
import { getFileByKey, uploadFile, getSignedDownloadUrl } from "@/lib/r2Storage";
import { supabase } from "@/lib/supabase";

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
  severity: "blocker" | "critical" | "warning";
  ruleId: string;
  message: string;
  bbox: number[] | null;
};

const MAX_ANNOTATIONS_TOTAL = 30;

function isAnnotatableSeverity(raw?: string): boolean {
  const s = String(raw ?? "").toLowerCase().trim();
  return s !== "" && s !== "info";
}

function normalizeAnnotationSeverity(raw?: string): "blocker" | "critical" | "warning" {
  const s = String(raw ?? "").toLowerCase().trim();
  if (s === "blocker") return "blocker";
  if (s === "critical") return "critical";
  return "warning";
}

function severityRank(severity: "blocker" | "critical" | "warning"): number {
  if (severity === "blocker") return 0;
  if (severity === "critical") return 1;
  return 2;
}

function severityColor(severity: "blocker" | "critical" | "warning") {
  if (severity === "blocker") return rgb(0.86, 0.08, 0.08);
  if (severity === "critical") return rgb(0.94, 0.27, 0.08);
  return rgb(0.93, 0.53, 0.0);
}

function normalizeCriticalIssues(
  pageIssues: PageIssue[],
  enrichedIssues: EnrichedIssue[],
  pageCount: number,
): CriticalIssue[] {
  const out: CriticalIssue[] = [];

  for (const issue of pageIssues) {
    if (!isAnnotatableSeverity(issue.severity)) continue;
    const page = Number(issue.page);
    if (!Number.isFinite(page) || page < 1 || page > pageCount) continue;
    out.push({
      page,
      severity: normalizeAnnotationSeverity(issue.severity),
      ruleId: String(issue.rule_id ?? "issue").trim() || "issue",
      message: issue.message?.trim() || "Formatting issue detected",
      bbox: Array.isArray(issue.bbox) && issue.bbox.length >= 4 ? issue.bbox : null,
    });
  }

  for (const issue of enrichedIssues) {
    if (!isAnnotatableSeverity(issue.severity)) continue;
    const page = Number(issue.page);
    if (!Number.isFinite(page) || page < 1 || page > pageCount) continue;
    out.push({
      page,
      severity: normalizeAnnotationSeverity(issue.severity),
      ruleId: String(issue.rule_id ?? "issue").trim() || "issue",
      message: issue.humanMessage?.trim() || "Formatting issue detected",
      bbox: null,
    });
  }

  return out;
}

function drawIssueMarkers(
  doc: PDFDocument,
  criticalIssues: CriticalIssue[],
): { globalBannerCount: number; boxCount: number } {
  const pages = doc.getPages();
  const pageCount = pages.length;
  if (!pageCount) return { globalBannerCount: 0, boxCount: 0 };

  const bySignature = new Map<string, { issue: CriticalIssue; pages: Set<number> }>();
  for (const issue of criticalIssues) {
    const signature = `${issue.ruleId}::${issue.message.toLowerCase()}`;
    const existing = bySignature.get(signature) ?? { issue, pages: new Set<number>() };
    existing.pages.add(issue.page);
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
      const bannerColor = severityColor(data.issue.severity);
      firstPage.drawRectangle({
        x: 18,
        y,
        width: Math.max(120, width - 36),
        height: 24,
        borderColor: bannerColor,
        borderWidth: 2,
      });
      const maxChars = Math.max(20, Math.floor((width - 52) / 5.5));
      const rawText = `Issue affects all pages: ${data.issue.message}`;
      const bannerText = rawText.length > maxChars ? rawText.slice(0, maxChars - 1) + "…" : rawText;
      firstPage.drawText(bannerText, { x: 24, y: y + 7, size: 9, color: bannerColor });
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
      borderColor: severityColor(issue.severity),
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

  const meta = await getStored(downloadId);
  if (meta?.sourcePdfKey) return meta.sourcePdfKey;
  if (!meta?.storedPath) return null;
  return meta.storedPath;
}

/**
 * Annotates the checker PDF for a given downloadId and returns the signed download URL.
 * Idempotent — if already annotated, returns the existing URL.
 * Returns null if the download doesn't exist or isn't a checker report.
 */
export async function annotateCheckerPdf(
  downloadId: string,
): Promise<{ annotatedPdfDownloadUrl: string } | null> {
  try {
    const meta = await getStored(downloadId);
    if (!meta) return null;
    if (!meta.processingReport || meta.processingReport.outputType !== "checker") return null;

    // Already annotated — return existing URL
    if (meta.annotatedPdfDownloadUrl && meta.annotatedPdfStatus === "ready") {
      return { annotatedPdfDownloadUrl: meta.annotatedPdfDownloadUrl };
    }

    const sourceKey = await resolveSourcePdfKey(downloadId);
    if (!sourceKey) return null;

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

    drawIssueMarkers(doc, criticalIssues);

    const annotatedBytes = await doc.save();
    const annotatedBuffer = Buffer.from(annotatedBytes);
    const annotatedFilename = "annotated-local.pdf";

    await uploadFile(downloadId, annotatedFilename, annotatedBuffer);
    const annotatedPdfDownloadUrl = await getSignedDownloadUrl(downloadId, annotatedFilename);

    await updateAnnotatedState(downloadId, { status: "ready", annotatedPdfDownloadUrl });

    return { annotatedPdfDownloadUrl };
  } catch (err) {
    console.error("[annotatePdf] annotateCheckerPdf failed:", err);
    return null;
  }
}
