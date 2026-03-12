"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import FreeToolCta from "@/components/FreeToolCta";
import { KDP_TRIM_SIZES, estimatePageCount, KDP_PAGE_LIMITS, type TrimSizeId } from "@/lib/kdpSpecs";

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
        <div className="flex items-center gap-2 mb-6">
          <Image src="/MANNY AVATAR.png" alt="Manny" width={28} height={28} style={{ borderRadius: "50%" }} />
          <span><span style={{ color: "#F05A28", fontWeight: "bold" }}>manu</span><span style={{ color: "#4cd964", fontWeight: "bold" }}>2print</span></span>
        </div>
        <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide text-brand-cream mb-2">
          Page Count Estimator
        </h1>
        <p className="font-sans text-brand-muted mb-8">
          Estimate interior page count from word count and trim size. Uses KDP-style words-per-page. Client-side only.
        </p>

        <div className="rounded-xl border border-brand-cardHover bg-brand-card p-6 mb-8">
          <div className="space-y-5">
            <div>
              <label className="block font-sans text-sm font-medium text-brand-cream mb-2">Word count</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="50000"
                value={wordCountInput}
                onChange={(e) => setWordCountInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full rounded-lg border border-brand-cardHover px-4 py-2.5 bg-m2p-ivory font-sans text-sm text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
              <p className="font-sans text-xs text-brand-muted mt-1">Numbers only, max {MAX_WORDS.toLocaleString()} words.</p>
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-brand-cream mb-2">Trim size</label>
              <select
                value={safeTrimId}
                onChange={(e) => setTrimId(e.target.value as TrimSizeId)}
                className="w-full rounded-lg border border-brand-cardHover px-4 py-2.5 bg-m2p-ivory font-sans text-sm text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold"
              >
                {KDP_TRIM_SIZES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-brand-cream mb-2">Font size (affects words per page)</label>
              <div className="flex gap-4">
                {FONT_OPTIONS.map((f) => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="fontSize"
                      value={f}
                      checked={fontSize === f}
                      onChange={() => setFontSize(f)}
                      className="text-brand-gold focus:ring-brand-gold"
                    />
                    <span className="font-sans text-sm text-brand-cream">{f}pt</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-brand-gold border border-brand-cardHover bg-brand-card p-6">
          <h2 className="font-bebas text-xl tracking-wide text-brand-cream mb-4">Result</h2>
          <p className="font-sans text-brand-muted">
            Estimated interior pages: <span className="text-brand-gold font-bold text-lg">{estimatedPages}</span>
            {estimatedPages >= KDP_PAGE_LIMITS.minPages && estimatedPages <= KDP_PAGE_LIMITS.maxPages && (
              <span className="block mt-1 text-xs">Within KDP range ({KDP_PAGE_LIMITS.minPages}–{KDP_PAGE_LIMITS.maxPages} pages).</span>
            )}
          </p>
        </div>

        <p className="mt-6 font-sans text-xs text-brand-muted">
          Estimate only. Actual page count depends on layout, headings, and images. No data sent to the server.
        </p>

        <FreeToolCta
          description="Format your manuscript for KDP print. Trim size, bleed, print-ready PDF."
          href="/kdp-formatter"
          buttonText="Try KDP Formatter"
        />
        <p className="text-center text-m2p-muted text-xs mt-8">© manu2print.com — Built for indie authors</p>
      </main>
    </div>
  );
}
