import Link from "next/link";
import AuthNav from "@/components/AuthNav";
import { ALL_TOOLS, PLATFORMS, type Tool } from "@/data/platformTools";

const BURNT = "#CC5500";
const NAVY = "#131A22";

/** Full-bleed bullseye with arrow: spans viewport, center = CTA link to upload. */
function HeroBullseye() {
  return (
    <section className="relative w-full min-h-[88vh] flex flex-col items-center justify-center overflow-hidden bg-ivory">
      {/* Giant bullseye + arrow: edge-to-edge, below the fold */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full min-h-[88vh] max-w-[180vw] object-contain text-amazon-navy"
          style={{ opacity: 0.92 }}
        >
          {/* Outer rings — concentric circles */}
          <circle cx="200" cy="200" r="195" fill="none" stroke="currentColor" strokeWidth="2" opacity={0.08} />
          <circle cx="200" cy="200" r="160" fill="none" stroke="currentColor" strokeWidth="3" opacity={0.12} />
          <circle cx="200" cy="200" r="125" fill="none" stroke={BURNT} strokeWidth="4" opacity={0.25} />
          <circle cx="200" cy="200" r="90" fill="none" stroke="currentColor" strokeWidth="3" opacity={0.2} />
          <circle cx="200" cy="200" r="58" fill={NAVY} opacity={0.9} />
          <circle cx="200" cy="200" r="36" fill={BURNT} />
          {/* Arrow: shaft + head pointing into center from left */}
          <line x1="48" y1="200" x2="165" y2="200" stroke={BURNT} strokeWidth="6" strokeLinecap="round" opacity={0.9} />
          <path d="M158 182 L178 200 L158 218 Z" fill={BURNT} opacity={0.95} />
        </svg>
      </div>

      {/* Center target = CTA link to upload (above the SVG so it’s clickable) */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full px-4">
        <Link
          href="/kdp-pdf-checker"
          className="group flex flex-col items-center justify-center rounded-full w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 bg-burnt text-white shadow-xl shadow-burnt/30 hover:shadow-2xl hover:shadow-burnt/40 hover:scale-105 transition-all duration-300 border-4 border-white/90"
          aria-label="Check your PDF — go to upload"
        >
          <span className="font-bebas text-xl sm:text-2xl md:text-3xl tracking-tight text-center leading-tight text-balance px-2">
            Check your PDF
          </span>
          <span className="font-sans text-xs sm:text-sm mt-1 opacity-95">Upload →</span>
        </Link>
      </div>

      {/* Headline + subcopy: centered, tighter, below the target */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 pb-12 sm:pb-16 text-center">
        <h1 className="font-bebas text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-amazon-navy mt-6 mb-3 text-balance leading-tight">
          Hit the target before you upload to KDP.
        </h1>
        <p className="font-sans text-base sm:text-lg leading-snug text-soft-muted text-balance">
          26 rules. Trim, margins, bleed. Pass or fix in one click.
        </p>
      </div>
    </section>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const isComingSoon = tool.comingSoon;
  const cardClassName = `rounded-2xl border-2 border-soft-border bg-white p-8 transition-all ${
    isComingSoon
      ? "opacity-85 cursor-default"
      : "hover:border-burnt/50 hover:shadow-lg hover:shadow-burnt/10"
  }`;
  const content = (
    <>
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className={`p-3 rounded-xl ${isComingSoon ? "bg-soft-border text-soft-muted" : "bg-burnt/10 text-burnt"}`}>
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tool.iconPath} />
          </svg>
        </span>
        {isComingSoon && (
          <span className="rounded-full bg-soft-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-soft-muted">
            Coming soon
          </span>
        )}
      </div>
      <h3 className="font-bebas text-xl sm:text-2xl tracking-wide text-amazon-navy mb-2">
        {tool.title}
      </h3>
      <p className="font-sans text-sm sm:text-base text-soft-muted leading-relaxed">
        {tool.description}
      </p>
        {!isComingSoon && (
        <p className="mt-4">
          {tool.free ? (
            <span className="text-sm font-medium text-burnt">Free</span>
          ) : (
            <span className="text-sm font-medium text-amazon-navy">{tool.pricing}</span>
          )}
        </p>
      )}
    </>
  );

  if (isComingSoon) {
    return <div className={cardClassName}>{content}</div>;
  }
  return (
    <Link href={tool.href} className={cardClassName}>
      {content}
    </Link>
  );
}

export default function Home() {
  const kdpPlatform = PLATFORMS[0];
  const tools = kdpPlatform.toolIds
    .map((id) => ALL_TOOLS.find((t) => t.id === id))
    .filter((t): t is Tool => !!t && t.available);

  return (
    <div className="min-h-screen bg-ivory">
      <nav className="sticky top-0 z-30 border-b border-soft-border bg-ivory/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-burnt">
              <svg className="w-4 h-4" fill="none" stroke="#131A22" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-amazon-navy">
              <span className="font-serif">manu</span>
              <span className="font-sans">2print</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/platform/kdp" className="text-sm font-medium text-amazon-navy hover:text-burnt transition-colors">
              Tools
            </Link>
            <Link href="/founders" className="text-sm font-medium text-amazon-navy hover:text-burnt transition-colors">
              Founders
            </Link>
            <AuthNav theme="light" />
          </div>
        </div>
      </nav>

      <HeroBullseye />

      {/* Secondary CTA + trust */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 py-5 bg-arctic/80 border-y border-soft-border">
        <Link
          href="/platform/kdp"
          className="rounded-xl px-6 py-3 text-sm font-bold border-2 border-amazon-navy text-amazon-navy hover:bg-amazon-navy hover:text-white transition-colors text-center"
        >
          See all tools
        </Link>
        <p className="text-center text-sm text-soft-muted max-w-xl mx-auto px-4">
          Your files are processed securely and never stored permanently. No subscription, no lock-in.
        </p>
      </div>

      {/* Social proof ticker */}
      <section className="py-4 overflow-hidden bg-amazon-navy border-y border-amazon-navy" aria-label="Social proof">
        <div className="flex w-[200%] animate-marquee">
          <span className="text-sm font-sans whitespace-nowrap flex-shrink-0 w-1/2 flex items-center gap-12 pr-12 text-burnt">
            <span className="tracking-wide">Trusted by indie authors on Amazon KDP</span>
            <span className="text-white/40" aria-hidden>·</span>
            <span className="tracking-wide">Built for KDP &amp; Kindle</span>
            <span className="text-white/40" aria-hidden>·</span>
            <span className="tracking-wide">No account required to start</span>
          </span>
          <span className="text-sm font-sans whitespace-nowrap flex-shrink-0 w-1/2 flex items-center gap-12 pr-12 text-burnt">
            <span className="tracking-wide">Trusted by indie authors on Amazon KDP</span>
            <span className="text-white/40" aria-hidden>·</span>
            <span className="tracking-wide">Built for KDP &amp; Kindle</span>
            <span className="text-white/40" aria-hidden>·</span>
            <span className="tracking-wide">No account required to start</span>
          </span>
        </div>
      </section>

      {/* What you get — tool cards */}
      <section id="tools" className="px-6 py-16 bg-ivory">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-bebas text-3xl sm:text-4xl tracking-tight text-amazon-navy text-center mb-3 text-balance">
            What you get
          </h2>
          <p className="font-sans text-soft-muted text-center mb-12 max-w-xl mx-auto leading-snug text-balance">
            One place for Amazon KDP and Kindle — check, format, list, and export.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
          <div className="text-center mt-14">
            <Link
              href="/platform/kdp"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold bg-burnt text-white hover:bg-burnt/90 transition-opacity shadow-md"
            >
              See all tools
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-soft-border px-6 py-10 bg-arctic">
        <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 text-sm text-soft-muted text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-burnt flex-shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="#131A22" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="font-medium text-amazon-navy">manu2print</span>
          </div>
          <p className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
            Your files are processed securely and never stored permanently.
            <Link href="/platform/kdp" className="text-burnt hover:underline font-medium">KDP &amp; Kindle tools</Link>
          </p>
        </div>
        <p className="mx-auto max-w-6xl text-center text-sm mt-5 text-soft-muted">
          © 2026 manu2print. KDP &amp; Kindle tools for indie authors.
        </p>
      </footer>
    </div>
  );
}
