"use client";

import { useState, useMemo } from "react";
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

  return (
    <ToolPageShell>
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide text-m2p-ink mb-2 text-center">
          KDP Page Count Estimator — Estimate Pages Before Formatting
        </h1>
        <p className="text-m2p-muted mb-3 text-center">
          Estimate interior page count from word count and trim size. Uses KDP-style words-per-page. Client-side only.
        </p>
        <p className="text-m2p-muted text-sm mt-2 mb-5 leading-relaxed text-center">
          Estimated page count helps with planning and cost calculation.
          It does not reflect your final PDF layout or KDP validation.
        </p>

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

        <div className="rounded-xl border-l-4 border-m2p-orange border border-m2p-border bg-white p-6 mb-5">
          <h2 className="font-bebas text-xl tracking-wide text-m2p-ink mb-4">Result</h2>
          <p className="text-m2p-muted">
            Estimated interior pages:{" "}
            <span className="text-m2p-orange font-bold text-lg">{estimatedPages}</span>
            {estimatedPages >= KDP_PAGE_LIMITS.minPages && estimatedPages <= KDP_PAGE_LIMITS.maxPages && (
              <span className="block mt-1 text-xs">Within KDP range ({KDP_PAGE_LIMITS.minPages}–{KDP_PAGE_LIMITS.maxPages} pages).</span>
            )}
          </p>
        </div>

        <p className="text-xs text-m2p-muted mb-2">
          Estimate only. Actual page count depends on layout, headings, and images. No data sent to the server.
        </p>

        {hasInteracted && <KdpConversionBridge />}
      </div>
    </ToolPageShell>
  );
}
