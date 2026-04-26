import Link from "next/link";
import Image from "next/image";
import { BrandWordmark } from "@/components/BrandWordmark";

export const metadata = {
  title: "KDP PDF Checker — Fix Formatting Errors Before You Upload to Amazon KDP | manu2print",
  description:
    "Check your PDF for KDP formatting errors before you upload to Amazon KDP. Find margin violations, bleed issues, trim size mismatches, and font errors in 90 seconds. Built for indie authors and self-publishers.",
};

const FREE_TOOLS = [
  {
    icon: "📐",
    name: "Spine Calculator",
    description: "Get the exact spine width for your paperback before you design your cover.",
    href: "/spine-calculator",
  },
  {
    icon: "💰",
    name: "Royalty Calculator",
    description: "See your KDP royalty before you set your price.",
    href: "/royalty-calculator",
  },
  {
    icon: "📄",
    name: "Page Count Estimator",
    description: "Estimate your final page count from word count and trim size.",
    href: "/page-count-estimator",
  },
  {
    icon: "🔍",
    name: "Title & Metadata Check",
    description: "Scan your title and keywords for banned or restricted terms.",
    href: "/title-metadata-check",
  },
];

const KDP_ERRORS = [
  {
    icon: "📏",
    title: "Margins outside KDP print area",
    body: "Too narrow on any side — or a gutter margin that doesn't account for page count — triggers an automatic rejection.",
  },
  {
    icon: "🩸",
    title: "Bleed not set correctly",
    body: "Images and backgrounds that extend to the edge require a 0.125\" bleed. Missing bleed is one of the most common KDP rejection causes.",
  },
  {
    icon: "📐",
    title: "Trim size mismatch",
    body: "Your PDF page size must exactly match the KDP trim size you selected — even a fraction of an inch off will fail.",
  },
  {
    icon: "🔤",
    title: "Fonts not embedded",
    body: "KDP requires all fonts to be embedded in the PDF. Un-embedded fonts cause text rendering failures during printing.",
  },
  {
    icon: "📄",
    title: "Page size inconsistencies",
    body: "Mixed page sizes in a single PDF — common when exporting from Canva or Word — cause formatting errors across the entire file.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Upload your interior PDF",
    body: "The exact file you plan to submit to Amazon KDP. PDF only — no account required.",
  },
  {
    step: "02",
    title: "See your score and detected issues",
    body: "We check 26 KDP print requirements and return a compliance score with a full issue list in under 90 seconds.",
  },
  {
    step: "03",
    title: "Unlock the full annotated report",
    body: "Pay $9 to download the annotated PDF — every issue highlighted on the exact page it appears, with plain-English fix instructions.",
  },
];

const FAQS = [
  {
    q: "Why did KDP reject my PDF?",
    a: "KDP rejects PDFs for many reasons — margins too narrow, incorrect trim size, fonts not embedded, or bleed settings missing. The rejection email rarely tells you what's wrong. This tool checks all 26 KDP print requirements and tells you exactly what to fix before you re-upload.",
  },
  {
    q: "What formatting issues does KDP check?",
    a: "KDP reviews margins, trim size, bleed, font embedding, page size consistency, image resolution, and color mode. A single KDP formatting error can trigger a rejection — even if your file looks correct on screen.",
  },
  {
    q: "How do I fix KDP margin errors?",
    a: "KDP requires a minimum 0.25\" margin on all sides, with a wider gutter margin (0.5\"–0.875\" depending on page count). Open your file in InDesign, Word, or Affinity Publisher, correct the margins to meet KDP's print requirements, then re-export as PDF.",
  },
  {
    q: "Does this tool guarantee KDP approval?",
    a: "No tool can guarantee that — Amazon's review is theirs alone. But fixing every flagged issue removes the most common KDP rejection causes and significantly improves your chances of approval on the first upload.",
  },
  {
    q: "How long does the KDP PDF scan take?",
    a: "Most scans complete in under 90 seconds. Larger files (100+ pages, heavy images) may take up to 3 minutes. Your score and issue count appear immediately — the full annotated report unlocks for $9.",
  },
];

