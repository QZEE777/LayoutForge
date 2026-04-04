"use client";

import { useEffect } from "react";
import Link from "next/link";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

const RULES = [
  "Trim size", "Margin compliance", "Bleed zone", "Font embedding",
  "Page count", "Image resolution", "File size limits", "Color mode",
  "Safe zone", "Spine & cover", "Page-number tags", "26 rules total",
];

const STEPS = [
  { n: "01", title: "Upload your PDF",      desc: "The exact file you plan to submit to KDP. Interior manuscripts only, any page count." },
  { n: "02", title: "See every issue",       desc: "Margins, trim size, bleed, fonts — flagged by page. Score and issue count shown immediately." },
  { n: "03", title: "Fix once. Upload once.", desc: "Pay $9 to unlock the full annotated report. Fix the issues, re-export, publish with confidence." },
];

const FOR_TAGS = ["Canva users", "Vellum users", "First-time authors", "Self-publishers", "Book formatters"];

interface Props {
  checkoutUrl: string;
  refCode: string;
  partnerName: string;
}

export function GoLandingClient({ checkoutUrl, refCode, partnerName }: Props) {
  useEffect(() => {
    if (!refCode) return;
    document.cookie = `m2p_ref=${refCode}; max-age=${THIRTY_DAYS}; path=/; SameSite=Lax`;
    try { localStorage.setItem("m2p_ref", refCode); } catch { /* ignore */ }
  }, [refCode]);

  return (
    <div className="font-sans bg-m2p-ivory text-m2p-ink min-h-screen">

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-m2p-ivory border-b border-m2p-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="no-underline flex items-center">
            <span className="font-black text-lg text-m2p-orange">manu</span>
            <span className="font-black text-lg text-m2p-live">2print</span>
          </Link>
          <a
            href={checkoutUrl}
            className="bg-m2p-orange hover:opacity-90 text-white font-bold text-sm px-5 py-2 rounded-lg no-underline transition-opacity"
          >
            Check My PDF — $9
          </a>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16 lg:py-20 grid lg:grid-cols-[1fr_288px] gap-12 items-center">
        <div>
          {partnerName && (
            <div className="inline-flex items-center gap-1.5 bg-m2p-live/10 border border-m2p-live/25 text-m2p-live font-semibold text-xs px-3 py-1 rounded-full mb-3">
              <span>👤</span>
              Recommended by {partnerName}
            </div>
          )}

          <div className="inline-block bg-m2p-orange/10 text-m2p-orange font-bold text-xs px-3 py-1 rounded-full mb-5 tracking-widest uppercase">
            $9 · One-time · Ready in 90 seconds
          </div>

          <h1 className="text-4xl lg:text-5xl xl:text-[3.25rem] font-black leading-[1.08] mb-5 text-balance">
            Your PDF looks right.{" "}
            <span className="text-m2p-orange">KDP will still reject it.</span>
          </h1>

          <p className="text-base leading-relaxed text-m2p-muted max-w-lg mb-8 text-pretty">
            Check it before you upload — or fix it after rejection. Get a precise,
            page-by-page compliance report in minutes — so you can fix every issue
            before Amazon sees it.
          </p>

          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5 mb-8 max-w-[440px]">
            {[
              "Annotated PDF with every issue highlighted by page",
              "Exact page numbers for every violation",
              "Plain-English fix instructions — no guesswork",
              "Works with Canva, InDesign, Word and PDF exports",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-m2p-ink">
                <span className="text-m2p-live font-bold mt-0.5 shrink-0">✓</span>
                <span className="text-pretty">{item}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <a
              href={checkoutUrl}
              className="inline-block bg-m2p-orange hover:opacity-90 text-white font-bold text-base px-9 py-4 rounded-xl no-underline transition-opacity"
            >
              Check My PDF — $9
            </a>
            <p className="text-sm text-m2p-muted">
              Score is free. $9 unlocks the full annotated report.
            </p>
          </div>
        </div>

        {/* Checkout card — desktop only */}
        <div className="hidden lg:block bg-white border border-m2p-border rounded-2xl p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-sm text-m2p-ink">KDP PDF Checker</span>
            <div className="text-right">
              <div className="text-2xl font-black text-m2p-orange">$9</div>
              <div className="text-xs text-m2p-muted">one-time</div>
            </div>
          </div>
          <div className="bg-m2p-ivory border-2 border-dashed border-m2p-border rounded-xl py-8 px-4 text-center mb-4">
            <div className="text-3xl mb-2">📄</div>
            <p className="text-sm text-m2p-muted mb-0">Drop your PDF here</p>
            <p className="text-xs text-m2p-muted">or click to browse</p>
          </div>
          <a
            href={checkoutUrl}
            className="block bg-m2p-orange hover:opacity-90 text-white font-bold text-sm py-3.5 rounded-xl no-underline text-center transition-opacity"
          >
            Check My PDF →
          </a>
        </div>
      </section>

      {/* ── Problem ───────────────────────────────────────────────────────── */}
      <section className="bg-m2p-ink py-16 lg:py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold text-m2p-orange tracking-[0.1em] uppercase mb-4">
            THE PROBLEM
          </p>
          <h2 className="text-3xl lg:text-4xl font-black text-white mb-3 text-balance">
            Amazon doesn&apos;t tell you what&apos;s wrong.
          </h2>
          <p className="text-base text-white/60 mb-10 max-w-xl mx-auto text-pretty">
            It sends you back to guess. Upload → wait → rejection → guess →
            re-upload → repeat. Sometimes for days. Sometimes for weeks.{" "}
            <strong className="text-white">Every rejection resets your timeline.</strong>
          </p>

          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-xs font-bold text-m2p-orange tracking-widest uppercase mb-3">
                WITHOUT MANU2PRINT
              </p>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                Upload → wait → rejection → guess → re-upload → repeat
              </p>
              <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-3 text-xs text-red-300 leading-relaxed">
                &ldquo;Your file has been rejected. Please review the KDP
                Formatting Guidelines and resubmit your manuscript.&rdquo;
              </div>
            </div>

            <div className="bg-white/5 border border-m2p-live/30 rounded-xl p-5">
              <p className="text-xs font-bold text-m2p-live tracking-widest uppercase mb-3">
                WITH MANU2PRINT
              </p>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                Upload → scan → fix → publish ✓
              </p>
              {[
                'Cover margin 0.5" — needs 0.125"',
                "Two KDP-incompatible fonts",
                "Image 62 DPI — will look blurry",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-amber-300 mb-1.5">
                  <span className="shrink-0">⚠</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 26 Rules ──────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-20 px-6 text-center">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-black mb-3 text-balance">
            KDP checks 26 rules.{" "}
            <span className="text-m2p-orange">Miss one — you&apos;re rejected.</span>
          </h2>
          <p className="text-base text-m2p-muted mb-10 text-pretty">
            We check every one before you upload — so you don&apos;t find out the hard way.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {RULES.map((rule) => (
              <div
                key={rule}
                className={`bg-white border border-m2p-border rounded-xl px-3 py-3.5 text-sm font-semibold ${
                  rule === "26 rules total" ? "text-m2p-orange" : "text-m2p-ink"
                }`}
              >
                {rule}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="bg-m2p-ivory-alt py-16 lg:py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-m2p-orange tracking-[0.1em] uppercase text-center mb-3">
            HOW IT WORKS
          </p>
          <h2 className="text-3xl lg:text-4xl font-black text-center mb-12 text-balance">
            Three steps. No guesswork.
          </h2>
          <div className="grid sm:grid-cols-3 gap-10">
            {STEPS.map((step) => (
              <div key={step.n}>
                <p className="text-5xl font-black text-m2p-orange mb-3 leading-none">{step.n}</p>
                <h3 className="font-extrabold text-lg mb-2 text-m2p-ink">{step.title}</h3>
                <p className="text-sm text-m2p-muted leading-relaxed text-pretty">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="bg-m2p-ink py-16 lg:py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-black text-white mb-3 text-balance">
            Stop guessing.{" "}
            <span className="text-m2p-orange">Start knowing.</span>
          </h2>
          <p className="text-base text-white/60 mb-6 text-pretty">
            Check your file before Amazon does. No waiting. No re-uploads. No guesswork.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {FOR_TAGS.map((tag) => (
              <span
                key={tag}
                className="bg-white/10 border border-white/20 rounded-full px-3.5 py-1.5 text-xs text-white/80"
              >
                {tag}
              </span>
            ))}
          </div>
          <a
            href={checkoutUrl}
            className="inline-block bg-m2p-orange hover:opacity-90 text-white font-bold text-lg px-12 py-5 rounded-2xl no-underline transition-opacity mb-4"
          >
            Check My PDF — $9
          </a>
          <p className="text-sm text-white/40">
            One-time payment · No subscription · Instant report
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-m2p-ivory border-t border-m2p-border py-6 px-6 text-center">
        <p className="mb-2">
          <span className="font-black text-m2p-orange">manu</span>
          <span className="font-black text-m2p-live">2print</span>
          <span className="text-sm text-m2p-muted ml-2">— KDP tools for indie authors.</span>
        </p>
        <div className="flex gap-4 justify-center text-xs text-m2p-muted">
          <Link href="/privacy"  className="hover:text-m2p-ink transition-colors">Privacy</Link>
          <Link href="/terms"    className="hover:text-m2p-ink transition-colors">Terms</Link>
          <Link href="/refunds"  className="hover:text-m2p-ink transition-colors">Refunds</Link>
          <Link href="/contact"  className="hover:text-m2p-ink transition-colors">Contact</Link>
        </div>
      </footer>

    </div>
  );
}
