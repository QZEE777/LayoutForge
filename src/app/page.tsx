import Link from "next/link";
import Image from "next/image";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import ToolBadge from "@/components/ToolBadge";
import PlatformWaitlistForm from "@/components/PlatformWaitlistForm";
import HeroDemo from "@/components/HeroDemo";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import PackBuyButton from "@/components/PackBuyButton";

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
      <section className="bg-m2p-ink pt-2 pb-8 md:pt-3 md:pb-10">
        <div className="max-w-6xl mx-auto px-6">
          {/* Manny logo — top-left of hero */}
          <div className="flex items-center gap-2 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/manny-avatar.png"
              alt="Manny"
              width={44}
              height={44}
              style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
            <span className="font-bold text-lg">
              <span className="text-m2p-orange">manu</span>
              <span className="text-m2p-live">2print</span>
            </span>
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-8">
            {/* LEFT — text content */}
            <div className="flex-[1.1] w-full lg:w-auto order-2 lg:order-1 text-center">
              <h1 className="font-bebas text-m2p-ivory leading-none tracking-wide mb-4">
                <span
                  className="block"
                  style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}
                >
                  KDP PDF <span className="text-m2p-live">Checker</span>
                </span>
                <span
                  className="block text-m2p-ivory/80"
                  style={{ fontSize: "clamp(1.4rem, 3.2vw, 2.5rem)", marginTop: "0.5rem", lineHeight: 1.15 }}
                >
                  Find Formatting Errors<br />
                  Before Amazon Rejects Your Book
                </span>
              </h1>
              <p className="text-m2p-ivory/90 text-lg max-w-xl mx-auto mb-1 leading-relaxed">
                Check your PDF before you upload to KDP.<br />
                See every issue — page by page — in minutes.
              </p>
              <p className="text-m2p-live text-sm italic mb-5">
                Already rejected? We show you exactly why.
              </p>
              <div className="flex justify-center mb-5">
                <Link
                  href="/kdp-pdf-checker"
                  className="bg-m2p-orange hover:bg-m2p-orange-hover text-white font-bold text-base px-8 py-4 rounded-xl shadow-[0_4px_24px_rgba(240,90,40,0.45)] hover:-translate-y-0.5 transition-all uppercase tracking-wide"
                >
                  Check My PDF for KDP Errors — $9
                </Link>
              </div>
            </div>
            {/* RIGHT — hero video / demo loop */}
            <div className="flex-1 flex flex-col items-center w-full lg:w-auto order-1 lg:order-2">
              <HeroDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2 — PAIN BLOCK ────────────────────────────────────── */}
      {/* Background: ivory #FAF7EE */}
      <section className="bg-m2p-ivory py-10 text-center">
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
      <section id="how-it-works" className="bg-m2p-ink py-12 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            THE PROCESS
          </p>
          <h2
            className="font-bebas text-m2p-ivory leading-tight mb-8"
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
      <section className="bg-m2p-ivory py-10 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-bebas text-m2p-ink leading-tight mb-6" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            <span className="block">Everything Amazon KDP Checks</span>
            <span className="block text-m2p-orange" style={{ fontSize: "clamp(1.25rem, 2.5vw, 2rem)", marginTop: "0.2rem" }}>
              Before You Upload
            </span>
          </h2>
          <ul className="space-y-3 text-left max-w-xl mx-auto">
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

      {/* ─── SECTION 4B — TESTIMONIALS ─────────────────────────────────── */}
      {/* Background: ivory #FAF7EE */}
      <section className="bg-m2p-ivory py-20 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            WHAT AUTHORS SAY
          </p>
          <h2 className="font-bebas text-m2p-ink leading-tight mb-12" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            <span className="block">Real Authors.</span>
            <span className="block text-m2p-orange" style={{ fontSize: "clamp(1.25rem, 2.5vw, 2rem)", marginTop: "0.2rem" }}>
              Real Results.
            </span>
          </h2>
          <TestimonialsCarousel />
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
                desc: "Shrink your PDF directly in the browser — your file never leaves your device. Compress working files from Canva, InDesign, or Word before sharing.",
                href: "/pdf-compress",
                cta: "→ Compress PDF",
              },
              {
                icon: "📐",
                title: "Spine Width Calculator",
                desc: "Get spine width and full-wrap cover dimensions for KDP paperbacks — in inches and mm. Essential before designing your cover.",
                href: "/spine-calculator",
                cta: "→ Calculate Spine",
              },
              {
                icon: "🎨",
                title: "Cover Size Calculator",
                desc: "Full-wrap cover dimensions — front, spine, and back — in inches and 300 DPI pixels. Includes a downloadable template PDF with trim lines, spine guides, and safe zones.",
                href: "/cover-calculator",
                cta: "→ Cover Dimensions",
              },
              {
                icon: "📊",
                title: "Royalty Calculator",
                desc: "Estimate royalty per sale for B&W white, B&W cream, or color interior printing. Enter trim size, page count, and list price.",
                href: "/royalty-calculator",
                cta: "→ Calculate Royalty",
              },
              {
                icon: "🚫",
                title: "Metadata Risk Checker",
                desc: "Paste your title, subtitle, or description to flag words and phrases that often cause KDP listing issues. Quick metadata sanity check — not a complete list.",
                href: "/banned-keyword-checker",
                cta: "→ Check Metadata",
              },
              {
                icon: "📄",
                title: "Page Count Estimator",
                desc: "Estimate how many pages your book will have from word count, trim size, and font size. Plan spine width, print cost, and royalty before you format.",
                href: "/page-count-estimator",
                cta: "→ Estimate Pages",
              },
              {
                icon: "📐",
                title: "Trim Size Comparison",
                desc: "Compare print cost and royalty across all KDP trim sizes side by side. Same page count and list price — see the difference before you commit.",
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
                className="bg-m2p-ivory rounded-2xl p-7 text-center relative shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all border-2" style={{ borderColor: "#2D6A2D" }}
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

            {/* Coming soon card — no link, no interaction */}
            <div className="bg-m2p-ivory rounded-2xl p-7 text-center relative shadow-sm border-2 opacity-60 cursor-default select-none" style={{ borderColor: "#B0A898" }}>
              <div className="absolute top-4 right-4">
                <ToolBadge status="coming-soon" />
              </div>
              <div className="text-4xl mb-3">🔢</div>
              <h3 className="font-bebas text-xl text-m2p-ink mb-2">Page Number Formatter</h3>
              <p className="text-sm text-m2p-muted">
                Add correct KDP-style odd/even page numbers to your interior PDF.
                Built for Canva and Word exports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6 — PRICING / SCAN PACKS ─────────────────────────── */}
      {/* Background: near-black #1A1208 */}
      <section id="pricing" className="py-20 text-center" style={{ backgroundColor: "#1A3A2A" }}>
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
            <div className="border-2 border-m2p-orange rounded-2xl p-6 text-center flex flex-col relative" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
              <div className="mb-3">
                <span className="inline-block bg-m2p-live text-m2p-ink text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full shadow-[0_0_8px_rgba(76,217,100,0.5)]">
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

            {/* Card 2 — Author Pack */}
            <div className="border-2 border-m2p-orange/40 rounded-2xl p-6 text-center flex flex-col relative" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
              <div className="mb-3 flex flex-wrap gap-2 justify-center">
                <span className="inline-block bg-m2p-live text-m2p-ink text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full shadow-[0_0_8px_rgba(76,217,100,0.5)]">
                  LIVE
                </span>
                <span className="inline-block bg-m2p-orange/20 text-m2p-orange text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-m2p-orange/30">
                  MOST POPULAR
                </span>
              </div>
              <h3 className="font-bebas text-m2p-ivory text-2xl mb-1">Author Pack</h3>
              <div className="font-bebas text-5xl text-m2p-orange leading-none mb-1">$19</div>
              <p className="text-m2p-orange/80 text-xs mb-1">~$6.33 per scan</p>
              <p className="text-m2p-ivory/60 text-sm mb-5">3 scans — for revisions and versions</p>
              <ul className="text-left space-y-2 text-sm text-m2p-ivory/80 mb-6 flex-1">
                <li>✓ Everything in Single</li>
                <li>✓ 3 scan credits</li>
                <li>✓ Credits never expire</li>
              </ul>
              <PackBuyButton
                priceType="author_pack"
                label="Buy Author Pack — $19"
                className="block w-full bg-m2p-orange hover:opacity-90 text-white font-bold px-5 py-3 rounded-xl text-sm transition-opacity shadow-[0_4px_16px_rgba(240,90,40,0.35)] disabled:opacity-60"
              />
            </div>

            {/* Card 3 — Indie Publisher */}
            <div className="border border-white/10 rounded-2xl p-6 text-center flex flex-col relative" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
              <div className="mb-3">
                <span className="inline-block bg-m2p-live text-m2p-ink text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full shadow-[0_0_8px_rgba(76,217,100,0.5)]">
                  LIVE
                </span>
              </div>
              <h3 className="font-bebas text-m2p-ivory text-2xl mb-1">Indie Publisher</h3>
              <div className="font-bebas text-5xl text-m2p-orange leading-none mb-1">$39</div>
              <p className="text-m2p-orange/80 text-xs mb-1">~$3.90 per scan</p>
              <p className="text-m2p-ivory/60 text-sm mb-5">10 scans — for multiple books or client work</p>
              <ul className="text-left space-y-2 text-sm text-m2p-ivory/80 mb-6 flex-1">
                <li>✓ Everything in Author</li>
                <li>✓ 10 scan credits</li>
                <li>✓ Credits never expire</li>
              </ul>
              <PackBuyButton
                priceType="indie_pack"
                label="Buy Indie Pack — $39"
                className="block w-full bg-m2p-orange hover:opacity-90 text-white font-bold px-5 py-3 rounded-xl text-sm transition-opacity disabled:opacity-60"
              />
            </div>

            {/* Card 4 — Pro / Studio */}
            <div className="border border-white/10 rounded-2xl p-6 text-center flex flex-col relative" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
              <div className="mb-3">
                <span className="inline-block bg-m2p-live text-m2p-ink text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full shadow-[0_0_8px_rgba(76,217,100,0.5)]">
                  LIVE
                </span>
              </div>
              <h3 className="font-bebas text-m2p-ivory text-2xl mb-1">Pro / Studio</h3>
              <div className="font-bebas text-5xl text-m2p-orange leading-none mb-1">$79</div>
              <p className="text-m2p-orange/80 text-xs mb-1">~$3.16 per scan</p>
              <p className="text-m2p-ivory/60 text-sm mb-5">High-volume publishing workflows</p>
              <ul className="text-left space-y-2 text-sm text-m2p-ivory/80 mb-6 flex-1">
                <li>✓ Everything in Indie</li>
                <li>✓ 25 scan credits</li>
                <li>✓ Credits never expire</li>
              </ul>
              <PackBuyButton
                priceType="pro_pack"
                label="Buy Pro Pack — $79"
                className="block w-full bg-m2p-orange hover:opacity-90 text-white font-bold px-5 py-3 rounded-xl text-sm transition-opacity disabled:opacity-60"
              />
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
            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", textWrap: "balance" } as React.CSSProperties}
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

      {/* ─── SECTION 7B — AFFILIATE CTA ─────────────────────────────────── */}
      {/* Background: dark green #1A3A2A */}
      <section className="py-14 text-center" style={{ backgroundColor: "#1A3A2A" }}>
        <div className="max-w-3xl mx-auto px-6">
          <span className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>
            Earn With Us
          </span>
          <h2
            className="font-bebas text-m2p-ivory leading-tight mb-3"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
          >
            Refer Authors. Earn 40% on Every Pack Sale.
          </h2>
          <p className="text-m2p-ivory/65 text-base max-w-lg mx-auto mb-8">
            Share your link. Earn up to $31.60 per pack sale — with a 12-month attribution cookie and monthly PayPal payouts. The best partner deal in the KDP space.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/partners/apply"
              className="inline-block bg-m2p-green hover:opacity-90 text-white font-bold px-8 py-3 rounded-xl text-sm transition-opacity"
            >
              Become a Partner →
            </Link>
            <Link
              href="/partners"
              className="inline-block border border-m2p-ivory/30 text-m2p-ivory/70 hover:text-m2p-ivory hover:border-m2p-ivory/60 font-bold px-8 py-3 rounded-xl text-sm transition-colors"
            >
              My Dashboard
            </Link>
          </div>
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
          <h2 className="font-bebas leading-tight mb-4" style={{ color: "#1A1208", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            <span className="block">Publishing Beyond Amazon</span>
            <span className="block" style={{ fontSize: "clamp(1.25rem, 2.5vw, 2rem)", opacity: 0.75, marginTop: "0.2rem" }}>
              Tools for Every Platform
            </span>
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
