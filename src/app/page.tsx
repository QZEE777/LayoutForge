import type { ReactNode } from "react";
import Link from "next/link";
import AuthNav from "@/components/AuthNav";
import TargetGraphic from "@/components/TargetGraphic";
import ToolBadge from "@/components/ToolBadge";
import FAQAccordion from "@/components/FAQAccordion";

export const metadata = {
  title: "KDP Manuscript Formatter Online — manu2print | Format in Minutes",
  description:
    "Upload your DOCX, get a KDP-compliant print-ready PDF. Auto-fix margins, page size, chapter breaks and widow control. No install. No Mac. Built by a self-published author.",
  keywords:
    "KDP formatter online, Amazon KDP manuscript formatter, KDP compliance check, format DOCX for KDP, Vellum alternative Windows, Atticus alternative, self publishing book formatting tool",
  openGraph: {
    title: "manu2print — KDP Manuscript Formatter",
    description: "Your manuscript. KDP-ready in minutes. Browser-based. No install.",
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
      "Vellum ($249, Mac only) and Atticus ($147) are full book design suites that rebuild your manuscript inside their own templates. manu2print is a precision KDP compliance tool — we fix your existing manuscript without rebuilding it, at a fraction of the cost, from any browser.",
  },
  {
    question: "Is my manuscript safe?",
    answer:
      "Your file is processed securely and deleted after formatting. We never store your manuscript permanently.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* SECTION 1 — NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-[#E0D8C4] bg-[#FAF7EE]">
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            <span className="text-2xl text-[#1A1208]">manu2print</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/platform/kdp" className="font-medium text-[#6B6151] hover:text-[#F05A28] transition-colors" style={{ fontFamily: "Inter, sans-serif" }}>
              Tools
            </Link>
            <a href="#how-it-works" className="font-medium text-[#6B6151] hover:text-[#F05A28] transition-colors" style={{ fontFamily: "Inter, sans-serif" }}>
              How It Works
            </a>
            <Link href="/pricing" className="font-medium text-[#6B6151] hover:text-[#F05A28] transition-colors" style={{ fontFamily: "Inter, sans-serif" }}>
              Pricing
            </Link>
            <Link href="/about" className="font-medium text-[#6B6151] hover:text-[#F05A28] transition-colors" style={{ fontFamily: "Inter, sans-serif" }}>
              About
            </Link>
            <Link
              href="/formatter"
              className="bg-[#F05A28] hover:bg-[#D94E20] text-white font-bold px-6 py-2.5 rounded-lg transition-colors"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Scan My PDF
            </Link>
            <AuthNav theme="light" />
          </div>
        </div>
      </nav>

      {/* SECTION 2 — HERO */}
      <section className="bg-[#FAF7EE] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* LEFT COLUMN — text content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="bg-[#FEF0EB] border border-[#F05A28]/25 text-[#F05A28] text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full inline-block mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
                ⚡ Built for Amazon KDP Authors — Browser-Based, No Install Required
              </div>
              <h1 className="text-[#1A1208] leading-tight tracking-wide mt-0 mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(3rem, 6vw, 5.5rem)" }}>
                KDP KILLED YOUR PDF.
                <br />
                <span className="text-[#F05A28]">WE FIX IT.</span>
              </h1>
              <p className="text-lg text-[#6B6151] max-w-xl mx-auto lg:mx-0 mt-0 mb-6" style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}>
                Your PDF gets rejected by KDP because of margin violations, incorrect page size, and formatting errors Amazon won&apos;t explain clearly. Upload your PDF. We scan it, show you exactly what&apos;s wrong, and fix it — so you can publish without the guesswork.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start mt-0">
                <Link
                  href="/formatter"
                  className="bg-[#F05A28] hover:bg-[#D94E20] text-white font-bold text-base px-8 py-4 rounded-xl shadow-[0_4px_20px_rgba(240,90,40,0.35)] hover:-translate-y-0.5 transition-all"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  📄 Scan My PDF Free — See What&apos;s Wrong
                </Link>
                <a
                  href="#how-it-works"
                  className="border border-[#E0D8C4] text-[#6B6151] font-medium text-base px-6 py-4 rounded-xl hover:bg-[#F5F0E3] transition-all"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  See How It Works ↓
                </a>
              </div>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start mt-4 text-sm text-[#6B6151]" style={{ fontFamily: "Inter, sans-serif" }}>
                <span>✓ Free compliance scan — no credit card</span>
                <span>✓ See every KDP error before you pay</span>
                <span>✓ Download the fixed PDF to publish</span>
                <span>✓ Built by a published KDP author</span>
              </div>
            </div>
            {/* RIGHT COLUMN — graphic */}
            <div className="flex-1 flex justify-center items-center">
              <div className="max-w-lg mx-auto">
                <TargetGraphic size={420} />
                <p className="text-xs text-[#6B6151] italic mt-3" style={{ fontFamily: "Inter, sans-serif" }}>
                  Drop your DOCX. Precision-formatted for KDP. Every time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — PAIN POINT */}
      <section className="bg-[#F5F0E3] py-24 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#F05A28] mb-2 uppercase tracking-[0.1em] text-sm" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            THE REAL PROBLEM
          </p>
          <h2 className="text-[#1A1208] leading-tight mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            KDP FORMATTING IS BROKEN. WE FIXED IT.
          </h2>
          <p className="text-lg text-[#2E2A22] max-w-2xl mx-auto mb-12" style={{ fontFamily: "Inter, sans-serif" }}>
            Every self-published author knows the frustration. You finish writing your book — the hard part — and then spend days wrestling with Word margins, page size errors, widow lines, and chapter break chaos. You upload to KDP and it gets rejected. Again. Vellum costs $249 and only runs on a Mac. Atticus costs $147 and ships with bugs. Reedsy is free but won&apos;t handle KDP print compliance. None of them tell you exactly what&apos;s wrong and fix it automatically. We do.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: "😤", title: "Hours Lost to Margin Hell", body: "KDP's margin requirements differ by trim size and page count. One wrong setting = rejection. Most authors spend 3–8 hours on formatting alone." },
              { icon: "💸", title: "Expensive Tools, Wrong Jobs", body: "Vellum and Atticus are book design suites. You don't need a suite. You need your existing manuscript made KDP-compliant — fast, on any device." },
              { icon: "🔄", title: "Upload. Reject. Repeat.", body: "KDP's own formatter is limited. Rejection messages are vague. Authors guess, re-upload, and waste days before publishing. That ends here." },
            ].map((card, i) => (
              <div key={i} className="bg-white border border-[#E0D8C4] rounded-2xl p-7 text-center hover:-translate-y-1 transition-transform">
                <div className="text-4xl mb-3">{card.icon}</div>
                <h3 className="text-[#1A1208] mb-2 text-[22px]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{card.title}</h3>
                <p className="text-sm text-[#6B6151]" style={{ fontFamily: "Inter, sans-serif" }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section id="how-it-works" className="bg-[#FAF7EE] py-24 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#F05A28] mb-2 uppercase tracking-[0.1em] text-sm" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            THE PROCESS
          </p>
          <h2 className="text-[#1A1208] leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            THREE STEPS. ZERO CONFUSION.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 max-w-4xl mx-auto mt-12 items-start">
            {[
              { num: "01", title: "UPLOAD YOUR DOCX", body: "Drag and drop your manuscript. Any version of Word. Any operating system. No account required for a free scan." },
              { num: "02", title: "WE SCAN & FIX", body: "Our engine checks every KDP compliance rule: page size, margins, chapter breaks, widow/orphan control, and double-spacing. Issues found are listed. Issues fixable are fixed automatically." },
              { num: "03", title: "DOWNLOAD & PUBLISH", body: "Get a print-ready KDP-compliant PDF with a compliance report page prepended. Upload directly to KDP. Done." },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="text-7xl text-[#F05A28] leading-none mb-3" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{step.num}</div>
                <h3 className="text-2xl text-[#1A1208] mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{step.title}</h3>
                <p className="text-sm text-[#6B6151]" style={{ fontFamily: "Inter, sans-serif" }}>{step.body}</p>
              </div>
            )).reduce<ReactNode[]>((acc, el, i) => {
              acc.push(el);
              if (i < 2) acc.push(<div key={`arrow-${i}`} className="hidden md:flex items-center justify-center text-3xl text-[#E0D8C4]" aria-hidden>→</div>);
              return acc;
            }, [])}
          </div>
        </div>
      </section>

      {/* SECTION 5 — TOOL SUITE */}
      <section className="bg-[#EDE8D8] py-24 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#F05A28] mb-2 uppercase tracking-[0.1em] text-sm" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            OUR TOOLS
          </p>
          <h2 className="text-[#1A1208] leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            EVERYTHING AN INDIE AUTHOR NEEDS. NOTHING THEY DON&apos;T.
          </h2>
          <p className="text-base text-[#6B6151] max-w-lg mx-auto mt-3 mb-12" style={{ fontFamily: "Inter, sans-serif" }}>
            A growing suite of precision publishing tools — browser-based, built for KDP.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {/* Card 1: free + live */}
            <div className="bg-white border border-[#E0D8C4] rounded-2xl p-7 text-center relative hover:-translate-y-1 transition-transform">
              <div className="absolute top-4 right-4 flex gap-2">
                <ToolBadge status="free" />
                <ToolBadge status="live" />
              </div>
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="text-xl text-[#1A1208] mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>KDP Compliance Scanner</h3>
              <p className="text-sm text-[#6B6151]" style={{ fontFamily: "Inter, sans-serif" }}>Upload your DOCX or PDF and get a full KDP compliance report. Margins, page size, widow lines — flagged instantly. Free for every manuscript.</p>
              <Link href="/formatter" className="text-[#F05A28] font-semibold text-sm mt-4 inline-block" style={{ fontFamily: "Inter, sans-serif" }}>→ Scan Now</Link>
            </div>
            {/* Card 2 */}
            <div className="bg-white border border-[#E0D8C4] rounded-2xl p-7 text-center relative hover:-translate-y-1 transition-transform">
              <div className="absolute top-4 right-4"><ToolBadge status="live" /></div>
              <div className="text-4xl mb-3">📄</div>
              <h3 className="text-xl text-[#1A1208] mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>KDP Formatter</h3>
              <p className="text-sm text-[#6B6151]" style={{ fontFamily: "Inter, sans-serif" }}>The full fix. Upload your DOCX, we auto-correct all KDP compliance issues and deliver a print-ready PDF. Works on any trim size.</p>
              <Link href="/formatter" className="text-[#F05A28] font-semibold text-sm mt-4 inline-block" style={{ fontFamily: "Inter, sans-serif" }}>→ Format My Book</Link>
            </div>
            {/* Card 3 */}
            <div className="bg-white border border-[#E0D8C4] rounded-2xl p-7 text-center relative hover:-translate-y-1 transition-transform">
              <div className="absolute top-4 right-4"><ToolBadge status="coming-soon" /></div>
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="text-xl text-[#1A1208] mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Smart Format AI</h3>
              <p className="text-sm text-[#6B6151]" style={{ fontFamily: "Inter, sans-serif" }}>AI-powered manuscript intelligence. Detects book structure, fixes inconsistencies, generates front matter, and formats your interior automatically.</p>
              <span className="text-[#7A6E5F] text-sm mt-4 inline-block" style={{ fontFamily: "Inter, sans-serif" }}>Notify Me When Live</span>
            </div>
            {/* Card 4 */}
            <div className="bg-white border border-[#E0D8C4] rounded-2xl p-7 text-center relative hover:-translate-y-1 transition-transform">
              <div className="absolute top-4 right-4"><ToolBadge status="coming-soon" /></div>
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="text-xl text-[#1A1208] mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Cover Compliance Checker</h3>
              <p className="text-sm text-[#6B6151]" style={{ fontFamily: "Inter, sans-serif" }}>Upload your cover file. We verify bleed, DPI, spine width, and color space against KDP specifications before you upload.</p>
              <span className="text-[#7A6E5F] text-sm mt-4 inline-block" style={{ fontFamily: "Inter, sans-serif" }}>Notify Me When Live</span>
            </div>
            {/* Card 5 */}
            <div className="bg-white border border-[#E0D8C4] rounded-2xl p-7 text-center relative hover:-translate-y-1 transition-transform">
              <div className="absolute top-4 right-4"><ToolBadge status="coming-soon" /></div>
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-xl text-[#1A1208] mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Royalty & Trim Calculator</h3>
              <p className="text-sm text-[#6B6151]" style={{ fontFamily: "Inter, sans-serif" }}>Enter page count, trim size, and price. Instantly see your KDP print cost, royalty per sale, and breakeven across all markets.</p>
              <span className="text-[#7A6E5F] text-sm mt-4 inline-block" style={{ fontFamily: "Inter, sans-serif" }}>Notify Me When Live</span>
            </div>
            {/* Card 6 */}
            <div className="bg-white border border-[#E0D8C4] rounded-2xl p-7 text-center relative hover:-translate-y-1 transition-transform">
              <div className="absolute top-4 right-4"><ToolBadge status="free" /></div>
              <div className="text-4xl mb-3">📚</div>
              <h3 className="text-xl text-[#1A1208] mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>KDP Margin Reference Guide</h3>
              <p className="text-sm text-[#6B6151]" style={{ fontFamily: "Inter, sans-serif" }}>A live reference table of KDP margin requirements by trim size and page count. Always updated. Bookmark it.</p>
              <Link href="#" className="text-[#F05A28] font-semibold text-sm mt-4 inline-block" style={{ fontFamily: "Inter, sans-serif" }}>→ View Guide</Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — COMPETITIVE COMPARISON */}
      <section className="bg-[#F5F0E3] py-24 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#F05A28] mb-2 uppercase tracking-[0.1em] text-sm" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            WHY MANU2PRINT
          </p>
          <h2 className="text-[#1A1208] leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            THE TOOL THEY COULDN&apos;T BUILD. BECAUSE THEY WEREN&apos;T AUTHORS.
          </h2>
          <p className="text-base text-[#6B6151] max-w-xl mx-auto mt-3 mb-12" style={{ fontFamily: "Inter, sans-serif" }}>
            Vellum and Atticus are excellent writing tools. They are not KDP compliance specialists. We are. Here&apos;s the difference that matters.
          </p>
          <div className="max-w-3xl mx-auto overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#1A1208] text-[#FAF7EE]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  <th className="px-4 py-3 text-left tracking-wide">FEATURE</th>
                  <th className="px-4 py-3 text-center tracking-wide text-[#F05A28] border-l-2 border-r-2 border-[#F05A28]">MANU2PRINT</th>
                  <th className="px-4 py-3 text-center tracking-wide">VELLUM $249</th>
                  <th className="px-4 py-3 text-center tracking-wide">ATTICUS $147</th>
                  <th className="px-4 py-3 text-center tracking-wide">REEDSY FREE</th>
                </tr>
              </thead>
              <tbody style={{ fontFamily: "Inter, sans-serif" }}>
                {[
                  ["Browser-based (no install)", "✅", "❌", "⚠️ Partial", "✅"],
                  ["Works on Windows / PC", "✅", "❌ Mac only", "✅", "✅"],
                  ["KDP-specific compliance fix", "✅ Auto", "❌ Manual", "❌ Manual", "❌ Limited"],
                  ["Compliance report page", "✅ Included", "❌", "❌", "❌"],
                  ["Keeps your original formatting", "✅ Surgical edits", "❌ Rebuilds book", "❌ Rebuilds book", "❌ Rebuilds book"],
                  ["Price", "$XXX per book", "$249 upfront", "$147 upfront", "Free (limited)"],
                  ["Built by KDP authors", "✅ 8 books published", "❌", "❌", "❌"],
                  ["Auto-fix margins & breaks", "✅", "❌", "❌", "❌"],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F5F0E3]"}>
                    <td className="px-4 py-3 text-[#1A1208]">{row[0]}</td>
                    <td className="px-4 py-3 text-center font-bold text-[#2D8C4E] border-l-2 border-r-2 border-[#F05A28]">{row[1]}</td>
                    <td className="px-4 py-3 text-center">{row[2] === "❌" || row[2].startsWith("❌") ? <span className="text-[#E74C3C]">{row[2]}</span> : row[2] === "⚠️ Partial" ? <span className="text-[#C8860A]">{row[2]}</span> : row[2]}</td>
                    <td className="px-4 py-3 text-center">{row[3] === "❌" || row[3].startsWith("❌") ? <span className="text-[#E74C3C]">{row[3]}</span> : row[3]}</td>
                    <td className="px-4 py-3 text-center">{row[4] === "❌" || row[4].startsWith("❌") ? <span className="text-[#E74C3C]">{row[4]}</span> : row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="max-w-2xl mx-auto mt-8 bg-[#FEF0EB] border-l-4 border-[#F05A28] rounded-lg px-6 py-5 text-left">
            <p className="text-sm text-[#2E2A22]" style={{ fontFamily: "Inter, sans-serif" }}>
              🎯 The Key Difference: manu2print makes surgical corrections to YOUR existing DOCX — preserving your fonts, layout, and formatting choices. Every other tool rebuilds your book from scratch inside their own template. Your book stays your book.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 7 — SOCIAL PROOF */}
      <section className="bg-[#1A1208] py-24 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#F05A28] mb-2 uppercase tracking-[0.1em] text-sm" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            BY THE NUMBERS
          </p>
          <h2 className="text-white mb-12" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            REAL AUTHORS. REAL RESULTS.
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto text-center">
            {[
              ["8", "KDP Books Published by Founder"],
              ["~3 MIN", "Average Processing Time"],
              ["100%", "Browser-Based, No Install"],
              ["$XXX", "vs $249 Vellum · $147 Atticus"],
            ].map(([num, label], i) => (
              <div key={i}>
                <div className="text-7xl text-[#F05A28] leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{num}</div>
                <p className="text-xs text-[#6B6151] uppercase tracking-widest mt-2" style={{ fontFamily: "Inter, sans-serif" }}>{label}</p>
              </div>
            ))}
          </div>
          <div className="max-w-2xl mx-auto mt-16 text-center">
            <div className="text-7xl text-[#F05A28] leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>❝</div>
            <p className="text-xl italic text-white mt-2" style={{ fontFamily: "Inter, sans-serif" }}>
              Finally — a formatting tool that actually understands KDP. I uploaded my manuscript and had a compliant PDF in just a few minutes. This is what authors have needed for years.
            </p>
            <p className="text-sm text-[#6B6151] mt-4" style={{ fontFamily: "Inter, sans-serif" }}>— Beta Author, 3-book KDP Publisher</p>
          </div>
        </div>
      </section>

      {/* SECTION 8 — PRICING */}
      <section className="bg-[#FAF7EE] py-24 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#F05A28] mb-2 uppercase tracking-[0.1em] text-sm" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            SIMPLE PRICING
          </p>
          <h2 className="text-[#1A1208] leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            PAY PER BOOK. NOT PER YEAR.
          </h2>
          <p className="text-base text-[#6B6151] max-w-md mx-auto mt-3 mb-12" style={{ fontFamily: "Inter, sans-serif" }}>
            No subscriptions. No monthly fees. Format one book or one hundred — you only pay when you use it.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white border border-[#E0D8C4] rounded-2xl p-8 text-center">
              <div className="mb-4"><ToolBadge status="free" /></div>
              <h3 className="text-3xl text-[#1A1208] mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>COMPLIANCE SCAN</h3>
              <div className="text-6xl text-[#1A1208]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>$0</div>
              <p className="text-sm text-[#6B6151] mt-1" style={{ fontFamily: "Inter, sans-serif" }}>Upload free. See every KDP error instantly.</p>
              <ul className="text-sm text-[#2E2A22] text-left mt-6 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
                <li>✓ Full KDP compliance report</li>
                <li>✓ Margin &amp; page size error detection</li>
                <li>✓ Chapter break &amp; widow flag analysis</li>
                <li>✓ See exactly what KDP will reject — before you pay</li>
                <li>✓ No credit card required to scan</li>
              </ul>
              <Link href="/formatter" className="block border-2 border-[#F05A28] text-[#F05A28] font-bold px-6 py-3 rounded-xl w-full mt-6 hover:bg-[#FEF0EB] transition-all" style={{ fontFamily: "Inter, sans-serif" }}>Scan My PDF Free — See the Report →</Link>
            </div>
            <div className="bg-white border-2 border-[#F05A28] rounded-2xl overflow-hidden text-center relative">
              <div className="bg-[#F05A28] text-white font-bold text-xs tracking-widest uppercase py-2 text-center" style={{ fontFamily: "Inter, sans-serif" }}>MOST POPULAR</div>
              <div className="p-8">
                <div className="mb-4"><ToolBadge status="live" /></div>
                <h3 className="text-3xl text-[#1A1208] mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>KDP FORMATTER</h3>
                <div className="text-6xl text-[#F05A28]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>$XXX</div>
                <p className="text-sm text-[#6B6151] mt-1" style={{ fontFamily: "Inter, sans-serif" }}>Pay only to download your fixed, print-ready PDF</p>
                <ul className="text-sm text-[#2E2A22] text-left mt-6 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
                  <li>✓ Everything in free scan, plus:</li>
                  <li>✓ Auto-fix ALL KDP compliance issues</li>
                  <li>✓ Surgical edits — keeps your original formatting</li>
                  <li>✓ Print-ready PDF export</li>
                  <li>✓ Compliance report page prepended</li>
                  <li>✓ All KDP trim sizes supported</li>
                  <li>✓ Any OS, any browser</li>
                </ul>
                <Link href="/formatter" className="block bg-[#F05A28] hover:bg-[#D94E20] text-white font-bold px-6 py-3 rounded-xl w-full mt-6 shadow-[0_4px_20px_rgba(240,90,40,0.35)] transition-all" style={{ fontFamily: "Inter, sans-serif" }}>Format My Book — $XXX →</Link>
              </div>
            </div>
          </div>
          <p className="text-sm text-[#6B6151] text-center mt-6" style={{ fontFamily: "Inter, sans-serif" }}>
            🔒 Secure payment processing. Your manuscript is processed and immediately deleted — never stored permanently.
          </p>
        </div>
      </section>

      {/* SECTION 9 — FAQ */}
      <section className="bg-[#F5F0E3] py-24 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#F05A28] mb-2 uppercase tracking-[0.1em] text-sm" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            COMMON QUESTIONS
          </p>
          <h2 className="text-[#1A1208] leading-tight mb-12" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            THINGS AUTHORS ASK US.
          </h2>
          <FAQAccordion items={faqItems} />
        </div>
      </section>

      {/* SECTION 10 — FINAL CTA BAND */}
      <section className="bg-[#F05A28] py-20 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-white leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
            YOUR NEXT BOOK DESERVES A CLEAN LAUNCH.
          </h2>
          <p className="text-lg text-white/80 max-w-lg mx-auto mt-4 mb-10" style={{ fontFamily: "Inter, sans-serif" }}>
            Stop fighting with margins. Upload your manuscript and get a KDP-compliant PDF in minutes — free to try, right now.
          </p>
          <Link href="/formatter" className="inline-block bg-white text-[#F05A28] font-bold text-lg px-10 py-4 rounded-xl hover:scale-105 transition-transform shadow-lg" style={{ fontFamily: "Inter, sans-serif" }}>
            📄 Scan My PDF Free →
          </Link>
        </div>
      </section>

      {/* SECTION 11 — FOOTER */}
      <footer className="bg-[#1A1208]">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center">
          <Link href="/" className="inline-block">
            <span className="text-2xl text-[#F05A28]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>manu2print</span>
          </Link>
          <p className="text-sm text-[#6B6151] mt-2" style={{ fontFamily: "Inter, sans-serif" }}>Precision KDP formatting. Browser-based. Built by authors.</p>
        </div>
        <nav className="w-full py-4 px-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm" aria-label="Footer" style={{ fontFamily: "Inter, sans-serif" }}>
          <Link href="/legal" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">Legal</Link>
          <Link href="/terms" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">Terms &amp; Conditions</Link>
          <Link href="/privacy" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">Privacy Policy</Link>
          <Link href="/about" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">About</Link>
          <Link href="/founders" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">Founders</Link>
          <Link href="/affiliate" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">Affiliate</Link>
          <Link href="/faq" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">FAQ</Link>
          <Link href="/contact" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">Contact</Link>
          <Link href="/refunds" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">Refund Policy</Link>
          <Link href="/cookies" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">Cookies</Link>
          <Link href="/platform/kdp" className="text-[#6B6151] hover:text-[#F05A28] transition-colors font-medium">Tools</Link>
        </nav>
        <div className="px-6 py-4 text-center text-xs text-[#6B6151]" style={{ fontFamily: "Inter, sans-serif" }}>
          <p>Your files are processed securely and never stored permanently.</p>
          <p className="mt-2">© 2026 manu2print. KDP &amp; Kindle tools for indie authors.</p>
        </div>
      </footer>
    </div>
  );
}
