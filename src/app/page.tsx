import Link from "next/link";
import AuthNav from "@/components/AuthNav";

/** Hero visual: PDF-style doc with diagnostic-style markers (red / yellow / green). Static SVG only. */
function HeroPdfVisual() {
  return (
    <div className="w-full max-w-md mx-auto flex justify-center" aria-hidden>
      <svg viewBox="0 0 280 360" className="w-full h-auto drop-shadow-lg" fill="none">
        {/* Page shape */}
        <rect x="20" y="20" width="240" height="320" rx="4" fill="#FFFFF0" stroke="#E5E4E1" strokeWidth="2" />
        {/* Trim area (green = safe) */}
        <rect x="40" y="40" width="200" height="280" rx="2" fill="none" stroke="#16A34A" strokeWidth="2" strokeDasharray="6 4" opacity="0.9" />
        {/* Margin warning (yellow) */}
        <rect x="52" y="52" width="176" height="256" rx="1" fill="none" stroke="#EAB308" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
        {/* Bleed / edge issue (red) */}
        <line x1="20" y1="80" x2="260" y2="80" stroke="#DC2626" strokeWidth="2" opacity="0.7" />
        <circle cx="50" cy="80" r="4" fill="#DC2626" opacity="0.8" />
        <circle cx="230" cy="80" r="4" fill="#DC2626" opacity="0.8" />
        {/* Gutter hint */}
        <line x1="140" y1="52" x2="140" y2="332" stroke="#131A22" strokeWidth="1" opacity="0.15" />
        {/* Decorative text lines */}
        <rect x="60" y="100" width="120" height="8" rx="2" fill="#E5E4E1" opacity="0.6" />
        <rect x="60" y="118" width="160" height="8" rx="2" fill="#E5E4E1" opacity="0.5" />
        <rect x="60" y="136" width="140" height="8" rx="2" fill="#E5E4E1" opacity="0.5" />
      </svg>
    </div>
  );
}

