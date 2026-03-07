import Link from "next/link";
import AuthNav from "@/components/AuthNav";

const BENEFITS = [
  {
    title: "Format for KDP",
    description: "DOCX to print-ready PDF. Trim size, bleed, margins.",
    href: "/kdp-formatter",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: "KDP Preflight",
    description: "Full PDF validation: 26 rules, trim, margins, bleed. Pass/fail report with on-page highlights.",
    href: "/kdp-pdf-checker",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "KDP Format Review",
    description: "AI review: margins, spacing, headings, KDP readiness. Paste or upload DOCX/PDF.",
    href: "/kdp-format-review",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Keywords & description",
    description: "7 keyword phrases and Amazon listing copy from your manuscript.",
    href: "/keyword-research-pdf",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: "Kindle EPUB",
    description: "Manuscript to Kindle-ready EPUB. One export, one place.",
    href: "/epub-maker",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: "FREE calculators & compressors",
    description: "Royalty, page count, trim, spine, cover size. Shrink PDFs in your browser.",
    href: "/platform/kdp",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <nav className="sticky top-0 z-20 border-b border-white/5 bg-brand-bg/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-brand-gold">
              <svg className="w-4 h-4" fill="none" stroke="#0F0D0B" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span
              className="text-lg font-bold tracking-tight text-brand-cream"
              style={{ textShadow: "0 0 24px rgba(250,247,242,0.25), 0 0 48px rgba(245,166,35,0.12)" }}
            >
              <span className="font-serif">manu</span>
              <span className="font-sans">2print</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/platform/kdp" className="text-sm font-medium text-brand-cream hover:text-brand-gold transition-colors">
              Tools
            </Link>
            <Link href="/founders" className="text-sm font-medium text-brand-cream hover:text-brand-gold transition-colors">
              Founders
            </Link>
            <AuthNav />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-20 pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-bebas text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-brand-cream mb-5">
            The formatting &amp; listing stack <span className="text-brand-gold">for KDP &amp; Kindle</span>
          </h1>
          <p className="font-sans text-lg sm:text-xl leading-relaxed text-brand-muted mb-10 max-w-2xl mx-auto">
            Print-ready interiors, PDF checks, keywords, descriptions, and Kindle EPUB. Pay per use — no subscription.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth"
              className="rounded-lg px-8 py-4 text-base font-semibold bg-brand-gold text-brand-bg hover:opacity-90 transition-opacity text-center"
            >
              Get Started
            </Link>
            <Link
              href="/platform/kdp"
              className="rounded-lg px-8 py-4 text-base font-semibold border border-brand-cardHover text-brand-cream hover:bg-white/5 transition-colors text-center"
            >
              See all tools
            </Link>
          </div>
        </div>
      </section>

      {/* Trust line */}
      <div className="border-y border-white/5 py-4 bg-brand-card/40">
        <p className="text-center text-sm text-brand-muted">
          Your files are processed securely and never stored permanently. Pay when you need it — no lock-in.
        </p>
      </div>

      {/* Social proof ticker */}
      <section className="py-5 overflow-hidden bg-brand-card border-y border-white/5" aria-label="Social proof">
        <div className="flex w-[200%] animate-marquee">
          <span className="text-sm font-sans whitespace-nowrap flex-shrink-0 w-1/2 flex items-center gap-12 pr-12 text-brand-gold/90">
            <span className="tracking-wide">Trusted by indie authors on Amazon KDP</span>
            <span className="text-brand-gold/50" aria-hidden>·</span>
            <span className="tracking-wide">Built for KDP &amp; Kindle</span>
            <span className="text-brand-gold/50" aria-hidden>·</span>
            <span className="tracking-wide">No account required to start</span>
          </span>
          <span className="text-sm font-sans whitespace-nowrap flex-shrink-0 w-1/2 flex items-center gap-12 pr-12 text-brand-gold/90">
            <span className="tracking-wide">Trusted by indie authors on Amazon KDP</span>
            <span className="text-brand-gold/50" aria-hidden>·</span>
            <span className="tracking-wide">Built for KDP &amp; Kindle</span>
            <span className="text-brand-gold/50" aria-hidden>·</span>
            <span className="tracking-wide">No account required to start</span>
          </span>
        </div>
      </section>

      {/* What you get */}
      <section id="tools" className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-bebas text-2xl sm:text-3xl tracking-wide text-brand-cream text-center mb-3">
            What you get
          </h2>
          <p className="font-sans text-brand-muted text-center mb-12 max-w-xl mx-auto">
            One place for everything Amazon KDP and Kindle — format, check, list, and export.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-xl border border-brand-cardHover bg-brand-card p-6 hover:border-brand-gold/40 hover:shadow-gold-glow transition-all"
              >
                <div className="text-brand-gold mb-4 group-hover:text-brand-cream transition-colors">
                  {item.icon}
                </div>
                <h3 className="font-bebas text-lg tracking-wide text-brand-cream mb-2">
                  {item.title}
                </h3>
                <p className="font-sans text-sm text-brand-muted">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/platform/kdp"
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold bg-brand-gold text-brand-bg hover:opacity-90 transition-opacity"
            >
              See all tools
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-10 bg-brand-bg">
        <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 text-sm text-brand-muted text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-brand-gold flex-shrink-0">
              <svg className="w-3 h-3" fill="none" stroke="#0F0D0B" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="font-medium text-brand-cream">manu2print</span>
          </div>
          <p className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
            Your files are processed securely and never stored permanently.
            <Link href="/platform/kdp" className="hover:text-brand-gold transition-colors">KDP &amp; Kindle tools</Link>
          </p>
        </div>
        <p className="mx-auto max-w-6xl text-center text-sm mt-5 text-brand-muted">
          © 2026 manu2print. KDP &amp; Kindle tools for indie authors.
        </p>
      </footer>
    </div>
  );
}
