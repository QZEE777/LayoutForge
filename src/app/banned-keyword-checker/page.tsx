"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  checkBannedKeywords,
  CATEGORY_LABELS,
  type RiskCategory,
} from "@/lib/kdpBannedKeywords";
import ToolPageShell from "@/components/ToolPageShell";
import KdpConversionBridge from "@/components/KdpConversionBridge";

// KDP metadata character limits
const LIMITS = { title: 200, subtitle: 200, description: 4000 };

const FIELD_LABEL = {
  title: "Title",
  subtitle: "Subtitle",
  description: "Description",
} as const;

const CATEGORY_COLORS: Record<RiskCategory, { bg: string; text: string; border: string }> = {
  promotional:  { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  trademark:    { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"    },
  platform:     { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"    },
  false_claim:  { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"  },
  health_claim: { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"    },
  contact:      { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  stuffing:     { bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-200" },
};

type CheckResult = ReturnType<typeof checkBannedKeywords>[number];

function CharCounter({ current, max }: { current: number; max: number }) {
  const pct = current / max;
  const color = pct > 0.9 ? "text-red-500" : pct > 0.75 ? "text-amber-500" : "text-m2p-muted";
  return (
    <span className={`text-xs ${color} tabular-nums`}>
      {current}/{max}
    </span>
  );
}

export default function BannedKeywordCheckerPage() {
  const [title, setTitle]           = useState("");
  const [subtitle, setSubtitle]     = useState("");
  const [description, setDescription] = useState("");
  const [results, setResults]       = useState<CheckResult[] | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  const handleCheck = useCallback(() => {
    const matches = checkBannedKeywords(title, subtitle, description);
    setResults(matches);
    setHasChecked(true);
  }, [title, subtitle, description]);

  const handleClear = () => {
    setTitle(""); setSubtitle(""); setDescription("");
    setResults(null); setHasChecked(false);
  };

  // Group results by field
  const byField = results
    ? (["title", "subtitle", "description"] as const).map((f) => ({
        field: f,
        items: results.filter((r) => r.field === f),
      })).filter((g) => g.items.length > 0)
    : [];

  const highCount   = results?.filter((r) => r.level === "high").length   ?? 0;
  const mediumCount = results?.filter((r) => r.level === "medium").length ?? 0;

  return (
    <ToolPageShell>
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="font-bebas tracking-wide text-m2p-ink mb-2 text-center">
          <span className="block text-3xl sm:text-4xl">KDP Metadata Risk Checker</span>
          <span className="block text-xl sm:text-2xl text-m2p-muted mt-1">
            Spot Risky Terms Before Amazon Flags Your Listing
          </span>
        </h1>
        <p className="text-m2p-muted mb-3 text-center text-sm leading-relaxed">
          <span className="block">Paste your title, subtitle, or description to flag words and phrases</span>
          <span className="block">that commonly cause KDP listing suppression or rejection.</span>
        </p>
        <p className="text-m2p-muted text-sm mt-2 mb-5 leading-relaxed text-center">
          Checks against 110+ known risk terms across 7 categories — promotional language,
          Amazon trademarks, competitor references, false claims, health claims, contact info, and keyword stuffing.
          Amazon does not publish a complete list.
        </p>

        {/* ── Input card ── */}
        <div className="rounded-xl border-2 bg-white p-6 mb-5" style={{ borderColor: "#2D6A2D" }}>
          <div className="space-y-4">

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-m2p-ink">Title</label>
                <CharCounter current={title.length} max={LIMITS.title} />
              </div>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, LIMITS.title))}
                placeholder="Your book title"
                rows={2}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink placeholder:text-m2p-muted focus:outline-none focus:ring-2 focus:ring-m2p-orange resize-y"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-m2p-ink">
                  Subtitle <span className="font-normal text-m2p-muted">(optional)</span>
                </label>
                <CharCounter current={subtitle.length} max={LIMITS.subtitle} />
              </div>
              <textarea
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value.slice(0, LIMITS.subtitle))}
                placeholder="Subtitle"
                rows={2}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink placeholder:text-m2p-muted focus:outline-none focus:ring-2 focus:ring-m2p-orange resize-y"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-m2p-ink">
                  Description <span className="font-normal text-m2p-muted">(optional)</span>
                </label>
                <CharCounter current={description.length} max={LIMITS.description} />
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, LIMITS.description))}
                placeholder="Book description"
                rows={5}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink placeholder:text-m2p-muted focus:outline-none focus:ring-2 focus:ring-m2p-orange resize-y"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={handleCheck}
              disabled={!title && !subtitle && !description}
              className="rounded-lg bg-m2p-orange px-5 py-2.5 text-sm font-semibold text-white hover:bg-m2p-orange-hover disabled:opacity-40 transition-colors"
            >
              Check for metadata risks
            </button>
            {(title || subtitle || description) && (
              <button
                type="button"
                onClick={handleClear}
                className="text-sm text-m2p-muted hover:text-m2p-ink transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* ── Results ── */}
        {results !== null && (
          <div className={`rounded-xl border-l-4 p-6 mb-5 ${
            results.length > 0
              ? "border-amber-500 bg-amber-50 border border-amber-200"
              : "border-m2p-live border border-m2p-border bg-white"
          }`}>
            <h2 className="font-bebas text-xl tracking-wide text-m2p-ink mb-3">Results</h2>

            {results.length === 0 ? (
              <div className="flex gap-3 items-start">
                <span className="text-m2p-live text-xl leading-none mt-0.5">✓</span>
                <div>
                  <p className="text-sm font-semibold text-m2p-ink">No known risk terms found</p>
                  <p className="text-sm text-m2p-muted mt-1 leading-relaxed">
                    Your metadata looks clean against our list. This doesn&apos;t guarantee
                    approval — always review{" "}
                    <a href="https://kdp.amazon.com/en_US/help/topic/G200820990" target="_blank" rel="noopener noreferrer" className="text-m2p-orange hover:underline">
                      KDP content guidelines
                    </a>{" "}
                    before publishing.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Summary row */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="text-sm text-m2p-muted">
                    {results.length} risk{results.length > 1 ? "s" : ""} found
                  </span>
                  {highCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-0.5">
                      ● {highCount} HIGH
                    </span>
                  )}
                  {mediumCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-0.5">
                      ● {mediumCount} MEDIUM
                    </span>
                  )}
                </div>

                {/* Grouped by field */}
                <div className="space-y-5">
                  {byField.map(({ field, items }) => (
                    <div key={field}>
                      <p className="text-xs font-semibold text-m2p-muted uppercase tracking-wide mb-2">
                        {FIELD_LABEL[field]}
                      </p>
                      <ul className="space-y-2">
                        {items.map((r, i) => {
                          const colors = CATEGORY_COLORS[r.category];
                          return (
                            <li
                              key={`${r.phrase}-${r.field}-${i}`}
                              className={`rounded-lg border px-4 py-3 ${colors.bg} ${colors.border}`}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-semibold text-sm ${colors.text}`}>
                                  &quot;{r.phrase}&quot;
                                </span>
                                <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                                  r.level === "high"
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : "bg-amber-100 text-amber-700 border-amber-200"
                                }`}>
                                  {r.level}
                                </span>
                                <span className={`text-xs ${colors.text} opacity-80`}>
                                  {CATEGORY_LABELS[r.category]}
                                </span>
                              </div>
                              <p className={`text-xs mt-1.5 leading-relaxed ${colors.text} opacity-80`}>
                                {r.reason}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-m2p-muted mt-4">
                  Remove or rephrase flagged terms before publishing. Review{" "}
                  <a href="https://kdp.amazon.com/en_US/help/topic/G200820990" target="_blank" rel="noopener noreferrer" className="text-m2p-orange hover:underline">
                    KDP content guidelines
                  </a>{" "}
                  for the full policy.
                </p>
              </>
            )}
          </div>
        )}

        <p className="text-xs text-m2p-muted mb-5 text-center">
          Checks against a curated list of known risk terms. Amazon does not publish a complete list. No data sent to any server.
        </p>

        {/* ── Related tools ── */}
        <div className="mt-5 text-center">
          <p className="text-xs text-m2p-muted font-semibold mb-2 uppercase tracking-wide">
            Related free tools
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/royalty-calculator" className="inline-flex items-center rounded-full bg-[#2D6A2D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A3A2A] transition-colors">Royalty Calculator →</Link>
            <Link href="/cover-calculator" className="inline-flex items-center rounded-full bg-[#2D6A2D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A3A2A] transition-colors">Cover Size Calculator →</Link>
            <Link href="/spine-calculator" className="inline-flex items-center rounded-full bg-[#2D6A2D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A3A2A] transition-colors">Spine Width Calculator →</Link>
          </div>
        </div>

        {hasChecked && <KdpConversionBridge />}

        {/* ── CTA ── */}
        <div className="mt-6 rounded-xl bg-m2p-orange-soft border border-m2p-orange/20 p-5 text-center">
          <p className="font-bebas text-m2p-ink text-lg mb-1">
            Clean metadata. Now check the PDF.
          </p>
          <p className="text-m2p-muted text-sm mb-4 leading-relaxed">
            Metadata issues are one reason KDP rejects books. The other is your interior PDF —
            margins, fonts, trim size, and bleed can all fail independently. Check it before you upload.
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