/** Directive toolkit card: variant = primary (orange) | available (blue) | coming (green) | ai (purple) */
function DirectiveToolCard({
  title,
  description,
  capabilities,
  cta,
  ctaHref,
  variant,
}: {
  title: string;
  description: string;
  capabilities?: string[];
  cta: string;
  ctaHref?: string;
  variant: "primary" | "available" | "coming" | "ai";
}) {
  const variantStyles = {
    primary: "border-2 border-brave bg-brave/10 shadow-md shadow-brave/10",
    available: "border-2 border-blue-600/40 bg-blue-50",
    coming: "border border-soft-border bg-white/80",
    ai: "border-2 border-violet-500/40 bg-violet-50/80",
  };
  const buttonStyles = {
    primary: "bg-brave text-white hover:bg-brave/90",
    available: "bg-blue-600 text-white hover:bg-blue-700",
    coming: "bg-freeGreen/80 text-white cursor-default pointer-events-none",
    ai: "bg-violet-600 text-white hover:bg-violet-700",
  };
  const isComingSoon = variant === "coming" && !ctaHref;
  return (
    <div className={`rounded-xl p-5 flex flex-col ${variantStyles[variant]}`}>
      <h3 className="font-bebas text-lg sm:text-xl tracking-wide text-amazon-navy mb-2">{title}</h3>
      <p className="text-sm text-soft-muted flex-1 mb-3">{description}</p>
      {capabilities && capabilities.length > 0 && (
        <ul className="text-xs text-amazon-navy/80 space-y-1 mb-3 list-disc list-inside">
          {capabilities.slice(0, 5).map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      )}
      {ctaHref ? (
        <Link
          href={ctaHref}
          className={`inline-block text-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${buttonStyles[variant]}`}
        >
          {cta}
        </Link>
      ) : (
        <span className={`inline-block text-center rounded-lg px-4 py-2.5 text-sm font-medium ${buttonStyles[variant]}`}>
          {cta}
        </span>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-ivory">
      {/* Nav: Tools, How It Works, Pricing, About + Check My PDF */}
      <nav className="sticky top-0 z-30 border-b border-soft-border bg-ivory/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-wrap items-center justify-between gap-4">
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
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/platform/kdp" className="text-sm font-medium text-amazon-navy hover:text-brave transition-colors">
              Tools
            </Link>
            <a href="#how-it-works" className="text-sm font-medium text-amazon-navy hover:text-brave transition-colors">
              How It Works
            </a>
            <Link href="/pricing" className="text-sm font-medium text-amazon-navy hover:text-brave transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="text-sm font-medium text-amazon-navy hover:text-brave transition-colors">
              About
            </Link>
            <Link
              href="/kdp-pdf-checker"
              className="rounded-lg px-4 py-2 text-sm font-medium bg-brave text-white hover:opacity-90 transition-opacity"
            >
              Check My PDF
            </Link>
            <AuthNav theme="light" />
          </div>
        </div>
      </nav>

      {/* 1. Hero */}
      <section className="px-6 pt-10 pb-16 sm:pt-16 sm:pb-20 bg-ivory">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-bebas text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-amazon-navy mb-4 text-balance leading-tight">
            Turn Your Manuscript Into a Print-Ready Book
          </h1>
          <p className="font-sans text-lg sm:text-xl text-soft-muted text-balance mb-2 max-w-2xl mx-auto">
            Check, fix, and prepare your PDF for Amazon KDP before you upload.
          </p>
          <p className="font-sans text-sm sm:text-base text-soft-muted text-balance mb-8">
            Avoid rejection. Save hours of frustration. Publish with confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link
              href="/kdp-pdf-checker"
              className="w-full sm:w-auto rounded-lg px-6 py-3.5 text-base font-medium bg-brave text-white hover:opacity-90 transition-opacity shadow-lg shadow-brave/20"
            >
              Check My PDF
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto rounded-lg px-6 py-3.5 text-base font-medium border-2 border-amazon-navy text-amazon-navy hover:bg-amazon-navy hover:text-white transition-colors"
            >
              See How It Works
            </a>
          </div>
          <HeroPdfVisual />
        </div>
      </section>

      {/* 2. The problem */}
      <section className="px-6 py-12 bg-arctic/80 border-y border-soft-border">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-bebas text-2xl sm:text-3xl text-amazon-navy mb-4">
            KDP rejection hurts
          </h2>
          <p className="text-soft-muted leading-relaxed">
            You upload your interior — and Amazon bounces it. Wrong trim, margins too tight, bleed missing. Hours of guessing. Our tools show you exactly what to fix before you hit upload, so your book passes the first time.
          </p>
        </div>
      </section>

      {/* 3. Toolkit — 5 directive cards */}
      <section id="tools" className="px-6 py-16 bg-ivory">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-bebas text-3xl sm:text-4xl tracking-tight text-amazon-navy text-center mb-3">
            The toolkit
          </h2>
          <p className="font-sans text-soft-muted text-center mb-10 max-w-xl mx-auto">
            Everything you need to get your book ready for KDP.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DirectiveToolCard
              title="PRINT READY CHECK"
              description="Upload your book PDF and instantly see if Amazon KDP will reject it."
              capabilities={["trim size validation", "margin analysis", "gutter calculation", "layout error detection", "page-level diagnostics"]}
              cta="Analyze My PDF"
              ctaHref="/kdp-pdf-checker"
              variant="primary"
            />
            <DirectiveToolCard
              title="COVER CHECK"
              description="Validate your full-wrap KDP cover for spine width, bleed, and trim alignment."
              cta="Coming Soon"
              variant="coming"
            />
            <DirectiveToolCard
              title="BOOK LAYOUT FIXER"
              description="Automatically repair common interior layout problems before publishing."
              cta="Coming Soon"
              variant="coming"
            />
            <DirectiveToolCard
              title="AI FORMATTER"
              description="Turn a raw manuscript into a properly formatted book interior."
              cta="Coming Soon"
              variant="ai"
            />
            <DirectiveToolCard
              title="TRIM SIZE CALCULATOR"
              description="Calculate the correct trim size, margins, and bleed for your book."
              cta="Open Tool"
              ctaHref="/trim-size-comparison"
              variant="available"
            />
          </div>
          <p className="text-center mt-8">
            <Link href="/platform/kdp" className="text-brave font-medium hover:underline">
              See all tools →
            </Link>
          </p>
        </div>
      </section>

      {/* 4. How it works */}
      <section id="how-it-works" className="px-6 py-16 bg-arctic/60 border-y border-soft-border">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-bebas text-3xl sm:text-4xl tracking-tight text-amazon-navy text-center mb-10">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-brave/20 text-brave flex items-center justify-center font-bebas text-xl mx-auto mb-3">1</div>
              <h3 className="font-semibold text-amazon-navy mb-2">Upload your manuscript PDF</h3>
              <p className="text-sm text-soft-muted">Drop your interior file. We accept up to 100 MB.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-brave/20 text-brave flex items-center justify-center font-bebas text-xl mx-auto mb-3">2</div>
              <h3 className="font-semibold text-amazon-navy mb-2">We analyze every page</h3>
              <p className="text-sm text-soft-muted">26 rules. Trim, margins, bleed, gutter — we check it all.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-brave/20 text-brave flex items-center justify-center font-bebas text-xl mx-auto mb-3">3</div>
              <h3 className="font-semibold text-amazon-navy mb-2">See exactly what to fix</h3>
              <p className="text-sm text-soft-muted">Pass/fail report and on-page highlights before you upload to KDP.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Benefits */}
      <section className="px-6 py-16 bg-ivory">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-bebas text-3xl sm:text-4xl tracking-tight text-amazon-navy text-center mb-10">
            Why authors use us
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="font-semibold text-amazon-navy mb-2">Avoid KDP Rejection</h3>
              <p className="text-sm text-soft-muted">Find layout issues before Amazon does.</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-amazon-navy mb-2">Save Hours of Frustration</h3>
              <p className="text-sm text-soft-muted">Stop guessing why your book failed validation.</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-amazon-navy mb-2">Publish With Confidence</h3>
              <p className="text-sm text-soft-muted">Know your book is ready before you click upload.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Trust */}
      <section className="py-8 bg-arctic/80 border-y border-soft-border">
        <p className="text-center text-sm text-soft-muted max-w-xl mx-auto px-4">
          Your files are processed securely and never stored permanently.
        </p>
        <p className="text-center text-sm text-soft-muted mt-1">
          No subscription, no lock-in.
        </p>
      </section>
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

      {/* 7. Final CTA */}
      <section className="px-6 py-16 bg-ivory">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-bebas text-3xl sm:text-4xl tracking-tight text-amazon-navy mb-4">
            Ready to check your book?
          </h2>
          <p className="text-soft-muted mb-8">
            See if your PDF will pass KDP — in minutes.
          </p>
          <Link
            href="/kdp-pdf-checker"
            className="inline-block rounded-lg px-8 py-4 text-base font-medium bg-brave text-white hover:opacity-90 transition-opacity shadow-lg shadow-brave/20"
          >
            Check My PDF
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-soft-border bg-arctic">
        <div className="flex justify-center py-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-brave flex-shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="#131A22" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="font-medium text-amazon-navy">manu2print</span>
          </Link>
        </div>
        <nav className="w-full bg-brave py-4 px-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white" aria-label="Footer">
          <Link href="/legal" className="hover:underline">Legal</Link>
          <Link href="/terms" className="hover:underline">Terms &amp; Conditions</Link>
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/founders" className="hover:underline">Founders</Link>
          <Link href="/affiliate" className="hover:underline">Affiliate</Link>
          <Link href="/faq" className="hover:underline">FAQ</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
          <Link href="/refunds" className="hover:underline">Refund Policy</Link>
          <Link href="/cookies" className="hover:underline">Cookies</Link>
          <Link href="/platform/kdp" className="hover:underline font-medium">Tools</Link>
        </nav>
        <div className="px-6 py-4 text-center text-sm text-soft-muted">
          <p>Your files are processed securely and never stored permanently.</p>
          <p className="mt-2">© 2026 manu2print. KDP &amp; Kindle tools for indie authors.</p>
        </div>
      </footer>
    </div>
  );
}
