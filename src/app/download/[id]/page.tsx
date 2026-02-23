"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

export default function DownloadPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  if (!id) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <p className="text-red-600">Invalid file ID.</p>
        <Link href="/kdp-formatter" className="mt-4 block text-blue-600 hover:underline">
          Upload a file
        </Link>
      </div>
    );
  }

  const pdfFileName = `${id}-kdp-print.pdf`;
  const pdfDownloadUrl = `/api/download/${id}/${encodeURIComponent(pdfFileName)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-slate-900">
            ScribeStack
          </Link>
          <Link href="/kdp-formatter" className="text-sm text-slate-600 hover:text-slate-900">
            New upload
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-4 py-12">
        {/* Success message */}
        <div className="mb-8 rounded-lg bg-green-50 border border-green-200 p-6">
          <h1 className="text-2xl font-bold text-green-900">PDF Generated!</h1>
          <p className="mt-2 text-green-800">
            Your KDP-compliant PDF is ready for download.
          </p>
        </div>

        {/* Download section */}
        <div className="rounded-lg bg-white p-8 shadow-sm border border-slate-200">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Download your file</h2>

          {/* PDF download */}
          <div className="mb-6">
            <a
              href={pdfDownloadUrl}
              download={pdfFileName}
              className="flex items-center gap-4 rounded-lg border-2 border-blue-600 bg-blue-50 p-6 hover:bg-blue-100 transition-colors"
            >
              <div className="flex-shrink-0">
                <svg
                  className="h-12 w-12 text-blue-600"
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
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">KDP Print PDF</h3>
                <p className="text-sm text-slate-600">
                  {pdfFileName}
                </p>
              </div>
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-blue-600"
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
            </a>
          </div>

          {/* EPUB Info Box */}
          <div className="mb-6 rounded-lg bg-purple-50 border-2 border-purple-600 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-12 w-12 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 text-lg">Need an EPUB file?</h3>
                <p className="text-sm text-slate-700 mt-2">
                  Your KDP PDF is ready to download. To also get an EPUB file for eBook distribution, use the free tool <strong>Calibre</strong>:
                </p>
                <ol className="mt-3 text-sm text-slate-700 space-y-1 ml-4 list-decimal">
                  <li>Download Calibre from <a href="https://calibre-ebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">calibre-ebook.com</a></li>
                  <li>Open your downloaded PDF in Calibre</li>
                  <li>Click "Convert books" and choose EPUB as output</li>
                </ol>
                <p className="text-xs text-slate-500 mt-3">
                  Calibre is free, open-source, and used by publishing professionals worldwide.
                </p>
              </div>
            </div>
          </div>

          {/* Info section */}
          <div className="space-y-4 border-t border-slate-200 pt-6">
            <div>
              <h3 className="font-semibold text-slate-900">What's included:</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>✓ KDP Print PDF (for paperback printing)</li>
                <li>✓ EPUB conversion guide (using free Calibre tool)</li>
                <li>✓ KDP-compliant trim size and margins</li>
                <li>✓ Proper bleed settings (if selected)</li>
                <li>✓ Professional typography and spacing</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">Next steps:</h3>
              <ol className="mt-2 space-y-1 text-sm text-slate-600">
                <li>1. Download the PDF above</li>
                <li>2. Review the format in a PDF reader</li>
                <li>3. Upload to Amazon KDP as your manuscript</li>
                <li>4. Design/upload your cover separately</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex gap-4">
          <a
            href={pdfDownloadUrl}
            download={pdfFileName}
            className="flex-1 rounded-lg bg-blue-600 px-6 py-3 text-center font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Download PDF
          </a>
          <Link
            href="/kdp-formatter"
            className="flex-1 rounded-lg border border-slate-300 px-6 py-3 text-center font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Format Another
          </Link>
        </div>

        {/* Footer info */}
        <div className="mt-8 rounded-lg bg-slate-50 p-4 text-xs text-slate-500 border border-slate-200">
          <p>
            <strong>Storage:</strong> Your files are stored temporarily for 24 hours. Download your PDF now and keep a backup.
          </p>
        </div>
      </main>
    </div>
  );
}
