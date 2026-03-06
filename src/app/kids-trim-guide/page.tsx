"use client";

import Link from "next/link";
import FreeToolCta from "@/components/FreeToolCta";

export default function KidsTrimGuidePage() {
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
          Kids book trim guide
        </h1>
        <p className="font-sans text-brand-muted mb-8">
          Quick reference for KDP children’s book trim sizes and page counts. Always confirm current minimums in KDP’s formatting help.
        </p>

        <div className="space-y-8">
          <section className="rounded-xl border border-brand-cardHover bg-brand-card p-6">
            <h2 className="font-bebas text-xl tracking-wide text-brand-cream mb-3">Picture books</h2>
            <p className="font-sans text-sm text-brand-muted mb-3">
              Typically ages 0–6. Square or near-square formats work well for spreads.
            </p>
            <ul className="font-sans text-sm text-brand-cream space-y-1.5 list-disc list-inside">
              <li><strong className="text-brand-gold">8.5&quot; × 8.5&quot;</strong> — Most popular; easy to hold, good for full-bleed art.</li>
              <li><strong className="text-brand-gold">8.5&quot; × 11&quot;</strong> — Portrait; more room per page.</li>
              <li><strong className="text-brand-gold">8.25&quot; × 8.25&quot;</strong> — Slightly smaller square; can reduce print cost.</li>
              <li>Page count: usually <strong>24–32+</strong> pages (KDP minimums vary by paper/ink; check KDP help).</li>
            </ul>
          </section>

          <section className="rounded-xl border border-brand-cardHover bg-brand-card p-6">
            <h2 className="font-bebas text-xl tracking-wide text-brand-cream mb-3">Early readers & chapter books</h2>
            <p className="font-sans text-sm text-brand-muted mb-3">
              More text; standard trade sizes are common.
            </p>
            <ul className="font-sans text-sm text-brand-cream space-y-1.5 list-disc list-inside">
              <li><strong className="text-brand-gold">6&quot; × 9&quot;</strong> — Standard trade; good for early readers and chapter books.</li>
              <li><strong className="text-brand-gold">5.5&quot; × 8.5&quot;</strong> — Slightly smaller trade.</li>
              <li>Page count: KDP minimum applies (e.g. 24+ for many options); length depends on your content.</li>
            </ul>
          </section>

          <section className="rounded-xl border border-brand-cardHover bg-brand-card p-6">
            <h2 className="font-bebas text-xl tracking-wide text-brand-cream mb-3">Bleed & safe zone</h2>
            <p className="font-sans text-sm text-brand-muted">
              For full-bleed illustrations: add <strong className="text-brand-cream">0.125&quot;</strong> bleed on all sides. Keep text and important art inside a safe zone (e.g. 0.25&quot; in from trim) so nothing is cut off. Use our{" "}
              <Link href="/cover-calculator" className="text-brand-gold hover:underline">full-wrap cover calculator</Link> and{" "}
              <Link href="/spine-calculator" className="text-brand-gold hover:underline">spine calculator</Link> for exact dimensions.
            </p>
          </section>
        </div>

        <p className="mt-8 font-sans text-xs text-brand-muted mb-6">
          This is a reference only. KDP’s current trim options and minimum page counts are in Amazon KDP Help.
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
