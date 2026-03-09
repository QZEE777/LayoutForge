import Link from "next/link";
import AuthNav from "@/components/AuthNav";

/** Hero: label above, PDF graphic with centered bullseye + CTA only, trust below. */
function HeroPdfVisual() {
  return (
    <div className="flex flex-col items-center">
      <p className="font-bebas text-sm sm:text-base tracking-[0.2em] text-amazon-navy/70 mb-4">SCAN YOUR MANUSCRIPT</p>
      <div className="relative w-full max-w-[320px] mx-auto">
        <svg viewBox="0 0 280 360" className="w-full h-auto drop-shadow-md" fill="none" aria-hidden>
          <rect x="20" y="20" width="240" height="320" rx="4" fill="#FFFFF8" stroke="#E5E4E1" strokeWidth="2" />
          <rect x="40" y="40" width="200" height="280" rx="2" fill="none" stroke="#16A34A" strokeWidth="2" strokeDasharray="6 4" opacity="0.85" />
          <rect x="52" y="52" width="176" height="256" rx="1" fill="none" stroke="#EAB308" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.75" />
          <line x1="140" y1="20" x2="140" y2="340" stroke="#E5E4E1" strokeWidth="1" opacity="0.4" />
          <line x1="20" y1="180" x2="260" y2="180" stroke="#E5E4E1" strokeWidth="1" opacity="0.4" />
          <line x1="20" y1="80" x2="260" y2="80" stroke="#DC2626" strokeWidth="2" opacity="0.6" />
          <circle cx="50" cy="80" r="4" fill="#DC2626" opacity="0.8" />
          <circle cx="230" cy="80" r="4" fill="#DC2626" opacity="0.8" />
          <line x1="140" y1="52" x2="140" y2="332" stroke="#131A22" strokeWidth="1" opacity="0.12" />
          <rect x="60" y="100" width="120" height="8" rx="2" fill="#E5E4E1" opacity="0.5" />
          <rect x="60" y="118" width="160" height="8" rx="2" fill="#E5E4E1" opacity="0.45" />
          <rect x="60" y="136" width="140" height="8" rx="2" fill="#E5E4E1" opacity="0.45" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-40 h-40 sm:w-44 sm:h-44 pointer-events-auto">
            <span className="absolute inset-0 rounded-full border-2 border-amazon-navy/20" aria-hidden />
            <span className="absolute inset-3 rounded-full border-2 border-brave/30" aria-hidden />
            <span className="absolute inset-6 rounded-full border-2 border-brave/50" aria-hidden />
            <span className="absolute inset-9 rounded-full border-2 border-brave/70 bg-brave/5" aria-hidden />
            <Link
              href="/kdp-pdf-checker"
              className="absolute inset-0 flex items-center justify-center rounded-full w-20 h-20 sm:w-24 sm:h-24 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-sm text-white shadow-[0_0_0_2px_rgba(251,84,43,0.3),0_6px_16px_rgba(251,84,43,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] hover:scale-105 hover:shadow-[0_0_0_3px_rgba(251,84,43,0.4),0_8px_20px_rgba(251,84,43,0.5)] transition-all"
              style={{ background: "linear-gradient(180deg, #FF6B4A 0%, #FB542B 50%, #E84A1C 100%)" }}
              title="Scan My PDF"
            >
              Scan My PDF
            </Link>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-soft-muted">Free scan • Instant report • No signup required</p>
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
              Scan My PDF
            </Link>
            <AuthNav theme="light" />
          </div>
        </div>
      </nav>

      {/* Hero — headline first, then visual, then subhead + trust */}
      <section className="px-6 pt-8 pb-16 sm:pt-12 sm:pb-20 bg-ivory">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-bebas text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-amazon-navy text-balance leading-tight">
            Turn Your Manuscript Into a Print-Ready PDF
          </h1>
          <p className="mt-3 font-sans text-base sm:text-lg text-soft-muted text-balance max-w-xl mx-auto">
            Scan your book for trim size, margins, bleed, and print formatting issues before uploading to Amazon KDP.
          </p>
          <div className="mt-10 sm:mt-12">
            <HeroPdfVisual />
          </div>
        </div>
      </section>

      {/* Credibility */}
      <section className="px-6 py-10 bg-white border-t border-soft-border">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-amazon-navy/80 text-sm sm:text-base">
            Built for self-publishing authors preparing books for Amazon KDP.
          </p>
        </div>
      </section>

      {/* What the Scanner Checks */}
      <section className="px-6 py-16 sm:py-20 bg-arctic/50">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-bebas text-2xl sm:text-3xl tracking-tight text-amazon-navy text-center mb-12">
            What the Scanner Checks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              { title: "Trim Size Detection", desc: "Validates your PDF matches KDP trim size requirements.", icon: "ruler" },
              { title: "Margin Safety Check", desc: "Ensures inner and outer margins meet KDP minimums.", icon: "margin" },
              { title: "Bleed & Gutter Validation", desc: "Checks bleed and gutter so content stays in safe area.", icon: "bleed" },
              { title: "Page Count Validation", desc: "Verifies page count is within KDP limits for your trim.", icon: "pages" },
              { title: "Font Embedding Check", desc: "Confirms fonts are embedded for print reliability.", icon: "font" },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl border border-soft-border bg-white p-6 text-center shadow-sm hover:shadow-md hover:border-brave/20 transition-all">
                <div className="w-12 h-12 rounded-xl bg-brave/10 text-brave flex items-center justify-center mx-auto mb-4">
                  {item.icon === "ruler" && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>}
                  {item.icon === "margin" && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>}
                  {item.icon === "bleed" && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>}
                  {item.icon === "pages" && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                  {item.icon === "font" && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12 6.75v10.5" /></svg>}
                </div>
                <h3 className="font-semibold text-amazon-navy mb-2">{item.title}</h3>
                <p className="text-sm text-soft-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-6 py-16 sm:py-20 bg-white border-y border-soft-border">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-bebas text-2xl sm:text-3xl tracking-tight text-amazon-navy text-center mb-14">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-12">
            <div className="relative text-center">
              <div className="w-14 h-14 rounded-2xl bg-brave/15 text-brave flex items-center justify-center font-bebas text-2xl mx-auto mb-4">1</div>
              <h3 className="font-semibold text-amazon-navy mb-2 text-lg">Upload your PDF</h3>
              <p className="text-sm text-soft-muted leading-relaxed">Drop your manuscript interior file.</p>
            </div>
            <div className="relative text-center">
              <div className="w-14 h-14 rounded-2xl bg-brave/15 text-brave flex items-center justify-center font-bebas text-2xl mx-auto mb-4">2</div>
              <h3 className="font-semibold text-amazon-navy mb-2 text-lg">Scan for formatting issues</h3>
              <p className="text-sm text-soft-muted leading-relaxed">We check trim, margins, bleed, and more.</p>
            </div>
            <div className="relative text-center">
              <div className="w-14 h-14 rounded-2xl bg-brave/15 text-brave flex items-center justify-center font-bebas text-2xl mx-auto mb-4">3</div>
              <h3 className="font-semibold text-amazon-navy mb-2 text-lg">Fix before uploading to KDP</h3>
              <p className="text-sm text-soft-muted leading-relaxed">Get a clear report, then fix and submit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Author Tools */}
      <section id="tools" className="px-6 py-16 sm:py-20 bg-arctic/50">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-bebas text-2xl sm:text-3xl tracking-tight text-amazon-navy text-center mb-12">
            Author Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-soft-border bg-white p-6 shadow-sm">
              <h3 className="font-bebas text-lg tracking-wide text-freeGreen mb-4">FREE TOOLS</h3>
              <ul className="space-y-2.5">
                {[
                  { name: "Margin Checker", href: "/kdp-pdf-checker" },
                  { name: "Trim Size Checker", href: "/kdp-pdf-checker" },
                  { name: "Page Count Validator", href: "/page-count-estimator" },
                ].map((t, i) => (
                  <li key={i}>
                    <Link href={t.href} className="text-amazon-navy hover:text-brave font-medium transition-colors">
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-soft-border bg-white p-6 shadow-sm">
              <h3 className="font-bebas text-lg tracking-wide text-brave mb-4">PRO TOOLS</h3>
              <ul className="space-y-2.5">
                {[
                  { name: "Full Print Readiness Scan", href: "/kdp-pdf-checker" },
                  { name: "KDP Compliance Report", href: "/kdp-pdf-checker" },
                  { name: "Formatting Fix Suggestions", href: "/kdp-pdf-checker" },
                ].map((t, i) => (
                  <li key={i}>
                    <Link href={t.href} className="text-amazon-navy hover:text-brave font-medium transition-colors">
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-center mt-8">
            <Link href="/platform/kdp" className="text-brave font-medium hover:underline">
              See all tools →
            </Link>
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-6 py-16 sm:py-20 bg-white border-y border-soft-border">
        <div className="mx-auto max-w-4xl overflow-x-auto">
          <h2 className="font-bebas text-2xl sm:text-3xl tracking-tight text-amazon-navy text-center mb-12">
            Why Authors Use manu2print
          </h2>
          <table className="w-full text-sm border-collapse bg-white rounded-2xl overflow-hidden shadow-sm border border-soft-border">
            <thead>
              <tr className="bg-arctic">
                <th className="px-5 py-4 text-left font-semibold text-amazon-navy">Feature</th>
                <th className="px-5 py-4 text-center font-semibold text-brave bg-brave/10">manu2print</th>
                <th className="px-5 py-4 text-center font-semibold text-amazon-navy">Vellum</th>
                <th className="px-5 py-4 text-center font-semibold text-amazon-navy">Other Formatting Tools</th>
              </tr>
            </thead>
            <tbody className="text-soft-muted">
              {[
                ["PDF Print Check", "✓", "—", "Varies"],
                ["KDP Compliance Scan", "✓", "—", "Varies"],
                ["Automated Issue Detection", "✓", "—", "Varies"],
                ["Price", "$7 / $27", "Paid", "Varies"],
              ].map((row, i) => (
                <tr key={i} className="border-t border-soft-border hover:bg-arctic/30 transition-colors">
                  <td className="px-5 py-3.5 text-amazon-navy/90">{row[0]}</td>
                  <td className="px-5 py-3.5 text-center text-brave font-semibold">{row[1]}</td>
                  <td className="px-5 py-3.5 text-center">{row[2]}</td>
                  <td className="px-5 py-3.5 text-center">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-6 py-16 sm:py-20 bg-arctic/50">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-soft-border bg-white p-8 sm:p-10 shadow-sm text-center">
            <blockquote className="text-lg sm:text-xl text-amazon-navy/90 leading-relaxed">
              &ldquo;Found margin issues before uploading to KDP. Saved me hours.&rdquo;
            </blockquote>
            <cite className="not-italic text-sm text-soft-muted mt-4 block">— Self-Publishing Author</cite>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 sm:py-20 bg-white border-t border-soft-border">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-bebas text-2xl sm:text-3xl tracking-tight text-amazon-navy mb-2">
            Ready to check your book before publishing?
          </h2>
          <p className="text-soft-muted text-sm sm:text-base mb-8">Get an instant report. No signup required.</p>
          <Link
            href="/kdp-pdf-checker"
            className="inline-block rounded-xl px-10 py-4 text-base font-semibold bg-brave text-white hover:opacity-90 hover:shadow-lg hover:shadow-brave/25 transition-all"
          >
            Scan My PDF
          </Link>
        </div>
      </section>

      {/* Trust + marquee (keep existing) */}
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
