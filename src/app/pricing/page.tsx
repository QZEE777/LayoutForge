import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export default function PricingPage() {
  return (
    <SiteShell>
      <section className="bg-m2p-ivory py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm font-bebas">
            SIMPLE PRICING
          </p>
          <h1 className="text-m2p-ink leading-tight mb-4 font-bebas" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            PRICING
          </h1>
          <p className="text-m2p-muted max-w-2xl mb-10" style={{ fontFamily: "Inter, sans-serif" }}>
            Simple, author-friendly pricing. No subscription required — pay per use or get a 6-month pass for unlimited access to paid tools.
          </p>
          <div className="rounded-2xl border border-m2p-border bg-white p-8 mb-8 max-w-2xl shadow-sm">
            <h2 className="text-m2p-ink text-xl mb-2 font-bebas">Paid tools</h2>
            <p className="text-m2p-muted text-sm mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
              Print Ready Check, KDP Formatter, Keyword Research, Description Generator, Format Review, and more.
            </p>
            <ul className="space-y-2 text-m2p-ink text-sm mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
              <li><strong>$7</strong> per use — one tool, one run.</li>
              <li><strong>$27</strong> for 6 months — unlimited use of all paid tools.</li>
            </ul>
            <Link
              href="/platform/kdp"
              className="inline-block rounded-xl px-6 py-2.5 text-sm font-bold bg-m2p-orange hover:bg-m2p-orange-hover text-white shadow-[0_2px_12px_rgba(240,90,40,0.3)] transition-all"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              See all tools
            </Link>
          </div>
          <p className="text-sm text-m2p-muted max-w-2xl" style={{ fontFamily: "Inter, sans-serif" }}>
            Many tools are <strong className="text-m2p-ink">free</strong> — PDF Compressor, calculators, trim guides, banned keyword checker. No account needed for most. <Link href="/" className="text-m2p-orange hover:underline">Back to home</Link> or <Link href="/faq" className="text-m2p-orange hover:underline">FAQ</Link>.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
