import SiteShell from "@/components/SiteShell";
import Link from "next/link";

export default function RefundsPage() {
  return (
    <SiteShell>
      <section className="bg-m2p-ivory py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            POLICY
          </p>
          <h1 className="font-bebas text-m2p-ink leading-tight mb-6 text-[clamp(2rem,4vw,3rem)]">
            REFUND POLICY
          </h1>
          <p className="text-sm text-[#6B6151] mb-10">Last updated: April 6, 2026</p>

          <div className="prose prose-sm max-w-none space-y-8 [&_h2]:text-m2p-ink [&_p]:text-[#6B6151] [&_li]:text-[#6B6151] [&_a]:text-m2p-orange [&_a]:hover:underline">
            <section>
              <h2 className="text-lg font-semibold text-m2p-ink mt-6 mb-2">1. Scope</h2>
              <p>
                This Refund Policy applies to paid digital tools, single scans, and credit bundles purchased through manu2print.
                Payments are processed by Lemon Squeezy. This policy works together with our{" "}
                <Link href="/terms" className="text-m2p-orange hover:underline">Terms &amp; Conditions</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-m2p-ink mt-6 mb-2">2. Single scan purchases ($9)</h2>
              <p className="mb-2">Refunds are generally approved when:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>the report was not delivered due to a technical failure on our side,</li>
                <li>you were charged more than once for the same scan, or</li>
                <li>there was a clear accidental duplicate checkout.</li>
              </ul>
              <p className="mt-3 mb-2">Refunds are generally not approved when:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>the report was delivered and accessible,</li>
                <li>you disagree with the findings, score, or issue count, or</li>
                <li>Amazon KDP later rejects your file (we do not guarantee platform approval).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-m2p-ink mt-6 mb-2">3. Credit bundles</h2>
              <p>
                Credit bundle purchases may be refunded within 14 days if credits are unused. If some credits were used,
                we may issue a partial refund for unused credits at our discretion. Promotional or bonus credits are non-refundable.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-m2p-ink mt-6 mb-2">4. Founder / partner commissions</h2>
              <p>
                If an order is refunded, any related partner commission may be reversed, voided, or adjusted in a later payout cycle.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-m2p-ink mt-6 mb-2">5. How to request a refund</h2>
              <p className="mb-2">
                Email{" "}
                <a href="mailto:hello@manu2print.com" className="text-m2p-orange hover:underline">hello@manu2print.com</a>{" "}
                and include:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>the email used at checkout,</li>
                <li>your order ID (if available),</li>
                <li>the date of purchase, and</li>
                <li>a short description of the issue.</li>
              </ul>
              <p className="mt-3">
                We usually respond within 1-2 business days. If approved, funds are returned to the original payment method.
                Bank/card posting times vary and may take 5-10 business days.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-m2p-ink mt-6 mb-2">6. Abuse and fraud</h2>
              <p>
                We may deny refund requests in cases of abuse, repeated chargeback patterns, or clear policy misuse.
                We may also pause or restrict access where fraud is suspected.
              </p>
            </section>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
