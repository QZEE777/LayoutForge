// cache-bust: 2026-03-21-v2
"use client";

// TODO: Manny watermark to be added to generated PDF output
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BrandWordmark } from "@/components/BrandWordmark";
import PaymentGate from "@/components/PaymentGate";
import CheckerPdfViewer from "@/components/CheckerPdfViewer";
import {
  difficultyLabel,
  cleanFilenameForDisplay,
  toFixDifficulty,
  getScoreGrade,
  canonicalCheckerReadinessScore,
  type FixDifficulty,
} from "@/lib/kdpReportEnhance";
import { buildVerifyShareCaption } from "@/lib/shareVerifyCaption";
import { createClient as createBrowserSupabase } from "@/lib/supabaseClient";
import { CHECKER_ANNOTATION_PASS_THRESHOLD } from "@/lib/checkerAnnotationStyle";

const MAX_ISSUES_GROUP_DISPLAY = 10;
const KDP_DISPLAY_PASS_THRESHOLD = CHECKER_ANNOTATION_PASS_THRESHOLD;

/** Download page visual tokens — design-only; print HTML uses matching hex values. */
const DL_VIS = {
  creamBg: "linear-gradient(180deg, #FAF7EE 0%, #F2EBDF 100%)",
  forestGrad: "linear-gradient(180deg, #1A6B2A 0%, #0D3D18 100%)",
  lime: "#C5E83A",
  cardShadow: "0 24px 56px -16px rgba(13,61,24,0.22)",
  innerShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
} as const;

/** Group issues by message type and cap for display. Returns { grouped, totalGroups, totalCount }. */
function getGroupedIssues(report: ProcessingReport | null): {
  grouped: Array<{ label: string; message: string; pages: number[]; toolFixInstruction?: string }>;
  totalGroups: number;
  totalCount: number;
} {
  if (!report) return { grouped: [], totalGroups: 0, totalCount: 0 };
  const rawIssues = report.issues ?? [];
  const enriched = report.issuesEnriched ?? [];

  if (enriched.length > 0) {
    const byMessage = new Map<string, { difficulty: FixDifficulty; pages: number[]; toolFixInstruction?: string }>();
    for (const item of enriched) {
      const msg = item.humanMessage;
      const existing = byMessage.get(msg);
      const pages = existing?.pages ?? [];
      if (item.page != null && !pages.includes(item.page)) pages.push(item.page);
      pages.sort((a, b) => a - b);
      const difficulty: FixDifficulty = item.fixDifficulty as FixDifficulty;
      if (!existing) byMessage.set(msg, { difficulty, pages, toolFixInstruction: item.toolFixInstruction });
      else existing.pages = pages;
    }
    const grouped = Array.from(byMessage.entries()).map(([message, { difficulty, pages, toolFixInstruction }]) => ({
      label: difficultyLabel(difficulty),
      message,
      pages,
      toolFixInstruction,
    }));
    return {
      grouped,
      totalGroups: grouped.length,
      totalCount: enriched.length,
    };
  }

  if (rawIssues.length === 0) return { grouped: [], totalGroups: 0, totalCount: 0 };
  const byMessage = new Map<string, number[]>();
  const pageMsgRe = /^\s*\[p\.(\d+)\]\s*(.+)$/;
  for (const raw of rawIssues) {
    const match = typeof raw === "string" ? raw.match(pageMsgRe) : null;
    const page = match ? parseInt(match[1], 10) : null;
    const message = match ? match[2].trim() : (typeof raw === "string" ? raw : String(raw));
    const pages = byMessage.get(message) ?? [];
    if (page != null && !pages.includes(page)) pages.push(page);
    pages.sort((a, b) => a - b);
    byMessage.set(message, pages);
  }
  const grouped = Array.from(byMessage.entries()).map(([message, pages]) => ({
    label: "",
    message,
    pages,
  }));
  return {
    grouped,
    totalGroups: grouped.length,
    totalCount: rawIssues.length,
  };
}

function formatPages(pages: number[]): string {
  if (pages.length === 0) return "";
  if (pages.length <= 10) return ` — pages ${pages.join(", ")}`;
  return ` — pages ${pages.slice(0, 3).join(", ")}, … ${pages[pages.length - 1]} (${pages.length} pages)`;
}

interface ProcessingReport {
  id?: string;
  source?: "checker";
  pagesGenerated?: number;
  chaptersDetected: number;
  sectionsDetected?: number;
  lessonsDetected?: number;
  estimatedPages?: number;
  issues: string[];
  fontUsed: string;
  trimSize: string;
  gutterInches?: number;
  outputType?: "pdf" | "docx" | "epub" | "checker" | "format-review";
  outputFilename?: string;
  status?: string;
  formatReviewText?: string;
  /** Checker report */
  pageCount?: number;
  trimDetected?: string;
  trimMatchKDP?: boolean;
  kdpTrimName?: string | null;
  recommendations?: string[];
  fileSizeMB?: number;
  recommendedGutterInches?: number;
  page_issues?: Array<{ page: number; rule_id: string; severity: string; message: string; bbox: number[] | null; fixDifficulty?: string }>;
  hasPdfPreview?: boolean;
  pdfSourceUrl?: string;
  annotatedPdfUrl?: string;
  annotatedPdfStatus?: string;
  annotationStatus?: "not_requested" | "queued" | "processing" | "ready" | "delivered" | "error";
  annotatedPdfDownloadUrl?: string;
  annotatedEmailRequested?: boolean;
  annotatedEmailSent?: boolean;
  score?: number;
  verdict?: "pass" | "needs-fixes";
  blockerCount?: number;
  warningCount?: number;
  infoCount?: number;
  issueCount?: number;
  /** Format review report */
  formatReviewSections?: Array<{ title: string; issues?: string[]; recommendations?: string[]; content?: string }>;
  summary?: string;
  topActions?: string[];
  kdpReadiness?: string;
  wordCount?: number;
  /** Enhanced checker report */
  scanDate?: string;
  fileNameScanned?: string;
  kdpPassProbability?: number;
  approval_likelihood?: number;
  riskLevel?: "Low" | "Medium" | "High";
  readinessScore100?: number;
  readiness_score?: number;
  highRiskPageNumbers?: number[];
  kdpReady?: boolean;
  issuesEnriched?: Array<{
    originalMessage: string;
    humanMessage: string;
    toolFixInstruction?: string;
    fixDifficulty: string;
    page?: number;
    severity?: string;
  }>;
  scoreGrade?: { grade: string; label: string; description: string };
  creationTool?: string;
  /** Rare: nested shape; format-report usually flattens processingReport onto report */
  processingReport?: { issuesEnriched?: ProcessingReport["issuesEnriched"] };
  uploadChecklist?: Array<{ check: string; status: "pass" | "warning" | "fail" }>;
  specTable?: Array<{ requirement: string; yourFile: string; kdpRequired: string; status: "pass" | "warning" | "fail" }>;
  estimatedFixHours?: number;
  upsellBridge?: string;
  advisoryNotices?: Array<{ rule_id: string; message: string; severity: "info" | "warning" }>;
  /** KDP trim id from checker upload when author picked an intended size. */
  intendedKdpTrimId?: string;
}

/** Hero / gradients: never "pass" visuals when server says needs-fixes (checklist/spec can fail without blockers). */
function checkerHeroLooksPassing(report: ProcessingReport, score: number | null): boolean {
  if (report.verdict === "needs-fixes") return false;
  if (score !== null) return score >= KDP_DISPLAY_PASS_THRESHOLD;
  return report.kdpReady === true;
}

