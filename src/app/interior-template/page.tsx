"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  KDP_TRIM_SIZES,
  getTrimSize,
  getGutterMargin,
  KDP_PAGE_LIMITS,
  type TrimSizeId,
} from "@/lib/kdpSpecs";
import { createInteriorTemplatePdf } from "@/lib/interiorTemplatePdf";
import ToolPageShell from "@/components/ToolPageShell";
import KdpConversionBridge from "@/components/KdpConversionBridge";

const { minPages, maxPages } = KDP_PAGE_LIMITS;

function clampPages(n: number): number {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.max(minPages, Math.min(maxPages, v)) : minPages;
}

export default function InteriorTemplatePage() {
  const [trimId, setTrimId] = useState<TrimSizeId>("6x9");
  const [pageCount, setPageCount] = useState(300);
  const [withBleed, setWithBleed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const markInteracted = useCallback(() => setHasInteracted(true), []);

  const pages = useMemo(() => clampPages(pageCount), [pageCount]);
  const trim = useMemo(() => getTrimSize(trimId), [trimId]);
  const gutterInches = useMemo(() => getGutterMargin(pages), [pages]);

  const handleDownload = async () => {
    if (!trim) return;
    setDownloading(true);
    markInteracted();
    try {
      const bytes = await createInteriorTemplatePdf({
        trimSizeId: trimId,
        pageCount: pages,
        withBleed,
      });
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kdp-interior-template-${trimId}-${pages}p${withBleed ? "-bleed" : ""}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ToolPageShell>
      <div className="mx-auto max-w-2xl px-6 py-8">

        {/* H1 — two-line split */}
        <h1 className="font-bebas tracking-wide text-m2p-ink mb-2 text-center">
          <span className="block text-3xl sm:text-4xl">KDP Interior Template Generator</span>
          <span className="block text-xl sm:text-2xl text-m2p-muted mt-1">
            Format Your Book Correctly Before You Publish
          </span>
        </h1>

        <p className="text-m2p-muted mb-3 text-center text-sm leading-relaxed">
          <span className="block">Download a ready-to-use interior layout template</span>
          <span className="block">with correct margins, trim size, and safe zones.</span>
        </p>
        <p className="text-m2p-muted text-sm mt-2 mb-5 leading-relaxed text-center">
          Use this template in Canva or your design tool to align your content
          correctly for KDP paperback publishing.
        </p>

        {/* Input card */}
        <div className="rounded-xl border-2 bg-white p-6 mb-5" style={{ borderColor: "#2D6A2D" }}>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Trim size</label>
              <select
                value={trimId}
                onChange={(e) => { setTrimId(e.target.value as TrimSizeId); markInteracted(); }}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
              >
                {KDP_TRIM_SIZES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Interior page count</label>
              <input
                type="number"
                min={minPages}
                max={maxPages}
                value={pageCount}
                onChange={(e) => { setPageCount(e.target.valueAsNumber ?? minPages); markInteracted(); }}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
              />
              <p className="text-xs text-m2p-muted mt-1">
                KDP range: {minPages}–{maxPages} pages. Gutter for {pages} pages:{" "}
                <strong className="text-m2p-ink">{gutterInches}&quot;</strong>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="bleed"
                type="checkbox"
                checked={withBleed}
                onChange={(e) => { setWithBleed(e.target.checked); markInteracted(); }}
                className="rounded border-m2p-border bg-m2p-ivory text-m2p-orange focus:ring-m2p-orange"
              />
              <label htmlFor="bleed" className="text-sm text-m2p-ink">
                Include bleed (0.125&quot;) and show trim line — for full-bleed interiors
              </label>
            </div>
          </div>
        </div>

        {/* Results card */}
        <div className="rounded-xl border-l-4 border-m2p-orange border border-m2p-border bg-white p-6 mb-5">
          <h2 className="font-bebas text-xl tracking-wide text-m2p-ink mb-4">Your template</h2>
          {trim && (
            <>
              <dl className="text-sm space-y-3 mb-5">
                <div>
                  <dt className="text-m2p-muted">Trim</dt>
                  <dd className="text-m2p-ink font-semibold">{trim.name}</dd>
                </div>
                <div>
                  <dt className="text-m2p-muted">Gutter (inside margin) for {pages} pages</dt>
                  <dd className="text-m2p-ink font-semibold">{gutterInches}&quot;</dd>
                </div>
                <div>
                  <dt className="text-m2p-muted">Outside margins</dt>
                  <dd className="text-m2p-ink">0.25&quot; top, bottom, outside edge — KDP minimum</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center gap-2 rounded-lg bg-m2p-orange px-4 py-2.5 text-sm font-semibold text-white hover:bg-m2p-orange-hover disabled:opacity-50 transition-colors"
              >
                {downloading ? "Generating…" : "Download Interior Template PDF"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <p className="text-xs text-m2p-muted mt-2">
                Includes trim lines, safe zones, and margin guides for accurate layout.
              </p>
            </>
          )}
        </div>

        {/* Reality hook */}
        <div className="rounded-xl bg-white border border-m2p-border px-5 py-4 mb-5">
          <p className="font-semibold text-m2p-ink text-sm mb-1">A template does not guarantee approval</p>
          <p className="text-m2p-muted text-sm leading-relaxed">
            Even if your layout looks correct, KDP can still reject your file for margin issues,
            page size mismatches, or font problems that only appear in the final PDF.
          </p>
        </div>

        <p className="text-xs text-m2p-muted mb-5 text-center">
          Based on Amazon KDP interior margin requirements. Gutter increases with page count. No data sent to the server.
        </p>

        {/* Related tools */}
        <div className="mt-5 text-center">
          <p className="text-xs text-m2p-muted font-semibold mb-2 uppercase tracking-wide">
            Related free tools
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/trim-size-comparison" className="inline-flex items-center rounded-full bg-[#2D6A2D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A3A2A] transition-colors">Trim Size Comparison →</Link>
            <Link href="/cover-calculator" className="inline-flex items-center rounded-full bg-[#2D6A2D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A3A2A] transition-colors">Cover Size Calculator →</Link>
            <Link href="/spine-calculator" className="inline-flex items-center rounded-full bg-[#2D6A2D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A3A2A] transition-colors">Spine Width Calculator →</Link>
          </div>
        </div>

        {/* Conversion bridge */}
        {hasInteracted && <KdpConversionBridge />}

      </div>
    </ToolPageShell>
  );
}
