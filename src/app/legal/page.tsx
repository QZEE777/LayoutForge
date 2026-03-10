import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export default function LegalPage() {
  return (
    <SiteShell>
      <section className="bg-[#FAF7EE] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#F05A28] mb-2 uppercase tracking-[0.1em] text-sm" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            DOCUMENTS
          </p>
          <h1 className="text-[#1A1208] leading-tight mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            LEGAL
          </h1>
          <p className="text-[#6B6151] mb-8 max-w-2xl" style={{ fontFamily: "Inter, sans-serif" }}>
            Links to our legal documents. Please read these before using our services; we will tweak details for our use as needed.
          </p>
          <ul className="space-y-3 text-[#1A1208]" style={{ fontFamily: "Inter, sans-serif" }}>
            <li>
              <Link href="/terms" className="text-[#F05A28] hover:underline font-medium">Terms &amp; Conditions</Link>
              <span className="text-[#6B6151] text-sm block mt-0.5">Use of site and tools, payment, liability, governing law.</span>
            </li>
            <li>
              <Link href="/privacy" className="text-[#F05A28] hover:underline font-medium">Privacy Policy</Link>
              <span className="text-[#6B6151] text-sm block mt-0.5">What we collect, why, retention, your rights, no selling data.</span>
            </li>
            <li>
              <Link href="/refunds" className="text-[#F05A28] hover:underline font-medium">Refund Policy</Link>
              <span className="text-[#6B6151] text-sm block mt-0.5">Refunds for paid tools and bundles.</span>
            </li>
            <li>
              <Link href="/cookies" className="text-[#F05A28] hover:underline font-medium">Cookie Policy</Link>
              <span className="text-[#6B6151] text-sm block mt-0.5">How we use cookies and similar technologies.</span>
            </li>
          </ul>
        </div>
      </section>
    </SiteShell>
  );
}
