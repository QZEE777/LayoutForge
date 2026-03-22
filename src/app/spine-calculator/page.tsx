"use client";

import { useState, useMemo } from "react";
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
import ToolPageShell from "@/components/ToolPageShell";
import KdpConversionBridge from "@/components/KdpConversionBridge";

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
    <ToolPageShell>
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide text-m2p-ink mb-2 text-center">
          KDP Spine Width Calculator — Calculate Book Spine for Print
        </h1>
        <p className="text-m2p-muted mb-3 text-center">
          Get spine width and full-wrap cover dimensions for KDP paperbacks. Use these when designing your cover in Canva or other tools.
        </p>
        <p className="text-m2p-muted text-sm mt-2 mb-5 leading-relaxed text-center">
          This calculates spine width based on page count and paper type.
          It does not verify your full book layout or KDP compliance —
          margins, trim, and fonts must still be checked.
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
                onChange={(e) => setPageCount(e.target.valueAsNumber ?? MIN_PAGES)}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
              />
              <p className="text-xs text-m2p-muted mt-1">KDP range: {MIN_PAGES}–{MAX_PAGES} pages.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Paper type</label>
              <select
                value={paperType}
                onChange={(e) => setPaperType(e.target.value as PaperType)}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
              >
                {PAPER_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Trim size (for full-wrap)</label>
              <select
                value={trimId}
                onChange={(e) => setTrimId(e.target.value as TrimSizeId)}
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
          <h2 className="font-bebas text-xl tracking-wide text-m2p-ink mb-4">Results</h2>
          <dl className="text-sm space-y-3">
            <div>
              <dt className="text-m2p-muted">Spine width</dt>
              <dd className="text-m2p-ink font-semibold">
                {spineInches.toFixed(3)} in ({spineMm.toFixed(2)} mm)
              </dd>
            </div>
            {fullWrap && (
              <div>
                <dt className="text-m2p-muted">Full-wrap cover size (with 0.125&quot; bleed)</dt>
                <dd className="text-m2p-ink font-semibold">
                  {fullWrap.widthInches.toFixed(3)} &times; {fullWrap.heightInches.toFixed(3)} in
                </dd>
                <dd className="text-m2p-muted text-xs mt-0.5">
                  Use this for front + spine + back in one canvas. Minimum 300 DPI for print.
                </dd>
              </div>
            )}
          </dl>
        </div>

        <p className="text-xs text-m2p-muted mb-2">
          Based on KDP paperback paper thickness. Actual spine may vary slightly by marketplace. No data sent to the server.
        </p>

        <KdpConversionBridge />

        <KdpConversionBridge />
      </div>
    </ToolPageShell>
  );
}
