import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-ivory px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-brave hover:underline text-sm font-medium mb-6 inline-block">
          ← manu2print
        </Link>
        <h1 className="font-bebas text-3xl text-amazon-navy mb-4">Pricing</h1>
        <p className="text-soft-muted mb-8">
          Simple, author-friendly pricing. No subscription required — pay per use or get a 6-month pass for unlimited access to paid tools.
        </p>
        <div className="rounded-xl border border-soft-border bg-white p-6 mb-8">
          <h2 className="font-bebas text-xl text-amazon-navy mb-2">Paid tools</h2>
          <p className="text-soft-muted text-sm mb-4">
            Print Ready Check, KDP Formatter, Keyword Research, Description Generator, Format Review, and more.
          </p>
          <ul className="space-y-2 text-amazon-navy text-sm mb-6">
            <li><strong>$7</strong> per use — one tool, one run.</li>
            <li><strong>$27</strong> for 6 months — unlimited use of all paid tools.</li>
          </ul>
          <Link
            href="/platform/kdp"
            className="inline-block rounded-lg px-5 py-2.5 text-sm font-medium bg-brave text-white hover:opacity-90 transition-opacity"
          >
            See all tools
          </Link>
        </div>
        <p className="text-sm text-soft-muted">
          Many tools are <strong className="text-amazon-navy">free</strong> — PDF Compressor, calculators, trim guides, banned keyword checker. No account needed for most. <Link href="/" className="text-brave hover:underline">Back to home</Link> or <Link href="/faq" className="text-brave hover:underline">FAQ</Link>.
        </p>
      </div>
    </div>
  );
}
