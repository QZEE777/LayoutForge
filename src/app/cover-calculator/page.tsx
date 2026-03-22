"use client";

import { useState, useMemo, useCallback } from "react";
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
import ToolPageShell from "@/components/ToolPageShell";
import KdpConversionBridge from "@/components/KdpConversionBridge";

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
  const [hasInteracted, setHasInteracted] = useState(false);

  const markInteracted = useCallback(() => setHasInteracted(true), []);

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
    <ToolPageShell>
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="font-bebas tracking-wide text-m2p-ink mb-2 text-center">
          <span className="block text-3xl sm:text-4xl">KDP Cover Size Calculator</span>
          <span className="block text-xl sm:text-2xl text-m2p-muted mt-1">
            Full-Wrap Paperback Cover Dimensions
          </span>
        </h1>
        <p className="text-m2p-muted mb-3 text-center">
          Calculate the exact full-wrap cover dimensions for your paperback —
          front, spine, and back — with bleed included.
        </p>
        <p className="text-m2p-muted text-sm mt-2 mb-5 leading-relaxed text-center">
          Designed in Canva, InDesign, or Photoshop? Get exact pixel dimensions
          at 300 DPI, inch dimensions with bleed, and a downloadable cover
          template PDF with KDP-exact guides.
        </p>

        <div className="rounded-xl border-2 bg-white p-6 mb-5" style={{ borderColor: "#2D6A2D" }}>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Interior page count</label>
              <input
                type="number"
                min={MIN_PAGES}
                max={MAX_PAGES}
                value={pageCount}
                onChange={(e) => { setPageCount(e.target.valueAsNumber ?? MIN_PAGES); markInteracted(); }}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
              />
              <p className="text-xs text-m2p-muted mt-1">KDP range: {MIN_PAGES}–{MAX_PAGES} pages.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Paper type</label>
              <select
                value={paperType}
                onChange={(e) => { setPaperType(e.target.value as PaperType); markInteracted(); }}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
              >
                {PAPER_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
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
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-m2p-orange border border-m2p-border bg-white p-6 mb-5">
          <h2 className="font-bebas text-xl tracking-wide text-m2p-ink mb-4">Your cover canvas size</h2>
          <dl className="text-sm space-y-4">
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
                    className="inline-flex items-center gap-2 rounded-lg bg-m2p-orange px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {downloading ? "Generating…" : "Download template PDF"}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <dd className="text-m2p-muted text-xs mt-1.5">
                    Template includes KDP-exact trim lines, spine guides, safe zones, bleed zone, barcode area, and manu2print branding.
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>

        <p className="text-xs text-m2p-muted mb-4">
          Based on KDP paperback paper thickness. Keep text and key art inside the safe zone (away from trim). No data sent to the server.
        </p>

        <div className="mt-5">
          <p className="text-xs text-m2p-muted font-semibold mb-2 uppercase tracking-wide">
            Related free tools
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/interior-template"
              className="inline-flex items-center rounded-full bg-[#2D6A2D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A3A2A] transition-colors"
            >
              Interior Margin Template →
            </Link>
            <Link
              href="/spine-calculator"
              className="inline-flex items-center rounded-full bg-[#2D6A2D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A3A2A] transition-colors"
            >
              Spine Width Calculator →
            </Link>
          </div>
        </div>

        {hasInteracted && <KdpConversionBridge />}

        <div className="mt-6 rounded-xl bg-m2p-orange-soft border border-m2p-orange/20 p-5 text-center">
          <p className="font-bebas text-m2p-ink text-lg mb-1">
            Ready for the next step?
          </p>
          <p className="text-m2p-muted text-sm mb-4 leading-relaxed">
            You have the correct cover dimensions. Now check whether your
            interior PDF will pass KDP review — margins, bleed, trim size,
            and fonts can still trigger rejection.
          </p>
          <Link
            href="/kdp-pdf-checker"
            className="inline-block bg-m2p-orange hover:bg-m2p-orange-hover text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            Check My PDF — $9
          </Link>
        </div>
      </div>
    </ToolPageShell>
  );
}
