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
const OUTSIDE_MARGIN = 0.25;
const INCH_TO_MM = 25.4;

// KDP gutter thresholds
const GUTTER_THRESHOLDS = [
  { upTo: 150,  gutter: 0.375 },
  { upTo: 300,  gutter: 0.5   },
  { upTo: 500,  gutter: 0.625 },
  { upTo: 700,  gutter: 0.75  },
  { upTo: 828,  gutter: 0.875 },
];

function clampPages(n: number): number {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.max(minPages, Math.min(maxPages, v)) : minPages;
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-block ml-1 cursor-help">
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-m2p-border text-m2p-muted text-xs font-bold leading-none">?</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 rounded-lg bg-m2p-ink text-white text-xs px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-center leading-relaxed">
        {text}
      </span>
    </span>
  );
}

export default function InteriorTemplatePage() {
  const [trimId, setTrimId] = useState<TrimSizeId>("6x9");
  const [pageCount, setPageCount] = useState(300);
  const [withBleed, setWithBleed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const markInteracted = useCallback(() => setHasInteracted(true), []);

  const pages = useMemo(() => clampPages(pageCount), [pageCount]);
  const trim = useMemo(() => getTrimSize(trimId), [trimId]);
  const gutterInches = useMemo(() => getGutterMargin(pages), [pages]);

  // Computed text area
  const textAreaWidth = useMemo(
    () => trim ? trim.widthInches - gutterInches - OUTSIDE_MARGIN : 0,
    [trim, gutterInches]
  );
  const textAreaHeight = useMemo(
    () => trim ? trim.heightInches - OUTSIDE_MARGIN * 2 : 0,
    [trim]
  );

  // Next gutter threshold
  const nextThreshold = useMemo(() => {
    let rangeStart = minPages;
    for (let i = 0; i < GUTTER_THRESHOLDS.length; i += 1) {
      const current = GUTTER_THRESHOLDS[i];
      if (pages >= rangeStart && pages <= current.upTo) {
        const next = GUTTER_THRESHOLDS[i + 1];
        if (!next || next.gutter <= current.gutter) return null;
        return { startsAt: current.upTo + 1, gutter: next.gutter };
      }
      rangeStart = current.upTo + 1;
    }
    return null;
  }, [pages]);

  const copyToClipboard = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
    } catch {
      setCopied(`${key}-fail`);
    }
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = async () => {
    if (!trim) return;
    setDownloading(true);
    setDownloadError(null);
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
          <span className="block text-3xl sm:text-4xl">KDP Interior Template Generator</span>
          <span className="block text-xl sm:text-2xl text-m2p-muted mt-1">
            Format Your Book Correctly Before You Publish
          </span>
        </h1>
        <p className="text-m2p-muted mb-3 text-center text-sm leading-relaxed">
          <span className="block">Download a ready-to-use interior layout template</span>
          <span className="block">with correct margins, trim size, and safe zones for KDP.</span>
        </p>
        <p className="text-m2p-muted text-sm mt-2 mb-5 leading-relaxed text-center">
          KDP&apos;s gutter (inside margin) increases with page count — more pages means a thicker spine
          and more paper hidden in the binding. This tool calculates the exact minimum for your book.
        </p>

        {/* ── Inputs ── */}
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
              <p className="text-xs text-m2p-muted mt-1">6&quot; × 9&quot; is the most popular for novels and non-fiction.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">
                Interior page count
                <Tooltip text="Use your final page count. KDP's gutter margin increases at 150, 300, 500, and 700 pages. Getting this wrong is a common rejection cause." />
              </label>
              <input
                type="number"
                min={minPages}
                max={maxPages}
                value={pageCount}
                onChange={(e) => {
                  const next = e.target.valueAsNumber;
                  setPageCount(Number.isFinite(next) ? next : minPages);
                  markInteracted();
                }}
                onBlur={() => setPageCount(clampPages(pageCount))}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
              />
              <p className="text-xs text-m2p-muted mt-1">KDP range: {minPages}–{maxPages} pages.</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="bleed"
                type="checkbox"
                checked={withBleed}
                onChange={(e) => { setWithBleed(e.target.checked); markInteracted(); }}
                className="rounded border-m2p-border bg-m2p-ivory text-m2p-orange focus:ring-m2p-orange"
              />
              <label htmlFor="bleed" className="text-sm text-m2p-ink flex items-center">
                Include bleed (0.125&quot;) and trim line — for full-bleed interiors
                <Tooltip text="Only needed if your interior has images or backgrounds that extend to the page edge. Most text-only books don't need bleed." />
              </label>
            </div>
          </div>
        </div>

        {/* ── Results ── */}
        <div className="rounded-xl border-l-4 border-m2p-orange border border-m2p-border bg-white p-6 mb-5">
          <h2 className="font-bebas text-xl tracking-wide text-m2p-ink mb-4">Your template</h2>
          {trim && (
            <dl className="text-sm space-y-4">

              {/* Gutter */}
              <div>
                <dt className="text-m2p-muted flex items-center">
                  Gutter (inside / binding margin) for {pages} pages
                  <Tooltip text="The gutter is the inside margin — the edge that goes into the book spine. KDP requires more gutter as pages increase because more paper is hidden in the binding." />
                </dt>
                <dd className="flex items-center gap-3 mt-1">
                  <span className="text-m2p-ink font-semibold text-lg">
                    {gutterInches}&quot; &nbsp;/&nbsp; {(gutterInches * INCH_TO_MM).toFixed(1)} mm
                  </span>
                  <button
                    onClick={() => copyToClipboard(String(gutterInches), "gutter")}
                    className="text-xs text-m2p-muted hover:text-m2p-orange border border-m2p-border rounded px-2 py-0.5 transition-colors"
                  >
                    {copied === "gutter" ? "✓ Copied" : copied === "gutter-fail" ? "Copy failed" : "Copy"}
                  </button>
                </dd>
              </div>

              {/* Outside margins */}
              <div>
                <dt className="text-m2p-muted flex items-center">
                  Outside margins (top, bottom, outer edge)
                  <Tooltip text="The top, bottom, and outer edge margin are all 0.25 inch minimum per KDP. These do not change with page count." />
                </dt>
                <dd className="text-m2p-ink font-semibold mt-0.5">
                  0.25&quot; &nbsp;/&nbsp; {(0.25 * INCH_TO_MM).toFixed(1)} mm — KDP minimum
                </dd>
              </div>

              {/* Text area */}
              <div className="pt-1 border-t border-m2p-border">
                <dt className="text-m2p-muted flex items-center">
                  Usable text area
                  <Tooltip text="This is the actual printable area inside your margins. All body text, images, and content must stay within this zone." />
                </dt>
                <dd className="flex items-center gap-3 mt-1">
                  <span className="text-m2p-ink font-semibold">
                    {textAreaWidth.toFixed(3)}&quot; × {textAreaHeight.toFixed(3)}&quot;
                  </span>
                  <button
                    onClick={() => copyToClipboard(`${textAreaWidth.toFixed(3)} x ${textAreaHeight.toFixed(3)}`, "textarea")}
                    className="text-xs text-m2p-muted hover:text-m2p-orange border border-m2p-border rounded px-2 py-0.5 transition-colors"
                  >
                    {copied === "textarea" ? "✓ Copied" : copied === "textarea-fail" ? "Copy failed" : "Copy"}
                  </button>
                </dd>
                <dd className="text-m2p-muted text-xs mt-0.5">
                  {(textAreaWidth * INCH_TO_MM).toFixed(1)} × {(textAreaHeight * INCH_TO_MM).toFixed(1)} mm
                </dd>
              </div>

              {/* Margin breakdown tiles */}
              <div>
                <dt className="text-m2p-muted text-xs mb-2 font-medium uppercase tracking-wide">Margin breakdown</dt>
                <dd className="grid grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg bg-amber-50 border border-amber-100 px-2 py-2 text-center">
                    <p className="text-m2p-muted font-medium">Gutter</p>
                    <p className="text-m2p-ink font-semibold mt-0.5">{gutterInches}&quot;</p>
                    <p className="text-m2p-muted">{(gutterInches * INCH_TO_MM).toFixed(1)} mm</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 border border-blue-100 px-2 py-2 text-center">
                    <p className="text-m2p-muted font-medium">Top</p>
                    <p className="text-m2p-ink font-semibold mt-0.5">0.25&quot;</p>
                    <p className="text-m2p-muted">6.4 mm</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 border border-blue-100 px-2 py-2 text-center">
                    <p className="text-m2p-muted font-medium">Bottom</p>
                    <p className="text-m2p-ink font-semibold mt-0.5">0.25&quot;</p>
                    <p className="text-m2p-muted">6.4 mm</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 border border-blue-100 px-2 py-2 text-center">
                    <p className="text-m2p-muted font-medium">Outside</p>
                    <p className="text-m2p-ink font-semibold mt-0.5">0.25&quot;</p>
                    <p className="text-m2p-muted">6.4 mm</p>
                  </div>
                </dd>
              </div>

              {/* Gutter progression */}
              <div>
                <dt className="text-m2p-muted text-xs mb-2 font-medium uppercase tracking-wide flex items-center gap-1">
                  Gutter increases with page count
                  <Tooltip text="KDP automatically requires a larger gutter as your page count grows. If your page count crosses a threshold after you've already formatted your book, you'll need to reformat." />
                </dt>
                <dd className="flex gap-1 flex-wrap">
                  {GUTTER_THRESHOLDS.map((t, i) => {
                    const rangeStart = i === 0 ? minPages : GUTTER_THRESHOLDS[i - 1].upTo + 1;
                    const isActive = pages <= t.upTo && (i === 0 || pages > GUTTER_THRESHOLDS[i - 1].upTo);
                    return (
                      <div
                        key={t.upTo}
                        className={`rounded-lg px-2.5 py-1.5 text-xs text-center border transition-colors ${
                          isActive
                            ? "bg-m2p-orange/10 border-m2p-orange text-m2p-orange font-semibold"
                            : "bg-m2p-ivory border-m2p-border text-m2p-muted"
                        }`}
                      >
                        <p className="font-medium">{t.gutter}&quot;</p>
                        <p className="text-xs opacity-75">{rangeStart}–{t.upTo}pp</p>
                      </div>
                    );
                  })}
                </dd>
                {nextThreshold && (
                  <p className="text-xs text-amber-700 mt-2">
                    ⚠ Gutter increases to <strong>{nextThreshold.gutter}&quot;</strong> at <strong>{nextThreshold.startsAt} pages</strong> — reformat required if you cross this threshold.
                  </p>
                )}
              </div>

              {/* Download */}
              <div className="pt-2 border-t border-m2p-border">
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
                  Includes trim lines, margin guides, safe zone, and dimension annotations — ready to use in Canva or InDesign.
                </p>
                {downloadError && (
                  <p className="mt-2 text-xs text-amber-700">{downloadError}</p>
                )}
              </div>
            </dl>
          )}
        </div>

        {/* Reality check */}
        <div className="rounded-xl bg-white border border-m2p-border px-5 py-4 mb-5">
          <p className="font-semibold text-m2p-ink text-sm mb-1">A template does not guarantee KDP approval</p>
          <p className="text-m2p-muted text-sm leading-relaxed">
            Even with correct margins, KDP can reject your file for font embedding failures,
            wrong page size in the PDF metadata, or image resolution issues that only appear in the final export.
          </p>
        </div>

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

        {hasInteracted && <KdpConversionBridge />}

        {/* CTA */}
        <div className="mt-6 rounded-xl bg-m2p-orange-soft border border-m2p-orange/20 p-5 text-center">
          <p className="font-bebas text-m2p-ink text-lg mb-1">
            Got your margins? Now check the actual PDF.
          </p>
          <p className="text-m2p-muted text-sm mb-4 leading-relaxed">
            A correct template is step one. Your exported PDF can still fail KDP
            for font issues, wrong trim size in metadata, or image problems. Check it before you upload.
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
