import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export default function PricingPage() {
  return (
    <SiteShell>
      <section className="bg-[#FAF7EE] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#F05A28] mb-2 uppercase tracking-[0.1em] text-sm" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            SIMPLE PRICING
          </p>
          <h1 className="text-[#1A1208] leading-tight mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            PRICING
          </h1>
          <p className="text-[#6B6151] max-w-2xl mb-10" style={{ fontFamily: "Inter, sans-serif" }}>
            Simple, author-friendly pricing. No subscription required — pay per use or get a 6-month pass for unlimited access to paid tools.
          </p>
          <div className="rounded-2xl border border-[#E0D8C4] bg-white p-8 mb-8 max-w-2xl shadow-sm">
            <h2 className="text-[#1A1208] text-xl mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Paid tools</h2>
            <p className="text-[#6B6151] text-sm mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
              Print Ready Check, KDP Formatter, Keyword Research, Description Generator, Format Review, and more.
            </p>
            <ul className="space-y-2 text-[#1A1208] text-sm mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
              <li><strong>$7</strong> per use — one tool, one run.</li>
              <li><strong>$27</strong> for 6 months — unlimited use of all paid tools.</li>
            </ul>
            <Link
              href="/platform/kdp"
              className="inline-block rounded-xl px-6 py-2.5 text-sm font-bold bg-[#F05A28] hover:bg-[#D94E20] text-white shadow-[0_2px_12px_rgba(240,90,40,0.3)] transition-all"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              See all tools
            </Link>
          </div>
          <p className="text-sm text-[#6B6151] max-w-2xl" style={{ fontFamily: "Inter, sans-serif" }}>
            Many tools are <strong className="text-[#1A1208]">free</strong> — PDF Compressor, calculators, trim guides, banned keyword checker. No account needed for most. <Link href="/" className="text-[#F05A28] hover:underline">Back to home</Link> or <Link href="/faq" className="text-[#F05A28] hover:underline">FAQ</Link>.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
