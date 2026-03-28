// cache-bust: 2026-03-21-v2
"use client";

// TODO: Manny watermark to be added to generated PDF output
import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PaymentGate from "@/components/PaymentGate";
import CheckerPdfViewer from "@/components/CheckerPdfViewer";
import { difficultyLabel, cleanFilenameForDisplay, toFixDifficulty, getScoreGrade, type FixDifficulty } from "@/lib/kdpReportEnhance";

const MAX_ISSUES_GROUP_DISPLAY = 10;

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
  annotatedPdfDownloadUrl?: string;
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
  const [annotatedReady, setAnnotatedReady] = useState(false);
  const [annotatedError, setAnnotatedError] = useState(false);
  const [annotatedWaitStartedAt, setAnnotatedWaitStartedAt] = useState<number | null>(null);
  const [annotatedTakingLong, setAnnotatedTakingLong] = useState(false);
  /** Checker UI: readiness / approval % from issues only (not engine-stored scores). */
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null);

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

  const handleCopyVerificationLink = useCallback(async () => {
    if (!id) return;
    const url = `https://manu2print.com/verify/${id}`;
    setCopyShareStatus("idle");
    try {
      await navigator.clipboard.writeText(url);
      setCopyShareStatus("ok");
      setTimeout(() => setCopyShareStatus("idle"), 2000);
    } catch {
      setCopyShareStatus("fail");
      setTimeout(() => setCopyShareStatus("idle"), 2000);
    }
  }, [id]);

  const loadReport = useCallback(() => {
    if (!id) return;
    setReportError(null);
    setReportLoading(true);
    fetch(`/api/format-report?id=${encodeURIComponent(id)}`)
      .then((r) => r.json().then((data: { success?: boolean; report?: ProcessingReport; message?: string }) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data.success && data.report) {
          const raw = data.report as ProcessingReport;
          if (raw.outputType === "checker") {
            const issues = data.report?.issuesEnriched ?? [];
            // Deduplicate by humanMessage so that the same issue type on many pages
            // counts as ONE issue (prevents score always bottoming out at 5).
            const uniqueByMessage = new Map<string, { fixDifficulty?: string; severity?: string }>();
            for (const i of issues) {
              if (!uniqueByMessage.has(i.humanMessage)) {
                uniqueByMessage.set(i.humanMessage, { fixDifficulty: i.fixDifficulty, severity: i.severity });
              }
            }
            const unique = Array.from(uniqueByMessage.values());
            const criticalCount = unique.filter(
              (i) => i.fixDifficulty === "advanced" || i.severity === "critical" || i.severity === "error"
            ).length;
            const moderateCount = unique.filter((i) => i.fixDifficulty === "moderate").length;
            const easyCount = unique.length - criticalCount - moderateCount;
            const nextCalculatedScore =
              unique.length === 0
                ? 95
                : Math.max(5, Math.min(100, 100 - criticalCount * 15 - moderateCount * 8 - easyCount * 3));
            setCalculatedScore(nextCalculatedScore);
          } else {
            setCalculatedScore(null);
          }
          setReport(raw);
          setReportError(null);
          if (raw.annotatedPdfStatus === "ready") setAnnotatedReady(true);
          if (raw.annotatedPdfUrl) {
            setAnnotatedWaitStartedAt((prev) => prev ?? Date.now());
          }
          if (raw.annotatedPdfUrl && searchParams.get("source") === "checker") {
            const match = raw.annotatedPdfUrl.match(/\/file\/([^/]+)\/annotated\/?$/);
            const jobId = match?.[1];
            if (jobId) {
              fetch(`/api/kdp-annotated-status?job_id=${encodeURIComponent(jobId)}`)
                .then((res) => res.json())
                .then((statusData: { status?: string }) => {
                  if (statusData.status === "ready") setAnnotatedReady(true);
                })
                .catch(() => {});
            }
          }
        } else {
          setCalculatedScore(null);
          setReportError(data?.message ?? "Report not available.");
        }
      })
      .catch(() => {
        setCalculatedScore(null);
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
    const maxAttempts = 20;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const poll = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/kdp-annotated-status?job_id=${encodeURIComponent(jobId)}`);
        const data = await res.json() as { status?: string };
        if (data.status === "ready") {
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
  }, [report?.annotatedPdfUrl, isCheckerFlow, annotatedReady, annotatedError]);

  useEffect(() => {
    if (!report?.annotatedPdfUrl || !isCheckerFlow) return;
    if (annotatedReady || annotatedError) return;
    setAnnotatedTakingLong(false);
    const t = setTimeout(() => setAnnotatedTakingLong(true), 90_000);
    return () => clearTimeout(t);
  }, [report?.annotatedPdfUrl, isCheckerFlow, annotatedReady, annotatedError]);

  if (!id) {
    return (
      <div className="min-h-screen bg-m2p-ivory text-m2p-ink p-8">
        <p className="text-red-400">Invalid file ID.</p>
        <Link href={isFormatReviewFlow ? "/kdp-format-review" : isCheckerFlow ? "/kdp-pdf-checker" : isEpubFlow ? "/epub-maker" : isPdfFlow ? "/kdp-formatter-pdf" : "/kdp-formatter"} className="mt-4 block text-m2p-orange hover:text-white">
          Upload a file
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-m2p-ivory text-m2p-ink">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight text-m2p-ink">
            <span><span style={{color:'#F05A28', fontWeight:'bold', fontSize:'1.25rem'}}>manu</span><span style={{color:'#4cd964', fontWeight:'bold', fontSize:'1.25rem'}}>2print</span></span>
          </Link>
          <Link href={isFormatReview ? "/kdp-format-review" : isChecker ? "/kdp-pdf-checker" : isEpub ? "/epub-maker" : isPdfFlow ? "/kdp-formatter-pdf" : "/kdp-formatter"} className="text-sm text-m2p-muted hover:text-m2p-orange">
            New upload
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center gap-1 mb-4 w-full">
          <Image src="/MANNY AVATAR.png" alt="Manny" width={120} height={120} style={{ borderRadius: "50%" }} />
          <span><span style={{ color: "#F05A28", fontWeight: "bold" }}>manu</span><span style={{ color: "#4cd964", fontWeight: "bold" }}>2print</span></span>
        </div>
        {/* Header section */}
        <h1 className="text-3xl font-bebas text-m2p-ink text-center mb-2">
          Your KDP Compliance Report Is Ready
        </h1>
        <p className="text-m2p-muted text-center mb-6">
          We analyzed your manuscript against all 26 Amazon KDP print formatting requirements.
          Download the full report to review every issue and recommended fix.
        </p>

        {reportLoading && !report && (
          <div className="mb-8 rounded-lg p-8 border border-m2p-border bg-white/80 text-center">
            <p className="text-m2p-ink font-medium">Loading your report…</p>
            <p className="text-sm text-m2p-muted mt-2">If you just uploaded, this may take a moment.</p>
          </div>
        )}
        {reportError && !report && (
          <div className="mb-8 rounded-lg p-6 border border-amber-500/50 bg-amber-50/80">
            <p className="text-m2p-ink font-medium">{reportError}</p>
            <p className="text-sm text-m2p-muted mt-2">If you just ran a check, wait a few seconds and try again.</p>
            <button
              type="button"
              onClick={loadReport}
              className="mt-4 rounded-lg bg-m2p-orange text-white px-4 py-2 text-sm font-medium hover:bg-m2p-orange-hover"
            >
              Try again
            </button>
          </div>
        )}

        {/* Trust block — always visible, above payment gate so it is never covered by overlay */}
        {!isChecker && (
          <div className="text-center border border-m2p-border rounded-lg p-4 mb-6">
            <p className="text-m2p-ink font-bold">✅ Verified by <span className="text-m2p-live">manu2print</span></p>
            <p className="text-m2p-muted text-sm">
              This report checks your manuscript against known Amazon KDP print formatting requirements.
            </p>
          </div>
        )}

        {/* Checker pre-gate teaser — grade, score, issue count visible before payment */}
        {report && isChecker && (() => {
          const score = calculatedScore ?? report.readinessScore100 ?? report.readiness_score ?? null;
          const _sg = score !== null ? getScoreGrade(score) : null;
          const gradeColor = (g: string) =>
            g === "A+" || g === "A" ? "#4cd964"
            : g === "B" ? "#6bc94d"
            : g === "C" ? "#f0a028"
            : g === "D" ? "#f05a28"
            : "#e03d3d";
          const gradeInfo = _sg === null ? null : {
            letter: _sg.grade,
            color:  gradeColor(_sg.grade),
            label:  _sg.label,
          };

          const uniqueIssues = new Map<string, string>();
          for (const i of (report.issuesEnriched ?? [])) {
            if (!uniqueIssues.has(i.humanMessage)) uniqueIssues.set(i.humanMessage, i.fixDifficulty ?? "");
          }
          const totalIssues = uniqueIssues.size;
          const criticalCount = Array.from(uniqueIssues.values()).filter((d) => d === "hard" || d === "very-hard").length;
          const risk = report.riskLevel ?? (score === null ? null : score >= 75 ? "Low" : score >= 50 ? "Medium" : "High");
          const riskColor = risk === "Low" ? "#4cd964" : risk === "Medium" ? "#f0a028" : "#e03d3d";
          const riskIcon = risk === "Low" ? "✅" : risk === "Medium" ? "⚠️" : "🔴";
          const borderColor = gradeInfo?.color ?? "#f05a28";

          return (
            <div className="rounded-xl border-2 mb-6 overflow-hidden" style={{ borderColor }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ background: borderColor }}>
                <span className="text-white font-bold text-sm tracking-wide">SCAN COMPLETE</span>
                <span className="text-white text-xs opacity-80">✅ Verified by manu2print</span>
              </div>
              <div className="bg-white/95 px-5 py-5">
                <div className="flex items-center gap-6">
                  {gradeInfo && (
                    <div className="shrink-0 w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 text-center" style={{ borderColor: gradeInfo.color }}>
                      <span className="text-3xl font-black leading-none" style={{ color: gradeInfo.color }}>{gradeInfo.letter}</span>
                      <span className="font-semibold leading-tight mt-0.5 px-1" style={{ color: gradeInfo.color, fontSize: "0.6rem" }}>{gradeInfo.label}</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-2.5">
                    {score !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-m2p-muted">Readiness score</span>
                        <span className="font-bold text-m2p-ink">{score}/100</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-m2p-muted">Issues found</span>
                      <span className="font-bold" style={{ color: totalIssues === 0 ? "#4cd964" : "#f05a28" }}>
                        {totalIssues} issue{totalIssues !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {criticalCount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-m2p-muted">Critical (hard to fix)</span>
                        <span className="font-bold text-red-500">{criticalCount}</span>
                      </div>
                    )}
                    {risk && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-m2p-muted">KDP rejection risk</span>
                        <span className="font-bold text-sm" style={{ color: riskColor }}>{riskIcon} {risk}</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-4 text-xs text-m2p-muted text-center border-t border-m2p-border pt-3 leading-relaxed" style={{ textWrap: "balance" } as React.CSSProperties}>
                  Unlock below to see every issue, which pages are affected, how to fix each one — and your annotated&nbsp;PDF.
                </p>
              </div>
            </div>
          );
        })()}

        {report && (
        <PaymentGate
          tool={isFormatReview ? "kdp-format-review" : isChecker ? "kdp-pdf-checker" : isEpub ? "epub-maker" : isPdfFlow ? "kdp-formatter-pdf" : "kdp-formatter"}
          downloadId={id}
          hideChildrenUntilUnlocked
        >
        {/* Checker: PDF viewer (always show when we have a preview PDF) */}
        {report?.outputType === "checker" && report.hasPdfPreview && report.pdfSourceUrl && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-m2p-ink mb-3">View issues on your PDF</h2>
            <CheckerPdfViewer
              pdfUrl={report.pdfSourceUrl}
              pageIssues={(report.page_issues ?? []).map((issue) => ({
                ...issue,
                fixDifficulty: issue.fixDifficulty ?? toFixDifficulty(issue.rule_id, issue.message),
              }))}
              totalPages={report.pageCount ?? 0}
            />
            {/* Annotated preview status sits directly under the viewer for checker reports */}
            {isChecker && report.annotatedPdfUrl && (
              <>
                {annotatedError ? (
                  <p className="mt-4 text-sm italic text-center" style={{ color: "#F05A28" }}>
                    Annotated preview not available for this file.
                  </p>
                ) : !annotatedReady && !annotatedTakingLong ? (
                  <p className="mt-4 text-sm italic text-center" style={{ color: "#F05A28" }}>
                    Annotated preview preparing…
                  </p>
                ) : !annotatedReady && annotatedTakingLong ? (
                  <p className="mt-4 text-sm italic text-center" style={{ color: "#6B6151" }}>
                    Annotated preview is taking longer than expected. You can still review the normal preview above — we’ll keep trying in the background.
                  </p>
                ) : null}
              </>
            )}
          </div>
        )}
        {report?.outputType === "checker" && !report.hasPdfPreview && (
          <p className="mb-6 text-sm text-center" style={{ color: "#F05A28" }}>
            Annotated preview not available for this file.
          </p>
        )}
        {report?.outputType === "checker" && report.hasPdfPreview && !report.pdfSourceUrl && (
          <p className="mb-6 text-sm text-center" style={{ color: "#F05A28" }}>
            Preview unavailable.
          </p>
        )}

        {/* Processing report card */}
        {report && (
          <div className={`mb-8 rounded-lg p-6 border ${report.outputType === "format-review" ? "bg-m2p-ivory border-m2p-border text-m2p-ink" : "bg-white border-m2p-border text-m2p-ink"}`}>
            {report.outputType === "checker" && (
              <>
                <div id="report-content">
                  <p className="mb-2 text-center text-3xl font-bold">
                    <span style={{ color: "#F05A28" }}>manu</span>
                    <span style={{ color: "#4cd964" }}>2print</span>
                  </p>
                  {(report.scanDate || report.fileNameScanned) && (
                    <p className="text-sm text-m2p-muted mb-3">
                      {report.scanDate && <>Scan: {new Date(report.scanDate).toLocaleString()}</>}
                      {report.scanDate && report.fileNameScanned && " · "}
                      {report.fileNameScanned && cleanFilenameForDisplay(report.fileNameScanned)}
                    </p>
                  )}
                  {(() => {
                    const s = calculatedScore ?? report.readinessScore100 ?? report.readiness_score ?? null;
                    const sg = s !== null ? getScoreGrade(s) : report.scoreGrade ?? null;
                    if (!sg) return null;
                    const col = sg.grade === "A+" || sg.grade === "A" ? "#4cd964" : sg.grade === "B" ? "#6bc94d" : sg.grade === "C" ? "#f0a028" : sg.grade === "D" ? "#f05a28" : "#e03d3d";
                    return (
                      <div className="mb-4 flex items-center gap-4 rounded-lg border border-m2p-border bg-m2p-ivory px-5 py-4">
                        <span className="text-5xl font-bebas leading-none" style={{ color: col }}>{sg.grade}</span>
                        <div>
                          <p className="font-bold text-m2p-ink text-lg leading-tight">{sg.label}</p>
                          <p className="text-sm text-m2p-muted mt-0.5">{sg.description}</p>
                        </div>
                      </div>
                    );
                  })()}
                  {(calculatedScore ?? report.readinessScore100) != null && (
                    <p className="mb-2 text-2xl font-bold text-m2p-ink">
                      Readiness: {calculatedScore ?? report.readinessScore100}/100
                    </p>
                  )}
                  {((calculatedScore ?? report.readinessScore100) != null && report.riskLevel) && (
                    <p className="mb-3 text-base font-semibold text-m2p-ink">
                      KDP Approval Likelihood: {calculatedScore ?? report.readinessScore100}% — Risk Level:{" "}
                      {report.riskLevel}
                    </p>
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
                  {report.uploadChecklist && report.uploadChecklist.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-m2p-ink mb-2">Upload readiness checklist</p>
                      <div className="space-y-2">
                        {report.uploadChecklist.map((item, i) => {
                          const statusStyles = {
                            pass: "bg-green-50 border-green-200 text-green-800",
                            warning: "bg-amber-50 border-amber-200 text-amber-800",
                            fail: "bg-red-50 border-red-200 text-red-800",
                          } as const;
                          const statusIcon = {
                            pass: "✅",
                            warning: "⚠️",
                            fail: "❌",
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
                              className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium ${statusStyles[item.status]}`}
                            >
                              <span>{statusIcon[item.status]}</span>
                              <span className="flex-1">{checkLabel}</span>
                              <span className="text-xs uppercase tracking-wide opacity-70">{item.status}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {report.specTable && report.specTable.length > 0 && (
                    <div className="mb-4 overflow-x-auto">
                      <p className="text-xs font-medium text-m2p-ink mb-2">KDP spec comparison</p>
                      <table className="w-full text-sm border border-m2p-border rounded-lg border-collapse">
                        <thead>
                          <tr className="bg-m2p-border/30">
                            <th className="text-left p-2 border-b border-m2p-border">Requirement</th>
                            <th className="text-left p-2 border-b border-m2p-border">Your file</th>
                            <th className="text-left p-2 border-b border-m2p-border">KDP required</th>
                            <th className="text-left p-2 border-b border-m2p-border">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.specTable.map((row, i) => (
                            <tr key={i} className="border-b border-m2p-border/50">
                              <td className="p-2">{row.requirement}</td>
                              <td className="p-2">{row.yourFile}</td>
                              <td className="p-2">{row.kdpRequired}</td>
                              <td className="p-2">{row.status === "pass" ? "✅" : row.status === "warning" ? "⚠️" : "❌"}</td>
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
                      <div className="mt-4 pt-4 border-t border-m2p-border">
                        <p className="text-xs font-medium text-m2p-orange mb-2">Issues</p>
                        <ul className="text-sm text-m2p-muted space-y-3">
                          {show.map((item, i) => (
                            <li key={i} className="rounded-lg border border-m2p-border bg-white/60 px-4 py-3">
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
                    <div className="mt-4 pt-4 border-t border-m2p-border">
                      <p className="text-xs font-medium text-m2p-live mb-2">Recommendations</p>
                      <ul className="text-xs text-m2p-muted list-disc list-inside space-y-1">
                        {report.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {report.kdpReady && (
                    <div className="mt-6 p-5 rounded-lg border-2 border-green-500 bg-green-50/80 text-m2p-ink">
                      <p className="font-bold text-green-800 mb-2">✅ Verified by <span className="text-m2p-live">manu2print</span></p>
                      <p className="font-semibold text-green-800 mb-1">KDP Compliance Scan: PASSED</p>
                      <p className="text-sm mb-1">File: {cleanFilenameForDisplay(report.fileNameScanned ?? "")}</p>
                      <p className="text-sm mb-1">Date: {report.scanDate ? new Date(report.scanDate).toLocaleString() : "—"}</p>
                      <p className="text-sm font-medium text-green-800">This file meets KDP print specifications.</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-m2p-border no-print">
                  {/* Report expiry urgency */}
                  <p className="text-center text-sm text-m2p-muted mb-4">
                    ⏳ Report expires in 24 hours — download now to keep a copy.
                  </p>
                  {report.annotatedPdfDownloadUrl && (
                    <div className="flex justify-center mb-3">
                      <a
                        href={report.annotatedPdfDownloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-m2p-orange text-white px-6 py-3 rounded-lg font-bold hover:bg-m2p-orange-hover cursor-pointer transition-colors inline-block"
                      >
                        Download Annotated PDF (with highlights)
                      </a>
                    </div>
                  )}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
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
    <html>
    <head>
      <title>KDP Compliance Report — manu2print</title>
      <style>
        body { font-family: Inter, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        .header { margin-bottom: 24px; }
        .logo-manu { color: #F05A28; font-weight: bold; font-size: 24px; }
        .logo-print { color: #4cd964; font-weight: bold; font-size: 24px; }
        .watermark { position: fixed; bottom: 20px; right: 20px; width: 100px; height: 100px; opacity: 0.08; pointer-events: none; z-index: -1; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { background: #FAF7EE; padding: 8px; text-align: left; border: 1px solid #E0D8C4; }
        td { padding: 8px; border: 1px solid #E0D8C4; }
        .footer { margin-top: 40px; text-align: center; color: #6B6151; font-size: 12px; border-top: 1px solid #E0D8C4; padding-top: 16px; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <img src="${origin}/MANNY%20AVATAR.png" class="watermark" alt="" />
      <div class="header">
        <span class="logo-manu">manu</span><span class="logo-print">2print</span>
      </div>
      ${bodyContent}
      <div style="margin-top:32px; padding:24px; background:#FEF0EB; border-radius:12px; text-align:center; border:1px solid #F05A28;">
        <p style="font-size:18px; font-weight:bold; color:#1A1208; margin-bottom:8px;">Want to fix these issues automatically?</p>
        <p style="color:#6B6151; margin-bottom:16px;">KDP PDF Formatter is coming soon — upload once, get a print-ready PDF instantly.</p>
        <p style="margin-bottom:16px;"><a href="https://manu2print.com" style="background:#F05A28; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold;">Join the Waitlist → manu2print.com</a></p>
        <p style="color:#6B6151; font-size:13px;">💰 Earn 30% commission — <a href="https://manu2print.com/partners" style="color:#F05A28;">become a partner</a></p>
      </div>
      <div class="footer">© manu2print — Built for indie authors</div>
    </body>
    </html>
  `);
                      printWindow.document.close();
                      printWindow.focus();
                      setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                      }, 500);
                    }}
                      className="bg-m2p-orange text-white px-6 py-3 rounded-lg font-bold hover:bg-m2p-orange-hover cursor-pointer transition-colors"
                    >
                      Download Full Report (PDF)
                    </button>
                  </div>
                  {/* Share section */}
                  <div className="mt-4 bg-m2p-orange-soft border border-m2p-border rounded-lg p-5">
                    <p className="font-semibold text-center text-xl text-m2p-ink mb-1">
                      Share your readiness score
                    </p>
                    <p className="text-sm text-m2p-muted mb-4 text-center">
                      Help other indie authors find manu2print — share your results
                    </p>
                    <div className="flex justify-center mb-4">
                      <button
                        type="button"
                        onClick={handleCopyVerificationLink}
                        className="inline-flex items-center gap-2 rounded-full bg-m2p-orange text-white px-5 py-2.5 text-sm font-semibold hover:bg-m2p-orange-hover transition-colors"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden
                        >
                          <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
                          <rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
                        </svg>
                        <span>
                          {copyShareStatus === "ok"
                            ? "Copied!"
                            : copyShareStatus === "fail"
                              ? "Copy failed"
                              : "Copy verification link"}
                        </span>
                      </button>
                    </div>
                    <div className="flex gap-4 justify-center flex-wrap items-center" style={{ gap: 16 }}>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=https://manu2print.com/verify/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Share on Facebook"
                        className="inline-flex items-center justify-center w-[52px] h-[52px] rounded-full bg-[#1877F2] text-white shadow-md hover:scale-[1.08] transition-transform"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </a>
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=https://manu2print.com/verify/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Share on LinkedIn"
                        className="inline-flex items-center justify-center w-[52px] h-[52px] rounded-full bg-[#0A66C2] text-white shadow-md hover:scale-[1.08] transition-transform"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                      <a
                        href="https://www.instagram.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Share on Instagram"
                        className="inline-flex items-center justify-center w-[52px] h-[52px] rounded-full text-white shadow-md hover:scale-[1.08] transition-transform"
                        style={{ background: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)" }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                      </a>
                      <a
                        href={`https://twitter.com/intent/tweet?url=https://manu2print.com/verify/${id}&text=Just%20checked%20my%20manuscript%20on%20Manu2Print%20-%20KDP%20Readiness%20Score%3A%20${calculatedScore ?? report.readinessScore100 ?? ""}%2F100`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Share on X"
                        className="inline-flex items-center justify-center w-[52px] h-[52px] rounded-full bg-black text-white shadow-md hover:scale-[1.08] transition-transform"
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                    </div>
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
        {isChecker && report?.annotatedPdfUrl && annotatedReady && !annotatedError && (
              <div className="mb-8 rounded-lg p-6 border bg-m2p-ink border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    const match = report.annotatedPdfUrl?.match(/\/file\/([^/]+)\/annotated\/?$/);
                    const jobId = match?.[1];
                    if (jobId) window.open(`/api/kdp-annotated-pdf?job_id=${encodeURIComponent(jobId)}`, "_blank");
                  }}
                  className="flex items-center gap-3 border border-m2p-orange rounded-lg p-4 bg-m2p-ivory/50 hover:bg-m2p-ivory/70 transition-colors cursor-pointer text-left w-full"
                >
                  <div className="w-10 h-10 border border-m2p-orange/30 rounded flex items-center justify-center text-m2p-orange flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium text-white">Download Annotated PDF (issues highlighted)</span>
                    <p className="text-sm text-m2p-muted mt-0.5">Opens in a new tab</p>
                  </div>
                </button>
              </div>
        )}

        {/* Success message */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-m2p-orange mb-2">
            {isFormatReview ? "Format Review Complete" : isChecker ? "KDP Check Complete" : isEpub ? "EPUB Ready!" : isDocx ? "Review DOCX Ready!" : "PDF Generated!"}
          </h1>
          <p className="text-m2p-muted">
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
        <div className="bg-m2p-ink border border-m2p-orange rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-center mb-6 text-white">Download your file</h2>

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
              className="w-full flex items-center justify-between border border-m2p-orange rounded-lg p-4 bg-m2p-ivory/50 text-left hover:bg-m2p-ivory/70 transition-colors cursor-pointer"
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
                    <li>Upload to Amazon KDP as your manuscript</li>
                    <li>Design/upload your cover separately</li>
                  </ol>
                </div>
              </>
            )}
          </div>
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
          <Link
            href={isFormatReview ? "/kdp-format-review" : isChecker ? "/kdp-pdf-checker" : isEpub ? "/epub-maker" : isPdfFlow ? "/kdp-formatter-pdf" : "/kdp-formatter"}
            className="flex-1 border border-white/20 hover:border-m2p-orange text-white font-medium py-3 px-6 rounded-lg text-center"
          >
            {isFormatReview ? "Review Another" : isChecker ? "Check Another PDF" : isEpub ? "Create Another EPUB" : "Format Another"}
          </Link>
        </div>
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
            href="/check-pdf"
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
