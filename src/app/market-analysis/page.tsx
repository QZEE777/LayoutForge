"use client";

import Link from "next/link";

export default function MarketAnalysisPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <nav className="sticky top-0 z-20 border-b border-white/5 bg-brand-bg/80 backdrop-blur-sm">
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
          <Link href="/platform/kdp" className="text-sm font-medium text-brand-cream hover:text-brand-gold transition-colors">
            Amazon KDP tools
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide text-brand-cream mb-2">
          Market Analysis
        </h1>
        <p className="font-sans text-brand-muted mb-6">
          AI analyzes competitor books to determine your key selling points and differentiation.
        </p>
        <div className="rounded-xl border border-brand-cardHover bg-brand-card p-6">
          <p className="font-sans text-brand-cream font-medium mb-4">Coming soon</p>
          <p className="font-sans text-sm text-brand-muted mb-4">
            We’re building this so you get a <strong className="text-brand-cream">BSR-based market view</strong> and clear differentiation advice.
          </p>
          <ul className="font-sans text-sm text-brand-muted space-y-2 mb-6 list-disc list-inside">
            <li><strong className="text-brand-cream">Scope:</strong> Top of your genre — e.g. top 3 subcategories, ~6 books — so the set is meaningful and comparable.</li>
            <li><strong className="text-brand-cream">Curated info:</strong> For each book we use listing data we can rely on (title, subtitle, description, category, BSR, keywords) — no scraping; APIs or curated data only.</li>
            <li><strong className="text-brand-cream">Advisory report:</strong> A short AI report per book (positioning, strengths, gaps) plus an overall market summary and “how you can stand out.”</li>
            <li><strong className="text-brand-cream">Go to Clarify:</strong> When the report is ready, a button will take you to Clarify with the analysis in context so you can ask follow-ups and refine positioning there.</li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <Link href="/platform/kdp" className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2.5 text-sm font-semibold text-brand-bg hover:opacity-90">
              Back to KDP tools
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
