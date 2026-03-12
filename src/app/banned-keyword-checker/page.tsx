"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { checkBannedKeywords } from "@/lib/kdpBannedKeywords";
import FreeToolCta from "@/components/FreeToolCta";

export default function BannedKeywordCheckerPage() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [results, setResults] = useState<{ phrase: string; field: "title" | "subtitle" | "description" }[] | null>(null);

  const handleCheck = useCallback(() => {
    const matches = checkBannedKeywords(title, subtitle, description);
    setResults(matches);
  }, [title, subtitle, description]);

  const fieldLabel = (f: "title" | "subtitle" | "description") =>
    f === "title" ? "Title" : f === "subtitle" ? "Subtitle" : "Description";

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
        <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide text-brand-cream mb-2">
          Banned keyword checker
        </h1>
        <p className="font-sans text-brand-muted mb-8">
          Paste your title, subtitle, or description to spot words and phrases that often trigger KDP listing issues. Not a complete list — Amazon doesn’t publish one. Use as a quick sanity check.
        </p>

        <div className="rounded-xl border border-brand-cardHover bg-brand-card p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block font-sans text-sm font-medium text-brand-cream mb-1.5">Title</label>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Your book title"
                rows={2}
                className="w-full rounded-lg border border-brand-cardHover px-4 py-2.5 bg-m2p-ivory font-sans text-sm text-brand-cream placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-gold resize-y"
              />
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-brand-cream mb-1.5">Subtitle (optional)</label>
              <textarea
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Subtitle"
                rows={2}
                className="w-full rounded-lg border border-brand-cardHover px-4 py-2.5 bg-m2p-ivory font-sans text-sm text-brand-cream placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-gold resize-y"
              />
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-brand-cream mb-1.5">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Book description"
                rows={5}
                className="w-full rounded-lg border border-brand-cardHover px-4 py-2.5 bg-m2p-ivory font-sans text-sm text-brand-cream placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-gold resize-y"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleCheck}
            className="mt-4 rounded-lg bg-brand-gold px-5 py-2.5 text-sm font-semibold text-brand-bg hover:opacity-90"
          >
            Check for risky terms
          </button>
        </div>

        {results !== null && (
          <div className={`rounded-xl border-l-4 p-6 mb-8 ${results.length > 0 ? "border-amber-500 bg-amber-500/10" : "border-brand-gold border border-brand-cardHover bg-brand-card"}`}>
            <h2 className="font-bebas text-xl tracking-wide text-brand-cream mb-3">Results</h2>
            {results.length === 0 ? (
              <p className="font-sans text-sm text-brand-muted">
                No risky terms found from our list. This doesn’t guarantee approval — always follow KDP content guidelines.
              </p>
            ) : (
              <ul className="font-sans text-sm space-y-1.5">
                {results.map((r, i) => (
                  <li key={`${r.phrase}-${r.field}-${i}`} className="text-brand-cream">
                    <span className="text-amber-400 font-medium">&quot;{r.phrase}&quot;</span>
                    <span className="text-brand-muted"> in {fieldLabel(r.field)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className="font-sans text-xs text-brand-muted mb-6">
          We check against a curated list of terms that often cause issues. Amazon’s full rules are in KDP Help. No data is sent to our server.
        </p>

        <FreeToolCta
          description="Format your manuscript for KDP print. Trim size, bleed, print-ready PDF."
          href="/kdp-formatter"
          buttonText="Try KDP Formatter"
        />
      </main>
    </div>
  );
}