export default function DownloadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = typeof params.id === "string" ? params.id : "";
  const isPdfFlow = searchParams.get("source") === "pdf";
  const isEpubFlow = searchParams.get("source") === "epub";
  const isCheckerFlow = searchParams.get("source") === "checker";
  const isFormatReviewFlow = searchParams.get("source") === "format-review";
  const [report, setReport] = useState<ProcessingReport | null>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copyReviewStatus, setCopyReviewStatus] = useState<"idle" | "ok" | "fail">("idle");
  const [copyShareStatus, setCopyShareStatus] = useState<"idle" | "ok" | "fail">("idle");
  // Share-to-earn state
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [annotatedReady, setAnnotatedReady] = useState(false);
  const [annotatedError, setAnnotatedError] = useState(false);
  const [annotatedWaitStartedAt, setAnnotatedWaitStartedAt] = useState<number | null>(null);
  const [annotatedTakingLong, setAnnotatedTakingLong] = useState(false);
  const [annotatedEmailInput, setAnnotatedEmailInput] = useState("");
  const [annotatedEmailStatus, setAnnotatedEmailStatus] = useState<"idle" | "saving" | "queued" | "sent" | "error">("idle");
  /** `undefined` = still resolving auth; `null` = guest; string = signed-in account email */
  const [authEmail, setAuthEmail] = useState<string | null | undefined>(undefined);
  const annotatedAutoInFlightRef = useRef(false);
  /** One automatic enqueue per download id (guests rely on the form; failures use Retry). */
  const annotatedAutoAttemptedRef = useRef(false);

  // Scan context from URL params (set by checker upload page)
  const scanBookType  = searchParams.get("bk") ?? "paperback";   // paperback | hardcover
  const scanBleed     = searchParams.get("bl") === "1";           // true = with bleed
  const scanColorMode = searchParams.get("cm") ?? "bw";           // bw | color
  const annotationStatus = report?.annotationStatus ?? "not_requested";
  const hasAnnotatedDownload = Boolean(
    report?.annotatedPdfDownloadUrl || (report?.annotatedPdfUrl && (annotationStatus === "ready" || annotationStatus === "delivered" || (annotatedReady && !annotatedError)))
  );
  const hasActionablePageIssues = (report?.page_issues?.length ?? 0) > 0;

  const isDocx = report?.outputType === "docx";
  const isEpub = isEpubFlow || report?.outputType === "epub";
  const isChecker = isCheckerFlow || report?.outputType === "checker";
  const isFormatReview = isFormatReviewFlow || report?.outputType === "format-review";
  const downloadFilename =
    report?.outputFilename ||
    (isDocx ? "kdp-review.docx" : isEpub ? "book.epub" : "kdp-print.pdf");

  const handleDownload = useCallback(async () => {
    setDownloadError(null);
    const url = `/api/download/${id}/${encodeURIComponent(downloadFilename)}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || `Download failed (${response.status})`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    }
  }, [id, downloadFilename]);

  /** Same layout as this page: opens print dialog → “Save as PDF”. Avoids server PDF that repeats every finding across many pages. */
  const handlePrintFullReportAsPdf = useCallback(() => {
    const content = document.getElementById("report-content");
    if (!content) return;
    const clone = content.cloneNode(true) as HTMLElement;
    if (clone.firstElementChild) clone.firstElementChild.remove();
    const bodyContent = clone.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>KDP Compliance Report — manu2print</title>
  <style>
    @page { size: letter; margin: 14mm 12mm; }
    * { box-sizing: border-box; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: system-ui, "Segoe UI", Inter, sans-serif;
      padding: 0;
      max-width: 820px;
      margin: 0 auto;
      background: #fff;
      color: #1A1208;
      font-size: 12.5px;
      line-height: 1.45;
    }
    .header { margin-bottom: 22px; padding-bottom: 14px; border-bottom: 2px solid rgba(26,107,42,0.2); }
    .logo-manu { color: #F05A28; font-weight: 900; font-size: 22px; }
    .logo-two { color: #1A1208; font-weight: 900; font-size: 22px; }
    .logo-print { color: #4cd964; font-weight: 900; font-size: 22px; }
    .watermark { position: fixed; bottom: 20px; right: 20px; width: 100px; height: 100px; opacity: 0.08; pointer-events: none; z-index: -1; }
    /* Cloned report uses Tailwind class names; this window has no app CSS — restore flex layout for print/PDF */
    .flex { display: flex; }
    .inline-flex { display: inline-flex; }
    .flex-col { flex-direction: column; }
    .flex-row { flex-direction: row; }
    .flex-wrap { flex-wrap: wrap; }
    .flex-nowrap { flex-wrap: nowrap; }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .items-end { align-items: flex-end; }
    .items-baseline { align-items: baseline; }
    .items-stretch { align-items: stretch; }
    .justify-center { justify-content: center; }
    .justify-between { justify-content: space-between; }
    .justify-start { justify-content: flex-start; }
    .shrink-0,
    .flex-shrink-0 { flex-shrink: 0; }
    .flex-1 { flex: 1 1 0%; min-width: 0; }
    .min-w-0 { min-width: 0; }
    .gap-1 { gap: 0.25rem; }
    .gap-1\\.5 { gap: 0.375rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
    .gap-6 { gap: 1.5rem; }
    .gap-x-1 { column-gap: 0.25rem; }
    .gap-x-1\\.5 { column-gap: 0.375rem; }
    .gap-x-2 { column-gap: 0.5rem; }
    .gap-y-0 { row-gap: 0; }
    @media (min-width: 640px) {
      .sm\\:flex-row { flex-direction: row; }
      .sm\\:items-end { align-items: flex-end; }
      .sm\\:items-stretch { align-items: stretch; }
      .sm\\:justify-start { justify-content: flex-start; }
      .sm\\:justify-between { justify-content: space-between; }
    }
    table { width: 100%; border-collapse: collapse; margin: 14px 0; border-radius: 8px; overflow: hidden; }
    th { background: linear-gradient(180deg, #1A6B2A 0%, #0D3D18 100%); color: #fff; padding: 9px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
    td { padding: 9px 10px; border: 1px solid #E0D8C4; background: rgba(255,255,255,0.92); vertical-align: top; }
    tr:nth-child(even) td { background: rgba(250,247,238,0.95); }
    .footer { margin-top: 36px; text-align: center; color: #6B6151; font-size: 11px; border-top: 1px solid #E0D8C4; padding-top: 14px; }
    @media print {
      .no-print { display: none !important; }
      body { background: #fff !important; }
    }
  </style>
</head>
<body>
  <img src="${origin}/MANNY%20AVATAR.png" class="watermark" alt="" />
  <div class="header">
    <span class="logo-manu">manu</span><span class="logo-two">2</span><span class="logo-print">print</span>
  </div>
  ${bodyContent}
  <div style="margin-top:28px; padding:22px; background:#FEF0EB; border-radius:12px; text-align:center; border:1px solid #F05A28;">
    <p style="font-size:16px; font-weight:bold; color:#1A1208; margin-bottom:8px;">Next step: upload-ready confidence</p>
    <p style="color:#6B6151; margin-bottom:10px;">Apply the fixes in this report, export a fresh PDF from your layout app, then run one final check before uploading to KDP.</p>
    <p style="color:#6B6151; margin-bottom:14px;">Need a second opinion? Share this report with your formatter, designer, or editor so they can fix issues page by page.</p>
    <p style="margin-bottom:14px;"><a href="https://manu2print.com/kdp-pdf-checker" style="background:#F05A28; color:white; padding:11px 22px; border-radius:8px; text-decoration:none; font-weight:bold;">Run final KDP check → manu2print.com/kdp-pdf-checker</a></p>
    <p style="color:#6B6151; font-size:12px;">Want to earn scan credits by referring authors? <a href="https://manu2print.com/partners" style="color:#F05A28;">Become a partner</a></p>
  </div>
  <div class="footer">© manu2print — Built for indie authors</div>
</body>
</html>
`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  }, []);

  const handleCopyForAIReview = useCallback(async () => {
    if (!report?.formatReviewText) return;
    setCopyReviewStatus("idle");
    try {
      await navigator.clipboard.writeText(report.formatReviewText);
      setCopyReviewStatus("ok");
      setTimeout(() => setCopyReviewStatus("idle"), 3000);
    } catch {
      setCopyReviewStatus("fail");
      setTimeout(() => setCopyReviewStatus("idle"), 3000);
    }
  }, [report?.formatReviewText]);

  const handleCopyFormatReviewShare = useCallback(async () => {
    if (!report || report.outputType !== "format-review") return;
    setCopyShareStatus("idle");
    const parts: string[] = [];
    if (report.kdpReadiness) parts.push(`KDP Readiness: ${report.kdpReadiness}`);
    if (report.summary) parts.push(report.summary);
    if (report.topActions?.length) parts.push("Top fixes: " + report.topActions.slice(0, 3).join(" · "));
    parts.push("Get your review: manu2print.com/kdp-format-review");
    try {
      await navigator.clipboard.writeText(parts.join("\n\n"));
      setCopyShareStatus("ok");
      setTimeout(() => setCopyShareStatus("idle"), 3000);
    } catch {
      setCopyShareStatus("fail");
      setTimeout(() => setCopyShareStatus("idle"), 3000);
    }
  }, [report]);

  // Fetch share token for authenticated user (passive share mode)
  useEffect(() => {
    fetch("/api/share/token")
      .then((r) => r.json())
      .then((d) => { if (d?.token?.token) setShareToken(d.token.token); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    createBrowserSupabase()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (cancelled) return;
        const e = user?.email?.trim().toLowerCase();
        setAuthEmail(e && e.length > 0 ? e : null);
      })
      .catch(() => {
        if (!cancelled) setAuthEmail(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCopyShareEarnLink = useCallback(async () => {
    if (!shareToken) return;
    const url = `https://www.manu2print.com/kdp-pdf-checker?sh=${shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch { /* clipboard blocked */ }
  }, [shareToken]);

  const handleCopyVerificationLink = useCallback(async () => {
    if (!id) return;
    const url = `https://www.manu2print.com/verify/${id}${shareToken ? `?sh=${shareToken}` : ""}`;
    setCopyShareStatus("idle");
    try {
      await navigator.clipboard.writeText(url);
      setCopyShareStatus("ok");
      setTimeout(() => setCopyShareStatus("idle"), 2000);
    } catch {
      setCopyShareStatus("fail");
      setTimeout(() => setCopyShareStatus("idle"), 2000);
    }
  }, [id, shareToken]);

  const loadReport = useCallback(() => {
    if (!id) return;
    setReportError(null);
    setReportLoading(true);
    fetch(`/api/format-report?id=${encodeURIComponent(id)}&t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json().then((data: { success?: boolean; report?: ProcessingReport; message?: string }) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data.success && data.report) {
          const raw = data.report as ProcessingReport;
          setReport(raw);
          setAnnotatedEmailInput("");
          setAnnotatedEmailStatus("idle");
          setReportError(null);
          if (raw.annotationStatus === "ready" || raw.annotationStatus === "delivered") setAnnotatedReady(true);
          if (raw.annotationStatus === "error") setAnnotatedError(true);
          if (raw.annotatedPdfUrl) {
            setAnnotatedWaitStartedAt((prev) => prev ?? Date.now());
          }
          if (raw.annotatedPdfUrl && searchParams.get("source") === "checker") {
            const match = raw.annotatedPdfUrl.match(/\/file\/([^/]+)\/annotated\/?$/);
            const jobId = match?.[1];
            if (jobId) {
              fetch(`/api/kdp-annotated-status?job_id=${encodeURIComponent(jobId)}`)
                .then((res) => res.json())
                .then((statusData: { status?: "queued" | "processing" | "ready" | "delivered" | "error" }) => {
                  if (statusData.status === "ready" || statusData.status === "delivered") setAnnotatedReady(true);
                  if (statusData.status === "error") setAnnotatedError(true);
                })
                .catch(() => {});
            }
          }
        } else {
          setReportError(data?.message ?? "Report not available.");
        }
      })
      .catch(() => {
        setReportError("Could not load report. Try again or refresh.");
      })
      .finally(() => setReportLoading(false));
  }, [id, searchParams]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  useEffect(() => {
    if (!report?.annotatedPdfUrl || !isCheckerFlow) return;
    if (annotatedReady || annotatedError) return;
    const match = report.annotatedPdfUrl.match(/\/file\/([^/]+)\/annotated\/?$/);
    const jobId = match?.[1];
    if (!jobId) return;
    let attempts = 0;
    const maxAttempts = 50;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const poll = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/kdp-annotated-status?job_id=${encodeURIComponent(jobId)}`);
        const data = await res.json() as { status?: "queued" | "processing" | "ready" | "delivered" | "error" };
        if (data.status === "ready" || data.status === "delivered") {
          setAnnotatedReady(true);
          if (intervalId) clearInterval(intervalId);
          return;
        }
        if (data.status === "error" || attempts >= maxAttempts) {
          setAnnotatedError(true);
          if (intervalId) clearInterval(intervalId);
        }
      } catch {
        if (attempts >= maxAttempts) {
          setAnnotatedError(true);
          if (intervalId) clearInterval(intervalId);
        }
      }
    };
    poll();
    intervalId = setInterval(poll, 3000);
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [report?.annotatedPdfUrl, isCheckerFlow, annotatedReady, annotatedError, id, annotationStatus]);

  useEffect(() => {
    if (!report?.annotatedPdfUrl || !isCheckerFlow) return;
    if (annotationStatus === "ready" || annotationStatus === "delivered" || annotationStatus === "error" || annotatedReady || annotatedError) return;
    setAnnotatedTakingLong(false);
    const t = setTimeout(() => setAnnotatedTakingLong(true), 45_000);
    return () => clearTimeout(t);
  }, [report?.annotatedPdfUrl, isCheckerFlow, annotatedReady, annotatedError, annotationStatus]);

  const postCheckerAnnotatedEmail = useCallback(async (email: string): Promise<boolean> => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setAnnotatedEmailStatus("error");
      return false;
    }
    setAnnotatedEmailStatus("saving");
    try {
      const res = await fetch("/api/checker-annotated-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email: normalized }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        sentNow?: boolean;
        status?: "queued" | "ready" | "delivered" | "error";
      };
      if (res.ok && data?.success) {
        const next = data.status === "delivered" || data.sentNow ? "sent" : "queued";
        setAnnotatedEmailStatus(next);
        setReport((prev) =>
          prev
            ? {
                ...prev,
                annotatedEmailRequested: true,
                annotatedEmailSent: next === "sent",
                annotationStatus: data.status ?? "queued",
              }
            : prev,
        );
        return true;
      }
      setAnnotatedEmailStatus("error");
      return false;
    } catch {
      setAnnotatedEmailStatus("error");
      return false;
    }
  }, [id]);

  const submitCheckerAnnotatedEmail = useCallback(async () => {
    await postCheckerAnnotatedEmail(annotatedEmailInput);
  }, [annotatedEmailInput, postCheckerAnnotatedEmail]);

  useEffect(() => {
    annotatedAutoAttemptedRef.current = false;
  }, [id]);

  useEffect(() => {
    if (authEmail === undefined || authEmail === null || !id) return;
    if (!isCheckerFlow) return;
    if (!report || (report.page_issues?.length ?? 0) === 0) return;
    const dl = Boolean(
      report.annotatedPdfDownloadUrl ||
        (report.annotatedPdfUrl &&
          (report.annotationStatus === "ready" ||
            report.annotationStatus === "delivered" ||
            (annotatedReady && !annotatedError))),
    );
    if (dl) return;
    if (report.annotatedEmailRequested || report.annotatedEmailSent) return;
    if (annotatedAutoAttemptedRef.current) return;
    if (annotatedAutoInFlightRef.current) return;
    annotatedAutoAttemptedRef.current = true;
    annotatedAutoInFlightRef.current = true;
    void postCheckerAnnotatedEmail(authEmail).finally(() => {
      annotatedAutoInFlightRef.current = false;
    });
  }, [
    authEmail,
    id,
    isCheckerFlow,
    postCheckerAnnotatedEmail,
    report?.annotatedEmailRequested,
    report?.annotatedEmailSent,
    report?.annotatedPdfDownloadUrl,
    report?.annotatedPdfUrl,
    report?.annotationStatus,
    report?.page_issues?.length,
    annotatedReady,
    annotatedError,
  ]);

  if (!id) {
    return (
      <div className="min-h-screen bg-m2p-ivory text-m2p-ink p-8">
        <p className="text-red-400">Invalid file ID.</p>
        <Link href={isFormatReviewFlow ? "/kdp-format-review" : isCheckerFlow ? "/kdp-pdf-checker" : isEpubFlow ? "/epub-maker" : isPdfFlow ? "/pdf-compress" : "/kdp-formatter"} className="mt-4 block text-m2p-orange hover:text-white">
          Upload a file
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-m2p-ink" style={{ background: DL_VIS.creamBg }}>
      {/* Header */}
      <header className="border-b border-[#1A6B2A]/10 bg-white/40 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="inline-flex items-baseline">
            <BrandWordmark variant="onLight" className="text-xl" />
          </Link>
          <Link
            href={isFormatReview ? "/kdp-format-review" : isChecker ? "/kdp-pdf-checker" : isEpub ? "/epub-maker" : isPdfFlow ? "/pdf-compress" : "/kdp-formatter"}
            className="text-sm font-semibold text-m2p-muted hover:text-m2p-orange transition-colors"
          >
            New upload
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-5 sm:px-6 py-10 sm:py-12">
        <div
          className="relative rounded-2xl border border-[#1A6B2A]/12 p-6 sm:p-8 mb-8 text-center overflow-hidden"
          style={{ boxShadow: DL_VIS.cardShadow, background: "rgba(255,255,255,0.72)" }}
        >
          <div className="absolute inset-x-0 top-0 h-1 opacity-90" style={{ background: DL_VIS.forestGrad }} aria-hidden />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <Image src="/MANNY AVATAR.png" alt="Manny" width={100} height={100} className="rounded-full shadow-lg ring-4 ring-white/80 shrink-0" />
            <div className="text-left sm:text-center">
              <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-m2p-muted mb-1">KDP compliance</p>
              <BrandWordmark variant="onLight" className="text-xl" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bebas text-m2p-ink text-center mb-2 leading-tight">
            Your KDP Compliance Report Is Ready
          </h1>
          <p className="text-m2p-muted text-center text-sm sm:text-base max-w-lg mx-auto leading-relaxed text-balance">
            We analyzed your manuscript against all 26 Amazon KDP print formatting requirements.
            <span className="block mt-1.5 text-m2p-muted/90">Download the full report to review every issue and its recommended fix.</span>
          </p>
        </div>

        {reportLoading && !report && (
          <div
            className="mb-8 rounded-2xl p-8 border border-m2p-border/60 text-center"
            style={{ background: "rgba(255,255,255,0.85)", boxShadow: DL_VIS.cardShadow }}
          >
            <div className="inline-block w-8 h-8 border-2 border-m2p-orange border-t-transparent rounded-full animate-spin mb-3" aria-hidden />
            <p className="text-m2p-ink font-semibold">Loading your report…</p>
            <p className="text-sm text-m2p-muted mt-2">If you just uploaded, this may take a moment.</p>
          </div>
        )}
        {reportError && !report && (
          <div className="mb-8 rounded-2xl p-6 border border-amber-400/40 bg-amber-50/90 shadow-lg">
            <p className="text-m2p-ink font-semibold flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-amber-600">⚠</span> {reportError}
            </p>
            <p className="text-sm text-m2p-muted mt-2 text-center sm:text-left">If you just ran a check, wait a few seconds and try again.</p>
            <button
              type="button"
              onClick={loadReport}
              className="mt-4 w-full sm:w-auto rounded-xl bg-m2p-orange text-white px-5 py-2.5 text-sm font-bold hover:bg-m2p-orange-hover shadow-md transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Trust block — always visible, above payment gate so it is never covered by overlay */}
        {!isChecker && (
          <div
            className="text-center rounded-2xl p-5 mb-6 border border-[#1A6B2A]/20"
            style={{ background: "rgba(255,255,255,0.75)", boxShadow: "0 8px 32px -12px rgba(13,61,24,0.15)" }}
          >
            <p className="text-m2p-ink font-bold text-sm flex flex-wrap items-center justify-center gap-x-1 gap-y-0">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#C5E83A]/25 text-[#2D6A2D] text-xs mr-1">✓</span>
              <span>Verified by</span>
              <BrandWordmark variant="onLight" className="text-sm" />
            </p>
            <p className="text-m2p-muted text-sm mt-2 leading-relaxed max-w-md mx-auto">
              This report checks your manuscript against known Amazon KDP print formatting requirements.
            </p>
          </div>
        )}

        {/* Checker pre-gate teaser — grade, score, issue count visible before payment */}
        {report && isChecker && (() => {
          const score = canonicalCheckerReadinessScore(report);
          const isPassingScore = checkerHeroLooksPassing(report, score);
          const _sg =
            report.verdict === "needs-fixes" && report.scoreGrade
              ? report.scoreGrade
              : score !== null
                ? getScoreGrade(score)
                : report.scoreGrade ?? null;
          const gradeColor = () => (isPassingScore ? "#4cd964" : "#f0a028");
          const gradeInfo = _sg === null ? null : {
            letter: _sg.grade,
            color:  gradeColor(),
            label:  _sg.label,
          };

          const uniqueIssues = new Map<string, string>();
          for (const i of (report.issuesEnriched ?? [])) {
            if (!uniqueIssues.has(i.humanMessage)) uniqueIssues.set(i.humanMessage, i.fixDifficulty ?? "");
          }
          const totalIssues = uniqueIssues.size;
          const criticalCount = Array.from(uniqueIssues.values()).filter((d) => d === "hard" || d === "very-hard").length;
          const risk = report.riskLevel ?? (score === null ? null : score >= 75 ? "Low" : score >= 50 ? "Medium" : "High");
          const riskColor = risk === "Low" ? "#4CE87A" : risk === "Medium" ? "#f0a028" : "#FF6A2B";
          const riskIcon = risk === "Low" ? "✓" : risk === "Medium" ? "⚠" : "✕";
          const headerGradient = isPassingScore
            ? "linear-gradient(180deg, #1A6B2A 0%, #0D3D18 100%)"
            : "linear-gradient(180deg, #D65A2F 0%, #C14A27 100%)";
          const scoreHeroColor = isPassingScore
            ? "#2D6A2D"
            : "#C27803";
          const statusLine =
            isPassingScore
              ? "Ready for KDP upload"
              : "Close — fix warnings before upload";
          const subLime = "#A8D878";

          return (
            <div
              className="rounded-2xl mb-6 overflow-hidden border border-black/[0.08] shadow-[0_24px_48px_-12px_rgba(13,61,24,0.35)]"
              style={{ borderColor: risk === "Low" ? "rgba(26,107,42,0.35)" : risk === "Medium" ? "rgba(107,56,0,0.35)" : "rgba(214,90,47,0.4)" }}
            >
              <div
                className="px-5 py-3.5 flex items-center justify-between gap-3"
                style={{ background: headerGradient }}
              >
                <span className="text-white font-black text-[11px] sm:text-xs tracking-[0.2em]">
                  SCAN COMPLETE
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold tracking-wide text-white/95 whitespace-nowrap inline-flex items-baseline gap-1">
                  <span className="opacity-90">Verified by</span>
                  <BrandWordmark variant="onDark" className="text-[10px] sm:text-xs" />
                </span>
              </div>
              <div
                className="px-5 sm:px-6 py-6"
                style={{ background: "linear-gradient(180deg, #FAF7EE 0%, #F2EBDF 100%)" }}
              >
                <div className="flex flex-col sm:flex-row sm:items-stretch gap-6">
                  {gradeInfo && (
                    <div className="shrink-0 flex justify-center sm:justify-start">
                      <div
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center text-center shadow-[0_8px_24px_-4px_rgba(13,61,24,0.25)] ring-2 ring-white/80"
                        style={{
                          borderWidth: 4,
                          borderStyle: "solid",
                          borderColor: gradeInfo.color,
                          background: "linear-gradient(145deg, #ffffff 0%, #FAF7EE 100%)",
                        }}
                      >
                        <span className="text-4xl sm:text-5xl font-black leading-none" style={{ color: gradeInfo.color }}>
                          {gradeInfo.letter}
                        </span>
                        <span
                          className="font-bold leading-tight mt-1 px-1 uppercase tracking-wide"
                          style={{ color: gradeInfo.color, fontSize: "0.55rem" }}
                        >
                          {gradeInfo.label}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    {score !== null && (
                      <>
                        <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-m2p-muted/90 mb-1">
                          Readiness score
                        </p>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span
                            className="text-[3.5rem] sm:text-6xl font-black tabular-nums leading-none tracking-tight"
                            style={{ color: scoreHeroColor }}
                          >
                            {score}
                          </span>
                          <span className="text-2xl sm:text-3xl font-bold text-m2p-ink/25">/100</span>
                        </div>
                        <p className="mt-2 text-sm sm:text-base font-bold" style={{ color: risk === "Low" ? subLime : riskColor }}>
                          {statusLine}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div
                  className="mt-6 space-y-0 rounded-xl overflow-hidden border border-m2p-border/40 bg-white/60 backdrop-blur-[2px]"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-m2p-border/30">
                    <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-m2p-muted">Issues found</span>
                    <span className="font-black" style={{ color: totalIssues === 0 ? "#2D6A2D" : "#f05a28" }}>
                      {totalIssues} issue{totalIssues !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {criticalCount > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-b border-m2p-border/30">
                      <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-m2p-muted">Critical (hard to fix)</span>
                      <span className="font-black text-red-600">{criticalCount}</span>
                    </div>
                  )}
                  {risk && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-m2p-muted">KDP rejection risk</span>
                      <span className="font-black text-sm flex items-center gap-1.5" style={{ color: riskColor }}>
                        <span className="opacity-90">{riskIcon}</span> {risk}
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className="mt-5 rounded-xl px-4 py-3.5 text-center"
                  style={{
                    background: "rgba(13, 61, 24, 0.14)",
                    border: "1px solid rgba(26, 107, 42, 0.2)",
                  }}
                >
                  <p
                    className="text-sm font-bold leading-snug text-m2p-ink"
                    style={{ textWrap: "balance" } as React.CSSProperties}
                  >
                    Unlock below for every issue, affected pages, fix steps
                    <span className="text-m2p-muted font-semibold"> — </span>
                    and your annotated PDF.
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {report && (
        <PaymentGate
          tool={isFormatReview ? "kdp-format-review" : isChecker ? "kdp-pdf-checker" : isEpub ? "epub-maker" : isPdfFlow ? "pdf-compress" : "kdp-formatter"}
          downloadId={id}
          hideChildrenUntilUnlocked
        >
        {/* Checker: PDF viewer (always show when we have a preview PDF) */}
        {report?.outputType === "checker" && report.hasPdfPreview && report.pdfSourceUrl && (
          <div className="mb-8 rounded-2xl border border-[#1A6B2A]/15 overflow-hidden bg-white/90 shadow-[0_12px_40px_-16px_rgba(13,61,24,0.2)]">
            <div className="px-4 sm:px-5 py-3 border-b border-m2p-border/40" style={{ background: DL_VIS.forestGrad }}>
              <h2 className="text-[11px] font-black tracking-[0.18em] text-white uppercase">View issues on your PDF</h2>
              <p className="text-[11px] text-white/75 mt-0.5">Page-by-page highlights match your report below</p>
            </div>
            <div className="p-3 sm:p-4">
            <CheckerPdfViewer
              pdfUrl={report.pdfSourceUrl}
              pageIssues={(report.page_issues ?? []).map((issue) => ({
                ...issue,
                fixDifficulty: issue.fixDifficulty ?? toFixDifficulty(issue.rule_id, issue.message),
              }))}
              totalPages={report.pageCount ?? 0}
              readinessScore={canonicalCheckerReadinessScore(report)}
              passThreshold={KDP_DISPLAY_PASS_THRESHOLD}
              verdict={report.verdict ?? null}
            />
            </div>
          </div>
        )}
        {report?.outputType === "checker" && report.hasPdfPreview && !report.pdfSourceUrl && (
          <p className="mb-6 text-sm text-center" style={{ color: "#F05A28" }}>
            Preview unavailable.
          </p>
        )}

        {/* Processing report card */}
        {report && (
          <div
            className={`mb-8 rounded-2xl p-5 sm:p-7 border ${report.outputType === "format-review" ? "border-m2p-border text-m2p-ink" : "border-[#1A6B2A]/12 text-m2p-ink"}`}
            style={{
              background: report.outputType === "format-review" ? "rgba(250,247,238,0.95)" : "rgba(255,255,255,0.92)",
              boxShadow: DL_VIS.cardShadow,
            }}
          >
            {report.outputType === "checker" && (
              <>
                <div id="report-content">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 pb-4 border-b border-m2p-border/50">
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-m2p-muted mb-1">Compliance report</p>
                      <BrandWordmark variant="onLight" className="text-2xl" />
                    </div>
                    {(report.scanDate || report.fileNameScanned) && (
                      <div className="text-xs sm:text-sm text-m2p-muted text-left sm:text-right space-y-0.5">
                        {report.scanDate && (
                          <p>
                            <span className="font-bold text-[10px] uppercase tracking-wider text-m2p-muted/80">Scan</span>{" "}
                            <span className="tabular-nums text-m2p-ink">{new Date(report.scanDate).toLocaleString()}</span>
                          </p>
                        )}
                        {report.fileNameScanned && (
                          <p>
                            <span className="font-bold text-[10px] uppercase tracking-wider text-m2p-muted/80">File</span>{" "}
                            <span className="text-m2p-ink">{cleanFilenameForDisplay(report.fileNameScanned)}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Top summary: consistent theme by result (green pass, orange fail). */}
                  {isChecker && (
                    <div className="mb-4 rounded-xl border border-m2p-border/50 overflow-hidden bg-white/85 shadow-sm">
                      <table className="w-full text-sm border-collapse">
                        <tbody>
                          {(() => {
                            const summaryScore = canonicalCheckerReadinessScore(report);
                            const summaryPass = checkerHeroLooksPassing(report, summaryScore);
                            const summaryHeaderStyle = {
                              background: summaryPass
                                ? "linear-gradient(180deg, #1A6B2A 0%, #0D3D18 100%)"
                                : "linear-gradient(180deg, #D65A2F 0%, #C14A27 100%)",
                              color: "#fff",
                            } as const;
                            return (
                              <>
                          <tr className="border-b border-m2p-border/30 align-top">
                            <th
                              scope="row"
                              className="py-3 px-3 text-left text-[10px] font-black uppercase tracking-wider w-[min(32%,10rem)] max-w-[11rem] border-r border-m2p-border/25 align-top"
                              style={summaryHeaderStyle}
                            >
                              Scan context
                            </th>
                            <td className="py-3 px-3">
                              <div
                                className="flex flex-wrap gap-2 items-center"
                                style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}
                              >
                                <span className="rounded-full px-3 py-1 text-xs font-bold bg-white/90 border border-[#1A6B2A]/20 text-m2p-ink shadow-sm whitespace-nowrap">
                                  {scanBookType === "hardcover" ? "📕 Hardcover" : "📖 Paperback"}
                                </span>
                                <span className="rounded-full px-3 py-1 text-xs font-bold bg-white/90 border border-[#1A6B2A]/20 text-m2p-ink shadow-sm whitespace-nowrap">
                                  {scanBleed ? "🩸 With bleed" : "⬜ No bleed"}
                                </span>
                                <span className="rounded-full px-3 py-1 text-xs font-bold bg-white/90 border border-[#1A6B2A]/20 text-m2p-ink shadow-sm whitespace-nowrap">
                                  {scanColorMode === "color" ? "🎨 Full color" : "⚫ B&W"}
                                </span>
                                {report.trimDetected && (
                                  <span className="rounded-full px-3 py-1 text-xs font-bold bg-white/90 border border-[#1A6B2A]/20 text-m2p-ink shadow-sm">
                                    📏 Detected trim: {report.trimDetected}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                          {(() => {
                            const s = summaryScore;
                            const sg =
                              report.verdict === "needs-fixes" && report.scoreGrade
                                ? report.scoreGrade
                                : s !== null
                                  ? getScoreGrade(s)
                                  : report.scoreGrade ?? null;
                            if (!sg) return null;
                            const col = checkerHeroLooksPassing(report, s) ? "#4cd964" : "#f0a028";
                            return (
                              <tr className="border-b border-m2p-border/30 align-top">
                                <th
                                  scope="row"
                                  className="py-3 px-3 text-left text-[10px] font-black uppercase tracking-wider border-r border-m2p-border/25 align-middle"
                                  style={summaryHeaderStyle}
                                >
                                  Grade & summary
                                </th>
                                <td className="py-3 px-3" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,247,238,0.98) 100%)" }}>
                                  {/* Text-only: no grade circle (print/PDF layout was still breaking with icons) */}
                                  <p className="font-black text-m2p-ink text-base sm:text-lg leading-snug m-0">
                                    <span className="font-bebas tabular-nums tracking-tight" style={{ color: col }}>
                                      Grade {sg.grade}
                                    </span>
                                    <span className="text-m2p-border font-semibold mx-2 select-none">·</span>
                                    <span>{sg.label}</span>
                                  </p>
                                  <p className="text-xs text-m2p-muted mt-1.5 leading-snug m-0">{sg.description}</p>
                                </td>
                              </tr>
                            );
                          })()}
                          {canonicalCheckerReadinessScore(report) != null && (
                            <tr className="border-b border-m2p-border/30">
                              <th
                                scope="row"
                                className="py-2.5 px-3 text-left text-[10px] font-black uppercase tracking-wider border-r border-m2p-border/25 align-middle whitespace-nowrap"
                                style={summaryHeaderStyle}
                              >
                                Readiness
                              </th>
                              <td className="py-2.5 px-3 font-black text-m2p-ink text-lg sm:text-xl tabular-nums">
                                <span className="text-[#0D3D18]">{canonicalCheckerReadinessScore(report)}</span>
                                <span className="text-m2p-muted text-sm font-bold"> /100</span>
                              </td>
                            </tr>
                          )}
                          {report.verdict && (
                            <tr className="border-b border-m2p-border/30">
                              <th
                                scope="row"
                                className="py-2.5 px-3 text-left text-[10px] font-black uppercase tracking-wider border-r border-m2p-border/25 align-middle"
                                style={summaryHeaderStyle}
                              >
                                Verdict
                              </th>
                              <td className="py-2.5 px-3 text-sm font-bold">
                                <span className={report.verdict === "pass" ? "text-[#2D6A2D]" : "text-[#c2410c]"}>
                                  {report.verdict === "pass" ? "KDP Ready" : "Needs Fixes"}
                                </span>
                              </td>
                            </tr>
                          )}
                          {typeof report.blockerCount === "number" && (
                            <tr className="border-b border-m2p-border/30">
                              <th
                                scope="row"
                                className="py-2.5 px-3 text-left text-[10px] font-black uppercase tracking-wider border-r border-m2p-border/25 align-middle"
                                style={summaryHeaderStyle}
                              >
                                Issue counts
                              </th>
                              <td className="py-2.5 px-3 text-xs text-m2p-ink font-semibold tabular-nums whitespace-nowrap">
                                Blockers {report.blockerCount} · Warnings {report.warningCount ?? 0} · Info {report.infoCount ?? 0}
                              </td>
                            </tr>
                          )}
                          {canonicalCheckerReadinessScore(report) != null && report.riskLevel && (
                            <tr className="border-b border-m2p-border/30">
                              <th
                                scope="row"
                                className="py-2.5 px-3 text-left text-[10px] font-black uppercase tracking-wider border-r border-m2p-border/25 align-middle"
                                style={summaryHeaderStyle}
                              >
                                Approval & risk
                              </th>
                              <td className="py-2.5 px-3 text-sm font-bold text-m2p-ink">
                                <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1" style={{ display: "inline-flex", flexWrap: "wrap", alignItems: "baseline", columnGap: "0.5rem" }}>
                                  <span className="text-m2p-muted font-semibold">Likelihood</span>
                                  <span className="tabular-nums">{canonicalCheckerReadinessScore(report)}%</span>
                                  <span className="text-m2p-border">·</span>
                                  <span className="text-m2p-muted font-semibold">Risk</span>
                                  <span
                                    className="font-black whitespace-nowrap"
                                    style={{
                                      color:
                                        report.riskLevel === "Low"
                                          ? "#2D6A2D"
                                          : report.riskLevel === "Medium"
                                            ? "#c27803"
                                            : "#c2410c",
                                    }}
                                  >
                                    {report.riskLevel}
                                  </span>
                                </span>
                              </td>
                            </tr>
                          )}
                              </>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Bleed context note — if user said no-bleed, downgrade bleed warnings */}
                  {isChecker && !scanBleed && report.issuesEnriched?.some(
                    (i) => /bleed|trim.*outside|does not extend/i.test(i.originalMessage)
                  ) && (
                    <div className="mb-4 rounded-xl border border-blue-200/80 bg-blue-50/90 px-4 py-3 text-sm text-blue-950 border-l-[4px] border-l-blue-600">
                      <p className="leading-relaxed m-0">
                        You indicated <strong>no bleed</strong> — bleed-related issues below are expected for your book type and can be ignored if you do not intend full-bleed images or backgrounds.
                      </p>
                    </div>
                  )}
                  {report.creationTool && report.creationTool !== "unknown" && (
                    <p className="mb-4 text-sm text-m2p-muted">
                      Detected source:{" "}
                      <span className="font-semibold text-m2p-ink capitalize">
                        {report.creationTool.replace(/_/g, " ")}
                      </span>
                      {" "}— fix instructions below are tailored to your tool.
                    </p>
                  )}
                  {report.highRiskPageNumbers && report.highRiskPageNumbers.length > 0 && (
                    <p className="mb-4 text-sm text-m2p-orange font-medium">
                      Pages most likely to cause print problems: {report.highRiskPageNumbers.join(", ")}
                    </p>
                  )}

                  {/* Advisory notices (Sprint 1: spine text, gutter boundary, hardcover rules) */}
                  {report.advisoryNotices && report.advisoryNotices.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {report.advisoryNotices.map((notice, i) => (
                        <div
                          key={i}
                          className={`rounded-xl border px-4 py-3 text-sm border-l-[4px] ${
                            notice.severity === "warning"
                              ? "border-amber-200 bg-amber-50/95 text-amber-950 border-l-amber-500"
                              : "border-blue-200 bg-blue-50/95 text-blue-950 border-l-blue-600"
                          }`}
                        >
                          <p className="leading-relaxed m-0">{notice.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Item 5: Title matches cover — static reminder for all checker reports */}
                  <div className="mb-4 rounded-xl border border-m2p-border/60 bg-gradient-to-br from-white to-m2p-ivory/80 px-4 py-3 text-sm text-m2p-ink border-l-[4px] border-l-[#2D6A2D] shadow-sm">
                    <p className="font-bold mb-0.5 m-0">Reminder: verify your cover title matches your interior</p>
                    <p className="text-m2p-muted text-xs leading-relaxed m-0 mt-1">
                      This scan checks your interior PDF only. Before uploading to KDP, confirm that the title, subtitle, and author name on your cover file exactly match your interior title page — including spelling, punctuation, and capitalization. Mismatches are a common KDP rejection reason.
                    </p>
                  </div>
                  {report.uploadChecklist && report.uploadChecklist.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-black tracking-[0.12em] uppercase text-m2p-muted mb-3">Upload readiness checklist</p>
                      <div className="space-y-2">
                        {report.uploadChecklist.map((item, i) => {
                          const statusStyles = {
                            pass: "bg-green-50 border-green-200 text-green-800",
                            warning: "bg-amber-50 border-amber-200 text-amber-800",
                            fail: "bg-red-50 border-red-200 text-red-800",
                          } as const;
                          const checkLabel =
                            item.check === "No critical errors" || item.check === "Critical errors found"
                              ? item.status === "pass"
                                ? "Passed — no critical errors"
                                : "Failed — critical errors found"
                              : item.check;
                          return (
                            <div
                              key={i}
                              className={`rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition-shadow hover:shadow-md ${statusStyles[item.status]}`}
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "0.5rem 1rem",
                              }}
                            >
                              <span className="min-w-0 flex-1">{checkLabel}</span>
                              <span className="text-xs uppercase tracking-wide opacity-80 whitespace-nowrap shrink-0">
                                {item.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {report.specTable && report.specTable.length > 0 && (
                    <div className="mb-4 overflow-x-auto rounded-xl border border-m2p-border/50 overflow-hidden shadow-sm">
                      <p className="text-[10px] font-black tracking-[0.12em] uppercase text-m2p-muted mb-0 px-4 py-3 bg-gradient-to-r from-[#1A6B2A]/12 to-transparent">
                        KDP spec comparison
                      </p>
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr style={{ background: "linear-gradient(180deg, #1A6B2A 0%, #0D3D18 100%)" }}>
                            <th className="text-left p-3 text-[10px] font-black tracking-wider uppercase text-white/95 border-b border-white/10">Requirement</th>
                            <th className="text-left p-3 text-[10px] font-black tracking-wider uppercase text-white/95 border-b border-white/10">Your file</th>
                            <th className="text-left p-3 text-[10px] font-black tracking-wider uppercase text-white/95 border-b border-white/10">KDP required</th>
                            <th className="text-left p-3 text-[10px] font-black tracking-wider uppercase text-white/95 border-b border-white/10">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white/90">
                          {report.specTable.map((row, i) => (
                            <tr key={i} className={`border-b border-m2p-border/40 ${i % 2 === 1 ? "bg-m2p-ivory/40" : ""}`}>
                              <td className="p-2.5 align-top">{row.requirement}</td>
                              <td className="p-2.5 align-top">{row.yourFile}</td>
                              <td className="p-2.5 align-top">{row.kdpRequired}</td>
                              <td className="p-2.5">{row.status === "pass" ? "✅" : row.status === "warning" ? "⚠️" : "❌"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {(() => {
                    const { grouped, totalGroups, totalCount } = getGroupedIssues(report);
                    if (grouped.length === 0) return null;
                    const show = grouped.slice(0, MAX_ISSUES_GROUP_DISPLAY);
                    const remaining = totalGroups - show.length;
                    return (
                      <div className="mt-4 pt-5 border-t border-m2p-border/60">
                        <p className="text-[10px] font-black tracking-[0.14em] uppercase mb-3" style={{ color: "#D65A2F" }}>Issues</p>
                        <ul className="text-sm text-m2p-muted space-y-3">
                          {show.map((item, i) => (
                            <li key={i} className="rounded-xl border border-m2p-border/50 bg-white/80 px-4 py-3 shadow-sm border-l-[3px] border-l-m2p-orange/50 hover:shadow-md transition-shadow">
                              <div>
                                {item.label ? <span className="text-xs font-bold uppercase tracking-wide text-m2p-orange mr-2">{item.label}</span> : null}
                                <span className="text-m2p-ink font-medium">{item.message}</span>
                                {item.pages.length > 0 ? <span className="text-m2p-muted">{formatPages(item.pages)}</span> : ""}
                              </div>
                              {item.toolFixInstruction && (
                                <p className="mt-2 text-xs text-m2p-muted border-t border-m2p-border/50 pt-2 leading-relaxed">
                                  <span className="font-semibold text-m2p-ink">How to fix: </span>
                                  {item.toolFixInstruction}
                                </p>
                              )}
                            </li>
                          ))}
                          {remaining > 0 ? (
                            <li className="text-m2p-muted italic">
                              …and {remaining} more {remaining === 1 ? "issue" : "issues"}. Download the full report for details.
                            </li>
                          ) : null}
                        </ul>
                      </div>
                    );
                  })()}
                  {report.recommendations && report.recommendations.length > 0 && (
                    <div className="mt-4 pt-5 border-t border-m2p-border/60">
                      <p className="text-[10px] font-black tracking-[0.12em] uppercase text-m2p-live mb-2">Recommendations</p>
                      <ul className="text-xs text-m2p-muted list-disc list-inside space-y-1">
                        {report.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {report.kdpReady && report.verdict !== "needs-fixes" && (
                    <div className="mt-6 pt-4 border-t border-m2p-border/60">
                      <p className="text-sm font-bold text-m2p-ink">
                        Verified by manu2print
                      </p>
                      <p className="mt-1 text-base font-black tracking-tight text-[#1A6B2A]">
                        KDP COMPLIANCE SCAN: PASSED
                      </p>
                      <p className="mt-1 text-sm text-m2p-muted">
                        <span className="font-semibold uppercase text-[10px] tracking-wider text-m2p-muted/80">File</span>{" "}
                        {cleanFilenameForDisplay(report.fileNameScanned ?? "")}
                      </p>
                      <p className="text-sm text-m2p-muted">
                        <span className="font-semibold uppercase text-[10px] tracking-wider text-m2p-muted/80">Date</span>{" "}
                        {report.scanDate ? new Date(report.scanDate).toLocaleString() : "—"}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#1A6B2A] leading-snug">
                        This file meets KDP print specifications.
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-6 border-t border-m2p-border/50 no-print">
                  <div
                    className="rounded-2xl border border-[#1A6B2A]/15 p-5 mb-5 text-center"
                    style={{ background: "rgba(13,61,24,0.06)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)" }}
                  >
                    <p className="text-[10px] font-black tracking-[0.12em] uppercase text-m2p-muted mb-2">Actions</p>
                    <p className="text-sm text-m2p-ink font-semibold mb-4">
                      ⏳ Report expires in 24 hours.
                    </p>
                    {authEmail === undefined && isChecker && (
                      <p className="text-xs text-m2p-muted mb-3">Checking your account…</p>
                    )}
                    {hasActionablePageIssues && hasAnnotatedDownload && (
                      <div className="flex justify-center mb-3">
                        {report.annotatedPdfDownloadUrl ? (
                          <a
                            href={report.annotatedPdfDownloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto text-center bg-m2p-orange text-white px-6 py-3.5 rounded-xl font-black hover:bg-m2p-orange-hover cursor-pointer transition-all shadow-md hover:shadow-lg inline-block"
                          >
                            Download Annotated PDF (with highlights)
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const match = report.annotatedPdfUrl?.match(/\/file\/([^/]+)\/annotated\/?$/);
                              const jobId = match?.[1];
                              if (jobId) window.open(`/api/kdp-annotated-pdf?job_id=${encodeURIComponent(jobId)}`, "_blank");
                            }}
                            className="w-full sm:w-auto text-center bg-m2p-orange text-white px-6 py-3.5 rounded-xl font-black hover:bg-m2p-orange-hover cursor-pointer transition-all shadow-md hover:shadow-lg inline-block"
                          >
                            Download Annotated PDF (with highlights)
                          </button>
                        )}
                      </div>
                    )}
                    {!hasAnnotatedDownload && isChecker && hasActionablePageIssues && !report.annotatedPdfUrl && (
                      <div className="flex justify-center mb-3">
                        <button
                          type="button"
                          disabled
                          className="w-full sm:w-auto text-center bg-m2p-orange/45 text-white/90 px-6 py-3.5 rounded-xl font-black cursor-not-allowed inline-block"
                        >
                          Annotated PDF not available for this scan yet
                        </button>
                      </div>
                    )}
                    {typeof authEmail === "string" &&
                      authEmail.length > 0 &&
                      isChecker &&
                      hasActionablePageIssues &&
                      !hasAnnotatedDownload &&
                      !(report.annotatedEmailRequested || report.annotatedEmailSent) && (
                        <div className="mt-3 rounded-xl border border-[#1A6B2A]/20 bg-white/75 p-4 text-left">
                          <p className="text-sm font-semibold text-m2p-ink">
                            Signed in — we&apos;ll email your annotated PDF to{" "}
                            <span className="text-m2p-orange break-all">{authEmail}</span> when it&apos;s ready.
                          </p>
                          {annotatedEmailStatus === "saving" && (
                            <p className="mt-2 text-xs text-m2p-muted">Saving your preference…</p>
                          )}
                          {annotatedEmailStatus === "error" && (
                            <div className="mt-3">
                              <p className="text-xs text-[#F05A28] mb-2">
                                Could not save automatically. Check your connection, or sign out to enter a different email.
                              </p>
                              <button
                                type="button"
                                onClick={() => void postCheckerAnnotatedEmail(authEmail)}
                                className="rounded-lg bg-m2p-orange text-white px-4 py-2 text-sm font-bold"
                              >
                                Retry
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    {authEmail === null &&
                      isChecker &&
                      hasActionablePageIssues &&
                      !hasAnnotatedDownload &&
                      !(report.annotatedEmailRequested || report.annotatedEmailSent) && (
                        <div className="mt-3 rounded-xl border border-[#1A6B2A]/20 bg-white/75 p-4 text-left">
                          <p className="text-sm font-semibold text-m2p-ink mb-2">
                            Get the annotated PDF by email when ready
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="email"
                              placeholder="you@example.com"
                              value={annotatedEmailInput}
                              onChange={(e) => {
                                setAnnotatedEmailInput(e.target.value);
                                if (annotatedEmailStatus === "error") setAnnotatedEmailStatus("idle");
                              }}
                              className="flex-1 rounded-lg border border-m2p-border/70 bg-white px-3 py-2 text-sm text-m2p-ink"
                            />
                            <button
                              type="button"
                              onClick={() => void submitCheckerAnnotatedEmail()}
                              disabled={annotatedEmailStatus === "saving"}
                              className="rounded-lg bg-m2p-orange text-white px-4 py-2 text-sm font-bold disabled:opacity-60"
                            >
                              {annotatedEmailStatus === "saving" ? "Saving..." : "Email me when ready"}
                            </button>
                          </div>
                          {annotatedEmailStatus === "queued" && (
                            <p className="mt-2 text-xs text-[#1A6B2A]">Queued. We&apos;ll auto-send when annotation is ready.</p>
                          )}
                          {annotatedEmailStatus === "sent" && (
                            <p className="mt-2 text-xs text-[#1A6B2A]">Sent. Check your inbox for the annotated PDF link.</p>
                          )}
                          {annotatedEmailStatus === "error" && (
                            <p className="mt-2 text-xs text-[#F05A28]">Enter a valid email and try again.</p>
                          )}
                        </div>
                      )}
                    {isChecker && hasActionablePageIssues && !hasAnnotatedDownload && (report.annotatedEmailRequested || report.annotatedEmailSent) && (
                      <p className="mt-3 text-xs text-center text-[#1A6B2A]">
                        {report.annotatedEmailSent
                          ? "Annotated PDF email sent. Check your inbox."
                          : "Annotated PDF email queued. We will send it automatically when ready."}
                      </p>
                    )}
                  <div className="mt-8 pt-1 border-t border-m2p-border/30">
                    <p className="text-xs text-m2p-muted text-center max-w-lg mx-auto mb-3 leading-relaxed">
                      <span className="font-semibold text-m2p-ink">Save this report as PDF</span> using the button below, then choose{" "}
                      <span className="font-semibold text-m2p-ink">Save as PDF</span> in the print dialog. It matches what you see on this page (same summary layout — not a separate long document). For on-page highlights, use{" "}
                      <span className="font-semibold text-m2p-ink">Annotated PDF</span> when available.
                    </p>
                    <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handlePrintFullReportAsPdf}
                      className="w-full sm:w-auto text-center bg-m2p-orange text-white px-6 py-3.5 rounded-xl font-black hover:bg-m2p-orange-hover cursor-pointer transition-all shadow-md hover:shadow-lg inline-block"
                    >
                      Download Full Report (PDF)
                    </button>
                    </div>
                  </div>
                  {/* Share-to-earn CTA — shown to authenticated users with a token */}
                  {shareToken && (
                    <div
                      className="mt-4 rounded-2xl p-5 text-center border border-[#1A6B2A]/25"
                      style={{ background: "linear-gradient(180deg, #2D6A2D 0%, #1a4a1a 100%)", boxShadow: DL_VIS.cardShadow }}
                    >
                      <p className="font-black text-white text-base mb-1">
                        Know another author who should check their PDF?
                      </p>
                      <p className="text-sm text-white/80 mb-4 leading-relaxed">
                        Share your personal link — when they buy through it, you earn a free scan credit.
                      </p>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          readOnly
                          value={`https://www.manu2print.com/kdp-pdf-checker?sh=${shareToken}`}
                          className="flex-1 rounded-xl border border-white/20 bg-black/20 px-3 py-2.5 text-xs text-white font-mono truncate"
                        />
                        <button
                          type="button"
                          onClick={handleCopyShareEarnLink}
                          className="shrink-0 rounded-xl bg-m2p-orange text-white px-5 py-2.5 text-sm font-black hover:bg-m2p-orange-hover transition-colors shadow-md"
                        >
                          {shareCopied ? "Copied! ✓" : "Copy link"}
                        </button>
                      </div>
                      <p className="text-xs text-white/65 mt-3">
                        Track your referrals →{" "}
                        <a href="/dashboard" className="text-[#C5E83A] font-bold hover:underline">Dashboard</a>
                      </p>
                    </div>
                  )}

                  {/* ── Share section ── */}
                  {(() => {
                    const readiness = canonicalCheckerReadinessScore(report);
                    const shareScore = readiness ?? 0;
                    const shareIsPass = checkerHeroLooksPassing(report, readiness);
                    const verifyLink  = `https://www.manu2print.com/verify/${id}${shareToken ? `?sh=${encodeURIComponent(shareToken)}` : ""}`;
                    const ogBase      = `/api/og/verify/${id}?p=${shareIsPass ? 1 : 0}&s=${shareScore}`;
                    const portraitUrl = `${ogBase}&format=portrait`;
                    const shareIssues = getGroupedIssues(report).totalCount;
                    const caption     = buildVerifyShareCaption({
                      isPass: shareIsPass,
                      score: shareScore,
                      verifyUrl: verifyLink,
                      issuesCount: shareIssues,
                    });
                    const headerGrad = shareIsPass
                      ? "linear-gradient(180deg, #1A6B2A 0%, #0D3D18 100%)"
                      : "linear-gradient(180deg, #D65A2F 0%, #C14A27 100%)";
                    const btnBg       = shareIsPass ? "#F05A28" : "#2D6A2D";

                    return (
                      <div className="mt-6 rounded-2xl overflow-hidden shadow-[0_16px_40px_-12px_rgba(13,61,24,0.2)] border border-[#1A6B2A]/12">

                        {/* Header bar */}
                        <div style={{ background: headerGrad, padding: "16px 24px", textAlign: "center" }}>
                          <p style={{ fontWeight: 900, fontSize: 17, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
                            {shareIsPass ? "✅ Share your result — inspire other authors" : "🛑 Share your result — warn other authors"}
                          </p>
                          <div style={{ height: 2, width: 48, background: "rgba(197,232,58,0.5)", borderRadius: 1, margin: "10px auto 0" }} aria-hidden />
                        </div>

                        <div style={{ background: "linear-gradient(180deg, #FAF7EE 0%, #F2EBDF 100%)", padding: "20px 18px 22px" }}>

                          {/* Card preview */}
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#9B8E7A", letterSpacing: "0.09em", textTransform: "uppercase", textAlign: "center", margin: "0 0 10px" }}>
                            Your share card — download &amp; post
                          </p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={portraitUrl}
                            alt="Share card preview"
                            style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto 14px", borderRadius: 12, border: "1.5px solid rgba(0,0,0,0.07)", boxShadow: "0 6px 24px rgba(0,0,0,0.13)" }}
                          />

                          {/* Download button */}
                          <div style={{ marginBottom: 18 }}>
                            <a
                              href={portraitUrl}
                              download={`manu2print-result-${shareIsPass ? "pass" : "fail"}-portrait.png`}
                              style={{ display: "block", textAlign: "center", background: headerGrad, color: "#fff", fontWeight: 800, fontSize: 14, padding: "14px 8px", borderRadius: 12, textDecoration: "none", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}
                            >
                              ⬇ Download — IG / FB / LinkedIn
                            </a>
                          </div>

                          {/* Caption preview */}
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#9B8E7A", letterSpacing: "0.09em", textTransform: "uppercase", textAlign: "center", margin: "0 0 8px" }}>
                            Ready-to-paste caption
                          </p>
                          <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.07)", borderRadius: 10, padding: "12px 14px", marginBottom: 12, fontSize: 13, lineHeight: 1.6, color: "#3D3227", whiteSpace: "pre-line", wordBreak: "break-word" }}>
                            {caption}
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(caption);
                                setCopyShareStatus("ok");
                                setTimeout(() => setCopyShareStatus("idle"), 2500);
                              } catch {
                                setCopyShareStatus("fail");
                              }
                            }}
                            style={{ width: "100%", background: btnBg, color: "#fff", fontWeight: 800, fontSize: 15, padding: "14px 16px", borderRadius: 11, border: "none", cursor: "pointer", marginBottom: 16 }}
                          >
                            {copyShareStatus === "ok" ? "✓ Copied!" : "📋 Copy Caption + Link"}
                          </button>

                          {/* Earn box */}
                          <div style={{ background: "#2D6A2D", borderRadius: 12, padding: "16px 18px", textAlign: "center" }}>
                            <p style={{ fontWeight: 900, fontSize: 15, color: "#fff", margin: "0 0 5px" }}>🎁 Share &amp; Get Free Scans</p>
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", margin: "0 0 10px", lineHeight: 1.5 }}>
                              When someone checks their PDF through your link,<br />you earn a 100% Free Scan Credit.
                            </p>
                            <a href="/partners" style={{ fontSize: 12, fontWeight: 700, color: "#4CE87A", textDecoration: "none", borderBottom: "1px solid rgba(76,232,122,0.4)", paddingBottom: 1 }}>
                              Want to earn cash instead? Become a partner →
                            </a>
                          </div>

                        </div>
                      </div>
                    );
                  })()}
                  </div>
                </div>
              </>
            )}
            {!(report.outputType === "checker" && report.uploadChecklist) && (
            <h2 className={`font-semibold mb-4 ${report.outputType === "format-review" ? "text-xl text-m2p-ink" : "text-m2p-ink"} ${report.outputType === "checker" ? "mt-6" : ""}`}>{report.outputType === "format-review" ? "Format review" : "Processing report"}</h2>
            )}
            <ul className="text-sm text-m2p-muted space-y-1">
              {report.outputType === "format-review" ? null : report.outputType === "checker" ? (
                !report.uploadChecklist && (
                  <>
                    <li>Trim detected: <span className="text-m2p-ink">{report.trimDetected ?? "—"}</span></li>
                    <li>Matches KDP trim: <span className="text-m2p-ink">{report.trimMatchKDP ? "Yes" : "No"}{report.kdpTrimName ? ` (${report.kdpTrimName})` : ""}</span></li>
                    <li>Page count: <span className="text-m2p-ink">{report.pageCount ?? "—"}</span></li>
                    {report.fileSizeMB != null && (
                      <li>File size: <span className="text-m2p-ink">{report.fileSizeMB} MB</span></li>
                    )}
                    {report.recommendedGutterInches != null && (
                      <li>
                        Recommended gutter (inner margin) for your page count:{" "}
                        <span className="text-m2p-ink">
                          {report.recommendedGutterInches}&quot; ({Math.round(report.recommendedGutterInches * 2.54 * 10) / 10} cm / {Math.round(report.recommendedGutterInches * 25.4 * 10) / 10} mm)
                        </span>
                        . We can&apos;t measure margins from the PDF; set inner margin ≥ 0.5&quot; + gutter in your layout app.
                      </li>
                    )}
                  </>
                )
              ) : report.outputType === "epub" ? (
                <>
                  <li>Format: <span className="text-m2p-ink">Kindle-ready EPUB</span></li>
                  <li>Chapters: <span className="text-m2p-ink">{report.chaptersDetected ?? 0}</span></li>
                </>
              ) : report.outputType === "docx" ? (
                <>
                  <li>Sections detected: <span className="text-m2p-ink">{report.sectionsDetected ?? 0}</span></li>
                  <li>Lessons detected: <span className="text-m2p-ink">{report.lessonsDetected ?? 0}</span></li>
                  <li>Estimated pages (PDF): <span className="text-m2p-ink">~{report.estimatedPages ?? report.chaptersDetected}</span></li>
                  <li>Font applied: <span className="text-m2p-ink">{report.fontUsed}</span></li>
                  <li>Trim size: <span className="text-m2p-ink">{report.trimSize}</span></li>
                  {report.status && (
                    <li>Status: <span className="text-m2p-ink">{report.status}</span></li>
                  )}
                </>
              ) : (
                <>
                  <li>Pages generated: <span className="text-m2p-ink">{report.pagesGenerated}</span></li>
                  <li>Chapters detected: <span className="text-m2p-ink">{report.chaptersDetected}</span></li>
                  <li>Trim size: <span className="text-m2p-ink">{report.trimSize}</span></li>
                  <li>Font: <span className="text-m2p-ink">{report.fontUsed}</span></li>
                  {report.gutterInches != null && (
                    <li>Gutter: <span className="text-m2p-ink">{report.gutterInches}&quot;</span></li>
                  )}
                </>
              )}
            </ul>
            {report.outputType !== "format-review" && report.outputType !== "checker" && report.issues && report.issues.length > 0 && (
              <div className="mt-4 pt-4 border-t border-m2p-border">
                <p className="text-xs font-medium text-m2p-orange mb-2">Issues</p>
                <ul className="text-xs text-m2p-muted list-disc list-inside space-y-1">
                  {report.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.outputType === "checker" && !report.uploadChecklist && report.recommendations && report.recommendations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-m2p-border">
                <p className="text-xs font-medium text-m2p-live mb-2">Recommendations</p>
                <ul className="text-xs text-m2p-muted list-disc list-inside space-y-1">
                  {report.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.outputType === "format-review" && (
              <>
                {report.kdpReadiness && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-base font-semibold bg-m2p-orange-soft text-m2p-ink border border-m2p-orange/40">
                      KDP readiness: {report.kdpReadiness}
                    </span>
                  </div>
                )}
                {report.wordCount != null && (
                  <p className="mt-3 text-base text-m2p-muted">
                    Word count: {report.wordCount.toLocaleString()} · Est. pages (6×9): ~{report.estimatedPages ?? "—"}
                    {report.recommendedGutterInches != null && ` · Recommended gutter: ${report.recommendedGutterInches}"`}
                  </p>
                )}
                {report.summary && (
                  <div className="mt-5 pt-4 border-t border-m2p-border">
                    <p className="text-sm font-semibold text-m2p-muted mb-2">Summary</p>
                    <p className="text-base text-m2p-muted leading-relaxed">{report.summary}</p>
                  </div>
                )}
                {report.topActions && report.topActions.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-m2p-border">
                    <p className="text-sm font-semibold text-m2p-live mb-2">Top actions</p>
                    <ul className="text-base text-m2p-muted list-disc list-inside space-y-2">
                      {report.topActions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {report.formatReviewSections && report.formatReviewSections.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-m2p-border space-y-4">
                    {report.formatReviewSections.map((sec, i) => (
                      <div key={i}>
                        <p className="text-base font-semibold text-m2p-ink mb-1">{sec.title}</p>
                        {sec.content && <p className="text-base text-m2p-muted leading-relaxed">{sec.content}</p>}
                        {sec.issues && sec.issues.length > 0 && (
                          <ul className="text-sm text-m2p-ink list-disc list-inside mt-1.5 space-y-0.5">
                            {sec.issues.map((issue, j) => (
                              <li key={j}>{issue}</li>
                            ))}
                          </ul>
                        )}
                        {sec.recommendations && sec.recommendations.length > 0 && (
                          <ul className="text-sm text-m2p-live list-disc list-inside mt-1.5 space-y-0.5">
                            {sec.recommendations.map((rec, j) => (
                              <li key={j}>{rec}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-5 pt-4 border-t border-m2p-border flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopyFormatReviewShare}
                    className="text-base font-medium text-m2p-muted hover:text-m2p-orange transition-colors"
                  >
                    {copyShareStatus === "ok" ? "Copied!" : copyShareStatus === "fail" ? "Copy failed" : "Copy summary for social"}
                  </button>
                  <span className="text-m2p-muted">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      const lines: string[] = [
                        "KDP Format Review Report",
                        "manu2print.com",
                        "",
                        report.kdpReadiness ? `KDP readiness: ${report.kdpReadiness}` : "",
                        report.summary ? `Summary: ${report.summary}` : "",
                        report.wordCount != null ? `Word count: ${report.wordCount}` : "",
                        report.estimatedPages != null ? `Est. pages (6×9): ~${report.estimatedPages}` : "",
                        report.recommendedGutterInches != null ? `Recommended gutter: ${report.recommendedGutterInches}"` : "",
                        "",
                        ...(report.topActions && report.topActions.length > 0 ? ["Top actions:", ...report.topActions.map((a) => `  • ${a}`), ""] : []),
                        ...(report.formatReviewSections || []).flatMap((sec) => [
                          "",
                          sec.title,
                          ...(sec.issues || []).map((i) => `  Issue: ${i}`),
                          ...(sec.recommendations || []).map((r) => `  Recommendation: ${r}`),
                        ]),
                      ];
                      const blob = new Blob([lines.filter(Boolean).join("\n")], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "kdp-format-review-report.txt";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="text-base font-medium text-amber-700 hover:text-amber-900 transition-colors"
                  >
                    Download report (.txt)
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Checker: annotated PDF download (status text now lives under viewer) */}
        {isChecker && hasActionablePageIssues && hasAnnotatedDownload && (
              <div className="mb-8 rounded-2xl p-5 border border-[#1A6B2A]/25 overflow-hidden" style={{ background: "linear-gradient(180deg, #143d1f 0%, #0a2412 100%)", boxShadow: DL_VIS.cardShadow }}>
                <button
                  type="button"
                  onClick={() => {
                    if (report.annotatedPdfDownloadUrl) {
                      window.open(report.annotatedPdfDownloadUrl, "_blank", "noopener,noreferrer");
                      return;
                    }
                    const match = report.annotatedPdfUrl?.match(/\/file\/([^/]+)\/annotated\/?$/);
                    const jobId = match?.[1];
                    if (jobId) window.open(`/api/kdp-annotated-pdf?job_id=${encodeURIComponent(jobId)}`, "_blank");
                  }}
                  className="flex items-center gap-4 border border-white/15 rounded-xl p-4 bg-white/10 hover:bg-white/15 transition-all cursor-pointer text-left w-full"
                >
                  <div className="w-12 h-12 border border-[#C5E83A]/40 rounded-xl flex items-center justify-center text-[#C5E83A] flex-shrink-0 bg-black/20">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-black text-white text-base">Download Annotated PDF (issues highlighted)</span>
                    <p className="text-sm text-white/65 mt-0.5">Opens in a new tab</p>
                  </div>
                </button>
              </div>
        )}

        {/* Success message */}
        <div
          className="text-center mb-8 rounded-2xl border border-[#1A6B2A]/15 px-5 py-6"
          style={{ background: "rgba(255,255,255,0.75)", boxShadow: DL_VIS.cardShadow }}
        >
          <p className="text-[10px] font-black tracking-[0.14em] uppercase text-m2p-muted mb-2">All set</p>
          <h1 className="text-3xl sm:text-4xl font-black text-m2p-orange mb-2 leading-tight">
            {isFormatReview ? "Format Review Complete" : isChecker ? "KDP Check Complete" : isEpub ? "EPUB Ready!" : isDocx ? "Review DOCX Ready!" : "PDF Generated!"}
          </h1>
          <p className="text-m2p-muted text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            {isFormatReview
              ? "Review your KDP Readiness and top actions above. Fix the suggested items, then upload to KDP with confidence."
              : isChecker
                ? "Review the report above. Fix any issues in your file, then re-upload to KDP."
                : isEpub
                  ? "Your Kindle-ready EPUB is ready to download."
                  : isDocx
                    ? "Your formatted review draft is ready. Download it, proofread and edit as needed, then return to generate your final KDP PDF."
                    : "Your KDP-compliant PDF is ready for download."}
          </p>
        </div>

        {/* Download section - hide for checker and format-review */}
        {!isChecker && !isFormatReview && (
        <div
          className="rounded-2xl p-6 sm:p-8 mb-6 border border-[#F05A28]/30 overflow-hidden"
          style={{ background: "linear-gradient(165deg, #1A1208 0%, #2C1810 50%, #1A1208 100%)", boxShadow: DL_VIS.cardShadow }}
        >
          <div className="h-1 w-20 mx-auto rounded-full mb-5" style={{ background: DL_VIS.forestGrad }} aria-hidden />
          <h2 className="text-xl font-black text-center mb-6 text-white tracking-tight">Download your file</h2>

          <div className="mb-6">
            {downloadError && (
              <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                {downloadError}
              </div>
            )}
            <button
              type="button"
              onClick={handleDownload}
              aria-label={isEpub ? "Download Kindle EPUB" : isDocx ? "Download review DOCX" : "Download KDP Print PDF"}
              className="w-full flex items-center justify-between border-2 border-m2p-orange/60 rounded-xl p-4 bg-white/95 text-left hover:bg-white transition-all cursor-pointer shadow-md hover:shadow-lg hover:border-m2p-orange"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-m2p-orange/30 rounded flex items-center justify-center text-m2p-orange">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-white">
                    {isEpub ? "Kindle EPUB" : isDocx ? "Review DOCX" : "KDP Print PDF"}
                  </h3>
                  <p className="text-sm text-m2p-muted">
                    {isEpub ? "Ready to download" : isDocx ? "Proofread and edit, then return to generate PDF" : "Ready to download"}
                  </p>
                </div>
              </div>
              <div className="text-m2p-orange hover:text-white">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </div>
            </button>
          </div>

          {report && report.formatReviewText && !isEpub && (
            <div className="mb-6 p-4 rounded-lg bg-m2p-ivory/50 border border-m2p-orange/30">
              <h3 className="font-medium text-white mb-2">Get a full-document AI format review</h3>
              <p className="text-sm text-m2p-muted mb-3">
                Copy the whole manuscript (structure + text). Paste it in Cursor chat and ask the AI to scan it as a professional KDP formatter — margins, spacing, headings, lists, and Amazon KDP rules.
              </p>
              <button
                type="button"
                onClick={handleCopyForAIReview}
                className="border border-m2p-orange/60 hover:border-m2p-orange hover:bg-m2p-orange/10 text-m2p-orange font-medium py-2 px-4 rounded-lg text-sm transition-colors"
              >
                {copyReviewStatus === "ok" ? "✓ Copied to clipboard" : copyReviewStatus === "fail" ? "Copy failed" : "Copy for AI review"}
              </button>
            </div>
          )}

          {isDocx && !isEpub && (
            <div className="mb-6 p-4 rounded-lg bg-m2p-ivory/50 border border-white/10">
              <p className="text-sm text-m2p-muted mb-2">
                This is your review draft. Open it in Word or Google Docs to proofread and make any edits.
                When ready, return to Manu2Print KDP to generate your final KDP-ready PDF.
              </p>
              <p className="text-sm text-m2p-muted mb-2">
                Margins in this draft are equal on all sides (0.7&quot;) for easier editing. Your final PDF will use Amazon KDP–compliant inside/outside margins and gutter.
              </p>
              <p className="text-sm text-m2p-muted mb-4">
                <span className="text-m2p-orange">Tip:</span> To get layout feedback from the AI, open the document, take a screenshot of a page, and paste it in chat.
              </p>
              <Link
                href={`/kdp-formatter?id=${id}`}
                className="inline-block bg-m2p-orange hover:bg-m2p-orange-hover text-[#1a1a12] font-semibold py-2.5 px-5 rounded-lg"
              >
                Generate KDP PDF from this file
              </Link>
            </div>
          )}

          {/* EPUB Info Box — only for PDF/DOCX flows */}
          {!isEpub && (
          <div className="bg-m2p-ink border-l-4 border-l-m2p-orange rounded-r-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 border border-m2p-orange/30 rounded-full flex items-center justify-center text-m2p-orange">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-2">Need an EPUB file?</h3>
                <p className="text-m2p-muted text-sm">
                  Your KDP PDF is ready to download. To also get an EPUB file for eBook distribution, use the free tool <span className="text-m2p-orange">Calibre</span>:
                </p>
                <ol className="mt-3 text-m2p-muted text-sm space-y-1 ml-4 list-decimal">
                  <li>Download Calibre from <a href="https://calibre-ebook.com" target="_blank" rel="noopener noreferrer" className="text-m2p-orange hover:underline">calibre-ebook.com</a></li>
                  <li>Open your downloaded PDF in Calibre</li>
                  <li>Click &quot;Convert books&quot; and choose EPUB as output</li>
                </ol>
                <p className="text-m2p-muted text-xs italic mt-3">
                  Calibre is free, open-source, and used by publishing professionals worldwide.
                </p>
              </div>
            </div>
          </div>
          )}

          {/* What's included / Next steps */}
          <div className="bg-m2p-ink rounded-lg p-6 mb-6 space-y-6">
            {isEpub ? (
              <>
                <p className="text-m2p-muted text-sm">
                  <span className="text-m2p-orange">✓</span> Kindle-ready EPUB for eBook distribution on Amazon KDP and other retailers.
                </p>
                <p className="text-m2p-muted text-sm">
                  Upload to KDP as your eBook manuscript, or use with other platforms (Apple Books, Kobo, etc.).
                </p>
              </>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold text-white mb-4">What&apos;s included:</h3>
                  <ul className="space-y-1 text-m2p-muted text-sm">
                    <li><span className="text-m2p-orange">✓</span> KDP Print PDF (for paperback printing)</li>
                    <li><span className="text-m2p-orange">✓</span> EPUB conversion guide (using free Calibre tool)</li>
                    <li><span className="text-m2p-orange">✓</span> KDP-compliant trim size and margins</li>
                    <li><span className="text-m2p-orange">✓</span> Proper bleed settings (if selected)</li>
                    <li><span className="text-m2p-orange">✓</span> Professional typography and spacing</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-4">Next steps:</h3>
                  <ol className="space-y-1 text-m2p-muted text-sm list-decimal ml-4">
                    <li>Download the PDF above</li>
                    <li>Review the format in a PDF reader</li>
                    <li><span className="text-m2p-orange font-semibold">Check it for KDP compliance before uploading</span> — catches rejection issues before Amazon does</li>
                    <li>Upload to Amazon KDP as your manuscript</li>
                    <li>Design/upload your cover separately</li>
                  </ol>
                  <Link
                    href="/kdp-pdf-checker"
                    className="mt-4 inline-flex items-center gap-2 bg-m2p-orange hover:opacity-90 text-white font-bold px-5 py-3 rounded-lg text-sm transition-opacity"
                  >
                    Check this PDF for KDP compliance →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
        )}

        {/* Formatter → Checker nudge: shown after download section for PDF formatter flow */}
        {!isChecker && !isFormatReview && !isEpub && !isDocx && (
          <div className="mb-4 rounded-xl border border-m2p-orange/40 bg-m2p-orange/8 p-4 flex items-center gap-4">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-m2p-orange/15 flex items-center justify-center text-m2p-orange text-xl">✅</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-m2p-ink text-sm mb-0.5">PDF ready — now check it for KDP compliance</p>
              <p className="text-xs text-m2p-muted">Catches margin, bleed, and font issues before Amazon does.</p>
            </div>
            <Link
              href="/kdp-pdf-checker"
              className="shrink-0 bg-m2p-orange hover:opacity-90 text-white font-bold px-4 py-2 rounded-lg text-sm transition-opacity whitespace-nowrap"
            >
              Check PDF →
            </Link>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-4">
          {!isChecker && (
          <button
            type="button"
            onClick={handleDownload}
            aria-label={isEpub ? "Download EPUB file" : isDocx ? "Download review DOCX" : "Download PDF file"}
            className="flex-1 bg-m2p-orange hover:bg-m2p-orange-hover text-[#1a1a12] font-semibold py-3 px-6 rounded-lg text-center cursor-pointer"
          >
            {isEpub ? "Download EPUB" : isDocx ? "Download Review DOCX" : "Download PDF"}
          </button>
          )}
          {!isChecker && (
            <Link
              href={isFormatReview ? "/kdp-format-review" : isEpub ? "/epub-maker" : isPdfFlow ? "/pdf-compress" : "/kdp-formatter"}
              className="flex-1 border border-white/20 hover:border-m2p-orange text-white font-medium py-3 px-6 rounded-lg text-center"
            >
              {isFormatReview ? "Review Another" : isEpub ? "Create Another EPUB" : "Format Another"}
            </Link>
          )}
        </div>

        {/* Checker: re-check CTA when issues exist */}
        {isChecker && report && (() => {
          const score = canonicalCheckerReadinessScore(report);
          const hasIssues = (report.issuesEnriched?.length ?? 0) > 0;
          if (!hasIssues && score !== null && score >= KDP_DISPLAY_PASS_THRESHOLD) return null;
          return (
            <div
              className="mt-7 rounded-2xl border p-6 sm:p-7 text-center overflow-hidden"
              style={{
                borderColor: "rgba(240,90,40,0.45)",
                background: "linear-gradient(160deg, rgba(255,242,233,0.95) 0%, rgba(255,255,255,0.96) 42%, rgba(255,231,214,0.92) 100%)",
                boxShadow: "0 20px 44px -18px rgba(240,90,40,0.45), inset 0 1px 0 rgba(255,255,255,0.7)",
              }}
            >
              <p className="text-[10px] font-black tracking-[0.14em] uppercase text-m2p-orange mb-2">Next action</p>
              <p className="font-black text-2xl sm:text-3xl text-m2p-ink mb-2 leading-tight">Fixed your issues?</p>
              <p className="text-sm sm:text-base text-m2p-muted mb-5 max-w-2xl mx-auto">
                Re-upload your corrected PDF now and run a fresh compliance check before you publish.
                <span className="block mt-1.5 font-semibold text-m2p-ink">Each re-check uses 5 scan credits.</span>
              </p>
              <Link
                href="/kdp-pdf-checker"
                className="inline-block bg-m2p-orange hover:bg-m2p-orange-hover text-white font-black px-9 py-4 rounded-xl text-lg tracking-tight transition-all shadow-[0_14px_30px_-14px_rgba(240,90,40,0.65)] hover:shadow-[0_18px_34px_-12px_rgba(240,90,40,0.75)]"
              >
                Re-check my PDF →
              </Link>
            </div>
          );
        })()}
        </PaymentGate>
        )}

        {/* Public verification link (text removed per UX update) */}

        {/* Micro FAQ */}
        <div className="border border-m2p-border rounded-lg divide-y divide-m2p-border mb-6">
          <div className="p-4">
            <p className="font-semibold text-m2p-ink mb-1">
              Q: What does this report check?
            </p>
            <p className="text-m2p-muted text-sm">
              A: The scan checks margins, trim size, bleed settings, font embedding, and other formatting rules required for Amazon KDP print publishing.
            </p>
          </div>
          <div className="p-4">
            <p className="font-semibold text-m2p-ink mb-1">
              Q: Will fixing these issues guarantee KDP approval?
            </p>
            <p className="text-m2p-muted text-sm">
              A: The report identifies common formatting problems, but final validation occurs during the Amazon KDP upload process.
            </p>
          </div>
          <div className="p-4">
            <p className="font-semibold text-m2p-ink mb-1">
              Q: Can Manu2Print fix these issues automatically?
            </p>
            <p className="text-m2p-muted text-sm">
              A: Yes. The KDP PDF Formatter repairs formatting errors and produces a print-ready PDF for KDP upload. Coming soon.
            </p>
          </div>
        </div>

        {/* Storage notice (single location) */}
        <div className="mt-8 bg-m2p-orange-soft/50 border border-m2p-border rounded-lg p-4 space-y-2">
          <p>
            <span className="text-m2p-ink font-medium">Storage:</span>{" "}
            <span className="text-xs text-m2p-muted">
              {isFormatReview || isChecker
                ? "Your report is stored temporarily for 24 hours."
                : "Your files are stored temporarily for 24 hours. Download now and keep a backup."}
            </span>
          </p>
          <p className="text-xs text-m2p-muted">
            <span className="text-m2p-ink font-medium">Save this link:</span> Bookmark this page or copy the URL to return to your download within 24 hours.
          </p>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-8">
          <a
            href="/kdp-pdf-checker"
            className="bg-m2p-orange-soft text-m2p-orange border border-m2p-orange px-6 py-3 rounded-lg font-bold hover:bg-m2p-orange hover:text-white"
          >
            Run Another Manuscript Check →
          </a>
        </div>

        <p className="text-center text-m2p-muted text-xs mt-6">
          © manu2print.com — Built for indie authors
        </p>
      </main>
    </div>
  );
}
