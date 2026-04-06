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
  SPINE_PER_PAGE,
  type PaperType,
  type TrimSizeId,
} from "@/lib/spineCalc";
import ToolPageShell from "@/components/ToolPageShell";
import KdpConversionBridge from "@/components/KdpConversionBridge";

function clampPages(n: number): number {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.max(MIN_PAGES, Math.min(MAX_PAGES, v)) : MIN_PAGES;
}

const INCH_TO_MM = 25.4;
const SPINE_TEXT_MIN = 0.75; // KDP minimum spine width for spine text
const MAX_SPINE_INCHES = MAX_PAGES * Math.max(...Object.values(SPINE_PER_PAGE)); // widest possible across supported paper types

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

export default function SpineCalculatorPage() {
  const [pageCount, setPageCount] = useState(300);
  const [paperType, setPaperType] = useState<PaperType>("bw-cream");
  const [trimId, setTrimId] = useState<TrimSizeId>("6x9");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const markInteracted = useCallback(() => setHasInteracted(true), []);

  const pages = useMemo(() => clampPages(pageCount), [pageCount]);
  const spineInches = useMemo(() => getSpineWidthInches(pages, paperType), [pages, paperType]);
  const spineMm = useMemo(() => spineInches * INCH_TO_MM, [spineInches]);
  const trim = useMemo(() => getTrimSize(trimId), [trimId]);
  const fullWrap = useMemo(
    () => (trim ? getFullWrapDimensions(trim.widthInches, trim.heightInches, spineInches) : null),
    [trim, spineInches]
  );

  const spineHasText = spineInches >= SPINE_TEXT_MIN;
  const pagesForSpineText = useMemo(
    () => Math.ceil(SPINE_TEXT_MIN / SPINE_PER_PAGE[paperType]),
    [paperType]
  );
  const pagesUntilText = Math.max(0, pagesForSpineText - pages);

  // Visual bar: % of max possible spine width
  const spineBarPct = Math.min(100, (spineInches / MAX_SPINE_INCHES) * 100);
  const spineTextThresholdPct = Math.min(100, (SPINE_TEXT_MIN / MAX_SPINE_INCHES) * 100);

  const copyToClipboard = (value: string, key: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <ToolPageShell>
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="font-bebas tracking-wide text-m2p-ink mb-2 text-center">
          <span className="block text-3xl sm:text-4xl">KDP Spine Width Calculator</span>
          <span className="block text-xl sm:text-2xl text-m2p-muted mt-1">Book Spine Width for KDP Paperbacks</span>
        </h1>
        <p className="text-m2p-muted mb-3 text-center">
          <span className="block">Calculate your exact spine width by page count and paper type.</span>
          <span className="block">Know before you design — not after KDP rejects it.</span>
        </p>
        <p className="text-m2p-muted text-sm mt-2 mb-5 leading-relaxed text-center">
          KDP calculates spine width from page count × paper thickness.
          Cream paper is thicker — fewer pages needed for a wider spine and spine text.
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
              <label className="block text-sm font-medium text-m2p-ink mb-2">
                Paper type
                <Tooltip text="Cream paper is thicker per page (0.0025 in/page) than white (0.002252 in/page). Same page count = wider spine on cream." />
              </label>
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
              <p className="text-xs text-m2p-muted mt-1">Used to calculate full-wrap canvas dimensions.</p>
            </div>
          </div>
        </div>

        {/* ── Results ── */}
        <div className="rounded-xl border-l-4 border-m2p-orange border border-m2p-border bg-white p-6 mb-5">
          <h2 className="font-bebas text-xl tracking-wide text-m2p-ink mb-4">Results</h2>
          <dl className="text-sm space-y-4">

            {/* Spine width */}
            <div>
              <dt className="text-m2p-muted flex items-center">
                Spine width
                <Tooltip text="This is the width of the spine panel on your full-wrap cover. Calculated from your page count multiplied by paper thickness per page." />
              </dt>
              <dd className="flex items-center gap-3 mt-1">
                <span className="text-m2p-ink font-semibold text-lg">
                  {spineInches.toFixed(3)}&quot; &nbsp;/&nbsp; {spineMm.toFixed(2)} mm
                </span>
                <button
                  onClick={() => copyToClipboard(spineInches.toFixed(3), "spine")}
                  className="text-xs text-m2p-muted hover:text-m2p-orange border border-m2p-border rounded px-2 py-0.5 transition-colors"
                >
                  {copied === "spine" ? "✓ Copied" : "Copy in"}
                </button>
                <button
                  onClick={() => copyToClipboard(spineMm.toFixed(2), "spinemm")}
                  className="text-xs text-m2p-muted hover:text-m2p-orange border border-m2p-border rounded px-2 py-0.5 transition-colors"
                >
                  {copied === "spinemm" ? "✓ Copied" : "Copy mm"}
                </button>
              </dd>
            </div>

            {/* Visual spine bar */}
            <div>
              <dt className="text-m2p-muted text-xs mb-1.5 flex items-center gap-1">
                Spine width relative to maximum
                <Tooltip text="The orange marker shows the 0.75 inch minimum needed for spine text. If your bar is left of the marker, you cannot add title/author to the spine." />
              </dt>
              <div className="relative h-5 rounded-full bg-m2p-ivory border border-m2p-border overflow-hidden">
                {/* Fill bar */}
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${spineBarPct}%`,
                    backgroundColor: spineHasText ? "#4cd964" : "#f97316",
                  }}
                />
                {/* Threshold marker */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-m2p-orange z-10"
                  style={{ left: `${spineTextThresholdPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-m2p-muted mt-1">
                <span>0&quot;</span>
                <span
                  className="text-m2p-orange font-medium"
                  style={{ transform: `translateX(${Math.max(-20, Math.min(20, spineTextThresholdPct - 50))}%)` }}
                >
                  0.75&quot; min for text
                </span>
                <span>{MAX_SPINE_INCHES.toFixed(2)}&quot;</span>
              </div>
            </div>

            {/* Spine text status */}
            {!spineHasText ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex gap-3 items-start">
                <span className="text-amber-500 text-base leading-none mt-0.5">⚠</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Too narrow for spine text</p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Your spine is <strong>{spineInches.toFixed(3)}&quot;</strong>. KDP requires at least <strong>0.75&quot;</strong> to allow title and author name on the spine.
                    You need <strong>{pagesUntilText} more pages</strong> ({pagesForSpineText} total) on {PAPER_OPTIONS.find(o => o.id === paperType)?.label ?? paperType}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-m2p-green/40 bg-m2p-green/5 px-4 py-3 flex gap-3 items-center">
                <span className="text-m2p-live text-base leading-none">✓</span>
                <p className="text-xs text-m2p-ink">
                  Wide enough for spine text — title and author name can be placed on the spine.
                  Allow <strong>±0.0625&quot;</strong> printing variance when positioning text.
                </p>
              </div>
            )}

            {/* Full-wrap dimensions */}
            {fullWrap && trim && (
              <>
                <div className="pt-1 border-t border-m2p-border">
                  <dt className="text-m2p-muted flex items-center">
                    Full-wrap canvas size (with 0.125&quot; bleed)
                    <Tooltip text="This is the total size for your cover file: front + spine + back, with 0.125 inch bleed on all outer edges." />
                  </dt>
                  <dd className="flex items-center gap-3 mt-1">
                    <span className="text-m2p-ink font-semibold">
                      {fullWrap.widthInches.toFixed(3)}&quot; × {fullWrap.heightInches.toFixed(3)}&quot;
                    </span>
                    <button
                      onClick={() => copyToClipboard(`${fullWrap.widthInches.toFixed(3)} x ${fullWrap.heightInches.toFixed(3)}`, "wrap")}
                      className="text-xs text-m2p-muted hover:text-m2p-orange border border-m2p-border rounded px-2 py-0.5 transition-colors"
                    >
                      {copied === "wrap" ? "✓ Copied" : "Copy"}
                    </button>
                  </dd>
                  <dd className="text-m2p-muted text-xs mt-0.5">
                    {(fullWrap.widthInches * INCH_TO_MM).toFixed(1)} × {(fullWrap.heightInches * INCH_TO_MM).toFixed(1)} mm &nbsp;·&nbsp; 300 DPI minimum
                  </dd>
                </div>

                {/* Panel breakdown */}
                <div>
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
                      <p className="text-m2p-muted">{spineMm.toFixed(1)} mm</p>
                    </div>
                    <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2 text-center">
                      <p className="text-m2p-muted font-medium">Front</p>
                      <p className="text-m2p-ink font-semibold mt-0.5">{trim.widthInches.toFixed(3)}&quot;</p>
                      <p className="text-m2p-muted">{(trim.widthInches * INCH_TO_MM).toFixed(1)} mm</p>
                    </div>
                  </dd>
                  <p className="text-xs text-m2p-muted mt-2">+ 0.125&quot; bleed on all outer edges (not shown above).</p>
                </div>
              </>
            )}
          </dl>
        </div>

        <p className="text-xs text-m2p-muted mb-5 text-center">
          Based on KDP paperback paper thickness specs. Actual spine may vary slightly by marketplace. No data sent to any server.
        </p>

        {/* ── Related tools ── */}
        <div className="mt-5 text-center">
          <p className="text-xs text-m2p-muted font-semibold mb-2 uppercase tracking-wide">
            Related free tools
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/cover-calculator" className="inline-flex items-center rounded-full bg-[#2D6A2D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A3A2A] transition-colors">Cover Size Calculator →</Link>
            <Link href="/royalty-calculator" className="inline-flex items-center rounded-full bg-[#2D6A2D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A3A2A] transition-colors">Royalty Calculator →</Link>
            <Link href="/page-count-estimator" className="inline-flex items-center rounded-full bg-[#2D6A2D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A3A2A] transition-colors">Page Count Estimator →</Link>
          </div>
        </div>

        {hasInteracted && <KdpConversionBridge />}

        {/* ── CTA ── */}
        <div className="mt-6 rounded-xl bg-m2p-orange-soft border border-m2p-orange/20 p-5 text-center">
          <p className="font-bebas text-m2p-ink text-lg mb-1">
            Got your spine width? Check the interior too.
          </p>
          <p className="text-m2p-muted text-sm mb-4 leading-relaxed">
            A correct spine doesn&apos;t guarantee KDP approval. Margins, bleed, trim size,
            and font embedding in your interior PDF can still get you rejected.
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
