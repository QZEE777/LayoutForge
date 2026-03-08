import Link from "next/link";
import AuthNav from "@/components/AuthNav";
import { ALL_TOOLS, PLATFORMS, type Tool } from "@/data/platformTools";

const BRAVE = "#FB542B";
const NAVY = "#131A22";

/** Full-bleed bullseye: spans viewport, center = CTA link to upload. */
function HeroBullseye() {
  return (
    <section className="relative w-full min-h-[88vh] flex flex-col items-center justify-center overflow-hidden bg-ivory">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full min-h-[88vh] max-w-[180vw] object-contain text-amazon-navy"
          style={{ opacity: 0.92 }}
        >
          <circle cx="200" cy="200" r="195" fill="none" stroke="currentColor" strokeWidth="2" opacity={0.08} />
          <circle cx="200" cy="200" r="160" fill="none" stroke="currentColor" strokeWidth="3" opacity={0.12} />
          <circle cx="200" cy="200" r="125" fill="none" stroke={BRAVE} strokeWidth="4" opacity={0.25} />
          <circle cx="200" cy="200" r="90" fill="none" stroke="currentColor" strokeWidth="3" opacity={0.2} />
          <circle cx="200" cy="200" r="58" fill={NAVY} opacity={0.9} />
          <circle cx="200" cy="200" r="36" fill={BRAVE} />
        </svg>
      </div>

      {/* Center target = CTA link to upload (above the SVG so it’s clickable) */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full px-4">
        <Link
          href="/kdp-pdf-checker"
          className="group flex flex-col items-center justify-center rounded-full w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 bg-brave text-white shadow-xl shadow-brave/30 hover:shadow-2xl hover:shadow-brave/40 hover:scale-105 transition-all duration-300 border-4 border-white/90"
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
          26 Rules. Trim, Margins, Bleed. Pass Or Fix In One Click.
        </p>
      </div>
    </section>
  );
}

/** Card ~1/3 smaller, centered text and icon; FREE in caps green, COMING SOON in caps. */
function ToolCard({ tool }: { tool: Tool }) {
  const isComingSoon = tool.comingSoon;
  const cardClassName = `rounded-xl border border-soft-border bg-white p-5 transition-all flex flex-col items-center text-center min-h-0 ${
    isComingSoon
      ? "opacity-85 cursor-default"
      : "hover:border-brave/50 hover:shadow-md hover:shadow-brave/10"
  }`;
  const content = (
    <>
      <div className="flex flex-col items-center gap-2 mb-3">
        <span className={`p-2 rounded-lg ${isComingSoon ? "bg-soft-border text-soft-muted" : "bg-brave/10 text-brave"}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tool.iconPath} />
          </svg>
        </span>
      </div>
      <h3 className="font-bebas text-base sm:text-lg tracking-wide text-amazon-navy mb-1.5">
        {tool.title}
      </h3>
      <p className="font-sans text-xs text-soft-muted leading-snug flex-1">
        {tool.description}
      </p>
      {isComingSoon ? (
        <div className="mt-3 w-full rounded-lg bg-freeGreen py-2 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-white">Coming Soon</span>
        </div>
      ) : (
        <p className="mt-2">
          {tool.free ? (
            <span className="text-xs font-bold uppercase text-freeGreen">FREE</span>
          ) : (
            <span className="text-xs font-medium text-amazon-navy">{tool.pricing}</span>
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
  const paidTools = tools.filter((t) => !t.free && !t.comingSoon);
  const comingSoonTools = tools.filter((t) => t.comingSoon);
  const freeTools = tools.filter((t) => t.free);

  return (
    <div className="min-h-screen bg-ivory">
      <nav className="sticky top-0 z-30 border-b border-soft-border bg-ivory/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-brave">
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
            <Link href="/platform/kdp" className="text-sm font-medium text-amazon-navy hover:text-brave transition-colors">
              Tools
            </Link>
            <Link href="/founders" className="text-sm font-medium text-amazon-navy hover:text-brave transition-colors">
              Founders
            </Link>
            <AuthNav theme="light" />
          </div>
        </div>
      </nav>

      <HeroBullseye />

      {/* Trust: two lines, centered */}
      <div className="py-5 bg-arctic/80 border-y border-soft-border">
        <p className="text-center text-sm text-soft-muted max-w-xl mx-auto px-4">
          Your files are processed securely and never stored permanently.
        </p>
        <p className="text-center text-sm text-soft-muted mt-1">
          No subscription, no lock-in.
        </p>
      </div>

      {/* Social proof ticker — all caps, bold, bright orange */}
      <section className="py-4 overflow-hidden bg-amazon-navy border-y border-amazon-navy" aria-label="Social proof">
        <div className="flex w-[200%] animate-marquee">
          <span className="text-sm font-bold font-sans uppercase whitespace-nowrap flex-shrink-0 w-1/2 flex items-center gap-12 pr-12 tracking-wider text-brave">
            <span>Trusted by indie authors on Amazon KDP</span>
            <span className="text-white/50" aria-hidden>✦</span>
            <span>Built for KDP &amp; Kindle</span>
            <span className="text-white/50" aria-hidden>✦</span>
            <span>No account required to start</span>
          </span>
          <span className="text-sm font-bold font-sans uppercase whitespace-nowrap flex-shrink-0 w-1/2 flex items-center gap-12 pr-12 tracking-wider text-brave">
            <span>Trusted by indie authors on Amazon KDP</span>
            <span className="text-white/50" aria-hidden>✦</span>
            <span>Built for KDP &amp; Kindle</span>
            <span className="text-white/50" aria-hidden>✦</span>
            <span>No account required to start</span>
          </span>
        </div>
      </section>

      {/* What you get — paid, then coming soon (shaded), then free (shaded) */}
      <section id="tools" className="px-6 py-16 bg-ivory">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-bebas text-3xl sm:text-4xl tracking-tight text-amazon-navy text-center mb-3 text-balance">
            What you get
          </h2>
          <p className="font-sans text-soft-muted text-center mb-10 max-w-xl mx-auto leading-snug text-balance">
            One place for Amazon KDP and Kindle — check, format, list, and export.
          </p>

          {paidTools.length > 0 && (
            <div className="rounded-2xl border-2 border-brave bg-brave/10 p-6 mb-10 flex justify-center">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
                {paidTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )}

          {comingSoonTools.length > 0 && (
            <div className="rounded-2xl bg-soft-border/50 border border-soft-border p-6 mb-10">
              <p className="font-bebas text-xl sm:text-2xl font-bold uppercase tracking-wider text-amazon-navy text-center mb-4">Coming Soon</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {comingSoonTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )}

          {freeTools.length > 0 && (
            <div className="rounded-2xl bg-freeGreen/5 border border-freeGreen/20 p-6">
              <p className="font-bebas text-xl sm:text-2xl font-bold uppercase tracking-wider text-freeGreen text-center mb-4">Free Tools</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {freeTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer — Legals, T&Cs, About, Affiliate, FAQ, Contact, Refunds, etc. */}
      <footer className="border-t border-soft-border px-6 py-10 bg-arctic">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-brave flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="#131A22" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <span className="font-medium text-amazon-navy">manu2print</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm" aria-label="Footer">
              <Link href="/legal" className="text-soft-muted hover:text-brave transition-colors">Legal</Link>
              <Link href="/terms" className="text-soft-muted hover:text-brave transition-colors">Terms &amp; Conditions</Link>
              <Link href="/privacy" className="text-soft-muted hover:text-brave transition-colors">Privacy Policy</Link>
              <Link href="/about" className="text-soft-muted hover:text-brave transition-colors">About</Link>
              <Link href="/affiliate" className="text-soft-muted hover:text-brave transition-colors">Affiliate</Link>
              <Link href="/faq" className="text-soft-muted hover:text-brave transition-colors">FAQ</Link>
              <Link href="/contact" className="text-soft-muted hover:text-brave transition-colors">Contact</Link>
              <Link href="/refunds" className="text-soft-muted hover:text-brave transition-colors">Refund Policy</Link>
              <Link href="/cookies" className="text-soft-muted hover:text-brave transition-colors">Cookies</Link>
              <Link href="/platform/kdp" className="text-brave hover:underline font-medium">Tools</Link>
            </nav>
          </div>
          <p className="text-center text-sm text-soft-muted mt-4">
            Your files are processed securely and never stored permanently.
          </p>
          <p className="text-center text-sm mt-3 text-soft-muted">
            © 2026 manu2print. KDP &amp; Kindle tools for indie authors.
          </p>
        </div>
      </footer>
    </div>
  );
}
