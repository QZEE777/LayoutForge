import Link from "next/link";
import AuthNav from "@/components/AuthNav";
import { ALL_TOOLS, PLATFORMS, type Tool } from "@/data/platformTools";

/** Bullseye: concentric circles, Amazon palette. Center = Print ready / KDP. */
function BullseyeIcon() {
  return (
    <div className="mx-auto w-48 h-48 sm:w-56 sm:h-56 flex-shrink-0" aria-hidden>
      <svg viewBox="0 0 120 120" className="w-full h-full text-amazon-navy">
        <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="3" opacity={0.15} />
        <circle cx="60" cy="60" r="42" fill="none" stroke="#FF9900" strokeWidth="4" opacity={0.5} />
        <circle cx="60" cy="60" r="30" fill="currentColor" />
        <circle cx="60" cy="60" r="18" fill="#FF9900" />
        <text x="60" y="62" textAnchor="middle" fill="#131A22" fontSize="11" fontWeight="700" fontFamily="var(--font-bebas-neue), Impact, sans-serif">KDP</text>
      </svg>
    </div>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const isComingSoon = tool.comingSoon;
  const cardClassName = `rounded-2xl border-2 border-soft-border bg-white p-8 transition-all ${
    isComingSoon
      ? "opacity-85 cursor-default"
      : "hover:border-amazon-orange/50 hover:shadow-lg hover:shadow-amazon-orange/10"
  }`;
  const content = (
    <>
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className={`p-3 rounded-xl ${isComingSoon ? "bg-soft-border text-soft-muted" : "bg-amazon-orange/10 text-amazon-orange"}`}>
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
            <span className="text-sm font-medium text-amazon-orange">Free</span>
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
    <div className="min-h-screen bg-soft-white">
      <nav className="sticky top-0 z-20 border-b border-soft-border bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-amazon-orange">
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
            <Link href="/platform/kdp" className="text-sm font-medium text-amazon-navy hover:text-amazon-orange transition-colors">
              Tools
            </Link>
            <Link href="/founders" className="text-sm font-medium text-amazon-navy hover:text-amazon-orange transition-colors">
              Founders
            </Link>
            <AuthNav theme="light" />
          </div>
        </div>
      </nav>

      {/* Hero — bullseye + one clear CTA */}
      <section className="px-6 pt-12 sm:pt-16 pb-14">
        <div className="mx-auto max-w-4xl flex flex-col items-center text-center">
          <BullseyeIcon />
          <h1 className="font-bebas text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-wide text-amazon-navy mt-6 mb-4">
            Check your print PDF <span className="text-amazon-orange">before you upload</span>
          </h1>
          <p className="font-sans text-lg sm:text-xl leading-relaxed text-soft-muted mb-8 max-w-2xl">
            One click. 26 KDP rules. Trim, margins, bleed — pass or fix. Then format, keywords, and Kindle EPUB when you’re ready. No lock-in.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/kdp-pdf-checker"
              className="rounded-xl px-8 py-4 text-base font-bold bg-amazon-orange text-amazon-navy hover:bg-amazon-orange/90 transition-all shadow-lg shadow-amazon-orange/20"
            >
              Check your PDF now
            </Link>
            <Link
              href="/platform/kdp"
              className="rounded-xl px-8 py-4 text-base font-semibold border-2 border-amazon-navy text-amazon-navy hover:bg-amazon-navy hover:text-white transition-colors"
            >
              See all tools
            </Link>
          </div>
        </div>
      </section>

      {/* Trust line — subliminal security + control */}
      <div className="border-y border-soft-border py-4 bg-white/60">
        <p className="text-center text-sm text-soft-muted max-w-2xl mx-auto px-4">
          Your files are processed securely and never stored permanently. Pay when you need it — no subscription, no lock-in.
        </p>
      </div>

      {/* Social proof ticker */}
      <section className="py-4 overflow-hidden bg-amazon-navy border-y border-amazon-navy" aria-label="Social proof">
        <div className="flex w-[200%] animate-marquee">
          <span className="text-sm font-sans whitespace-nowrap flex-shrink-0 w-1/2 flex items-center gap-12 pr-12 text-amazon-orange">
            <span className="tracking-wide">Trusted by indie authors on Amazon KDP</span>
            <span className="text-white/40" aria-hidden>·</span>
            <span className="tracking-wide">Built for KDP &amp; Kindle</span>
            <span className="text-white/40" aria-hidden>·</span>
            <span className="tracking-wide">No account required to start</span>
          </span>
          <span className="text-sm font-sans whitespace-nowrap flex-shrink-0 w-1/2 flex items-center gap-12 pr-12 text-amazon-orange">
            <span className="tracking-wide">Trusted by indie authors on Amazon KDP</span>
            <span className="text-white/40" aria-hidden>·</span>
            <span className="tracking-wide">Built for KDP &amp; Kindle</span>
            <span className="text-white/40" aria-hidden>·</span>
            <span className="tracking-wide">No account required to start</span>
          </span>
        </div>
      </section>

      {/* What you get — tool cards, happy medium size, names prominent */}
      <section id="tools" className="px-6 py-16 bg-soft-white">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-bebas text-3xl sm:text-4xl tracking-wide text-amazon-navy text-center mb-3">
            What you get
          </h2>
          <p className="font-sans text-soft-muted text-center mb-12 max-w-xl mx-auto">
            One place for everything Amazon KDP and Kindle — check, format, list, and export.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
          <div className="text-center mt-14">
            <Link
              href="/platform/kdp"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold bg-amazon-orange text-amazon-navy hover:bg-amazon-orange/90 transition-opacity shadow-md"
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
      <footer className="border-t border-soft-border px-6 py-10 bg-white">
        <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 text-sm text-soft-muted text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-amazon-orange flex-shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="#131A22" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="font-medium text-amazon-navy">manu2print</span>
          </div>
          <p className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
            Your files are processed securely and never stored permanently.
            <Link href="/platform/kdp" className="text-amazon-orange hover:underline font-medium">KDP &amp; Kindle tools</Link>
          </p>
        </div>
        <p className="mx-auto max-w-6xl text-center text-sm mt-5 text-soft-muted">
          © 2026 manu2print. KDP &amp; Kindle tools for indie authors.
        </p>
      </footer>
    </div>
  );
}
