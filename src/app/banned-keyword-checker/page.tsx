"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { checkBannedKeywords } from "@/lib/kdpBannedKeywords";
import ToolPageShell from "@/components/ToolPageShell";
import KdpConversionBridge from "@/components/KdpConversionBridge";

export default function BannedKeywordCheckerPage() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [results, setResults] = useState<{ phrase: string; field: "title" | "subtitle" | "description" }[] | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  const handleCheck = useCallback(() => {
    const matches = checkBannedKeywords(title, subtitle, description);
    setResults(matches);
    setHasChecked(true);
  }, [title, subtitle, description]);

  const fieldLabel = (f: "title" | "subtitle" | "description") =>
    f === "title" ? "Title" : f === "subtitle" ? "Subtitle" : "Description";

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
          Paste your title, subtitle, or description to flag words and phrases
          that often cause KDP listing issues.
        </p>
        <p className="text-m2p-muted text-sm mt-2 mb-5 leading-relaxed text-center">
          This is a quick metadata sanity check — not a complete list.
          Amazon doesn&apos;t publish one.
        </p>

        {/* Trust / context block */}
        <div className="rounded-xl bg-white border border-m2p-border px-5 py-4 mb-5 text-sm text-m2p-muted leading-relaxed">
          <p className="font-semibold text-m2p-ink mb-2">We check for common metadata risks such as:</p>
          <ul className="space-y-1">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-m2p-orange flex-shrink-0" />
              Repeated or generic keywords stuffed into titles
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-m2p-orange flex-shrink-0" />
              Promotional language (e.g. "free," "bestselling," "sale")
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-m2p-orange flex-shrink-0" />
              Misleading claims or unauthorized references to other titles or authors
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-m2p-orange flex-shrink-0" />
              Terms that often conflict with KDP metadata guidelines
            </li>
          </ul>
        </div>

        {/* Input card */}
        <div className="rounded-xl border-2 bg-white p-6 mb-5" style={{ borderColor: "#2D6A2D" }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-1.5">Title</label>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Your book title"
                rows={2}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink placeholder:text-m2p-muted focus:outline-none focus:ring-2 focus:ring-m2p-orange resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-1.5">Subtitle <span className="font-normal text-m2p-muted">(optional)</span></label>
              <textarea
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Subtitle"
                rows={2}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink placeholder:text-m2p-muted focus:outline-none focus:ring-2 focus:ring-m2p-orange resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-1.5">Description <span className="font-normal text-m2p-muted">(optional)</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Book description"
                rows={5}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink placeholder:text-m2p-muted focus:outline-none focus:ring-2 focus:ring-m2p-orange resize-y"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleCheck}
            className="mt-4 rounded-lg bg-m2p-orange px-5 py-2.5 text-sm font-semibold text-white hover:bg-m2p-orange-hover transition-colors"
          >
            Check for metadata risks
          </button>
        </div>

        {/* Results */}
        {results !== null && (
          <div className={`rounded-xl border-l-4 p-6 mb-5 ${
            results.length > 0
              ? "border-amber-500 bg-amber-50 border border-amber-200"
              : "border-l-4 border-m2p-orange border border-m2p-border bg-white"
          }`}>
            <h2 className="font-bebas text-xl tracking-wide text-m2p-ink mb-3">Results</h2>
            {results.length === 0 ? (
              <p className="text-sm text-m2p-muted">
                No common metadata risks found from our list. This doesn&apos;t guarantee approval — always follow{" "}
                <a
                  href="https://kdp.amazon.com/en_US/help/topic/G200820990"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-m2p-orange hover:underline"
                >
                  KDP content guidelines
                </a>
                .
              </p>
            ) : (
              <>
                <p className="text-sm text-m2p-muted mb-3">
                  {results.length} possible metadata risk{results.length > 1 ? "s" : ""} found. Review before publishing.
                </p>
                <ul className="text-sm space-y-2">
                  {results.map((r, i) => (
                    <li key={`${r.phrase}-${r.field}-${i}`} className="flex items-start gap-2">
                      <span className="mt-0.5 text-amber-500 flex-shrink-0">⚠</span>
                      <span>
                        <span className="font-medium text-m2p-ink">&quot;{r.phrase}&quot;</span>
                        <span className="text-m2p-muted"> in {fieldLabel(r.field)}</span>
                        <span className="block text-xs text-amber-700 mt-0.5">
                          Possible metadata risk — may conflict with KDP metadata guidelines. Review before publishing.
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <p className="text-xs text-m2p-muted mb-5">
          We check against a curated list of terms that often cause metadata issues on KDP.
          Amazon&apos;s full guidelines are in{" "}
          <a
            href="https://kdp.amazon.com/en_US/help/topic/G200820990"
            target="_blank"
            rel="noopener noreferrer"
            className="text-m2p-orange hover:underline"
          >
            KDP Help
          </a>
          . No data is sent to our server.
        </p>

        {/* Related tools */}
        <div className="mt-5">
          <p className="text-xs text-m2p-muted font-semibold mb-2 uppercase tracking-wide">
            Related free tools
          </p>
          <div className="flex flex-wrap gap-2">
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

        {/* Conversion bridge — fires after check */}
        {hasChecked && <KdpConversionBridge />}
      </div>
    </ToolPageShell>
  );
}
