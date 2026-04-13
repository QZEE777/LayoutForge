import Link from "next/link";
import { BrandWordmark } from "@/components/BrandWordmark";
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
    <div className="min-h-screen bg-m2p-ivory">
      {/* NAVBAR */}
      <SiteNav />

      {/* ─── SECTION 1 — HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-m2p-ink pt-3 pb-10 md:pt-5 md:pb-14">
        <div className="pointer-events-none absolute -right-20 -top-28 h-[22rem] w-[22rem] rounded-full bg-[#f05a28]/15 blur-[80px]" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-[18rem] w-[18rem] rounded-full bg-[#4cd964]/10 blur-[70px]" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.07), transparent 55%)",
          }}
          aria-hidden
        />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="shrink-0 rounded-full bg-gradient-to-br from-white/25 to-white/[0.06] p-[3px] shadow-[0_8px_32px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/manny-avatar.png"
                alt="Manny"
                width={80}
                height={80}
                className="rounded-full"
                style={{ objectFit: "cover", display: "block" }}
              />
            </div>
            <BrandWordmark variant="onDark" className="text-lg sm:text-xl" />
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="flex-[1.1] w-full lg:w-auto order-2 lg:order-1 text-center lg:text-left">
              <h1 className="font-bebas text-white leading-none tracking-wide mb-4">
                <span
                  className="block drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)]"
                  style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}
                >
                  KDP PDF <span className="text-m2p-live">Checker</span>
                </span>
                <span
                  className="block text-white/90 text-balance"
                  style={{ fontSize: "clamp(1.35rem, 3vw, 2.35rem)", marginTop: "0.5rem", lineHeight: 1.18 }}
                >
                  Find formatting errors before Amazon rejects your book
                </span>
              </h1>
              {/* text-white/* — not text-m2p-ivory/* so body color (black in light mode) never leaks on dark hero */}
              <p className="text-lg text-white/90 max-w-xl mx-auto lg:mx-0 mb-2 leading-relaxed text-balance">
                Check your PDF before you upload to KDP. See every issue — page by page — in minutes.
              </p>
              <p className="text-m2p-live text-sm font-medium mb-6 max-w-xl mx-auto lg:mx-0">
                Already rejected? We show you exactly why.
              </p>
              <div className="flex justify-center lg:justify-start">
                <Link
                  href="/kdp-pdf-checker"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#ff7a4a] to-m2p-orange px-8 py-4 text-base font-bold text-white shadow-[0_8px_32px_rgba(240,90,40,0.5)] ring-1 ring-white/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(240,90,40,0.55)] hover:brightness-[1.03] active:translate-y-0"
                >
                  Check my PDF — $9
                </Link>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center w-full lg:w-auto order-1 lg:order-2">
              <div className="w-full max-w-[min(100%,420px)] lg:max-w-none rounded-2xl bg-gradient-to-b from-white/[0.06] to-transparent p-1 ring-1 ring-white/10 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)]">
                <HeroDemo />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2 — PAIN BLOCK (orange band, compact) ───────────────── */}
      <section className="relative border-t border-white/20 bg-gradient-to-br from-[#ff7a4a] via-m2p-orange to-[#d94a1f] py-8 text-center sm:py-9">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_0%,rgba(255,255,255,0.12),transparent_55%)]" aria-hidden />
        <div className="relative mx-auto max-w-xl px-5 sm:px-6">
          <div className="rounded-2xl border border-white/25 bg-black/10 px-5 py-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)] backdrop-blur-[2px] sm:px-6 sm:py-5">
            <p className="text-[15px] font-semibold leading-snug text-white text-balance sm:text-lg sm:leading-relaxed">
              Stop guessing if your PDF will pass.{" "}
              <span className="font-medium text-white/95">
                KDP won&apos;t spell out what&apos;s wrong until after you submit.
              </span>
            </p>
            <p className="mt-3 font-bebas text-xl tracking-wide text-white drop-shadow-sm sm:text-2xl">
              We do — before you upload.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3 — HOW IT WORKS ──────────────────────────────────── */}
      <section
        id="how-it-works"
        className="relative overflow-hidden py-16 text-center"
        style={{
          background: "linear-gradient(180deg, #12100c 0%, #1A1208 40%, #0f0e0b 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(240,90,40,0.08),transparent)]" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-6">
          <p className="mb-1 text-xs font-semibold tracking-tight text-m2p-orange/90">
            The process
          </p>
          <h2
            className="font-bebas text-m2p-ivory leading-tight mb-10 drop-shadow-sm"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            How it works
          </h2>
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-3 md:gap-4">
            {[
              {
                num: "01",
                title: "Upload your PDF",
                body: "Drag and drop your manuscript. Any browser — nothing to install.",
              },
              {
                num: "02",
                title: "We scan every KDP rule",
                body: "26 compliance checks — margins, bleed, fonts, trim, and more. Every hit shows the page and how to fix it.",
              },
              {
                num: "03",
                title: "Download your report",
                body: "Full report plus an annotated PDF. Fix issues, re-export, upload with confidence.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="rounded-xl border border-white/20 bg-gradient-to-b from-[#ff8f5c] to-m2p-orange px-4 py-5 text-center shadow-[0_10px_28px_-8px_rgba(0,0,0,0.45)] ring-1 ring-black/10 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-8px_rgba(0,0,0,0.5)]"
              >
                <div className="font-bebas text-4xl leading-none text-white drop-shadow-sm tabular-nums">
                  {step.num}
                </div>
                <h3 className="mt-2 font-sans text-[15px] font-bold leading-tight text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-left text-[13px] leading-relaxed text-[#2c1810]/90">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 4 — FEATURE OUTCOMES ─────────────────────────────── */}
      <section className="border-t border-black/[0.04] bg-gradient-to-b from-[#F7F2E8] to-m2p-ivory py-14 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-bebas text-m2p-ink leading-tight mb-8" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            <span className="block text-balance">Everything Amazon KDP checks</span>
            <span className="mt-1 block text-m2p-orange" style={{ fontSize: "clamp(1.25rem, 2.5vw, 2rem)" }}>
              before you upload
            </span>
          </h2>
          <ul className="mx-auto max-w-xl space-y-3 text-left">
            {[
              "Know your trim size is KDP-approved before you submit",
              "Catch margin violations that trigger instant KDP rejection",
              "See exactly which pages KDP will flag",
              "Confirm your fonts will print correctly on every page",
              "Verify bleed, page count, and file size are within KDP limits",
            ].map((outcome) => (
              <li
                key={outcome}
                className="flex items-start gap-4 rounded-2xl border border-black/[0.05] bg-white/60 px-4 py-3 shadow-[0_4px_24px_-12px_rgba(26,18,8,0.12)] backdrop-blur-[2px] transition-colors hover:border-[#1A6B2A]/15"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-m2p-orange to-[#d94e20] text-xs font-bold text-white shadow-sm ring-2 ring-white">
                  ✓
                </span>
                <span className="text-base leading-relaxed text-m2p-ink/95 pt-0.5">{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── SECTION 4B — TESTIMONIALS ─────────────────────────────────── */}
      <section className="bg-m2p-ivory py-20 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <p className="mb-1 text-xs font-semibold tracking-tight text-m2p-orange">
            What authors say
          </p>
          <h2 className="font-bebas text-m2p-ink leading-tight mb-10" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            <span className="block">Real authors.</span>
            <span className="mt-1 block text-m2p-orange" style={{ fontSize: "clamp(1.25rem, 2.5vw, 2rem)" }}>
              Real results.
            </span>
          </h2>
          <div className="rounded-3xl border border-black/[0.05] bg-white/40 p-1 shadow-[0_20px_60px_-28px_rgba(26,18,8,0.15)] backdrop-blur-sm sm:p-2">
            <TestimonialsCarousel />
          </div>
        </div>
      </section>

      {/* ─── SECTION 5 — TOOLS GRID ─────────────────────────────────────── */}
      <section id="tools" className="bg-gradient-to-b from-white via-[#FAFAF8] to-white py-20 text-center">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-1 text-xs font-semibold tracking-tight text-m2p-orange">
            Our tools
          </p>
          <h2
            className="font-bebas text-m2p-ink leading-tight text-balance"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            Everything an indie author needs. Nothing they don&apos;t.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base text-m2p-muted mb-12">
            PDF tools first — browser-based, built for KDP. More formats and platforms coming soon.
          </p>

          {/* KDP PDF Checker — featured top card */}
          <div className="mx-auto mb-12 max-w-md">
            <div className="relative overflow-hidden rounded-3xl border-2 border-m2p-orange/90 bg-gradient-to-br from-m2p-ivory via-white to-[#E8F5E9]/40 p-8 text-center shadow-[0_20px_50px_-20px_rgba(240,90,40,0.35)] ring-1 ring-black/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_64px_-24px_rgba(240,90,40,0.42)]">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-m2p-orange/10 blur-2xl" aria-hidden />
              <div className="absolute right-4 top-4 z-10 flex gap-2">
                <ToolBadge status="live" />
              </div>
              <div className="relative z-[1] text-4xl mb-3">🎯</div>
              <h3 className="relative z-[1] font-bebas text-xl text-m2p-ink mb-2">KDP PDF CHECKER</h3>
              <p className="relative z-[1] text-sm text-m2p-muted leading-relaxed">
                Upload your PDF and get a full KDP compliance report. Margins, page size, bleed — flagged
                with exact page numbers and an annotated PDF.
              </p>
              <Link
                href="/kdp-pdf-checker"
                className="relative z-[1] mt-5 inline-flex items-center gap-1 text-sm font-bold text-m2p-orange transition-colors hover:text-m2p-orange-hover"
              >
                Check my PDF — $9 <span aria-hidden>→</span>
              </Link>
            </div>
          </div>

          {/* Free tools grid */}
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "🗜️",
                title: "PDF Compressor",
                desc: "Shrink or print-optimize your PDF in the browser — no upload. Use for sharing and preview; keep your high-res original for KDP.",
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
                className="group relative overflow-hidden rounded-2xl border-2 border-[#2D6A2D]/30 bg-gradient-to-b from-m2p-ivory to-white p-7 text-center shadow-[0_10px_36px_-14px_rgba(45,106,45,0.18)] ring-1 ring-black/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-[#2D6A2D]/50 hover:shadow-[0_18px_48px_-16px_rgba(45,106,45,0.25)]"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#2D6A2D]/[0.06] blur-xl transition-opacity group-hover:opacity-100" aria-hidden />
                <div className="absolute right-4 top-4 z-10">
                  <ToolBadge status="free" />
                </div>
                <div className="relative text-4xl mb-3 drop-shadow-sm">{tool.icon}</div>
                <h3 className="relative font-bebas text-xl text-m2p-ink mb-2">{tool.title}</h3>
                <p className="relative text-sm text-m2p-muted leading-relaxed">{tool.desc}</p>
                <Link
                  href={tool.href}
                  className="relative mt-4 inline-flex items-center gap-1 text-sm font-bold text-m2p-orange transition-colors hover:text-m2p-orange-hover"
                >
                  {tool.cta.replace(/^→\s*/, "")} <span aria-hidden>→</span>
                </Link>
              </div>
            ))}

            {/* Coming soon card — no link, no interaction */}
            <div className="relative cursor-default select-none overflow-hidden rounded-2xl border-2 border-[#B0A898]/60 bg-m2p-ivory/80 p-7 text-center opacity-70 shadow-sm ring-1 ring-black/[0.03]">
              <div className="absolute right-4 top-4 z-10">
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
      <section
        id="pricing"
        className="relative overflow-hidden py-20 text-center"
        style={{
          background: "linear-gradient(165deg, #0f2419 0%, #1A3A2A 45%, #142a1f 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(240,90,40,0.12),transparent)]" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6">
          <p className="mb-1 text-xs font-semibold tracking-tight text-m2p-orange">
            Pricing
          </p>
          <h2
            className="font-bebas text-m2p-ivory leading-tight mb-3"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            Choose your scan pack
          </h2>
          <p className="mx-auto mb-12 max-w-md text-base text-m2p-ivory/70">
            Start simple or save more as you go. Credits never expire. No subscription.
          </p>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

            {/* Card 1 — Single Scan (LIVE) */}
            <div
              className="relative flex flex-col rounded-2xl border-2 border-m2p-orange p-6 text-center shadow-[0_16px_48px_-20px_rgba(0,0,0,0.45)] ring-1 ring-white/5 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.05) 100%)" }}
            >
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
                className="block rounded-xl bg-gradient-to-b from-[#ff7a4a] to-m2p-orange px-5 py-3 text-sm font-bold text-white shadow-[0_6px_24px_rgba(240,90,40,0.4)] ring-1 ring-white/15 transition-all hover:brightness-[1.05]"
              >
                Check my PDF — $9
              </Link>
            </div>

            {/* Card 2 — Author Pack */}
            <div
              className="relative flex flex-col rounded-2xl border-2 border-m2p-orange/45 p-6 text-center shadow-[0_12px_40px_-18px_rgba(0,0,0,0.4)] ring-1 ring-white/5 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.05) 100%)" }}
            >
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
              <p className="text-m2p-orange/80 text-xs mb-1">~$3.17 per scan</p>
              <p className="text-m2p-ivory/60 text-sm mb-5">6 scans — for revisions and versions</p>
              <ul className="text-left space-y-2 text-sm text-m2p-ivory/80 mb-6 flex-1">
                <li>✓ Everything in Single</li>
                <li>✓ 6 scan credits</li>
                <li>✓ Credits never expire</li>
              </ul>
              <PackBuyButton
                priceType="author_pack"
                label="Buy Author Pack — $19"
                className="block w-full bg-m2p-orange hover:opacity-90 text-white font-bold px-5 py-3 rounded-xl text-sm transition-opacity shadow-[0_4px_16px_rgba(240,90,40,0.35)] disabled:opacity-60"
              />
            </div>

            {/* Card 3 — Indie Publisher */}
            <div
              className="relative flex flex-col rounded-2xl border border-white/12 p-6 text-center shadow-lg shadow-black/20 ring-1 ring-white/5 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)" }}
            >
              <div className="mb-3">
                <span className="inline-block bg-m2p-live text-m2p-ink text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full shadow-[0_0_8px_rgba(76,217,100,0.5)]">
                  LIVE
                </span>
              </div>
              <h3 className="font-bebas text-m2p-ivory text-2xl mb-1">Indie Publisher</h3>
              <div className="font-bebas text-5xl text-m2p-orange leading-none mb-1">$39</div>
              <p className="text-m2p-orange/80 text-xs mb-1">~$2.79 per scan</p>
              <p className="text-m2p-ivory/60 text-sm mb-5">14 scans — for multiple books or client work</p>
              <ul className="text-left space-y-2 text-sm text-m2p-ivory/80 mb-6 flex-1">
                <li>✓ Everything in Author</li>
                <li>✓ 14 scan credits</li>
                <li>✓ Credits never expire</li>
              </ul>
              <PackBuyButton
                priceType="indie_pack"
                label="Buy Indie Pack — $39"
                className="block w-full bg-m2p-orange hover:opacity-90 text-white font-bold px-5 py-3 rounded-xl text-sm transition-opacity disabled:opacity-60"
              />
            </div>

            {/* Card 4 — Pro / Studio */}
            <div
              className="relative flex flex-col rounded-2xl border border-white/12 p-6 text-center shadow-lg shadow-black/20 ring-1 ring-white/5 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)" }}
            >
              <div className="mb-3">
                <span className="inline-block bg-m2p-live text-m2p-ink text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full shadow-[0_0_8px_rgba(76,217,100,0.5)]">
                  LIVE
                </span>
              </div>
              <h3 className="font-bebas text-m2p-ivory text-2xl mb-1">Pro / Studio</h3>
              <div className="font-bebas text-5xl text-m2p-orange leading-none mb-1">$79</div>
              <p className="text-m2p-orange/80 text-xs mb-1">~$2.63 per scan</p>
              <p className="text-m2p-ivory/60 text-sm mb-5">High-volume publishing workflows</p>
              <ul className="text-left space-y-2 text-sm text-m2p-ivory/80 mb-6 flex-1">
                <li>✓ Everything in Indie</li>
                <li>✓ 30 scan credits</li>
                <li>✓ Credits never expire</li>
              </ul>
              <PackBuyButton
                priceType="pro_pack"
                label="Buy Pro Pack — $79"
                className="block w-full bg-m2p-orange hover:opacity-90 text-white font-bold px-5 py-3 rounded-xl text-sm transition-opacity disabled:opacity-60"
              />
            </div>
          </div>

          <p className="mt-8 text-sm text-m2p-ivory/50">
            Credits never expire. No subscription. Use when you need.
          </p>
        </div>
      </section>

      {/* ─── SECTION 7 — SECONDARY CTA ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-m2p-orange via-[#e84e22] to-[#c43d18] py-20 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,rgba(255,255,255,0.15),transparent)]" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6">
          <h2
            className="font-bebas text-white leading-tight mb-4 drop-shadow-md text-balance"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", textWrap: "balance" } as React.CSSProperties}
          >
            Ready to stop KDP rejections before they happen?
          </h2>
          <p className="mx-auto mb-10 max-w-lg text-lg text-white/90">
            Thousands of KDP rejections happen every day. Most are avoidable.
          </p>
          <Link
            href="/kdp-pdf-checker"
            className="inline-block rounded-2xl bg-white px-10 py-4 text-lg font-bold text-m2p-orange shadow-[0_12px_40px_rgba(0,0,0,0.2)] ring-2 ring-white/30 transition-all hover:scale-[1.02] hover:shadow-[0_16px_48px_rgba(0,0,0,0.25)]"
          >
            Scan my PDF — $9
          </Link>
        </div>
      </section>

      {/* ─── SECTION 7B — AFFILIATE CTA ─────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-16 text-center"
        style={{
          background: "linear-gradient(180deg, #152e22 0%, #1A3A2A 50%, #122018 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_100%,rgba(76,217,100,0.08),transparent)]" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6">
          <span
            className="mb-4 inline-block rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold tracking-tight text-white/95"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            Earn with us
          </span>
          <h2
            className="font-bebas text-m2p-ivory leading-tight mb-3 text-balance"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
          >
            Refer authors. Earn 40% on every pack sale.
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-base text-m2p-ivory/65 leading-relaxed">
            Share your link. Earn up to $31.60 per pack sale — with a 12-month attribution cookie and monthly PayPal payouts. The best partner deal in the KDP space.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/partners/apply"
              className="inline-block rounded-xl bg-[#2D6A2D] px-8 py-3 text-sm font-bold text-white shadow-[0_6px_24px_rgba(45,106,45,0.35)] ring-1 ring-white/10 transition-all hover:bg-[#256035]"
            >
              Become a partner →
            </Link>
            <Link
              href="/partners"
              className="inline-block rounded-xl border border-m2p-ivory/35 px-8 py-3 text-sm font-bold text-m2p-ivory/75 transition-colors hover:border-m2p-ivory/55 hover:text-m2p-ivory"
            >
              My dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SECTION 8 — PUBLISHING BEYOND AMAZON ──────────────────────── */}
      <section className="border-t border-[#1A1208]/8 bg-gradient-to-b from-[#E8F0E8] via-[#E2EBE2] to-[#DCE8DC] py-20 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <p
            className="mb-2 text-xs font-semibold tracking-tight text-[#2D6A2D]"
          >
            KDP is just the beginning
          </p>
          <h2 className="font-bebas leading-tight mb-4 text-[#1A1208]" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            <span className="block text-balance">Publishing beyond Amazon</span>
            <span className="mt-1 block opacity-80" style={{ fontSize: "clamp(1.25rem, 2.5vw, 2rem)" }}>
              Tools for every platform
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
          <div className="mb-12 flex flex-wrap justify-center gap-3">
            {[
              "IngramSpark Checker",
              "Barnes & Noble Press",
              "Lulu / Draft2Digital",
            ].map((platform) => (
              <span
                key={platform}
                className="inline-flex items-center gap-2 rounded-full border border-[#1A1208]/12 bg-white/70 px-4 py-2.5 text-sm font-medium text-[#1A1208]/75 shadow-[0_4px_20px_-8px_rgba(26,18,8,0.12)] backdrop-blur-sm"
              >
                {platform}
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D6A2D]">
                  Soon
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
