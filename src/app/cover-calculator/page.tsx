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
import { createCoverTemplatePdf } from "@/lib/coverTemplatePdf";
import FreeToolCta from "@/components/FreeToolCta";

function clampPages(n: number): number {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.max(MIN_PAGES, Math.min(MAX_PAGES, v)) : MIN_PAGES;
}

const DPI = 300;

function inchesToPx(inches: number): number {
  return Math.round(inches * DPI);
}

export default function CoverCalculatorPage() {
  const [pageCount, setPageCount] = useState(300);
  const [paperType, setPaperType] = useState<PaperType>("bw-cream");
  const [trimId, setTrimId] = useState<TrimSizeId>("6x9");

  const pages = useMemo(() => clampPages(pageCount), [pageCount]);
  const spineInches = useMemo(() => getSpineWidthInches(pages, paperType), [pages, paperType]);
  const trim = useMemo(() => getTrimSize(trimId), [trimId]);
  const fullWrap = useMemo(
    () => (trim ? getFullWrapDimensions(trim.widthInches, trim.heightInches, spineInches) : null),
    [trim, spineInches]
  );
  const pixels = useMemo(
    () => (fullWrap ? { width: inchesToPx(fullWrap.widthInches), height: inchesToPx(fullWrap.heightInches) } : null),
    [fullWrap]
  );

  const [downloading, setDownloading] = useState(false);
  const handleDownloadTemplate = async () => {
    // Read current values at call time to avoid stale closure
    const currentPages = clampPages(pageCount);
    const currentSpineInches = getSpineWidthInches(currentPages, paperType);
    const currentTrim = getTrimSize(trimId);
    const currentFullWrap = currentTrim
      ? getFullWrapDimensions(currentTrim.widthInches, currentTrim.heightInches, currentSpineInches)
      : null;
    if (!currentFullWrap || !currentTrim) return;
    const params = {
      widthInches: currentFullWrap.widthInches,
      heightInches: currentFullWrap.heightInches,
      spineWidthInches: currentSpineInches,
      trimWidthInches: currentTrim.widthInches,
      trimHeightInches: currentTrim.heightInches,
      bleedInches: 0.125,
    };
    setDownloading(true);
    try {
      const bytes = await createCoverTemplatePdf(params);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kdp-cover-template-${currentTrim.id}-${currentPages}p.pdf`;
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
            <span><span style={{color:'#F05A28', fontWeight:'bold', fontSize:'1.25rem'}}>manu</span><span style={{color:'#4cd964', fontWeight:'bold', fontSize:'1.25rem'}}>2print</span></span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/platform/kdp" className="text-sm font-medium text-m2p-ink hover:text-m2p-orange transition-colors">
              Tools
            </Link>
            <Link href="/platform/kdp" className="text-sm font-medium text-m2p-ink hover:text-m2p-orange transition-colors">
              Amazon KDP
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide text-m2p-ink mb-2">
          Full-wrap cover calculator
        </h1>
        <p className="font-sans text-m2p-muted mb-8">
          Get the exact canvas size for your KDP cover (front + spine + back). Use the pixel dimensions in Canva, Photoshop, or other design tools at 300 DPI.
        </p>

        <div className="rounded-xl border border-m2p-border bg-white p-6 mb-8">
          <div className="space-y-5">
            <div>
              <label className="block font-sans text-sm font-medium text-m2p-ink mb-2">Interior page count</label>
              <input
                type="number"
                min={MIN_PAGES}
                max={MAX_PAGES}
                value={pageCount}
                onChange={(e) => setPageCount(e.target.valueAsNumber ?? MIN_PAGES)}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory font-sans text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
              />
              <p className="font-sans text-xs text-m2p-muted mt-1">KDP range: {MIN_PAGES}–{MAX_PAGES} pages.</p>
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-m2p-ink mb-2">Paper type</label>
              <select
                value={paperType}
                onChange={(e) => setPaperType(e.target.value as PaperType)}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory font-sans text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
              >
                {PAPER_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-m2p-ink mb-2">Trim size</label>
              <select
                value={trimId}
                onChange={(e) => setTrimId(e.target.value as TrimSizeId)}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory font-sans text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
              >
                {KDP_TRIM_SIZES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-m2p-orange border border-m2p-border bg-white p-6">
          <h2 className="font-bebas text-xl tracking-wide text-m2p-ink mb-4">Your cover canvas size</h2>
          <dl className="font-sans text-sm space-y-4">
            {pixels && fullWrap && (
              <>
                <div>
                  <dt className="text-m2p-muted">For Canva / design tools (300 DPI)</dt>
                  <dd className="text-m2p-ink font-semibold text-lg mt-0.5">
                    {pixels.width} × {pixels.height} px
                  </dd>
                  <dd className="text-m2p-muted text-xs mt-1">
                    Create a custom size with these dimensions. Front, spine, and back in one artboard.
                  </dd>
                </div>
                <div>
                  <dt className="text-m2p-muted">Exact size (inches, with 0.125&quot; bleed)</dt>
                  <dd className="text-m2p-ink font-semibold">
                    {fullWrap.widthInches.toFixed(3)} × {fullWrap.heightInches.toFixed(3)} in
                  </dd>
                </div>
                <div>
                  <dt className="text-m2p-muted">Spine width</dt>
                  <dd className="text-m2p-ink font-semibold">
                    {spineInches.toFixed(3)} in
                  </dd>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 rounded-lg bg-m2p-orange px-4 py-2.5 text-sm font-semibold text-brand-bg hover:opacity-90 disabled:opacity-50"
                  >
                    {downloading ? "Generating…" : "Download template PDF"}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <dd className="text-m2p-muted text-xs mt-1.5">
                    Template includes trim lines, spine guides (green), safe zone borders (green), bleed zone, and barcode area.
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>

        <p className="mt-6 font-sans text-xs text-m2p-muted">
          Based on KDP paperback paper thickness. Keep text and key art inside the safe zone (away from trim). No data sent to the server.
        </p>

        <p className="mt-4 font-sans text-sm text-m2p-muted">
          <Link href="/interior-template" className="text-brave hover:underline">Interior margin template</Link> for Canva (trim + safe zone). <Link href="/spine-calculator" className="text-brave hover:underline">Spine width calculator</Link> for spine-only and full-wrap in mm.
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
