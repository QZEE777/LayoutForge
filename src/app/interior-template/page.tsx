"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  KDP_TRIM_SIZES,
  getTrimSize,
  getGutterMargin,
  KDP_PAGE_LIMITS,
  type TrimSizeId,
} from "@/lib/kdpSpecs";
import { createInteriorTemplatePdf } from "@/lib/interiorTemplatePdf";

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

  const pages = useMemo(() => clampPages(pageCount), [pageCount]);
  const trim = useMemo(() => getTrimSize(trimId), [trimId]);
  const gutterInches = useMemo(() => getGutterMargin(pages), [pages]);

  const handleDownload = async () => {
    if (!trim) return;
    setDownloading(true);
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
    <div className="min-h-screen bg-m2p-ivory">
      <nav className="sticky top-0 z-20 border-b border-white/5 bg-m2p-ivory/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-brand-gold">
              <svg className="w-4 h-4" fill="none" stroke="#0F0D0B" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-brand-cream">
              <span className="font-serif">manu</span>
              <span className="font-sans">2print</span>
            </span>
          </Link>
          <Link href="/platform/kdp" className="text-sm font-medium text-brand-cream hover:text-brand-gold transition-colors">
            All KDP tools
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide text-brand-cream mb-2">
          KDP interior margin template
        </h1>
        <p className="font-sans text-brand-muted mb-8">
          Download a one-page PDF with your book&apos;s exact trim size and <strong className="text-brand-cream">safe zone</strong> (gutter + margins per Amazon KDP). Use it in Canva as a guide: keep all content inside the green rectangle. Gutter is based on your page count so it matches KDP requirements.
        </p>

        <div className="rounded-xl border border-brand-cardHover bg-brand-card p-6 mb-8">
          <div className="space-y-5">
            <div>
              <label className="block font-sans text-sm font-medium text-brand-cream mb-2">Trim size</label>
              <select
                value={trimId}
                onChange={(e) => setTrimId(e.target.value as TrimSizeId)}
                className="w-full rounded-lg border border-brand-cardHover px-4 py-2.5 bg-m2p-ivory font-sans text-sm text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold"
              >
                {KDP_TRIM_SIZES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-brand-cream mb-2">Interior page count</label>
              <input
                type="number"
                min={minPages}
                max={maxPages}
                value={pageCount}
                onChange={(e) => setPageCount(e.target.valueAsNumber ?? minPages)}
                className="w-full rounded-lg border border-brand-cardHover px-4 py-2.5 bg-m2p-ivory font-sans text-sm text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
              <p className="font-sans text-xs text-brand-muted mt-1">KDP range: {minPages}–{maxPages} pages. Gutter for {pages} pages: <strong className="text-brand-cream">{gutterInches}&quot;</strong></p>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="bleed"
                type="checkbox"
                checked={withBleed}
                onChange={(e) => setWithBleed(e.target.checked)}
                className="rounded border-brand-cardHover bg-m2p-ivory text-brand-gold focus:ring-brand-gold"
              />
              <label htmlFor="bleed" className="font-sans text-sm text-brand-cream">
                Include bleed (0.125&quot;) and show trim line — for full-bleed interiors
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-brand-gold border border-brand-cardHover bg-brand-card p-6">
          <h2 className="font-bebas text-xl tracking-wide text-brand-cream mb-4">Your template</h2>
          {trim && (
            <>
              <dl className="font-sans text-sm space-y-3">
                <div>
                  <dt className="text-brand-muted">Trim</dt>
                  <dd className="text-brand-cream font-semibold">{trim.name}</dd>
                </div>
                <div>
                  <dt className="text-brand-muted">Gutter (inside margin) for {pages} pages</dt>
                  <dd className="text-brand-cream font-semibold">{gutterInches}&quot;</dd>
                </div>
                <div>
                  <dt className="text-brand-muted">Outside margins</dt>
                  <dd className="text-brand-cream">0.25&quot; (top, bottom, outside edge) — KDP minimum</dd>
                </div>
              </dl>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2.5 text-sm font-semibold text-brand-bg hover:opacity-90 disabled:opacity-50"
                >
                  {downloading ? "Generating…" : "Download template PDF"}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <p className="font-sans text-xs text-brand-muted mt-1.5">
                  One page with safe-zone rectangle. Upload to Canva as a background or reference — keep content inside the green box.
                </p>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 font-sans text-xs text-brand-muted">
          Based on Amazon KDP interior margin requirements. Gutter increases with page count. No data sent to the server.
        </p>

        <p className="mt-4 font-sans text-sm text-brand-muted">
          <Link href="/cover-calculator" className="text-brand-gold hover:underline">Cover calculator</Link> for full-wrap dimensions and cover template. <Link href="/kdp-formatter" className="text-brand-gold hover:underline">KDP Formatter</Link> for Word → print-ready PDF.
        </p>
      </main>
    </div>
  );
}
