import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export default function LegalPage() {
  return (
    <SiteShell>
      <section className="bg-m2p-ivory py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            DOCUMENTS
          </p>
          <h1 className="font-bebas text-m2p-ink leading-tight mb-4 text-[clamp(2rem,4vw,3rem)]">
            LEGAL
          </h1>
          <p className="text-m2p-muted mb-8 max-w-2xl" >
            Links to our legal documents. Please read these before using our services; we will tweak details for our use as needed.
          </p>
          <ul className="space-y-3 text-m2p-ink" >
            <li>
              <Link href="/terms" className="text-m2p-orange hover:underline font-medium">Terms &amp; Conditions</Link>
              <span className="text-m2p-muted text-sm block mt-0.5">Use of site and tools, payment, liability, governing law.</span>
            </li>
            <li>
              <Link href="/privacy" className="text-m2p-orange hover:underline font-medium">Privacy Policy</Link>
              <span className="text-m2p-muted text-sm block mt-0.5">What we collect, why, retention, your rights, no selling data.</span>
            </li>
            <li>
              <Link href="/refunds" className="text-m2p-orange hover:underline font-medium">Refund Policy</Link>
              <span className="text-m2p-muted text-sm block mt-0.5">Refunds for paid tools and bundles.</span>
            </li>
            <li>
              <Link href="/cookies" className="text-m2p-orange hover:underline font-medium">Cookie Policy</Link>
              <span className="text-m2p-muted text-sm block mt-0.5">How we use cookies and similar technologies.</span>
            </li>
          </ul>
        </div>
      </section>
    </SiteShell>
  );
}
