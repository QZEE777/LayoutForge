import type { ReactNode } from "react";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import TargetGraphic from "@/components/TargetGraphic";
import ToolBadge from "@/components/ToolBadge";
import DocxVoteCard from "@/components/DocxVoteCard";
import FAQAccordion from "@/components/FAQAccordion";

export const metadata = {
  title: "KDP Manuscript Formatter Online — manu2print | Format in Minutes",
  description:
    "Upload your PDF, get a KDP compliance report and print-ready fix. Scan for margin, page size, and formatting errors. No install. No Mac. Built by a self-published author.",
  keywords:
    "KDP formatter online, Amazon KDP PDF formatter, KDP compliance check, format PDF for KDP, Vellum alternative Windows, Atticus alternative, self publishing book formatting tool",
  openGraph: {
    title: "manu2print — KDP PDF Formatter",
    description: "Your PDF. KDP-ready in minutes. Browser-based. No install.",
    url: "https://www.manu2print.com",
    type: "website",
  },
};

const faqItems = [
  {
    question: "Do I need to create an account to use manu2print?",
    answer:
      "No account is needed to run a free compliance scan and see your full report. To download your corrected, print-ready PDF you will need to sign up — it takes 30 seconds with Google or your email.",
  },
  {
    question: "Will manu2print change my book's fonts or layout?",
    answer:
      "Never. We make surgical corrections only — fixing what KDP requires (margins, page size, chapter breaks) while leaving your fonts, styles, spacing, and creative choices completely intact. Your book stays your book.",
  },
  {
    question: "What is the difference between a Compliance Scan and the KDP Formatter?",
    answer:
      "The free Compliance Scan tells you what is wrong. The KDP Formatter fixes it automatically and delivers a print-ready PDF. Think of the scan as a diagnosis — the formatter is the fix.",
  },
  {
    question: "Does this work on Windows, PC, and Chromebook?",
    answer:
      "Yes. manu2print runs entirely in your browser. Nothing to install. Works on Windows, Mac, Linux, Chromebook — any device with a modern browser.",
  },
  {
    question: "How is this different from Vellum or Atticus?",
    answer:
      "Vellum ($249, Mac only) and Atticus ($147) are full book design suites that rebuild your book inside their own templates. manu2print is a precision KDP compliance tool — we fix your existing PDF without rebuilding it, at a fraction of the cost, from any browser.",
  },
  {
    question: "Is my file safe?",
    answer:
      "Your file is processed securely and deleted after formatting. We never store your PDF permanently.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* SECTION 1 — NAVBAR */}
      <SiteNav />

      {/* SECTION 2 — HERO — constrained so nav + hero fit in one viewport (above the fold) */}
      <section className="bg-m2p-ivory py-4 max-h-[calc(100vh-3.5rem)] min-h-0 flex flex-col">
        {/* Full-width eyebrow bar below navbar */}
        <div className="w-full flex-shrink-0 bg-m2p-orange-soft border-b border-m2p-orange/20 py-1.5 text-center">
          <span className="text-m2p-orange text-[11px] font-semibold uppercase tracking-widest" >
            ⚡ Built for Amazon KDP Authors — Browser-Based, No Install Required
          </span>
        </div>
        <div className="max-w-6xl mx-auto px-6 w-full flex-1 min-h-0 flex flex-col justify-center">
          <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
            {/* LEFT COLUMN — vertically centered with PDF graphic; less gap between headline lines */}
            <div className="flex-[1.1] w-full lg:w-auto order-2 lg:order-1 text-center">
              <h1 className="font-bebas text-m2p-ink leading-none tracking-wide mt-0 mb-2 text-center text-[clamp(2.25rem,4.8vw,4.25rem)]">
                KDP KILLED YOUR PDF?
                <br />
                <span className="text-m2p-orange">WE FIX IT</span>
              </h1>
              <p className="text-base text-m2p-muted max-w-xl mx-auto mt-0 mb-4 leading-snug text-center lg:text-left" >
                Your PDF gets rejected by KDP because of margin violations, incorrect page size, and formatting errors Amazon won&apos;t explain clearly. Upload your PDF. We scan it, show you exactly what&apos;s wrong, and fix it — so you can publish without the guesswork.
              </p>
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start mt-0 items-center text-center lg:text-left">
                <Link
                  href="/kdp-pdf-checker"
                  className="bg-m2p-orange hover:bg-m2p-orange-hover text-white font-bold text-sm px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(240,90,40,0.35)] hover:-translate-y-0.5 transition-all uppercase tracking-wide"
                >
                  📄 Check My PDF — See What&apos;s Wrong
                </Link>
                <a
                  href="#how-it-works"
                  className="bg-m2p-live hover:bg-m2p-live-hover text-white font-bold text-sm px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(76,217,100,0.4)] hover:-translate-y-0.5 transition-all uppercase tracking-wide"
                >
                  See How It Works ↓
                </a>
              </div>
            </div>
            {/* RIGHT COLUMN — graphic only; caption moved inside graphic */}
            <div className="flex-[0.9] flex flex-col items-center w-full lg:w-auto order-1 lg:order-2">
              <div className="max-w-lg mx-auto w-full flex flex-col items-center">
                <TargetGraphic size={380} />
              </div>
            </div>
          </div>
        </div>
        {/* Trust row — faded green box */}
        <div className="max-w-6xl mx-auto px-6 mt-4 flex-shrink-0">
          <div className="rounded-xl bg-m2p-live/10 border border-m2p-live/25 px-4 py-2.5 flex flex-wrap gap-x-4 gap-y-1 justify-center text-xs text-m2p-ink/90 shadow-sm" >
            <span>✓ Free compliance scan — no credit card</span>
            <span>✓ See every KDP error before you pay</span>
            <span>✓ Download the fixed PDF to publish</span>
            <span>✓ Built by a published KDP author</span>
          </div>
        </div>
      </section>

      {/* SECTION 3 — PAIN POINT */}
      <section className="bg-m2p-ivory py-24 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            THE REAL PROBLEM
          </p>
          <h2 className="font-bebas text-m2p-ink leading-tight mb-6 text-[clamp(2rem,4vw,3rem)]">
            KDP FORMATTING IS BROKEN. WE FIXED IT.
          </h2>
          <p className="text-lg text-m2p-ink max-w-2xl mx-auto mb-12" >
            Every self-published author knows the frustration. You finish writing your book — the hard part — and then spend days wrestling with Word margins, page size errors, widow lines, and chapter break chaos. You upload to KDP and it gets rejected. Again. Vellum costs $249 and only runs on a Mac. Atticus costs $147 and ships with bugs. Reedsy is free but won&apos;t handle KDP print compliance. None of them tell you exactly what&apos;s wrong and fix it automatically. We do.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: "😤", title: "Hours Lost to Margin Hell", body: "KDP's margin requirements differ by trim size and page count. One wrong setting = rejection. Most authors spend 3–8 hours on formatting alone." },
              { icon: "💸", title: "Expensive Tools, Wrong Jobs", body: "Vellum and Atticus are book design suites. You don't need a suite. You need your existing PDF made KDP-compliant — fast, on any device." },
              { icon: "🔄", title: "Upload. Reject. Repeat.", body: "KDP's own formatter is limited. Rejection messages are vague. Authors guess, re-upload, and waste days before publishing. That ends here." },
            ].map((card, i) => (
              <div key={i} className="bg-white border border-m2p-border rounded-2xl p-7 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 border-m2p-border/90 transition-all">
                <div className="text-4xl mb-3">{card.icon}</div>
                <h3 className="font-bebas text-m2p-ink mb-2 text-[22px]" >{card.title}</h3>
                <p className="text-sm text-m2p-muted" >{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section id="how-it-works" className="bg-m2p-ivory py-24 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            THE PROCESS
          </p>
          <h2 className="font-bebas text-m2p-ink leading-tight text-[clamp(2rem,4vw,3rem)]">
            THREE STEPS. ZERO CONFUSION.
          </h2>
          <div className="grid grid-cols-1 grid-rows-3 gap-4 max-w-2xl mx-auto mt-12 min-h-[420px]">
            {[
              { num: "01", title: "UPLOAD YOUR PDF", body: "Drag and drop your PDF. Any browser, any operating system. No account required for a free scan." },
              { num: "02", title: "WE SCAN & FIX", body: "Our engine checks every KDP compliance rule: page size, margins, chapter breaks, widow/orphan control, and double-spacing. Issues found are listed. Issues fixable are fixed automatically." },
              { num: "03", title: "DOWNLOAD & PUBLISH", body: "Get a print-ready KDP-compliant PDF with a compliance report page prepended. Upload directly to KDP. Done." },
            ].map((step, i) => (
              <div key={i} className="min-h-0 flex flex-col justify-center text-center bg-white/70 border border-m2p-border/80 rounded-2xl px-6 py-5 shadow-sm">
                <div className="font-bebas text-5xl text-m2p-orange leading-none mb-2" >{step.num}</div>
                <h3 className="font-bebas text-xl text-m2p-ink mb-1.5" >{step.title}</h3>
                <p className="text-sm text-m2p-muted" >{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — TOOL SUITE */}
      <section id="tools" className="bg-m2p-ivory py-24 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            OUR TOOLS
          </p>
          <h2 className="font-bebas text-m2p-ink leading-tight text-[clamp(2rem,4vw,3rem)]">
            EVERYTHING AN INDIE AUTHOR NEEDS. NOTHING THEY DON&apos;T.
          </h2>
          <p className="text-base text-m2p-muted max-w-lg mx-auto mt-3 mb-12" >
            PDF tools first — browser-based, built for KDP. More formats and tools coming soon.
          </p>
          {/* PAID TOOLS — top row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto mb-12">
            <div className="bg-white border border-m2p-border rounded-2xl p-7 text-center relative shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="absolute top-4 right-4 flex gap-2">
                <ToolBadge status="free" />
                <ToolBadge status="live" />
              </div>
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-bebas text-xl text-m2p-ink mb-2" >Print Ready Check</h3>
              <p className="text-sm text-m2p-muted" >Upload your PDF and get a full KDP compliance report. Margins, page size, bleed, widow lines — flagged instantly. Free scan, no signup.</p>
              <Link href="/kdp-pdf-checker" className="text-m2p-orange font-semibold text-sm mt-4 inline-block" >→ Check My PDF</Link>
            </div>
            <div className="bg-white border border-m2p-border rounded-2xl p-7 text-center relative shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="absolute top-4 right-4"><ToolBadge status="coming-soon" /></div>
              <div className="text-4xl mb-3">📄</div>
              <h3 className="font-bebas text-xl text-m2p-ink mb-2" >KDP PDF Formatter</h3>
              <p className="text-sm text-m2p-muted" >The full fix. Upload your PDF, we flag issues and deliver a print-ready PDF. Works on any trim size. Pay only to download.</p>
              <Link href="/kdp-formatter-pdf" className="text-m2p-orange font-semibold text-sm mt-4 inline-block" >→ Format My PDF</Link>
            </div>
          </div>

          {/* FREE TOOLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto mb-12">
            <div className="bg-white border border-m2p-border rounded-2xl p-7 text-center relative shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="absolute top-4 right-4"><ToolBadge status="free" /></div>
              <div className="text-4xl mb-3">🗜️</div>
              <h3 className="font-bebas text-xl text-m2p-ink mb-2" >PDF Compressor</h3>
              <p className="text-sm text-m2p-muted" >Shrink PDFs in your browser. No upload to our servers — runs locally. Free, no account required.</p>
              <Link href="/pdf-compress" className="text-m2p-orange font-semibold text-sm mt-4 inline-block" >→ Compress PDF</Link>
            </div>
            <div className="bg-white border border-m2p-border rounded-2xl p-7 text-center relative shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="absolute top-4 right-4"><ToolBadge status="free" /></div>
              <div className="text-4xl mb-3">📐</div>
              <h3 className="font-bebas text-xl text-m2p-ink mb-2" >Spine Width Calculator</h3>
              <p className="text-sm text-m2p-muted" >Spine width and full-wrap cover dimensions for KDP paperbacks. Essential for cover design.</p>
              <Link href="/spine-calculator" className="text-m2p-orange font-semibold text-sm mt-4 inline-block" >→ Calculate Spine</Link>
            </div>
            <div className="bg-white border border-m2p-border rounded-2xl p-7 text-center relative shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="absolute top-4 right-4"><ToolBadge status="free" /></div>
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="font-bebas text-xl text-m2p-ink mb-2" >Cover Size Calculator</h3>
              <p className="text-sm text-m2p-muted" >Full-wrap cover dimensions in inches and 300 DPI pixels for Canva and other design tools.</p>
              <Link href="/cover-calculator" className="text-m2p-orange font-semibold text-sm mt-4 inline-block" >→ Cover Dimensions</Link>
            </div>
            <div className="bg-white border border-m2p-border rounded-2xl p-7 text-center relative shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="absolute top-4 right-4"><ToolBadge status="free" /></div>
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-bebas text-xl text-m2p-ink mb-2" >Royalty Calculator</h3>
              <p className="text-sm text-m2p-muted" >Page count, trim size, and price → KDP print cost, royalty per sale, and breakeven.</p>
              <Link href="/royalty-calculator" className="text-m2p-orange font-semibold text-sm mt-4 inline-block" >→ Royalty Calculator</Link>
            </div>
            <div className="bg-white border border-m2p-border rounded-2xl p-7 text-center relative shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="absolute top-4 right-4"><ToolBadge status="free" /></div>
              <div className="text-4xl mb-3">🚫</div>
              <h3 className="font-bebas text-xl text-m2p-ink mb-2" >Banned Keyword Checker</h3>
              <p className="text-sm text-m2p-muted" >Spot risky words in title, subtitle, or description before publishing on KDP.</p>
              <Link href="/banned-keyword-checker" className="text-m2p-orange font-semibold text-sm mt-4 inline-block" >→ Check Keywords</Link>
            </div>
            <div className="bg-white border border-m2p-border rounded-2xl p-7 text-center relative shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="absolute top-4 right-4"><ToolBadge status="free" /></div>
              <div className="text-4xl mb-3">📄</div>
              <h3 className="font-bebas text-xl text-m2p-ink mb-2" >Page Count Estimator</h3>
              <p className="text-sm text-m2p-muted" >Estimate interior pages from word count and trim size.</p>
              <Link href="/page-count-estimator" className="text-m2p-orange font-semibold text-sm mt-4 inline-block" >→ Estimate Pages</Link>
            </div>
            <div className="bg-white border border-m2p-border rounded-2xl p-7 text-center relative shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="absolute top-4 right-4"><ToolBadge status="free" /></div>
              <div className="text-4xl mb-3">📐</div>
              <h3 className="font-bebas text-xl text-m2p-ink mb-2" >Trim Size Comparison</h3>
              <p className="text-sm text-m2p-muted" >Compare print cost and royalty across trim sizes.</p>
              <Link href="/trim-size-comparison" className="text-m2p-orange font-semibold text-sm mt-4 inline-block" >→ Compare Trims</Link>
            </div>
            <div className="bg-white border border-m2p-border rounded-2xl p-7 text-center relative shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="absolute top-4 right-4"><ToolBadge status="free" /></div>
              <div className="text-4xl mb-3">📋</div>
              <h3 className="font-bebas text-xl text-m2p-ink mb-2" >Interior Template</h3>
              <p className="text-sm text-m2p-muted" >Download a PDF with your book&apos;s exact trim and safe zone for Canva.</p>
              <Link href="/interior-template" className="text-m2p-orange font-semibold text-sm mt-4 inline-block" >→ Get Template</Link>
            </div>
          </div>

          {/* COMING SOON / VOTE */}
          <p className="text-m2p-orange mb-4 uppercase tracking-[0.1em] text-sm" >
            Coming soon
          </p>
          <div className="max-w-md mx-auto">
            <DocxVoteCard variant="homepage" />
          </div>
        </div>
      </section>

      {/* SECTION 6 — COMPETITIVE COMPARISON */}
      <section className="bg-m2p-ivory py-24 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            WHY MANU2PRINT
          </p>
          <h2 className="font-bebas text-m2p-ink leading-tight text-[clamp(2rem,4vw,3rem)]">
            THE TOOL THEY COULDN&apos;T BUILD. BECAUSE THEY WEREN&apos;T AUTHORS.
          </h2>
          <p className="text-base text-m2p-muted max-w-xl mx-auto mt-3 mb-12" >
            Vellum and Atticus are excellent writing tools. They are not KDP compliance specialists. We are. Here&apos;s the difference that matters.
          </p>
          <div className="max-w-3xl mx-auto overflow-x-auto rounded-2xl overflow-hidden shadow-md border border-m2p-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-m2p-ink text-white" >
                  <th className="px-4 py-3 text-left tracking-wide">FEATURE</th>
                  <th className="px-4 py-3 text-center tracking-wide text-m2p-orange border-l-2 border-r-2 border-m2p-orange">MANU2PRINT</th>
                  <th className="px-4 py-3 text-center tracking-wide">VELLUM $249</th>
                  <th className="px-4 py-3 text-center tracking-wide">ATTICUS $147</th>
                  <th className="px-4 py-3 text-center tracking-wide">REEDSY FREE</th>
                </tr>
              </thead>
              <tbody >
                {[
                  ["Browser-based (no install)", "✅", "❌", "⚠️ Partial", "✅"],
                  ["Works on Windows / PC", "✅", "❌ Mac only", "✅", "✅"],
                  ["KDP-specific compliance fix", "✅ Auto", "❌ Manual", "❌ Manual", "❌ Limited"],
                  ["Compliance report page", "✅ Included", "❌", "❌", "❌"],
                  ["Keeps your original formatting", "✅ Surgical edits", "❌ Rebuilds book", "❌ Rebuilds book", "❌ Rebuilds book"],
                  ["Price", "$XXX per book", "$249 upfront", "$147 upfront", "Free (limited)"],
                  ["Built by KDP authors", "✅ 18 books published", "❌", "❌", "❌"],
                  ["Auto-fix margins & breaks", "✅", "❌", "❌", "❌"],
                ].map((row, i) => (
                  <tr key={i} className={`${i % 2 === 0 ? "bg-white" : "bg-m2p-ivory/50"} hover:bg-m2p-ivory/80 transition-colors`}>
                    <td className="px-4 py-3 text-m2p-ink">{row[0]}</td>
                    <td className="px-4 py-3 text-center font-bold text-m2p-live border-l-2 border-r-2 border-m2p-orange">{row[1]}</td>
                    <td className="px-4 py-3 text-center">{row[2] === "❌" || row[2].startsWith("❌") ? <span className="text-[#E74C3C]">{row[2]}</span> : row[2] === "⚠️ Partial" ? <span className="text-[#C8860A]">{row[2]}</span> : row[2]}</td>
                    <td className="px-4 py-3 text-center">{row[3] === "❌" || row[3].startsWith("❌") ? <span className="text-[#E74C3C]">{row[3]}</span> : row[3]}</td>
                    <td className="px-4 py-3 text-center">{row[4] === "❌" || row[4].startsWith("❌") ? <span className="text-[#E74C3C]">{row[4]}</span> : row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="max-w-2xl mx-auto mt-8 bg-m2p-orange-soft border-l-4 border-m2p-orange rounded-2xl px-6 py-5 text-left shadow-sm">
            <p className="text-sm text-m2p-ink" >
              🎯 The Key Difference: manu2print makes surgical corrections to YOUR existing PDF — preserving your fonts, layout, and formatting choices. Every other tool rebuilds your book from scratch inside their own template. Your book stays your book.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 7 — SOCIAL PROOF */}
      <section className="bg-m2p-ink py-24 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            BY THE NUMBERS
          </p>
          <h2 className="font-bebas text-white mb-12 text-[clamp(2rem,4vw,3rem)]">
            REAL AUTHORS. REAL RESULTS.
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto text-center">
            {[
              ["18", "KDP Books Published by Founder"],
              ["~3 MIN", "Average Processing Time"],
              ["100%", "Browser-Based, No Install"],
              ["$XXX", "vs $249 Vellum · $147 Atticus"],
            ].map(([num, label], i) => (
              <div key={i}>
                <div className="font-bebas text-7xl text-m2p-orange leading-none" >{num}</div>
                <p className="text-xs text-m2p-muted uppercase tracking-widest mt-2" >{label}</p>
              </div>
            ))}
          </div>
          {/* Testimonials carousel / ticker placeholder — profile pic + quote; marquee loop */}
          <p className="text-m2p-orange uppercase tracking-widest text-xs mt-16 mb-6" >What authors say</p>
          <div className="relative w-full overflow-hidden" aria-label="Testimonials carousel">
            <div className="flex animate-marquee gap-8 py-4" style={{ width: "200%" }}>
              {[1, 2].map((set) => (
                <div key={set} className="flex gap-8 flex-shrink-0 justify-center" style={{ width: "50%" }}>
                  {[1, 2, 3].map((i) => (
                    <div key={`${set}-${i}`} className="flex-shrink-0 w-[280px] sm:w-[320px] rounded-2xl bg-white/10 border border-white/25 p-6 text-left shadow-lg backdrop-blur-sm">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-m2p-orange/30 flex items-center justify-center text-white/80 text-sm"  aria-hidden>👤</div>
                        <div>
                          <p className="text-white font-medium text-sm" >Author name</p>
                          <p className="text-white/70 text-xs">KDP Publisher</p>
                        </div>
                      </div>
                      <p className="text-white/95 text-sm italic leading-relaxed" >
                        &ldquo;Finally — a formatting tool that actually understands KDP. I uploaded my PDF and had a compliant file in just a few minutes.&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 — PRICING */}
      <section className="bg-m2p-ivory py-24 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            SIMPLE PRICING
          </p>
          <h2 className="font-bebas text-m2p-ink leading-tight text-[clamp(2rem,4vw,3rem)]">
            PAY PER BOOK. NOT PER YEAR.
          </h2>
          <p className="text-base text-m2p-muted max-w-md mx-auto mt-3 mb-12" >
            No subscriptions. No monthly fees. Format one book or one hundred — you only pay when you use it.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white border border-m2p-border rounded-2xl p-8 text-center shadow-sm">
              <div className="mb-4"><ToolBadge status="free" /></div>
              <h3 className="font-bebas text-3xl text-m2p-ink mb-2" >COMPLIANCE SCAN</h3>
              <div className="font-bebas text-6xl text-m2p-ink" >$0</div>
              <p className="text-sm text-m2p-muted mt-1" >Upload free. See every KDP error instantly.</p>
              <ul className="text-sm text-m2p-ink text-left mt-6 space-y-2" >
                <li>✓ Full KDP compliance report</li>
                <li>✓ Margin &amp; page size error detection</li>
                <li>✓ Chapter break &amp; widow flag analysis</li>
                <li>✓ See exactly what KDP will reject — before you pay</li>
                <li>✓ No credit card required to scan</li>
              </ul>
              <Link href="/kdp-pdf-checker" className="block border-2 border-m2p-orange text-m2p-orange font-bold px-6 py-3 rounded-xl w-full mt-6 hover:bg-m2p-orange-soft transition-all" >Check My PDF free — See the report →</Link>
            </div>
            <div className="bg-white border-2 border-m2p-orange rounded-2xl overflow-hidden text-center relative shadow-md">
              <div className="bg-m2p-orange text-white font-bold text-xs tracking-widest uppercase py-2 text-center" >MOST POPULAR</div>
              <div className="p-8">
                <div className="mb-4"><ToolBadge status="live" /></div>
                <h3 className="font-bebas text-3xl text-m2p-ink mb-2" >KDP FORMATTER</h3>
                <div className="font-bebas text-6xl text-m2p-orange" >$XXX</div>
                <p className="text-sm text-m2p-muted mt-1" >Pay only to download your fixed, print-ready PDF</p>
                <ul className="text-sm text-m2p-ink text-left mt-6 space-y-2" >
                  <li>✓ Everything in free scan, plus:</li>
                  <li>✓ Auto-fix ALL KDP compliance issues</li>
                  <li>✓ Surgical edits — keeps your original formatting</li>
                  <li>✓ Print-ready PDF export</li>
                  <li>✓ Compliance report page prepended</li>
                  <li>✓ All KDP trim sizes supported</li>
                  <li>✓ Any OS, any browser</li>
                </ul>
                <Link href="/formatter" className="block bg-m2p-orange hover:bg-m2p-orange-hover text-white font-bold px-6 py-3 rounded-xl w-full mt-6 shadow-[0_4px_20px_rgba(240,90,40,0.35)] transition-all" >Format My Book — $XXX →</Link>
              </div>
            </div>
          </div>
          <p className="text-sm text-m2p-muted text-center mt-6" >
            🔒 Secure payment processing. Your PDF is processed and immediately deleted — never stored permanently.
          </p>
        </div>
      </section>

      {/* SECTION 9 — FAQ */}
      <section className="bg-m2p-ivory py-24 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            COMMON QUESTIONS
          </p>
          <h2 className="font-bebas text-m2p-ink leading-tight mb-12 text-[clamp(2rem,4vw,3rem)]">
            THINGS AUTHORS ASK US.
          </h2>
          <FAQAccordion items={faqItems} />
        </div>
      </section>

      {/* SECTION 10 — FINAL CTA BAND */}
      <section className="bg-m2p-orange py-20 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-bebas text-white leading-tight text-[clamp(2.5rem,5vw,4rem)]">
            YOUR NEXT BOOK DESERVES A CLEAN LAUNCH.
          </h2>
          <p className="text-lg text-white/80 max-w-lg mx-auto mt-4 mb-10" >
            Stop fighting with margins. Upload your PDF and get a KDP-compliant file in minutes — free to try, right now.
          </p>
          <Link href="/kdp-pdf-checker" className="inline-block bg-white text-m2p-orange font-bold text-lg px-10 py-4 rounded-xl hover:scale-[1.02] transition-transform shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-m2p-orange" >
            📄 Check My PDF free →
          </Link>
        </div>
      </section>

      {/* SECTION 11 — FOOTER */}
      <SiteFooter />
    </div>
  );
}
