"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  getSpineWidthInches,
  getFullWrapDimensions,
  PAPER_OPTIONS,
  KDP_TRIM_SIZES,
  getTrimSize,
  MIN_PAGES,
  MAX_PAGES,
  type PaperType,
  type TrimSizeId,
} from "@/lib/spineCalc";
import FreeToolCta from "@/components/FreeToolCta";

function clampPages(n: number): number {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.max(MIN_PAGES, Math.min(MAX_PAGES, v)) : MIN_PAGES;
}

const INCH_TO_MM = 25.4;

export default function SpineCalculatorPage() {
  const [pageCount, setPageCount] = useState(300);
  const [paperType, setPaperType] = useState<PaperType>("bw-cream");
  const [trimId, setTrimId] = useState<TrimSizeId>("6x9");

  const pages = useMemo(() => clampPages(pageCount), [pageCount]);
  const spineInches = useMemo(() => getSpineWidthInches(pages, paperType), [pages, paperType]);
  const spineMm = useMemo(() => spineInches * INCH_TO_MM, [spineInches]);
  const trim = useMemo(() => getTrimSize(trimId), [trimId]);
  const fullWrap = useMemo(
    () => (trim ? getFullWrapDimensions(trim.widthInches, trim.heightInches, spineInches) : null),
    [trim, spineInches]
  );

  return (
    <div className="min-h-screen bg-brand-bg">
      <nav className="sticky top-0 z-20 border-b border-white/5 bg-brand-bg/80 backdrop-blur-sm">
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
          <div className="flex items-center gap-6">
            <Link href="/platform/kdp" className="text-sm font-medium text-brand-cream hover:text-brand-gold transition-colors">
              Tools
            </Link>
            <Link href="/platform/kdp" className="text-sm font-medium text-brand-cream hover:text-brand-gold transition-colors">
              Amazon KDP
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide text-brand-cream mb-2">
          Spine width calculator
        </h1>
        <p className="font-sans text-brand-muted mb-8">
          Get spine width and full-wrap cover dimensions for KDP paperbacks. Use these when designing your cover in Canva or other tools.
        </p>

        <div className="rounded-xl border border-brand-cardHover bg-brand-card p-6 mb-8">
          <div className="space-y-5">
            <div>
              <label className="block font-sans text-sm font-medium text-brand-cream mb-2">Interior page count</label>
              <input
                type="number"
                min={MIN_PAGES}
                max={MAX_PAGES}
                value={pageCount}
                onChange={(e) => setPageCount(e.target.valueAsNumber ?? MIN_PAGES)}
                className="w-full rounded-lg border border-brand-cardHover px-4 py-2.5 bg-brand-bg font-sans text-sm text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
              <p className="font-sans text-xs text-brand-muted mt-1">KDP range: {MIN_PAGES}–{MAX_PAGES} pages.</p>
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-brand-cream mb-2">Paper type</label>
              <select
                value={paperType}
                onChange={(e) => setPaperType(e.target.value as PaperType)}
                className="w-full rounded-lg border border-brand-cardHover px-4 py-2.5 bg-brand-bg font-sans text-sm text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold"
              >
                {PAPER_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-brand-cream mb-2">Trim size (for full-wrap)</label>
              <select
                value={trimId}
                onChange={(e) => setTrimId(e.target.value as TrimSizeId)}
                className="w-full rounded-lg border border-brand-cardHover px-4 py-2.5 bg-brand-bg font-sans text-sm text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold"
              >
                {KDP_TRIM_SIZES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-brand-gold border border-brand-cardHover bg-brand-card p-6">
          <h2 className="font-bebas text-xl tracking-wide text-brand-cream mb-4">Results</h2>
          <dl className="font-sans text-sm space-y-3">
            <div>
              <dt className="text-brand-muted">Spine width</dt>
              <dd className="text-brand-cream font-semibold">
                {spineInches.toFixed(3)} in ({spineMm.toFixed(2)} mm)
              </dd>
            </div>
            {fullWrap && (
              <div>
                <dt className="text-brand-muted">Full-wrap cover size (with 0.125&quot; bleed)</dt>
                <dd className="text-brand-cream font-semibold">
                  {fullWrap.widthInches.toFixed(3)} &times; {fullWrap.heightInches.toFixed(3)} in
                </dd>
                <dd className="text-brand-muted text-xs mt-0.5">
                  Use this for front + spine + back in one canvas. Minimum 300 DPI for print.
                </dd>
              </div>
            )}
          </dl>
        </div>

        <p className="mt-6 font-sans text-xs text-brand-muted">
          Based on KDP paperback paper thickness. Actual spine may vary slightly by marketplace. No data sent to the server.
        </p>

        <FreeToolCta
          description="Format your manuscript for KDP print. Trim size, bleed, print-ready PDF."
          href="/kdp-formatter"
          buttonText="Try KDP Formatter"
        />
      </main>
    </div>
  );
}
