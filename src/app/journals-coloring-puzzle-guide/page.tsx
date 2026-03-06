"use client";

import Link from "next/link";
import FreeToolCta from "@/components/FreeToolCta";

export default function JournalsColoringPuzzleGuidePage() {
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
          Journals, coloring & puzzle guide
        </h1>
        <p className="font-sans text-brand-muted mb-8">
          Quick reference for KDP trim sizes, page counts, and formatting tips for journals, workbooks, coloring books, and puzzle/activity books. Confirm current rules in KDP Help.
        </p>

        <div className="space-y-8">
          <section className="rounded-xl border border-brand-cardHover bg-brand-card p-6">
            <h2 className="font-bebas text-xl tracking-wide text-brand-cream mb-3">Journals & workbooks</h2>
            <p className="font-sans text-sm text-brand-muted mb-3">
              Lined, dotted, or blank interiors; often letter size for writing space.
            </p>
            <ul className="font-sans text-sm text-brand-cream space-y-1.5 list-disc list-inside">
              <li><strong className="text-brand-gold">8.5&quot; × 11&quot;</strong> — Most common for journals and workbooks; familiar letter size.</li>
              <li><strong className="text-brand-gold">7&quot; × 10&quot;</strong> — Good for workbooks; slightly smaller, still roomy.</li>
              <li><strong className="text-brand-gold">6&quot; × 9&quot;</strong> — Compact journal; lower print cost.</li>
              <li>Page count: KDP minimums apply (e.g. 24+ pages for many options). Typical journals run 100–200+ pages.</li>
            </ul>
          </section>

          <section className="rounded-xl border border-brand-cardHover bg-brand-card p-6">
            <h2 className="font-bebas text-xl tracking-wide text-brand-cream mb-3">Coloring books</h2>
            <p className="font-sans text-sm text-brand-muted mb-3">
              Usually full-bleed line art; color interior = higher print cost. Single-sided pages avoid bleed-through.
            </p>
            <ul className="font-sans text-sm text-brand-cream space-y-1.5 list-disc list-inside">
              <li><strong className="text-brand-gold">8.5&quot; × 8.5&quot;</strong> — Popular square format; easy to scan and print.</li>
              <li><strong className="text-brand-gold">8.5&quot; × 11&quot;</strong> — Portrait; more room per page.</li>
              <li><strong className="text-brand-gold">8&quot; × 10&quot;</strong> — Large format; good for detailed art.</li>
              <li>Use <strong className="text-brand-cream">0.125&quot; bleed</strong> if art goes to the edge. Keep important lines inside a safe zone (e.g. 0.25&quot; from trim).</li>
              <li>Images: <strong className="text-brand-cream">300 DPI</strong> for sharp print. KDP supports color interior; confirm current page-count minimums for color.</li>
            </ul>
          </section>

          <section className="rounded-xl border border-brand-cardHover bg-brand-card p-6">
            <h2 className="font-bebas text-xl tracking-wide text-brand-cream mb-3">Puzzle & activity books</h2>
            <p className="font-sans text-sm text-brand-muted mb-3">
              Word search, sudoku, mazes, etc. Often B&amp;W or limited color; same trim options as above.
            </p>
            <ul className="font-sans text-sm text-brand-cream space-y-1.5 list-disc list-inside">
              <li><strong className="text-brand-gold">8.5&quot; × 11&quot;</strong> — Plenty of space for grids and instructions.</li>
              <li><strong className="text-brand-gold">6&quot; × 9&quot;</strong> — Portable; good for travel-sized puzzles.</li>
              <li>Page count: KDP minimums apply. Many activity books are 50–150+ pages.</li>
              <li>Bleed only if you have full-bleed art; otherwise standard margins are fine.</li>
            </ul>
          </section>

          <section className="rounded-xl border border-brand-cardHover bg-brand-card p-6">
            <h2 className="font-bebas text-xl tracking-wide text-brand-cream mb-3">Use our other tools</h2>
            <p className="font-sans text-sm text-brand-muted">
              <Link href="/cover-calculator" className="text-brand-gold hover:underline">Full-wrap cover calculator</Link> and{" "}
              <Link href="/spine-calculator" className="text-brand-gold hover:underline">spine calculator</Link> for cover dimensions.{" "}
              <Link href="/interior-template" className="text-brand-gold hover:underline">KDP interior template</Link> for a PDF with trim and safe zone to design in Canva.
            </p>
          </section>
        </div>

        <p className="mt-8 font-sans text-xs text-brand-muted mb-6">
          Reference only. Check Amazon KDP Help for current trim options, minimum page counts, and color/B&amp;W rules.
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
