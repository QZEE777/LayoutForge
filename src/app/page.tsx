import Link from "next/link";
import { BrandWordmark } from "@/components/BrandWordmark";

export const metadata = {
  title: "manu2print — KDP Tools for Indie Authors",
  description:
    "Know before KDP does. Check your PDF for compliance, calculate your spine, estimate royalties, and more — free tools for self-publishers.",
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
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
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
            KDP compliance tools for indie authors
          </div>

          <h1
            className="font-black leading-tight mb-5 mx-auto"
            style={{
              color: "#1A1208",
              fontSize: "clamp(2.4rem, 5vw, 3.5rem)",
              letterSpacing: "-0.03em",
              maxWidth: "720px",
            }}
          >
            Know before{" "}
            <span style={{ color: "#f05a28" }}>KDP does.</span>
          </h1>

          <p
            className="text-lg leading-relaxed mb-4 mx-auto"
            style={{ color: "#6B6151", maxWidth: "560px" }}
          >
            Most KDP rejections are preventable. Upload your PDF, find every
            compliance issue before Amazon does, and publish with confidence.
          </p>

          <p className="text-sm mb-10" style={{ color: "#9B8E7E" }}>
            Checks margins, trim, fonts, bleed, and 26 more rules — in under 90 seconds.
          </p>

          <Link
            href="/kdp-pdf-checker"
            className="inline-flex items-center gap-2 rounded-xl font-black text-base px-8 py-4 transition-opacity hover:opacity-90"
            style={{ background: "#f05a28", color: "#fff" }}
          >
            Check My PDF — $9 →
          </Link>

          <p className="text-xs mt-3" style={{ color: "#9B8E7E" }}>
            Score preview free · $9 unlocks the full annotated report
          </p>
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
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                letterSpacing: "-0.02em",
              }}
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

      {/* ── Bridge ─────────────────────────────────────────────── */}
      <section style={{ background: "#1A1208", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Next step
          </p>
          <h2
            className="font-black leading-tight mb-4"
            style={{
              color: "#fff",
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              letterSpacing: "-0.02em",
            }}
          >
            Calculated. Estimated. Checked.{" "}
            <span style={{ color: "#f05a28" }}>Now verify the file.</span>
          </h2>
          <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
            The free tools get you ready. The PDF Checker makes sure your file is.
          </p>
          <Link
            href="/kdp-pdf-checker"
            className="inline-flex items-center gap-2 rounded-xl font-black text-base px-8 py-4 transition-opacity hover:opacity-90"
            style={{ background: "#f05a28", color: "#fff" }}
          >
            Check My PDF →
          </Link>
          <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.3)" }}>
            $9 · 2 scans included · Results in ~90 seconds
          </p>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section
        style={{
          background: "rgba(240,90,40,0.04)",
          borderTop: "1px solid rgba(240,90,40,0.1)",
        }}
      >
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2
            className="font-black leading-tight mb-4"
            style={{
              color: "#1A1208",
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              letterSpacing: "-0.02em",
            }}
          >
            Stop guessing.{" "}
            <span style={{ color: "#f05a28" }}>Start knowing.</span>
          </h2>
          <p className="text-base mb-8" style={{ color: "#6B6151" }}>
            One upload. Every issue. No surprises when Amazon reviews your file.
          </p>
          <Link
            href="/kdp-pdf-checker"
            className="inline-flex items-center gap-2 rounded-xl font-black text-base px-8 py-4 transition-opacity hover:opacity-90"
            style={{ background: "#f05a28", color: "#fff" }}
          >
            Check My PDF — $9 →
          </Link>
          <p className="text-xs mt-3" style={{ color: "#9B8E7E" }}>
            Score preview free · Full report $9 · No subscription
          </p>
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
