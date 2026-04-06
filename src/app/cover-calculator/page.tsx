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
const INCH_TO_MM = 25.4;
const SPINE_TEXT_MIN = 0.75; // KDP minimum spine width for text

function inchesToPx(inches: number): number {
  return Math.round(inches * DPI);
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-block ml-1 cursor-help">
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-m2p-border text-m2p-muted text-xs font-bold leading-none">?</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-m2p-ink text-white text-xs px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-center leading-relaxed">
        {text}
      </span>
    </span>
  );
}

export default function CoverCalculatorPage() {
  const [pageCount, setPageCount] = useState(300);
  const [paperType, setPaperType] = useState<PaperType>("bw-cream");
  const [trimId, setTrimId] = useState<TrimSizeId>("6x9");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

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

  const spineHasText = spineInches >= SPINE_TEXT_MIN;

  const copyToClipboard = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
    } catch {
      setCopied(`${key}-fail`);
    }
    setTimeout(() => setCopied(null), 2000);
  };

  const [downloading, setDownloading] = useState(false);
  const handleDownloadTemplate = async () => {
    const currentPages = clampPages(pageCount);
    const currentSpineInches = getSpineWidthInches(currentPages, paperType);
    const currentTrim = getTrimSize(trimId);
    const currentFullWrap = currentTrim
      ? getFullWrapDimensions(currentTrim.widthInches, currentTrim.heightInches, currentSpineInches)
      : null;
    if (!currentFullWrap || !currentTrim) return;
    const paperLabel = PAPER_OPTIONS.find((o) => o.id === paperType)?.label ?? paperType;
    const params = {
      widthInches: currentFullWrap.widthInches,
      heightInches: currentFullWrap.heightInches,
      spineWidthInches: currentSpineInches,
      trimWidthInches: currentTrim.widthInches,
      trimHeightInches: currentTrim.heightInches,
      bleedInches: 0.125,
      pageCount: currentPages,
      paperTypeLabel: paperLabel,
    };
    setDownloading(true);
    setDownloadError(null);
    try {
      const bytes = await createCoverTemplatePdf(params);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kdp-cover-template-${currentTrim.id}-${currentPages}p.pdf`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1200);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Could not generate template PDF. Please try again.");
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
          <span className="block">Calculate the exact full-wrap cover dimensions for your paperback —</span>
          <span className="block">front, spine, and back — with bleed included.</span>
        </p>
        <p className="text-m2p-muted text-sm mt-2 mb-5 leading-relaxed text-center">
          <span className="block">Designing in Canva, InDesign, or Photoshop? Get pixel dimensions</span>
          <span className="block">at 300 DPI, inches, and mm — plus a downloadable cover template PDF.</span>
        </p>

        {/* ── Inputs ── */}
        <div className="rounded-xl border-2 bg-white p-6 mb-5" style={{ borderColor: "#2D6A2D" }}>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Interior page count</label>
              <input
                type="number"
                min={MIN_PAGES}
                max={MAX_PAGES}
                value={pageCount}
                onChange={(e) => {
                  const next = e.target.valueAsNumber;
                  setPageCount(Number.isFinite(next) ? next : MIN_PAGES);
                  markInteracted();
                }}
                onBlur={() => setPageCount(clampPages(pageCount))}
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
              <p className="text-xs text-m2p-muted mt-1">Cream paper is slightly thicker — affects spine width.</p>
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
              <p className="text-xs text-m2p-muted mt-1">6&quot; × 9&quot; is the most popular for novels and non-fiction.</p>
            </div>
          </div>
        </div>

        {/* ── Spine text warning ── */}
        {!spineHasText && fullWrap && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 mb-5 flex gap-3 items-start">
            <span className="text-amber-500 text-lg leading-none mt-0.5">⚠</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Spine too narrow for text</p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Your spine is <strong>{spineInches.toFixed(3)}&quot;</strong>. KDP requires a minimum of <strong>0.75&quot;</strong> before spine text (title/author) is allowed.
                Add more pages or use cream paper to widen the spine.
              </p>
            </div>
          </div>
        )}
        {spineHasText && fullWrap && (
          <div className="rounded-xl border border-m2p-green/40 bg-m2p-green/5 px-5 py-3 mb-5 flex gap-3 items-center">
            <span className="text-m2p-live text-base leading-none">✓</span>
            <p className="text-xs text-m2p-ink">
              Spine is <strong>{spineInches.toFixed(3)}&quot;</strong> — wide enough for title and author text.
            </p>
          </div>
        )}

        {/* ── Results ── */}
        <div className="rounded-xl border-l-4 border-m2p-orange border border-m2p-border bg-white p-6 mb-5">
          <h2 className="font-bebas text-xl tracking-wide text-m2p-ink mb-4">Your cover canvas size</h2>

          {pixels && fullWrap && trim && (
            <dl className="text-sm space-y-4">

              {/* Pixel dimensions */}
              <div>
                <dt className="text-m2p-muted flex items-center">
                  For Canva / design tools (300 DPI)
                  <Tooltip text="Create a custom canvas in Canva or Photoshop with exactly these pixel dimensions. This covers front, spine, and back in one artboard." />
                </dt>
                <dd className="flex items-center gap-3 mt-1">
                  <span className="text-m2p-ink font-semibold text-lg">{pixels.width} × {pixels.height} px</span>
                  <button
                    onClick={() => copyToClipboard(`${pixels.width} x ${pixels.height}`, "px")}
                    className="text-xs text-m2p-muted hover:text-m2p-orange border border-m2p-border rounded px-2 py-0.5 transition-colors"
                  >
                    {copied === "px" ? "✓ Copied" : copied === "px-fail" ? "Copy failed" : "Copy"}
                  </button>
                </dd>
              </div>

              {/* Inch dimensions */}
              <div>
                <dt className="text-m2p-muted flex items-center">
                  Exact size (with 0.125&quot; bleed)
                  <Tooltip text="Bleed is the extra 0.125 inch on each edge that gets trimmed off during printing. Always include bleed so your cover has no white borders." />
                </dt>
                <dd className="flex items-center gap-3 mt-0.5">
                  <span className="text-m2p-ink font-semibold">
                    {fullWrap.widthInches.toFixed(3)}&quot; × {fullWrap.heightInches.toFixed(3)}&quot;
                  </span>
                  <button
                    onClick={() => copyToClipboard(`${fullWrap.widthInches.toFixed(3)} x ${fullWrap.heightInches.toFixed(3)}`, "in")}
                    className="text-xs text-m2p-muted hover:text-m2p-orange border border-m2p-border rounded px-2 py-0.5 transition-colors"
                  >
                    {copied === "in" ? "✓ Copied" : copied === "in-fail" ? "Copy failed" : "Copy"}
                  </button>
                </dd>
                <dd className="text-m2p-muted text-xs mt-0.5">
                  {(fullWrap.widthInches * INCH_TO_MM).toFixed(1)} × {(fullWrap.heightInches * INCH_TO_MM).toFixed(1)} mm
                </dd>
              </div>

              {/* Spine */}
              <div>
                <dt className="text-m2p-muted flex items-center">
                  Spine width
                  <Tooltip text="The spine width is calculated from your page count and paper type. Cream paper is thicker, giving a wider spine." />
                </dt>
                <dd className="flex items-center gap-3 mt-0.5">
                  <span className="text-m2p-ink font-semibold">
                    {spineInches.toFixed(3)}&quot; ({(spineInches * INCH_TO_MM).toFixed(2)} mm)
                  </span>
                  <button
                    onClick={() => copyToClipboard(spineInches.toFixed(3), "spine")}
                    className="text-xs text-m2p-muted hover:text-m2p-orange border border-m2p-border rounded px-2 py-0.5 transition-colors"
                  >
                    {copied === "spine" ? "✓ Copied" : copied === "spine-fail" ? "Copy failed" : "Copy"}
                  </button>
                </dd>
              </div>

              {/* Panel breakdown */}
              <div className="pt-1 border-t border-m2p-border">
                <dt className="text-m2p-muted text-xs mb-2 font-medium uppercase tracking-wide">Panel breakdown</dt>
                <dd className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-center">
                    <p className="text-m2p-muted font-medium">Back</p>
                    <p className="text-m2p-ink font-semibold mt-0.5">{trim.widthInches.toFixed(3)}&quot;</p>
                    <p className="text-m2p-muted">{(trim.widthInches * INCH_TO_MM).toFixed(1)} mm</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-center">
                    <p className="text-m2p-muted font-medium">Spine</p>
                    <p className="text-m2p-ink font-semibold mt-0.5">{spineInches.toFixed(3)}&quot;</p>
                    <p className="text-m2p-muted">{(spineInches * INCH_TO_MM).toFixed(1)} mm</p>
                  </div>
                  <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2 text-center">
                    <p className="text-m2p-muted font-medium">Front</p>
                    <p className="text-m2p-ink font-semibold mt-0.5">{trim.widthInches.toFixed(3)}&quot;</p>
                    <p className="text-m2p-muted">{(trim.widthInches * INCH_TO_MM).toFixed(1)} mm</p>
                  </div>
                </dd>
                <p className="text-xs text-m2p-muted mt-2">+ 0.125&quot; bleed on all outer edges (not shown above).</p>
              </div>

              {/* Download */}
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
                <p className="text-m2p-muted text-xs mt-1.5">
                  Includes trim lines, spine guides, safe zones, bleed zone, barcode area, and dimension annotations — ready to use in Canva or InDesign.
                </p>
                {downloadError && (
                  <p className="mt-2 text-xs text-amber-700">{downloadError}</p>
                )}
              </div>
            </dl>
          )}
        </div>

        <p className="text-xs text-m2p-muted mb-4 text-center">
          Based on KDP paperback paper thickness specifications. No data sent to any server.
        </p>

        {/* ── Related tools ── */}
        <div className="mt-5 text-center">
          <p className="text-xs text-m2p-muted font-semibold mb-2 uppercase tracking-wide">
            Related free tools
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
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

        {/* ── CTA ── */}
        <div className="mt-6 rounded-xl bg-m2p-orange-soft border border-m2p-orange/20 p-5 text-center">
          <p className="font-bebas text-m2p-ink text-lg mb-1">
            Ready for the next step?
          </p>
          <p className="text-m2p-muted text-sm mb-4 leading-relaxed">
            You have the right cover dimensions. Now check whether your
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
