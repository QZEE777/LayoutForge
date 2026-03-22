import Link from "next/link";
import Image from "next/image";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import ToolBadge from "@/components/ToolBadge";
import PlatformWaitlistForm from "@/components/PlatformWaitlistForm";

export const metadata = {
  title: "KDP PDF Checker — Find Formatting Errors Before Amazon Rejects Your Book | manu2print",
  description:
    "Upload your PDF manuscript and get a full KDP compliance report in minutes. Check margins, trim size, bleed, and fonts before Amazon rejects your self-publishing PDF. $9, no subscription.",
  keywords:
    "KDP PDF checker, Amazon KDP formatting errors, KDP compliance check, KDP margin violation, KDP trim size check, self publishing PDF check, KDP rejection fix, IngramSpark PDF checker",
  openGraph: {
    title: "KDP PDF Checker — Find Formatting Errors Before Amazon Rejects Your Book | manu2print",
    description:
      "Upload your PDF manuscript and get a full KDP compliance report in minutes. Check margins, trim size, bleed, and fonts before Amazon rejects your self-publishing PDF. $9, no subscription.",
    url: "https://www.manu2print.com",
    type: "website",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* NAVBAR */}
      <SiteNav />

      {/* ─── SECTION 1 — HERO ─────────────────────────────────────────── */}
      {/* Background: near-black #1A1208 */}
      <section className="bg-m2p-ink py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h1
            className="font-bebas text-m2p-ivory leading-none tracking-wide mb-5"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
          >
            KDP PDF Checker — Find Formatting Errors Before Amazon Rejects Your Book
          </h1>
          <p className="text-m2p-ivory/90 text-lg max-w-2xl mx-auto mb-4 leading-relaxed">
            Upload your manuscript and get a clear, page-by-page KDP compliance report in minutes — before you submit.
          </p>
          <p className="text-m2p-ivory/55 text-sm italic mb-8">
            KDP rejected your PDF? We show you exactly why.
          </p>
          <div className="flex justify-center mb-5">
            <Link
              href="/kdp-pdf-checker"
              className="bg-m2p-orange hover:bg-m2p-orange-hover text-white font-bold text-base px-8 py-4 rounded-xl shadow-[0_4px_24px_rgba(240,90,40,0.45)] hover:-translate-y-0.5 transition-all uppercase tracking-wide"
            >
              Check My PDF for KDP Errors — $9
            </Link>
          </div>
          <p className="text-m2p-ivory/40 text-xs italic">
            Built for indie authors publishing on Amazon KDP — covering margins, bleed, trim size, and full PDF compliance.
          </p>
        </div>
      </section>

      {/* ─── SECTION 2 — PAIN BLOCK ────────────────────────────────────── */}
      {/* Background: ivory #FAF7EE */}
      <section className="bg-m2p-ivory py-20 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-m2p-ink text-xl md:text-2xl leading-relaxed mb-3">
            Stop guessing if your PDF will pass.
          </p>
          <p className="text-m2p-ink text-xl md:text-2xl leading-relaxed mb-3">
            KDP doesn&apos;t tell you what&apos;s wrong until after you submit.
          </p>
          <p className="text-m2p-orange font-bold text-xl md:text-2xl leading-relaxed">
            We do — before you upload.
          </p>
        </div>
      </section>

      {/* ─── SECTION 3 — HOW IT WORKS ──────────────────────────────────── */}
      {/* Background: near-black #1A1208 */}
      <section id="how-it-works" className="bg-m2p-ink py-20 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            THE PROCESS
          </p>
          <h2
            className="font-bebas text-m2p-ivory leading-tight mb-14"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            HOW IT WORKS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              {
                num: "01",
                title: "Upload Your PDF",
                body: "Drag and drop your manuscript PDF. Any browser, any operating system. No software to install.",
              },
              {
                num: "02",
                title: "We Scan Every KDP Rule",
                body: "Our engine checks 26 KDP compliance rules — the same categories Amazon flags during review. Page size, margins, bleed, fonts, trim size. Every issue flagged with exact page number and fix guidance.",
              },
              {
                num: "03",
                title: "Download Your Report",
                body: "Get a detailed compliance report and an annotated PDF showing exactly where KDP will flag your file. Fix it. Upload with confidence.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-white/5 border border-white/10 rounded-2xl px-6 py-8 text-center"
              >
                <div className="font-bebas text-5xl text-m2p-orange leading-none mb-3">
                  {step.num}
                </div>
                <h3 className="font-bebas text-m2p-ivory text-xl mb-3">{step.title}</h3>
                <p className="text-m2p-ivory/70 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 4 — FEATURE OUTCOMES ─────────────────────────────── */}
      {/* Background: ivory #FAF7EE */}
      <section className="bg-m2p-ivory py-20 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2
            className="font-bebas text-m2p-ink leading-tight mb-12"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            Everything Amazon KDP Checks — Before You Upload
          </h2>
          <ul className="space-y-5 text-left max-w-xl mx-auto">
            {[
              "Know your trim size is KDP-approved before you submit",
              "Catch margin violations that trigger instant KDP rejection",
              "See exactly which pages KDP will flag",
              "Confirm your fonts will print correctly on every page",
              "Verify bleed, page count, and file size are within KDP limits",
            ].map((outcome) => (
              <li key={outcome} className="flex items-start gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-m2p-orange text-white flex items-center justify-center text-xs font-bold mt-0.5">
                  ✓
                </span>
                <span className="text-m2p-ink text-base leading-relaxed">{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── SECTION 5 — TOOLS GRID ─────────────────────────────────────── */}
      {/* Background: white — distinct from ivory sections */}
      <section id="tools" className="bg-white py-20 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            OUR TOOLS
          </p>
          <h2
            className="font-bebas text-m2p-ink leading-tight"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            EVERYTHING AN INDIE AUTHOR NEEDS. NOTHING THEY DON&apos;T.
          </h2>
          <p className="text-base text-m2p-muted max-w-lg mx-auto mt-3 mb-12">
            PDF tools first — browser-based, built for KDP. More formats and platforms coming soon.
          </p>

          {/* Print Ready Check — featured top card */}
          <div className="max-w-md mx-auto mb-10">
            <div className="bg-m2p-ivory border-2 border-m2p-orange rounded-2xl p-7 text-center relative shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <div className="absolute top-4 right-4 flex gap-2">
                <ToolBadge status="live" />
              </div>
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-bebas text-xl text-m2p-ink mb-2">Print Ready Check</h3>
              <p className="text-sm text-m2p-muted">
                Upload your PDF and get a full KDP compliance report. Margins, page size, bleed — flagged
                with exact page numbers and an annotated PDF.
              </p>
              <Link
                href="/kdp-pdf-checker"
                className="text-m2p-orange font-semibold text-sm mt-4 inline-block hover:underline"
              >
                → Check My PDF — $9
              </Link>
            </div>
          </div>

          {/* Free tools grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              {
                icon: "🗜️",
                title: "PDF Compressor",
                desc: "Shrink PDFs in your browser. No upload to our servers — runs locally. Free, no account required.",
                href: "/pdf-compress",
                cta: "→ Compress PDF",
              },
              {
                icon: "📐",
                title: "Spine Width Calculator",
                desc: "Spine width and full-wrap cover dimensions for KDP paperbacks. Essential for cover design.",
                href: "/spine-calculator",
                cta: "→ Calculate Spine",
              },
              {
                icon: "🎨",
                title: "Cover Size Calculator",
                desc: "Full-wrap cover dimensions in inches and 300 DPI pixels for Canva and other design tools.",
                href: "/cover-calculator",
                cta: "→ Cover Dimensions",
              },
              {
                icon: "📊",
                title: "Royalty Calculator",
                desc: "Page count, trim size, and price → KDP print cost, royalty per sale, and breakeven.",
                href: "/royalty-calculator",
                cta: "→ Royalty Calculator",
              },
              {
                icon: "🚫",
                title: "Banned Keyword Checker",
                desc: "Spot risky words in title, subtitle, or description before publishing on KDP.",
                href: "/banned-keyword-checker",
                cta: "→ Check Keywords",
              },
              {
                icon: "📄",
                title: "Page Count Estimator",
                desc: "Estimate interior pages from word count and trim size.",
                href: "/page-count-estimator",
                cta: "→ Estimate Pages",
              },
              {
                icon: "📐",
                title: "Trim Size Comparison",
                desc: "Compare print cost and royalty across trim sizes.",
                href: "/trim-size-comparison",
                cta: "→ Compare Trims",
              },
              {
                icon: "📋",
                title: "Interior Template",
                desc: "Download a PDF with your book's exact trim and safe zone for Canva.",
                href: "/interior-template",
                cta: "→ Get Template",
              },
            ].map((tool) => (
              <div
                key={tool.title}
                className="bg-m2p-ivory border border-m2p-border rounded-2xl p-7 text-center relative shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="absolute top-4 right-4">
                  <ToolBadge status="free" />
                </div>
                <div className="text-4xl mb-3">{tool.icon}</div>
                <h3 className="font-bebas text-xl text-m2p-ink mb-2">{tool.title}</h3>
                <p className="text-sm text-m2p-muted">{tool.desc}</p>
                <Link
                  href={tool.href}
                  className="text-m2p-orange font-semibold text-sm mt-4 inline-block hover:underline"
                >
                  {tool.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 6 — PRICING / SCAN PACKS ─────────────────────────── */}
      {/* Background: near-black #1A1208 */}
      <section id="pricing" className="bg-m2p-ink py-20 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            PRICING
          </p>
          <h2
            className="font-bebas text-m2p-ivory leading-tight mb-3"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            Choose Your Scan Pack
          </h2>
          <p className="text-m2p-ivory/70 text-base max-w-md mx-auto mb-12">
            Start simple or save more as you go. Credits never expire. No subscription.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 max-w-5xl mx-auto">

            {/* Card 1 — Single Scan (LIVE) */}
            <div className="bg-white/5 border-2 border-m2p-orange rounded-2xl p-6 text-center flex flex-col relative">
              <div className="mb-3">
                <span className="inline-block bg-m2p-orange text-white text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full">
                  LIVE
                </span>
              </div>
              <h3 className="font-bebas text-m2p-ivory text-2xl mb-1">Single Scan</h3>
              <div className="font-bebas text-5xl text-m2p-orange leading-none mb-2">$9</div>
              <p className="text-m2p-ivory/60 text-sm mb-5">Perfect for one manuscript</p>
              <ul className="text-left space-y-2 text-sm text-m2p-ivory/80 mb-6 flex-1">
                <li>✓ 1 KDP compliance scan</li>
                <li>✓ Annotated PDF with highlights</li>
                <li>✓ Full compliance report</li>
                <li>✓ 26 rules checked</li>
              </ul>
              <Link
                href="/kdp-pdf-checker"
                className="block bg-m2p-orange hover:bg-m2p-orange-hover text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors shadow-[0_4px_16px_rgba(240,90,40,0.35)]"
              >
                Check My PDF for KDP Errors — $9
              </Link>
            </div>

            {/* Card 2 — Author Pack (COMING SOON / MOST POPULAR) */}
            <div className="bg-white/5 border-2 border-m2p-orange/40 rounded-2xl p-6 text-center flex flex-col relative opacity-90">
              <div className="mb-3 flex flex-wrap gap-2 justify-center">
                <span className="inline-block bg-white/10 text-m2p-ivory/70 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-white/10">
                  COMING SOON
                </span>
                <span className="inline-block bg-m2p-orange/20 text-m2p-orange text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-m2p-orange/30">
                  MOST POPULAR
                </span>
              </div>
              <h3 className="font-bebas text-m2p-ivory text-2xl mb-1">Author Pack</h3>
              <div className="font-bebas text-5xl text-m2p-ivory/80 leading-none mb-1">$19</div>
              <p className="text-m2p-orange/80 text-xs mb-1">~$6.33 per scan</p>
              <p className="text-m2p-ivory/60 text-sm mb-5">3 scans — for revisions and versions</p>
              <ul className="text-left space-y-2 text-sm text-m2p-ivory/70 mb-6 flex-1">
                <li>✓ Everything in Single</li>
                <li>✓ 3 scan credits</li>
              </ul>
              <button
                disabled
                className="block w-full bg-white/10 text-m2p-ivory/50 font-bold px-5 py-3 rounded-xl text-sm cursor-not-allowed border border-white/10"
              >
                Launching Soon
              </button>
              <p className="text-m2p-ivory/40 text-xs mt-3">
                Packs launching soon — join early access below ↓
              </p>
            </div>

            {/* Card 3 — Indie Publisher (COMING SOON) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center flex flex-col relative opacity-90">
              <div className="mb-3">
                <span className="inline-block bg-white/10 text-m2p-ivory/70 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-white/10">
                  COMING SOON
                </span>
              </div>
              <h3 className="font-bebas text-m2p-ivory text-2xl mb-1">Indie Publisher</h3>
              <div className="font-bebas text-5xl text-m2p-ivory/80 leading-none mb-1">$39</div>
              <p className="text-m2p-orange/80 text-xs mb-1">~$3.90 per scan</p>
              <p className="text-m2p-ivory/60 text-sm mb-5">10 scans — for multiple books or client work</p>
              <ul className="text-left space-y-2 text-sm text-m2p-ivory/70 mb-6 flex-1">
                <li>✓ Everything in Author</li>
                <li>✓ 10 scan credits</li>
              </ul>
              <button
                disabled
                className="block w-full bg-white/10 text-m2p-ivory/50 font-bold px-5 py-3 rounded-xl text-sm cursor-not-allowed border border-white/10"
              >
                Launching Soon
              </button>
              <p className="text-m2p-ivory/40 text-xs mt-3">
                Packs launching soon — join early access below ↓
              </p>
            </div>

            {/* Card 4 — Pro / Studio (COMING SOON) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center flex flex-col relative opacity-90">
              <div className="mb-3">
                <span className="inline-block bg-white/10 text-m2p-ivory/70 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-white/10">
                  COMING SOON
                </span>
              </div>
              <h3 className="font-bebas text-m2p-ivory text-2xl mb-1">Pro / Studio</h3>
              <div className="font-bebas text-5xl text-m2p-ivory/80 leading-none mb-1">$79</div>
              <p className="text-m2p-orange/80 text-xs mb-1">~$3.16 per scan</p>
              <p className="text-m2p-ivory/60 text-sm mb-5">High-volume publishing workflows</p>
              <ul className="text-left space-y-2 text-sm text-m2p-ivory/70 mb-6 flex-1">
                <li>✓ Everything in Indie</li>
                <li>✓ 25 scan credits</li>
              </ul>
              <button
                disabled
                className="block w-full bg-white/10 text-m2p-ivory/50 font-bold px-5 py-3 rounded-xl text-sm cursor-not-allowed border border-white/10"
              >
                Launching Soon
              </button>
              <p className="text-m2p-ivory/40 text-xs mt-3">
                Packs launching soon — join early access below ↓
              </p>
            </div>
          </div>

          <p className="text-m2p-ivory/50 text-sm mt-8">
            Credits never expire. No subscription. Use when you need.
          </p>
        </div>
      </section>

      {/* ─── SECTION 7 — SECONDARY CTA ─────────────────────────────────── */}
      {/* Background: orange #F05A28 */}
      <section className="bg-m2p-orange py-20 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2
            className="font-bebas text-white leading-tight mb-4"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
          >
            Ready to Stop KDP Rejections Before They Happen?
          </h2>
          <p className="text-white/85 text-lg max-w-lg mx-auto mb-10">
            Thousands of KDP rejections happen every day. Most are avoidable.
          </p>
          <Link
            href="/kdp-pdf-checker"
            className="inline-block bg-white text-m2p-orange font-bold text-lg px-10 py-4 rounded-xl hover:scale-[1.02] transition-transform shadow-xl"
          >
            Scan My PDF for KDP Errors — $9
          </Link>
        </div>
      </section>

      {/* ─── SECTION 8 — PUBLISHING BEYOND AMAZON ──────────────────────── */}
      {/* Background: sage #E8F0E8 */}
      <section className="py-20 text-center" style={{ backgroundColor: "#E8F0E8" }}>
        <div className="max-w-4xl mx-auto px-6">
          <p
            className="font-bebas mb-2 uppercase tracking-[0.1em]"
            style={{ color: "#1A1208", fontSize: "clamp(1rem, 2vw, 1.25rem)" }}
          >
            KDP is just the beginning.
          </p>
          <h2
            className="font-bebas leading-tight mb-4"
            style={{ color: "#1A1208", fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            Publishing Beyond Amazon — Tools for Every Platform
          </h2>
          <p className="text-[#1A1208]/70 text-base max-w-2xl mx-auto mb-8">
            Working on IngramSpark formatting, print-ready PDF checks, and platform-specific compliance
            tools for indie authors.
          </p>

          <div className="text-left max-w-2xl mx-auto mb-10 space-y-4 text-[#1A1208]/80 text-base leading-relaxed">
            <p>
              We&apos;re building the same precision tools for every major publishing platform.
              IngramSpark. Expanded print distribution. Platform-specific PDF requirements.
            </p>
            <p>
              Each one comes with its own rules — trim sizes, margins, color profiles, and rejection
              risks. Instead of guessing across platforms, you&apos;ll be able to check everything in
              one place.
            </p>
          </div>

          {/* Platform badges */}
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {[
              "IngramSpark Checker",
              "Barnes & Noble Press",
              "Lulu / Draft2Digital",
            ].map((platform) => (
              <span
                key={platform}
                className="inline-flex items-center gap-2 rounded-full border border-[#1A1208]/20 bg-white/60 px-4 py-2 text-sm font-medium text-[#1A1208]/70"
              >
                {platform}
                <span className="text-xs font-bold text-[#2D6A2D] tracking-widest uppercase">
                  COMING SOON
                </span>
              </span>
            ))}
          </div>

          {/* Lead capture */}
          <div className="max-w-md mx-auto">
            <PlatformWaitlistForm />
            <p className="text-[#1A1208]/55 text-xs mt-3">
              Be the first to test new tools and get early access pricing.
            </p>
            <p className="text-[#1A1208]/40 text-xs mt-2 italic">
              Built for IngramSpark PDF formatting, print-ready file checks, and multi-platform
              publishing workflows.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 9 — FOOTER ─────────────────────────────────────────── */}
      <SiteFooter />
    </div>
  );
}
