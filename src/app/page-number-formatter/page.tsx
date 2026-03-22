"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import ToolPageShell from "@/components/ToolPageShell";
import KdpConversionBridge from "@/components/KdpConversionBridge";
import { addPageNumbers, type NumberPlacement } from "@/lib/pageNumberFormatter";
import { PDFDocument } from "pdf-lib";

const MAX_MB = 50;

export default function PageNumberFormatterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [startPage, setStartPage] = useState(1);
  const [placement, setPlacement] = useState<NumberPlacement>("bottom-outer");
  const [processing, setProcessing] = useState(false);
  const [doneBlobUrl, setDoneBlobUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleFileChange = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const f = e.target.files?.[0];
    setError(null);
    setDoneBlobUrl(null);
    if (!f) { setFile(null); return; }
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setError("PDF files only."); setFile(null); return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB}MB.`); setFile(null); return;
    }
    setFile(f);
    setHasInteracted(true);
    try {
      const buf = await f.arrayBuffer();
      const doc = await PDFDocument.load(buf);
      setPageCount(doc.getPageCount());
    } catch {
      setPageCount(null);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const result = await addPageNumbers(buf, {
        startPageIndex: startPage - 1,
        placement,
      });
      const blob = new Blob([result], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setDoneBlobUrl(url);
      setOutputName(file.name.replace(/\.pdf$/i, "") + "-numbered.pdf");
      setHasInteracted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed.");
    } finally {
      setProcessing(false);
    }
  }, [file, startPage, placement]);

  return (
    <ToolPageShell>
      <div className="mx-auto max-w-2xl px-6 py-8">

        {/* H1 */}
        <h1 className="font-bebas tracking-wide text-m2p-ink mb-2 text-center">
          <span className="block text-3xl sm:text-4xl">KDP Page Number Formatter</span>
          <span className="block text-xl sm:text-2xl text-m2p-muted mt-1">
            Fix Book Pagination for Print Layout
          </span>
        </h1>

        {/* Description */}
        <p className="text-m2p-muted mb-3 text-center text-sm leading-relaxed">
          <span className="block">Add correct page numbers to your interior PDF —</span>
          <span className="block">aligned for real print layout before you upload to Amazon.</span>
        </p>
        <p className="text-m2p-muted text-sm mt-1 mb-5 text-center">
          <span className="block">Designed for Canva, Word, and PDF exports</span>
          <span className="block">used for KDP paperback publishing.</span>
        </p>

        {/* Print layout education block */}
        <div className="rounded-xl border-l-4 bg-white p-4 mb-4" style={{ borderColor: "#2D6A2D" }}>
          <p className="font-bebas text-m2p-ink text-base mb-2">Print Layout Rule</p>
          <ul className="text-sm text-m2p-muted space-y-1">
            <li>→ Right pages are <strong className="text-m2p-ink">odd numbers</strong></li>
            <li>→ Left pages are <strong className="text-m2p-ink">even numbers</strong></li>
            <li>→ Chapter 1 should start on a <strong className="text-m2p-ink">right-hand page</strong></li>
          </ul>
          <p className="text-xs text-m2p-muted mt-2">
            Most design tools do not enforce this automatically.
          </p>
        </div>

        {/* Pre-flight warning */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-4 text-sm text-amber-800">
          <strong>Before you start:</strong> If your PDF already has page numbers,
          remove them in Canva or your editor first. This tool adds new numbers —
          it does not erase existing ones.
        </div>

        {/* Beta pricing strip */}
        <div className="rounded-xl bg-m2p-orange-soft border border-m2p-orange/20 p-4 mb-5 text-center text-sm">
          <p className="font-semibold text-m2p-ink mb-1">Free during beta</p>
          <p className="text-m2p-muted text-xs">
            No payment required. Upload, number, download.
          </p>
        </div>

        {/* Upload + options card — hidden after completion */}
        {!doneBlobUrl && (
          <div className="rounded-xl border-2 bg-white p-6 mb-5" style={{ borderColor: "#2D6A2D" }}>
            <div className="space-y-5">

              {/* Step 1 — Upload */}
              <div>
                <label className="block text-sm font-medium text-m2p-ink mb-2">
                  Step 1 — Upload your interior PDF
                </label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  disabled={processing}
                  className="block w-full text-sm text-m2p-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-m2p-orange file:text-white file:font-medium file:cursor-pointer hover:file:bg-m2p-orange-hover"
                />
                {file && pageCount && (
                  <p className="text-xs text-m2p-muted mt-1">
                    {file.name} — {pageCount} pages
                  </p>
                )}
              </div>

              {/* Step 2 — Start page */}
              {file && (
                <div>
                  <label className="block text-sm font-medium text-m2p-ink mb-2">
                    Step 2 — Which page should be numbered page 1?
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={pageCount ?? 828}
                    value={startPage}
                    onChange={(e) => {
                      setStartPage(Number(e.target.value) || 1);
                      setHasInteracted(true);
                    }}
                    className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
                  />
                  <p className="text-xs text-m2p-muted mt-1">
                    Pages before this number will not be numbered. In most books,
                    Chapter 1 starts on a right-hand (odd) page.
                  </p>
                </div>
              )}

              {/* Step 3 — Placement */}
              {file && (
                <div>
                  <label className="block text-sm font-medium text-m2p-ink mb-2">
                    Step 3 — Number placement
                  </label>
                  <div className="space-y-2">
                    {([
                      ["bottom-outer", "Bottom outer — odd right, even left (recommended)"],
                      ["bottom-center", "Bottom center"],
                      ["top-outer",    "Top outer — odd right, even left"],
                    ] as [NumberPlacement, string][]).map(([val, label]) => (
                      <label key={val} className="flex items-center gap-2 cursor-pointer text-sm text-m2p-muted">
                        <input
                          type="radio"
                          name="placement"
                          value={val}
                          checked={placement === val}
                          onChange={() => { setPlacement(val); setHasInteracted(true); }}
                          className="text-m2p-orange focus:ring-m2p-orange"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Submit */}
              {file && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!file || processing}
                  className="w-full rounded-xl bg-m2p-orange hover:bg-m2p-orange-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-6 transition-colors"
                >
                  {processing ? "Adding page numbers…" : "Add Page Numbers"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Result block */}
        {doneBlobUrl && (
          <div className="rounded-2xl bg-white border border-m2p-border p-6 mb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center">
                <span className="text-green-600 font-bold text-lg">✓</span>
              </div>
              <h2 className="font-bebas text-xl text-m2p-ink">Your Numbered PDF Is Ready</h2>
            </div>
            <p className="text-m2p-muted text-sm mb-4">
              Page numbers applied using print-style odd/even placement.
              Review before uploading to KDP.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={doneBlobUrl}
                download={outputName}
                className="rounded-xl bg-m2p-orange px-6 py-3 text-white font-bold hover:bg-m2p-orange-hover transition-colors text-center"
              >
                Download Numbered PDF
              </a>
              <button
                type="button"
                onClick={() => {
                  setDoneBlobUrl(null);
                  setFile(null);
                  setPageCount(null);
                  setError(null);
                }}
                className="rounded-xl border border-m2p-border px-6 py-3 text-m2p-muted hover:bg-m2p-orange-soft/50 transition-colors"
              >
                Number another PDF
              </button>
            </div>
          </div>
        )}

        {/* Limitation note */}
        <div className="rounded-xl bg-m2p-orange-soft border border-m2p-orange/20 p-4 mb-4 text-sm">
          <p className="font-semibold text-m2p-ink mb-1">Important Note</p>
          <p className="text-m2p-muted">
            This tool adds new page numbers only. It does not erase existing
            numbers or rewrite your layout. If your PDF already has page
            numbers, remove them in Canva or your editor first, then return here.
          </p>
        </div>

        {/* Approval warning */}
        <div className="rounded-xl bg-white border border-m2p-border p-4 mb-5 text-sm">
          <p className="font-semibold text-m2p-ink mb-1">
            Correct Page Numbers Do Not Guarantee KDP Approval
          </p>
          <p className="text-m2p-muted">
            Even with correct pagination, KDP can still reject your file for
            margin issues, page size mismatch, bleed settings, or font problems.
          </p>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-m2p-muted mb-5 text-center">
          All processing happens in your browser. Your file never leaves your device.
          No data sent to the server.
        </p>

        {/* Related tools */}
        <div className="mt-5 text-center">
          <p className="text-xs text-m2p-muted font-semibold mb-2 uppercase tracking-wide">
            Related free tools
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: "Interior Template",    href: "/interior-template" },
              { label: "Page Count Estimator", href: "/page-count-estimator" },
              { label: "Trim Size Comparison", href: "/trim-size-comparison" },
              { label: "Cover Size Calculator",href: "/cover-calculator" },
            ].map((tool) => (
              <Link key={tool.href} href={tool.href}
                className="inline-flex items-center rounded-full bg-[#2D6A2D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A3A2A] transition-colors">
                {tool.label} →
              </Link>
            ))}
          </div>
        </div>

        {/* Conversion bridge — post-interaction only */}
        {hasInteracted && <KdpConversionBridge />}

      </div>
    </ToolPageShell>
  );
}
