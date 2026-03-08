import Link from "next/link";
import AuthNav from "@/components/AuthNav";

/** Hero visual: PDF diagnostic image + bullseye overlay with CTA. Bullseye = "hit the print-ready target". */
function HeroPdfVisual() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <svg viewBox="0 0 280 360" className="w-full h-auto drop-shadow-lg" fill="none" aria-hidden>
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
      {/* Bullseye overlay — glossy bright orange round button centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex items-center justify-center w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72">
          <span className="absolute inset-0 rounded-full border-4 border-amazon-navy/25" aria-hidden />
          <span className="absolute inset-4 rounded-full border-4 border-brave/40" aria-hidden />
          <span className="absolute inset-8 rounded-full border-4 border-brave/70" aria-hidden />
          <span className="absolute inset-12 rounded-full border-4 border-brave bg-brave/20" aria-hidden />
          <Link
            href="/kdp-pdf-checker"
            className="relative z-10 flex items-center justify-center rounded-full w-28 h-28 sm:w-32 sm:h-32 font-bold text-sm sm:text-base text-white shadow-[0_0_0_3px_rgba(251,84,43,0.4),0_4px_14px_rgba(251,84,43,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] hover:scale-105 transition-transform"
            style={{ background: "linear-gradient(180deg, #FF6B4A 0%, #FB542B 50%, #E84A1C 100%)" }}
            title="Hit the Target → Check My PDF"
          >
            Check My PDF
          </Link>
        </div>
      </div>
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
    <div className={`rounded-xl p-5 flex flex-col items-center text-center ${variantStyles[variant]}`}>
      <h3 className="font-bebas text-lg sm:text-xl tracking-wide text-amazon-navy mb-2">{title}</h3>
      <p className="text-sm text-soft-muted flex-1 mb-3 max-w-xs line-clamp-3">{description}</p>
      {capabilities && capabilities.length > 0 && (
        <ul className="text-xs text-amazon-navy/80 space-y-1 mb-3 list-none text-center">
          {capabilities.slice(0, 5).map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      )}
      {ctaHref ? (
        <Link
          href={ctaHref}
          className={`inline-block text-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors w-full sm:w-auto ${buttonStyles[variant]}`}
        >
          {cta}
        </Link>
      ) : (
        <span className={`inline-block text-center rounded-lg px-4 py-2.5 text-sm font-medium w-full sm:w-auto ${buttonStyles[variant]}`}>
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

      {/* 3. Toolkit — PDF tools (live) + DOCX/others (coming soon). Same block format, all text centered. */}
      <section id="tools" className="px-6 py-16 bg-ivory">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-bebas text-3xl sm:text-4xl tracking-tight text-amazon-navy text-center mb-3">
            The toolkit
          </h2>
          <p className="font-sans text-soft-muted text-center mb-10 max-w-xl mx-auto">
            PDF tools ready now. DOCX tools coming soon.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DirectiveToolCard
              title="PRINT READY CHECK"
              description="Upload your book PDF and instantly see if Amazon KDP will reject it. Trim, margins, bleed — 26 rules. Pass/fail report with on-page highlights."
              cta="Analyze My PDF"
              ctaHref="/kdp-pdf-checker"
              variant="primary"
            />
            <DirectiveToolCard
              title="PDF COMPRESSOR"
              description="Shrink PDFs up to 50 MB in your browser. No account needed. Your file never leaves your device."
              cta="Open Tool"
              ctaHref="/pdf-compress"
              variant="available"
            />
            <DirectiveToolCard
              title="PDF PRINT OPTIMIZER"
              description="Shrink and print-optimize your PDF for smaller file size. Runs in your browser. Free."
              cta="Open Tool"
              ctaHref="/kdp-formatter-pdf"
              variant="available"
            />
            <DirectiveToolCard
              title="KDP FORMATTER (DOCX)"
              description="Format your Word manuscript for KDP print. Trim size, bleed, margins. Outputs print-ready PDF."
              cta="Coming Soon"
              variant="coming"
            />
            <DirectiveToolCard
              title="7 KEYWORD RESEARCH (DOCX)"
              description="Get 7 KDP keyword phrases from your DOCX manuscript. AI-powered suggestions for your listing."
              cta="Coming Soon"
              variant="coming"
            />
            <DirectiveToolCard
              title="DESCRIPTION GENERATOR (DOCX)"
              description="Full Amazon listing from your manuscript: book description, author bio, BISAC categories."
              cta="Coming Soon"
              variant="coming"
            />
            <DirectiveToolCard
              title="COVER CHECK"
              description="Validate your full-wrap KDP cover for spine width, bleed, and trim alignment before you upload."
              cta="Coming Soon"
              variant="coming"
            />
            <DirectiveToolCard
              title="BOOK LAYOUT FIXER"
              description="Automatically repair common interior layout mistakes so your PDF passes KDP validation."
              cta="Coming Soon"
              variant="coming"
            />
            <DirectiveToolCard
              title="AI FORMATTER"
              description="Turn a raw manuscript into a properly formatted book interior. AI-powered structure and layout."
              cta="Coming Soon"
              variant="ai"
            />
          </div>
          <p className="text-center mt-8">
            <Link href="/platform/kdp" className="text-brave font-medium hover:underline">
              See all tools →
            </Link>
          </p>
        </div>
      </section>

      {/* 3b. Free tools — 6 cards, same block format, all text centered */}
      <section className="px-6 py-16 bg-arctic/60 border-y border-soft-border">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-bebas text-3xl sm:text-4xl tracking-tight text-amazon-navy text-center mb-3">
            Free tools
          </h2>
          <p className="font-sans text-soft-muted text-center mb-10 max-w-xl mx-auto">
            Calculators and helpers — no payment required.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <DirectiveToolCard
              title="PDF COMPRESSOR"
              description="Shrink PDFs up to 50 MB in your browser. No account needed. Your file never leaves your device."
              cta="Open Tool"
              ctaHref="/pdf-compress"
              variant="available"
            />
            <DirectiveToolCard
              title="KDP ROYALTY CALCULATOR"
              description="Earnings by page count, trim size, and list price. See royalty and print cost before you publish."
              cta="Open Tool"
              ctaHref="/royalty-calculator"
              variant="available"
            />
            <DirectiveToolCard
              title="PAGE COUNT ESTIMATOR"
              description="Estimate interior page count from your word count and trim size. Plan your book length."
              cta="Open Tool"
              ctaHref="/page-count-estimator"
              variant="available"
            />
            <DirectiveToolCard
              title="TRIM SIZE COMPARISON"
              description="Compare print cost and royalty across trim sizes. Pick the best size for your book."
              cta="Open Tool"
              ctaHref="/trim-size-comparison"
              variant="available"
            />
            <DirectiveToolCard
              title="SPINE WIDTH CALCULATOR"
              description="Spine width and full-wrap cover dimensions for KDP paperbacks. Use with cover design tools."
              cta="Open Tool"
              ctaHref="/spine-calculator"
              variant="available"
            />
            <DirectiveToolCard
              title="FULL-WRAP COVER CALCULATOR"
              description="Cover canvas size in inches and 300 DPI pixels for Canva and other design tools."
              cta="Open Tool"
              ctaHref="/cover-calculator"
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

      {/* 5b. Testimonials (placeholder for beta) */}
      <section className="px-6 py-16 bg-arctic/60 border-y border-soft-border">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-bebas text-3xl sm:text-4xl tracking-tight text-amazon-navy text-center mb-10">
            What Authors Are Saying
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-soft-border bg-white p-5 shadow-sm">
              <p className="text-sm text-soft-muted italic">&ldquo;manu2print saved me hours trying to figure out why KDP rejected my PDF.&rdquo;</p>
            </div>
            <div className="rounded-xl border border-soft-border bg-white p-5 shadow-sm">
              <p className="text-sm text-soft-muted italic">&ldquo;Finally a tool that shows exactly what&apos;s wrong with my book layout.&rdquo;</p>
            </div>
            <div className="rounded-xl border border-soft-border bg-white p-5 shadow-sm">
              <p className="text-sm text-soft-muted italic">&ldquo;Placeholder — real testimonial after beta.&rdquo;</p>
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

      {/* 7. Competitor comparison (placeholder for beta) */}
      <section className="px-6 py-16 bg-ivory">
        <div className="mx-auto max-w-4xl overflow-x-auto">
          <h2 className="font-bebas text-3xl sm:text-4xl tracking-tight text-amazon-navy text-center mb-10">
            How manu2print Compares
          </h2>
          <table className="w-full text-sm border-collapse border border-soft-border bg-white rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-arctic">
                <th className="border border-soft-border px-4 py-3 text-left font-semibold text-amazon-navy">Feature</th>
                <th className="border border-soft-border px-4 py-3 text-center font-semibold text-brave bg-brave/10">manu2print</th>
                <th className="border border-soft-border px-4 py-3 text-center font-semibold text-amazon-navy">Vellum</th>
                <th className="border border-soft-border px-4 py-3 text-center font-semibold text-amazon-navy">Atticus</th>
                <th className="border border-soft-border px-4 py-3 text-center font-semibold text-amazon-navy">Other tools</th>
              </tr>
            </thead>
            <tbody className="text-soft-muted">
              <tr><td className="border border-soft-border px-4 py-2">PDF Layout Validation</td><td className="border border-soft-border px-4 py-2 text-center text-brave font-medium">✓</td><td className="border border-soft-border px-4 py-2 text-center">—</td><td className="border border-soft-border px-4 py-2 text-center">—</td><td className="border border-soft-border px-4 py-2 text-center">Varies</td></tr>
              <tr><td className="border border-soft-border px-4 py-2">KDP Print Readiness Check</td><td className="border border-soft-border px-4 py-2 text-center text-brave font-medium">✓</td><td className="border border-soft-border px-4 py-2 text-center">—</td><td className="border border-soft-border px-4 py-2 text-center">—</td><td className="border border-soft-border px-4 py-2 text-center">Varies</td></tr>
              <tr><td className="border border-soft-border px-4 py-2">Margin + Gutter Analysis</td><td className="border border-soft-border px-4 py-2 text-center text-brave font-medium">✓</td><td className="border border-soft-border px-4 py-2 text-center">—</td><td className="border border-soft-border px-4 py-2 text-center">—</td><td className="border border-soft-border px-4 py-2 text-center">Varies</td></tr>
              <tr><td className="border border-soft-border px-4 py-2">Trim Size Detection</td><td className="border border-soft-border px-4 py-2 text-center text-brave font-medium">✓</td><td className="border border-soft-border px-4 py-2 text-center">—</td><td className="border border-soft-border px-4 py-2 text-center">—</td><td className="border border-soft-border px-4 py-2 text-center">Varies</td></tr>
              <tr><td className="border border-soft-border px-4 py-2">Visual Error Highlighting</td><td className="border border-soft-border px-4 py-2 text-center text-brave font-medium">✓</td><td className="border border-soft-border px-4 py-2 text-center">—</td><td className="border border-soft-border px-4 py-2 text-center">—</td><td className="border border-soft-border px-4 py-2 text-center">Varies</td></tr>
              <tr><td className="border border-soft-border px-4 py-2">Price</td><td className="border border-soft-border px-4 py-2 text-center text-brave font-medium">$7 / $27</td><td className="border border-soft-border px-4 py-2 text-center">Paid</td><td className="border border-soft-border px-4 py-2 text-center">Subscription</td><td className="border border-soft-border px-4 py-2 text-center">Varies</td></tr>
            </tbody>
          </table>
          <p className="text-center text-xs text-soft-muted mt-4">Placeholder — expand with real data after beta.</p>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section className="px-6 py-16 bg-arctic/80 border-t border-soft-border">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-bebas text-3xl sm:text-4xl tracking-tight text-amazon-navy mb-4">
            Ready to See if Your Book Will Pass KDP?
          </h2>
          <Link
            href="/kdp-pdf-checker"
            className="inline-block rounded-lg px-8 py-4 text-base font-medium bg-brave text-white hover:opacity-90 transition-opacity shadow-lg shadow-brave/20 mt-6"
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