export default function HomePage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #FAF7EE 0%, #F2EBDF 35%, #FAF8F4 100%)" }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="border-b border-[#1A6B2A]/10 bg-[#FAF7EE]/75 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto max-w-5xl px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <BrandWordmark variant="onLight" className="text-lg sm:text-xl" />
          </Link>
          <Link
            href="/kdp-pdf-checker"
            className="rounded-xl font-bold text-sm px-4 py-2 transition-opacity hover:opacity-80"
            style={{ background: "#f05a28", color: "#fff" }}
          >
            Check My PDF →
          </Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide mb-6"
            style={{
              background: "rgba(240,90,40,0.08)",
              color: "#f05a28",
              border: "1px solid rgba(240,90,40,0.15)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "#f05a28" }}
            />
            Checks against real KDP print requirements
          </div>

          <h1
            className="font-black leading-tight mb-6 mx-auto"
            style={{
              color: "#1A1208",
              fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
              letterSpacing: "-0.03em",
              maxWidth: "780px",
              textWrap: "balance",
            } as React.CSSProperties}
          >
            KDP PDF Checker —{" "}
            <span style={{ color: "#f05a28" }}>
              Fix Formatting Errors Before You Upload to Amazon KDP
            </span>
          </h1>

          <div className="mx-auto mb-8" style={{ maxWidth: "560px" }}>
            <p className="text-lg leading-relaxed mb-4" style={{ color: "#3a3020" }}>
              You upload your book. It looks correct.
              <br />
              KDP reviews it… and rejects it days later.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "#6B6151" }}>
              Margins. Bleed. Fonts. Trim size.
              <br />
              Issues you don&apos;t see — but KDP does.
            </p>
          </div>

          <Link
            href="/kdp-pdf-checker"
            className="inline-flex items-center gap-2 rounded-xl font-black text-base px-8 py-4 transition-opacity hover:opacity-90 mb-4"
            style={{ background: "#f05a28", color: "#fff" }}
          >
            Check your PDF now →
          </Link>

          <p className="text-xs" style={{ color: "#9B8E7E" }}>
            No account required &nbsp;•&nbsp; Secure upload &nbsp;•&nbsp; Instant scan
          </p>
        </div>
      </section>

      {/* ── Common KDP Errors ──────────────────────────────────── */}
      <section style={{ background: "#1A1208", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="text-center mb-10">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Why files get rejected
            </p>
            <h2
              className="font-black mb-3"
              style={{
                color: "#fff",
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                letterSpacing: "-0.02em",
                textWrap: "balance",
              } as React.CSSProperties}
            >
              Common KDP formatting errors this tool finds
            </h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              Built for indie authors and self-publishers. No guesswork — exact issues identified.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {KDP_ERRORS.map((err) => (
              <div
                key={err.title}
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span className="text-2xl mb-3 block">{err.icon}</span>
                <p className="font-bold text-sm mb-2" style={{ color: "#fff" }}>
                  {err.title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {err.body}
                </p>
              </div>
            ))}

            {/* Manny thumbs-up clipboard — 6th cell on large screens */}
            <div
              className="rounded-2xl overflow-hidden flex items-center justify-center sm:col-span-2 lg:col-span-1"
              style={{
                background: "#1A1208",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <Image
                src="/manny/manny_thumbs_up_clipboard_01.png"
                alt="manu2print KDP PDF checker"
                width={140}
                height={140}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Free Tools ─────────────────────────────────────────── */}
      <section style={{ background: "#FAF8F4", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="text-center mb-10">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "#9B8E7E" }}
            >
              Free Tools
            </p>
            <h2
              className="font-black mb-2"
              style={{
                color: "#1A1208",
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                letterSpacing: "-0.02em",
                textWrap: "balance",
              } as React.CSSProperties}
            >
              Everything you need before you upload.
            </h2>
            <p className="text-sm" style={{ color: "#6B6151" }}>
              No account. No payment. Just tools that work.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            {FREE_TOOLS.map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                className="group flex flex-col rounded-2xl p-6 transition-all duration-200 hover:shadow-[0_12px_32px_-12px_rgba(13,61,24,0.18)] hover:border-[#1A6B2A]/20"
                style={{
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.07)",
                }}
              >
                <span className="text-2xl mb-3">{tool.icon}</span>
                <p className="font-bold text-sm mb-2" style={{ color: "#1A1208" }}>
                  {tool.name}
                </p>
                <p
                  className="text-xs leading-relaxed flex-1"
                  style={{ color: "#6B6151" }}
                >
                  {tool.description}
                </p>
                <p
                  className="text-xs font-bold mt-4 transition-colors group-hover:text-[#f05a28]"
                  style={{ color: "#9B8E7E" }}
                >
                  Use free →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bridge CTA ─────────────────────────────────────────── */}
      <section
        style={{
          background: "rgba(240,90,40,0.04)",
          borderTop: "1px solid rgba(240,90,40,0.1)",
          borderBottom: "1px solid rgba(240,90,40,0.1)",
        }}
      >
        <div className="mx-auto max-w-3xl px-6 py-14 text-center">
          <h2
            className="font-black leading-tight mb-4"
            style={{
              color: "#1A1208",
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              letterSpacing: "-0.02em",
              textWrap: "balance",
            } as React.CSSProperties}
          >
            Before you upload to KDP —{" "}
            <span style={{ color: "#f05a28" }}>check your file first.</span>
          </h2>
          <p className="text-base mb-8" style={{ color: "#6B6151" }}>
            Fix KDP formatting errors before Amazon sees your file. One scan. Every issue. No surprises.
          </p>
          <Link
            href="/kdp-pdf-checker"
            className="inline-flex items-center gap-2 rounded-xl font-black text-base px-8 py-4 transition-opacity hover:opacity-90"
            style={{ background: "#f05a28", color: "#fff" }}
          >
            Check your PDF now →
          </Link>
          <p className="text-xs mt-3" style={{ color: "#9B8E7E" }}>
            Score preview free · Full annotated report $9 · No subscription
          </p>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section style={{ background: "#FAF8F4", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "#9B8E7E" }}
          >
            How it works
          </p>
          <h2
            className="font-black mb-2"
            style={{
              color: "#1A1208",
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              letterSpacing: "-0.02em",
              textWrap: "balance",
            } as React.CSSProperties}
          >
            Three steps. No guesswork.
          </h2>
          <p className="text-sm mb-10" style={{ color: "#9B8E7E" }}>
            If your file has a KDP formatting error, we catch it before Amazon does.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((s) => (
              <div
                key={s.step}
                className="rounded-2xl p-6 text-left"
                style={{
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.07)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}
              >
                <p
                  className="font-black text-4xl mb-3"
                  style={{ color: "rgba(240,90,40,0.18)" }}
                >
                  {s.step}
                </p>
                <p className="font-bold text-sm mb-2" style={{ color: "#1A1208" }}>
                  {s.title}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#6B6151" }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section style={{ background: "#FAF7EE", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="text-center mb-10">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "#9B8E7E" }}
            >
              Questions
            </p>
            <h2
              className="font-black"
              style={{
                color: "#1A1208",
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                letterSpacing: "-0.02em",
                textWrap: "balance",
              } as React.CSSProperties}
            >
              KDP PDF formatting — common questions
            </h2>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}
          >
            {FAQS.map((item, i) => (
              <details
                key={i}
                className="group"
                style={{
                  borderBottom:
                    i < FAQS.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                }}
              >
                <summary
                  className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none select-none"
                  style={{ color: "#1A1208" }}
                >
                  <span className="font-semibold text-sm">{item.q}</span>
                  <span
                    className="shrink-0 text-lg leading-none"
                    style={{ color: "#f05a28" }}
                  >
                    +
                  </span>
                </summary>
                <p
                  className="px-6 pb-5 text-sm leading-relaxed"
                  style={{ color: "#6B6151" }}
                >
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(0,0,0,0.07)", background: "#FAF8F4" }}>
        <div className="mx-auto max-w-5xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "#C4B5A0" }}>
            © 2026 manu2print.com · KDP tools for indie authors
          </p>
          <div className="flex items-center gap-4 text-xs" style={{ color: "#9B8E7E" }}>
            <Link href="/privacy" className="hover:opacity-70 transition-opacity">Privacy</Link>
            <Link href="/terms" className="hover:opacity-70 transition-opacity">Terms</Link>
            <Link href="/refunds" className="hover:opacity-70 transition-opacity">Refunds</Link>
            <Link href="/contact" className="hover:opacity-70 transition-opacity">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
