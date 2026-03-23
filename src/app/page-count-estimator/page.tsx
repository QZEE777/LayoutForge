"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { KDP_TRIM_SIZES, estimatePageCount, KDP_PAGE_LIMITS, type TrimSizeId } from "@/lib/kdpSpecs";
import ToolPageShell from "@/components/ToolPageShell";
import KdpConversionBridge from "@/components/KdpConversionBridge";

const MAX_WORDS = 5_000_000;
const FONT_OPTIONS = [10, 11, 12] as const;

function sanitizeWordCount(value: unknown): number {
  const n = typeof value === "number" ? value : Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MAX_WORDS);
}

function isValidTrimId(id: string): id is TrimSizeId {
  return KDP_TRIM_SIZES.some((t) => t.id === id);
}

export default function PageCountEstimatorPage() {
  const [wordCountInput, setWordCountInput] = useState("50000");
  const [trimId, setTrimId] = useState<TrimSizeId>("6x9");
  const [fontSize, setFontSize] = useState<10 | 11 | 12>(11);
  const [hasInteracted, setHasInteracted] = useState(false);

  const wordCount = useMemo(
    () => sanitizeWordCount(wordCountInput === "" ? 0 : Number(wordCountInput.replace(/\D/g, ""))),
    [wordCountInput]
  );
  const safeTrimId = useMemo(() => (isValidTrimId(trimId) ? trimId : "6x9"), [trimId]);
  const estimatedPages = useMemo(
    () => estimatePageCount(wordCount, safeTrimId, fontSize),
    [wordCount, safeTrimId, fontSize]
  );

  const inRange =
    estimatedPages >= KDP_PAGE_LIMITS.minPages &&
    estimatedPages <= KDP_PAGE_LIMITS.maxPages;

  return (
    <ToolPageShell>
      <div className="mx-auto max-w-2xl px-6 py-8">

        {/* H1 — two-line split, no dash */}
        <h1 className="font-bebas tracking-wide text-m2p-ink mb-2 text-center">
          <span className="block text-3xl sm:text-4xl">KDP Page Count Estimator</span>
          <span className="block text-xl sm:text-2xl text-m2p-muted mt-1">
            Estimate Pages Before Formatting
          </span>
        </h1>

        <p className="text-m2p-muted mb-3 text-center text-sm leading-relaxed">
          <span className="block">Estimate how many pages your book will have —</span>
          <span className="block">before you design your cover, set your price, or upload to Amazon.</span>
        </p>
        <p className="text-m2p-muted text-sm mt-2 mb-5 leading-relaxed text-center">
          <span className="block">Calculate page count based on word count, trim size,</span>
          <span className="block">and font size using KDP-style layout assumptions.</span>
        </p>

        {/* Input card */}
        <div className="rounded-xl border-2 bg-white p-6 mb-5" style={{ borderColor: "#2D6A2D" }}>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Word count</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="50000"
                value={wordCountInput}
                onChange={(e) => { setWordCountInput(e.target.value.replace(/\D/g, "").slice(0, 10)); setHasInteracted(true); }}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
              />
              <p className="text-xs text-m2p-muted mt-1">Numbers only, max {MAX_WORDS.toLocaleString()} words.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Trim size</label>
              <select
                value={safeTrimId}
                onChange={(e) => { setTrimId(e.target.value as TrimSizeId); setHasInteracted(true); }}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
              >
                {KDP_TRIM_SIZES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Font size (affects words per page)</label>
              <div className="flex gap-4">
                {FONT_OPTIONS.map((f) => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="fontSize"
                      value={f}
                      checked={fontSize === f}
                      onChange={() => { setFontSize(f); setHasInteracted(true); }}
                      className="text-m2p-orange focus:ring-m2p-orange"
                    />
                    <span className="text-sm text-m2p-ink">{f}pt</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Result card */}
        <div className="rounded-xl border-l-4 border-m2p-orange border border-m2p-border bg-white p-6 mb-5">
          <h2 className="font-bebas text-xl tracking-wide text-m2p-ink mb-3">Your Estimated Page Count</h2>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="font-bebas text-5xl text-m2p-orange leading-none">{estimatedPages}</span>
            <span className="text-m2p-muted text-sm">pages</span>
          </div>
          {inRange ? (
            <p className="text-xs text-green-700 mb-2">
              Within KDP range ({KDP_PAGE_LIMITS.minPages}–{KDP_PAGE_LIMITS.maxPages} pages).
            </p>
          ) : (
            <p className="text-xs text-amber-600 mb-2">
              Outside KDP range ({KDP_PAGE_LIMITS.minPages}–{KDP_PAGE_LIMITS.maxPages} pages) — adjust word count or trim size.
            </p>
          )}
          <p className="text-xs text-m2p-muted">
            This is an estimate. Final page count depends on layout, spacing, images, and chapter formatting.
          </p>
        </div>

        {/* Insight block */}
        <div className="rounded-xl bg-white border border-m2p-border px-5 py-4 mb-5">
          <p className="font-semibold text-m2p-ink text-sm mb-2">What this means</p>
          <p className="text-m2p-muted text-sm mb-3">Your page count affects:</p>
          <ul className="space-y-1.5">
            {[
              "Print cost — more pages = higher cost per unit",
              "Royalty per sale — print cost reduces your margin",
              "Spine width — drives your cover template dimensions",
              "Final book price — thinner books are harder to price high",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-m2p-muted">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-m2p-orange flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-m2p-muted mb-5 text-center">
          Estimate only. Actual page count depends on layout, headings, and images. No data sent to the server.
        </p>

        {/* Related tools */}
        <div className="mt-5 text-center">
          <p className="text-xs text-m2p-muted font-semibold mb-2 uppercase tracking-wide">
            Related free tools
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/royalty-calculator"
              className="inline-flex items-center rounded-full bg-[#2D6A2D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A3A2A] transition-colors"
            >
              Royalty Calculator →
            </Link>
            <Link
              href="/cover-calculator"
              className="inline-flex items-center rounded-full bg-[#2D6A2D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A3A2A] transition-colors"
            >
              Cover Size Calculator →
            </Link>
            <Link
              href="/spine-calculator"
              className="inline-flex items-center rounded-full bg-[#2D6A2D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A3A2A] transition-colors"
            >
              Spine Width Calculator →
            </Link>
          </div>
        </div>

        {/* Conversion bridge — fires after first interaction */}
        {hasInteracted && <KdpConversionBridge />}

      </div>
    </ToolPageShell>
  );
}
