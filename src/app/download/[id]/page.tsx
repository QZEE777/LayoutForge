"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import PaymentGate from "@/components/PaymentGate";
import CheckerPdfViewer from "@/components/CheckerPdfViewer";

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
  page_issues?: Array<{ page: number; rule_id: string; severity: string; message: string; bbox: number[] | null }>;
  hasPdfPreview?: boolean;
  pdfSourceUrl?: string;
  annotatedPdfUrl?: string;
  annotatedPdfStatus?: string;
  /** Format review report */
  formatReviewSections?: Array<{ title: string; issues?: string[]; recommendations?: string[]; content?: string }>;
  summary?: string;
  topActions?: string[];
  kdpReadiness?: string;
  wordCount?: number;
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
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copyReviewStatus, setCopyReviewStatus] = useState<"idle" | "ok" | "fail">("idle");
  const [copyShareStatus, setCopyShareStatus] = useState<"idle" | "ok" | "fail">("idle");
  const [annotatedReady, setAnnotatedReady] = useState(false);
  const [annotatedError, setAnnotatedError] = useState(false);

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

  useEffect(() => {
    if (!id) return;
    fetch(`/api/format-report?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.report) {
          const r = data.report as ProcessingReport;
          setReport(r);
          if (r.annotatedPdfStatus === "ready") setAnnotatedReady(true);
          if (r.annotatedPdfUrl && searchParams.get("source") === "checker") {
            const match = r.annotatedPdfUrl.match(/\/file\/([^/]+)\/annotated\/?$/);
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
        }
      })
      .catch(() => {});
  }, [id, searchParams]);

  // Poll annotated PDF status when checker flow (storage never updated to "ready", so poll whenever we have URL)
  useEffect(() => {
    if (!report?.annotatedPdfUrl || !isCheckerFlow) return;
    const match = report.annotatedPdfUrl.match(/\/file\/([^/]+)\/annotated\/?$/);
    const jobId = match?.[1];
    if (!jobId) return;
    let attempts = 0;
    const maxAttempts = 10;
    const intervalMs = 3000;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const poll = () => {
      attempts += 1;
      fetch(`/api/kdp-annotated-status?job_id=${encodeURIComponent(jobId)}`)
        .then((res) => res.json())
        .then((data: { status?: string }) => {
          if (data.status === "ready") {
            setAnnotatedReady(true);
            if (intervalId) clearInterval(intervalId);
            return;
          }
          if (data.status === "error" || attempts >= maxAttempts) {
            setAnnotatedError(true);
            if (intervalId) clearInterval(intervalId);
          }
        })
        .catch(() => {
          if (attempts >= maxAttempts) setAnnotatedError(true);
          if (intervalId) clearInterval(intervalId);
        });
    };
    poll();
    intervalId = setInterval(poll, intervalMs);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [report?.annotatedPdfUrl, report?.annotatedPdfStatus, isCheckerFlow]);

  if (!id) {
    return (
      <div className="min-h-screen bg-[#1a1a12] text-[#F5F0E8] p-8">
        <p className="text-red-400">Invalid file ID.</p>
        <Link href={isFormatReviewFlow ? "/kdp-format-review" : isCheckerFlow ? "/kdp-pdf-checker" : isEpubFlow ? "/epub-maker" : isPdfFlow ? "/kdp-formatter-pdf" : "/kdp-formatter"} className="mt-4 block text-[#D4A843] hover:text-[#F5F0E8]">
          Upload a file
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a12] text-[#F5F0E8]">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight text-[#F5F0E8]">
            manu2print
          </Link>
          <Link href={isFormatReview ? "/kdp-format-review" : isChecker ? "/kdp-pdf-checker" : isEpub ? "/epub-maker" : isPdfFlow ? "/kdp-formatter-pdf" : "/kdp-formatter"} className="text-sm text-[#8B8B6B] hover:text-[#F5F0E8]">
            New upload
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <PaymentGate tool={isFormatReview ? "kdp-format-review" : isChecker ? "kdp-pdf-checker" : isEpub ? "epub-maker" : isPdfFlow ? "kdp-formatter-pdf" : "kdp-formatter"} downloadId={id}>
        {/* Checker: PDF viewer with issue overlays (when we have the user's PDF + page_issues) */}
        {report?.outputType === "checker" && report.hasPdfPreview && report.page_issues && report.page_issues.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[#F5F0E8] mb-3">View issues on your PDF</h2>
            <CheckerPdfViewer
              pdfUrl={report.pdfSourceUrl ?? `/api/view-pdf/${id}`}
              pageIssues={report.page_issues}
              totalPages={report.pageCount ?? 0}
            />
          </div>
        )}
        {report?.outputType === "checker" && report.page_issues && report.page_issues.length > 0 && !report.hasPdfPreview && (
          <p className="mb-6 text-sm text-[#8B8B6B]">
            For a visual report with highlights on each page, run the check with a file under 4 MB (uploaded on this site).
          </p>
        )}

        {/* Processing report card */}
        {report && (
          <div className={`mb-8 rounded-lg p-6 border ${report.outputType === "format-review" ? "bg-slate-100 border-slate-300 text-slate-800" : "bg-[#24241a] border-white/10"}`}>
            {report.outputType === "checker" && (
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${(report.issues?.length ?? 0) === 0 ? "bg-green-500/20 text-green-300 border border-green-500/40" : "bg-amber-500/20 text-amber-300 border border-amber-500/40"}`}>
                  KDP Ready: {(report.issues?.length ?? 0) === 0 ? "Yes" : `No — ${report.issues?.length ?? 0} issue${(report.issues?.length ?? 0) === 1 ? "" : "s"}`}
                </span>
              </div>
            )}
            <h2 className={`font-semibold mb-4 ${report.outputType === "format-review" ? "text-xl text-slate-800" : "text-[#F5F0E8]"}`}>{report.outputType === "format-review" ? "Format review" : "Processing report"}</h2>
            <ul className="text-sm text-[#8B8B6B] space-y-1">
              {report.outputType === "format-review" ? null : report.outputType === "checker" ? (
                <>
                  <li>Trim detected: <span className="text-[#F5F0E8]">{report.trimDetected ?? "—"}</span></li>
                  <li>Matches KDP trim: <span className="text-[#F5F0E8]">{report.trimMatchKDP ? "Yes" : "No"}{report.kdpTrimName ? ` (${report.kdpTrimName})` : ""}</span></li>
                  <li>Page count: <span className="text-[#F5F0E8]">{report.pageCount ?? "—"}</span></li>
                  {report.fileSizeMB != null && (
                    <li>File size: <span className="text-[#F5F0E8]">{report.fileSizeMB} MB</span></li>
                  )}
                  {report.recommendedGutterInches != null && (
                    <li>
                      Recommended gutter (inner margin) for your page count:{" "}
                      <span className="text-[#F5F0E8]">
                        {report.recommendedGutterInches}&quot; ({Math.round(report.recommendedGutterInches * 2.54 * 10) / 10} cm / {Math.round(report.recommendedGutterInches * 25.4 * 10) / 10} mm)
                      </span>
                      . We can&apos;t measure margins from the PDF; set inner margin ≥ 0.5&quot; + gutter in your layout app.
                    </li>
                  )}
                </>
              ) : report.outputType === "epub" ? (
                <>
                  <li>Format: <span className="text-[#F5F0E8]">Kindle-ready EPUB</span></li>
                  <li>Chapters: <span className="text-[#F5F0E8]">{report.chaptersDetected ?? 0}</span></li>
                </>
              ) : report.outputType === "docx" ? (
                <>
                  <li>Sections detected: <span className="text-[#F5F0E8]">{report.sectionsDetected ?? 0}</span></li>
                  <li>Lessons detected: <span className="text-[#F5F0E8]">{report.lessonsDetected ?? 0}</span></li>
                  <li>Estimated pages (PDF): <span className="text-[#F5F0E8]">~{report.estimatedPages ?? report.chaptersDetected}</span></li>
                  <li>Font applied: <span className="text-[#F5F0E8]">{report.fontUsed}</span></li>
                  <li>Trim size: <span className="text-[#F5F0E8]">{report.trimSize}</span></li>
                  {report.status && (
                    <li>Status: <span className="text-[#F5F0E8]">{report.status}</span></li>
                  )}
                </>
              ) : (
                <>
                  <li>Pages generated: <span className="text-[#F5F0E8]">{report.pagesGenerated}</span></li>
                  <li>Chapters detected: <span className="text-[#F5F0E8]">{report.chaptersDetected}</span></li>
                  <li>Trim size: <span className="text-[#F5F0E8]">{report.trimSize}</span></li>
                  <li>Font: <span className="text-[#F5F0E8]">{report.fontUsed}</span></li>
                  {report.gutterInches != null && (
                    <li>Gutter: <span className="text-[#F5F0E8]">{report.gutterInches}&quot;</span></li>
                  )}
                </>
              )}
            </ul>
            {report.outputType !== "format-review" && report.issues && report.issues.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs font-medium text-[#D4A843] mb-2">Issues</p>
                <ul className="text-xs text-[#8B8B6B] list-disc list-inside space-y-1">
                  {report.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.outputType === "checker" && report.recommendations && report.recommendations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs font-medium text-green-400 mb-2">Recommendations</p>
                <ul className="text-xs text-[#8B8B6B] list-disc list-inside space-y-1">
                  {report.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.outputType === "checker" && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    const lines: string[] = [
                      "KDP PDF Check Report",
                      "manu2print.com",
                      "",
                      `KDP Ready: ${(report.issues?.length ?? 0) === 0 ? "Yes" : `No — ${report.issues?.length ?? 0} issue(s)`}`,
                      "",
                      `Trim detected: ${report.trimDetected ?? "—"}`,
                      `Matches KDP trim: ${report.trimMatchKDP ? "Yes" : "No"}${report.kdpTrimName ? ` (${report.kdpTrimName})` : ""}`,
                      `Page count: ${report.pageCount ?? "—"}`,
                      ...(report.fileSizeMB != null ? [`File size: ${report.fileSizeMB} MB`] : []),
                      ...(report.recommendedGutterInches != null ? [`Recommended gutter (inner margin): ${report.recommendedGutterInches}" (${Math.round(report.recommendedGutterInches * 2.54 * 10) / 10} cm / ${Math.round(report.recommendedGutterInches * 25.4 * 10) / 10} mm)`] : []),
                      "",
                      ...(report.issues && report.issues.length > 0 ? ["Issues:", ...report.issues.map((i) => `  • ${i}`), ""] : []),
                      ...(report.recommendations && report.recommendations.length > 0 ? ["Recommendations:", ...report.recommendations.map((r) => `  • ${r}`)] : []),
                    ];
                    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "kdp-check-report.txt";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-sm font-medium text-[#D4A843] hover:text-[#F5F0E8] transition-colors"
                >
                  Download report (.txt)
                </button>
              </div>
            )}
            {report.outputType === "format-review" && (
              <>
                {report.kdpReadiness && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-base font-semibold bg-amber-200 text-amber-900 border border-amber-400">
                      KDP readiness: {report.kdpReadiness}
                    </span>
                  </div>
                )}
                {report.wordCount != null && (
                  <p className="mt-3 text-base text-slate-600">
                    Word count: {report.wordCount.toLocaleString()} · Est. pages (6×9): ~{report.estimatedPages ?? "—"}
                    {report.recommendedGutterInches != null && ` · Recommended gutter: ${report.recommendedGutterInches}"`}
                  </p>
                )}
                {report.summary && (
                  <div className="mt-5 pt-4 border-t border-slate-300">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Summary</p>
                    <p className="text-base text-slate-700 leading-relaxed">{report.summary}</p>
                  </div>
                )}
                {report.topActions && report.topActions.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-300">
                    <p className="text-sm font-semibold text-emerald-800 mb-2">Top actions</p>
                    <ul className="text-base text-slate-700 list-disc list-inside space-y-2">
                      {report.topActions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {report.formatReviewSections && report.formatReviewSections.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-300 space-y-4">
                    {report.formatReviewSections.map((sec, i) => (
                      <div key={i}>
                        <p className="text-base font-semibold text-slate-800 mb-1">{sec.title}</p>
                        {sec.content && <p className="text-base text-slate-600 leading-relaxed">{sec.content}</p>}
                        {sec.issues && sec.issues.length > 0 && (
                          <ul className="text-sm text-amber-800 list-disc list-inside mt-1.5 space-y-0.5">
                            {sec.issues.map((issue, j) => (
                              <li key={j}>{issue}</li>
                            ))}
                          </ul>
                        )}
                        {sec.recommendations && sec.recommendations.length > 0 && (
                          <ul className="text-sm text-emerald-800 list-disc list-inside mt-1.5 space-y-0.5">
                            {sec.recommendations.map((rec, j) => (
                              <li key={j}>{rec}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-5 pt-4 border-t border-slate-300 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopyFormatReviewShare}
                    className="text-base font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {copyShareStatus === "ok" ? "Copied!" : copyShareStatus === "fail" ? "Copy failed" : "Copy summary for social"}
                  </button>
                  <span className="text-slate-400">|</span>
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

        {/* Checker: annotated PDF status and download */}
        {isChecker && report?.annotatedPdfUrl && (
          <div className="mb-8 rounded-lg p-6 border bg-[#24241a] border-white/10">
            {annotatedError ? (
              <p className="text-sm text-[#8B8B6B]">Annotated preview unavailable.</p>
            ) : annotatedReady ? (
              <button
                type="button"
                onClick={() => {
                  const match = report.annotatedPdfUrl?.match(/\/file\/([^/]+)\/annotated\/?$/);
                  const jobId = match?.[1];
                  if (jobId) window.open(`/api/kdp-annotated-pdf?job_id=${encodeURIComponent(jobId)}`, "_blank");
                }}
                className="flex items-center gap-3 border border-[#D4A843] rounded-lg p-4 bg-[#1a1a12]/50 hover:bg-[#1a1a12]/70 transition-colors cursor-pointer text-left w-full"
              >
                <div className="w-10 h-10 border border-[#D4A843]/30 rounded flex items-center justify-center text-[#D4A843] flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <span className="font-medium text-[#F5F0E8]">Download Annotated PDF (issues highlighted)</span>
                  <p className="text-sm text-[#8B8B6B] mt-0.5">Opens in a new tab</p>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 text-sm text-[#8B8B6B]">
                <svg className="animate-spin h-5 w-5 text-[#D4A843] flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12 0s12 5.373 12 12-5.373 12-12 12v-2a8 8 0 01-8-8z" />
                </svg>
                <span>Annotated PDF preparing…</span>
              </div>
            )}
          </div>
        )}

        {/* Success message */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#D4A843] mb-2">
            {isFormatReview ? "Format Review Complete" : isChecker ? "KDP Check Complete" : isEpub ? "EPUB Ready!" : isDocx ? "Review DOCX Ready!" : "PDF Generated!"}
          </h1>
          <p className="text-[#8B8B6B]">
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
        <div className="bg-[#24241a] border border-[#D4A843] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-center mb-6 text-[#F5F0E8]">Download your file</h2>

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
              className="w-full flex items-center justify-between border border-[#D4A843] rounded-lg p-4 bg-[#1a1a12]/50 text-left hover:bg-[#1a1a12]/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-[#D4A843]/30 rounded flex items-center justify-center text-[#D4A843]">
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
                  <h3 className="font-medium text-[#F5F0E8]">
                    {isEpub ? "Kindle EPUB" : isDocx ? "Review DOCX" : "KDP Print PDF"}
                  </h3>
                  <p className="text-sm text-[#8B8B6B]">
                    {isEpub ? "Ready to download" : isDocx ? "Proofread and edit, then return to generate PDF" : "Ready to download"}
                  </p>
                </div>
              </div>
              <div className="text-[#D4A843] hover:text-[#F5F0E8]">
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
            <div className="mb-6 p-4 rounded-lg bg-[#1a1a12]/50 border border-[#D4A843]/30">
              <h3 className="font-medium text-[#F5F0E8] mb-2">Get a full-document AI format review</h3>
              <p className="text-sm text-[#8B8B6B] mb-3">
                Copy the whole manuscript (structure + text). Paste it in Cursor chat and ask the AI to scan it as a professional KDP formatter — margins, spacing, headings, lists, and Amazon KDP rules.
              </p>
              <button
                type="button"
                onClick={handleCopyForAIReview}
                className="border border-[#D4A843]/60 hover:border-[#D4A843] hover:bg-[#D4A843]/10 text-[#D4A843] font-medium py-2 px-4 rounded-lg text-sm transition-colors"
              >
                {copyReviewStatus === "ok" ? "✓ Copied to clipboard" : copyReviewStatus === "fail" ? "Copy failed" : "Copy for AI review"}
              </button>
            </div>
          )}

          {isDocx && !isEpub && (
            <div className="mb-6 p-4 rounded-lg bg-[#1a1a12]/50 border border-white/10">
              <p className="text-sm text-[#8B8B6B] mb-2">
                This is your review draft. Open it in Word or Google Docs to proofread and make any edits.
                When ready, return to Manu2Print KDP to generate your final KDP-ready PDF.
              </p>
              <p className="text-sm text-[#8B8B6B] mb-2">
                Margins in this draft are equal on all sides (0.7&quot;) for easier editing. Your final PDF will use Amazon KDP–compliant inside/outside margins and gutter.
              </p>
              <p className="text-sm text-[#8B8B6B] mb-4">
                <span className="text-[#D4A843]">Tip:</span> To get layout feedback from the AI, open the document, take a screenshot of a page, and paste it in chat.
              </p>
              <Link
                href={`/kdp-formatter?id=${id}`}
                className="inline-block bg-[#D4A843] hover:bg-[#c49a3d] text-[#1a1a12] font-semibold py-2.5 px-5 rounded-lg"
              >
                Generate KDP PDF from this file
              </Link>
            </div>
          )}

          {/* EPUB Info Box — only for PDF/DOCX flows */}
          {!isEpub && (
          <div className="bg-[#24241a] border-l-4 border-l-[#D4A843] rounded-r-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 border border-[#D4A843]/30 rounded-full flex items-center justify-center text-[#D4A843]">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#F5F0E8] mb-2">Need an EPUB file?</h3>
                <p className="text-[#8B8B6B] text-sm">
                  Your KDP PDF is ready to download. To also get an EPUB file for eBook distribution, use the free tool <span className="text-[#D4A843]">Calibre</span>:
                </p>
                <ol className="mt-3 text-[#8B8B6B] text-sm space-y-1 ml-4 list-decimal">
                  <li>Download Calibre from <a href="https://calibre-ebook.com" target="_blank" rel="noopener noreferrer" className="text-[#D4A843] hover:underline">calibre-ebook.com</a></li>
                  <li>Open your downloaded PDF in Calibre</li>
                  <li>Click &quot;Convert books&quot; and choose EPUB as output</li>
                </ol>
                <p className="text-[#8B8B6B] text-xs italic mt-3">
                  Calibre is free, open-source, and used by publishing professionals worldwide.
                </p>
              </div>
            </div>
          </div>
          )}

          {/* What's included / Next steps */}
          <div className="bg-[#24241a] rounded-lg p-6 mb-6 space-y-6">
            {isEpub ? (
              <>
                <p className="text-[#8B8B6B] text-sm">
                  <span className="text-[#D4A843]">✓</span> Kindle-ready EPUB for eBook distribution on Amazon KDP and other retailers.
                </p>
                <p className="text-[#8B8B6B] text-sm">
                  Upload to KDP as your eBook manuscript, or use with other platforms (Apple Books, Kobo, etc.).
                </p>
              </>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold text-[#F5F0E8] mb-4">What&apos;s included:</h3>
                  <ul className="space-y-1 text-[#8B8B6B] text-sm">
                    <li><span className="text-[#D4A843]">✓</span> KDP Print PDF (for paperback printing)</li>
                    <li><span className="text-[#D4A843]">✓</span> EPUB conversion guide (using free Calibre tool)</li>
                    <li><span className="text-[#D4A843]">✓</span> KDP-compliant trim size and margins</li>
                    <li><span className="text-[#D4A843]">✓</span> Proper bleed settings (if selected)</li>
                    <li><span className="text-[#D4A843]">✓</span> Professional typography and spacing</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-[#F5F0E8] mb-4">Next steps:</h3>
                  <ol className="space-y-1 text-[#8B8B6B] text-sm list-decimal ml-4">
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
            className="flex-1 bg-[#D4A843] hover:bg-[#c49a3d] text-[#1a1a12] font-semibold py-3 px-6 rounded-lg text-center cursor-pointer"
          >
            {isEpub ? "Download EPUB" : isDocx ? "Download Review DOCX" : "Download PDF"}
          </button>
          )}
          <Link
            href={isFormatReview ? "/kdp-format-review" : isChecker ? "/kdp-pdf-checker" : isEpub ? "/epub-maker" : isPdfFlow ? "/kdp-formatter-pdf" : "/kdp-formatter"}
            className="flex-1 border border-white/20 hover:border-[#D4A843] text-[#F5F0E8] font-medium py-3 px-6 rounded-lg text-center"
          >
            {isFormatReview ? "Review Another" : isChecker ? "Check Another PDF" : isEpub ? "Create Another EPUB" : "Format Another"}
          </Link>
        </div>
        </PaymentGate>

        {/* Storage notice + Save this link */}
        <div className="mt-8 bg-[#24241a]/50 border border-white/10 rounded-lg p-4 space-y-2">
          <p>
            <span className="text-[#F5F0E8] font-medium">Storage:</span>{" "}
            <span className="text-xs text-[#8B8B6B]">
              {isFormatReview || isChecker ? "Your report is stored temporarily for 24 hours." : "Your files are stored temporarily for 24 hours. Download now and keep a backup."}
            </span>
          </p>
          <p className="text-xs text-[#8B8B6B]">
            <span className="text-[#F5F0E8] font-medium">Save this link:</span> Bookmark this page or copy the URL to return to your download within 24 hours.
          </p>
        </div>
      </main>
    </div>
  );
}
