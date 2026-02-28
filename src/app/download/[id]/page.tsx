"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import PaymentGate from "@/components/PaymentGate";

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
  outputType?: "pdf" | "docx";
  status?: string;
}

export default function DownloadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = typeof params.id === "string" ? params.id : "";
  const isPdfFlow = searchParams.get("source") === "pdf";
  const [report, setReport] = useState<ProcessingReport | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const isDocx = report?.outputType === "docx";
  const downloadFilename = isDocx ? "kdp-review.docx" : "kdp-print.pdf";

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

  useEffect(() => {
    if (!id) return;
    fetch(`/api/format-report?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.report) setReport(data.report);
      })
      .catch(() => {});
  }, [id]);

  if (!id) {
    return (
      <div className="min-h-screen bg-[#1a1a12] text-[#F5F0E8] p-8">
        <p className="text-red-400">Invalid file ID.</p>
        <Link href={isPdfFlow ? "/kdp-formatter-pdf" : "/kdp-formatter"} className="mt-4 block text-[#D4A843] hover:text-[#F5F0E8]">
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
          <Link href={isPdfFlow ? "/kdp-formatter-pdf" : "/kdp-formatter"} className="text-sm text-[#8B8B6B] hover:text-[#F5F0E8]">
            New upload
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <PaymentGate tool={isPdfFlow ? "kdp-formatter-pdf" : "kdp-formatter"} downloadId={id}>
        {/* Processing report card */}
        {report && (
          <div className="mb-8 bg-[#24241a] border border-white/10 rounded-lg p-6">
            <h2 className="font-semibold text-[#F5F0E8] mb-4">Processing report</h2>
            <ul className="text-sm text-[#8B8B6B] space-y-1">
              {report.outputType === "docx" ? (
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
            {report.issues && report.issues.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs font-medium text-[#D4A843] mb-2">Warnings</p>
                <ul className="text-xs text-[#8B8B6B] list-disc list-inside space-y-1">
                  {report.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {/* Success message */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#D4A843] mb-2">
            {isDocx ? "Review DOCX Ready!" : "PDF Generated!"}
          </h1>
          <p className="text-[#8B8B6B]">
            {isDocx
              ? "Your formatted review draft is ready. Download it, proofread and edit as needed, then return to generate your final KDP PDF."
              : "Your KDP-compliant PDF is ready for download."}
          </p>
        </div>

        {/* Download section */}
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
                    {isDocx ? "Review DOCX" : "KDP Print PDF"}
                  </h3>
                  <p className="text-sm text-[#8B8B6B]">
                    {isDocx ? "Proofread and edit, then return to generate PDF" : "Ready to download"}
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

          {isDocx && (
            <div className="mb-6 p-4 rounded-lg bg-[#1a1a12]/50 border border-white/10">
              <p className="text-sm text-[#8B8B6B] mb-4">
                This is your review draft. Open it in Word or Google Docs to proofread and make any edits.
                When ready, return to manu2print to generate your final KDP-ready PDF.
              </p>
              <Link
                href={`/kdp-formatter?id=${id}`}
                className="inline-block bg-[#D4A843] hover:bg-[#c49a3d] text-[#1a1a12] font-semibold py-2.5 px-5 rounded-lg"
              >
                Generate KDP PDF from this file
              </Link>
            </div>
          )}

          {/* EPUB Info Box */}
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

          {/* What's included / Next steps */}
          <div className="bg-[#24241a] rounded-lg p-6 mb-6 space-y-6">
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
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 bg-[#D4A843] hover:bg-[#c49a3d] text-[#1a1a12] font-semibold py-3 px-6 rounded-lg text-center cursor-pointer"
          >
            {isDocx ? "Download Review DOCX" : "Download PDF"}
          </button>
          <Link
            href={isPdfFlow ? "/kdp-formatter-pdf" : "/kdp-formatter"}
            className="flex-1 border border-white/20 hover:border-[#D4A843] text-[#F5F0E8] font-medium py-3 px-6 rounded-lg text-center"
          >
            Format Another
          </Link>
        </div>
        </PaymentGate>

        {/* Storage notice */}
        <div className="mt-8 bg-[#24241a]/50 border border-white/10 rounded-lg p-4">
          <p>
            <span className="text-[#F5F0E8] font-medium">Storage:</span>{" "}
            <span className="text-xs text-[#8B8B6B]">Your files are stored temporarily for 24 hours. Download your PDF now and keep a backup.</span>
          </p>
        </div>
      </main>
    </div>
  );
}
