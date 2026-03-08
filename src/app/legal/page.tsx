import Link from "next/link";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-ivory px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-brave hover:underline text-sm font-medium mb-6 inline-block">
          ← manu2print
        </Link>
        <h1 className="font-bebas text-3xl text-amazon-navy mb-4">Legal</h1>
        <p className="text-soft-muted mb-8">
          Links to our legal documents. Please read these before using our services; we will tweak details for our use as needed.
        </p>
        <ul className="space-y-3 text-amazon-navy">
          <li>
            <Link href="/terms" className="text-brave hover:underline font-medium">Terms &amp; Conditions</Link>
            <span className="text-soft-muted text-sm block mt-0.5">Use of site and tools, payment, liability, governing law.</span>
          </li>
          <li>
            <Link href="/privacy" className="text-brave hover:underline font-medium">Privacy Policy</Link>
            <span className="text-soft-muted text-sm block mt-0.5">What we collect, why, retention, your rights, no selling data.</span>
          </li>
          <li>
            <Link href="/refunds" className="text-brave hover:underline font-medium">Refund Policy</Link>
            <span className="text-soft-muted text-sm block mt-0.5">Refunds for paid tools and bundles.</span>
          </li>
          <li>
            <Link href="/cookies" className="text-brave hover:underline font-medium">Cookie Policy</Link>
            <span className="text-soft-muted text-sm block mt-0.5">How we use cookies and similar technologies.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
