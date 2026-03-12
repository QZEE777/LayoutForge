import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export default function PrivacyPage() {
  return (
    <SiteShell>
      <section className="bg-m2p-ivory py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            POLICY
          </p>
          <h1 className="font-bebas text-m2p-ink leading-tight mb-2 text-[clamp(2rem,4vw,3rem)]">
            PRIVACY POLICY
          </h1>
          <p className="text-sm text-m2p-muted mb-10" >Last updated: [DATE — tweak before publish]</p>

          <div className="prose prose-sm max-w-none space-y-8 [&_h2]:text-m2p-ink [&_h2]:font-semibold [&_p]:text-m2p-muted [&_ul]:text-m2p-muted [&_a]:text-m2p-orange [&_a]:hover:underline" >
          <section>
            <p>
              This Privacy Policy explains how manu2print (“we,” “us”) collects, uses, and protects your information when you use our website and tools. We do not sell your personal data. Your files are processed securely and are not stored permanently except as needed to deliver the service (e.g. temporary processing).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-6 mb-2 text-m2p-ink">1. Who we are</h2>
            <p className="text-m2p-muted">
              manu2print provides KDP and Kindle-related tools for authors and publishers. We are the data controller for the personal data we collect in connection with our site and services, except where we act as a processor on your behalf (e.g. when processing content you upload solely to run a tool).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-6 mb-2 text-m2p-ink">2. What we collect</h2>
            <ul className="list-disc pl-5 text-m2p-muted space-y-1">
              <li><strong>Account and identity:</strong> Email address, name (if you provide it), and sign-in credentials when you create an account or use magic-link sign-in.</li>
              <li><strong>Payment and billing:</strong> Payment is processed by Lemon Squeezy. We may receive transaction identifiers and limited billing-related data; we do not store full payment card details.</li>
              <li><strong>Content you upload:</strong> Manuscripts, PDFs, or other files you submit for formatting, checking, or analysis. These are processed to provide the service and are not retained longer than necessary (e.g. we do not store your manuscript permanently after processing).</li>
              <li><strong>Usage and technical data:</strong> Log data (e.g. IP address, browser type), pages visited, and tool usage to operate the site, prevent abuse, and improve our services. We may use cookies and similar technologies as described in our <Link href="/cookies" className="text-[#F05A28] hover:underline">Cookie Policy</Link>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-6 mb-2 text-m2p-ink">3. Why we use your data</h2>
            <p className="text-m2p-muted">
              We use your data to: provide and improve our tools; process payments; authenticate you; send service-related and (where permitted) marketing communications; detect and prevent fraud or abuse; and comply with legal obligations. We do not use your uploaded content to train AI models; it is processed only to deliver the service you request.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-6 mb-2 text-m2p-ink">4. Retention</h2>
            <p className="text-m2p-muted">
              We retain account and usage data as long as your account is active or as needed for legal, security, or billing purposes. Uploaded files are processed and then deleted or anonymized according to our internal retention policy (e.g. short-term retention for delivery, then removal). You may request deletion of your account and associated data as set out in “Your rights” below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-6 mb-2 text-m2p-ink">5. We do not sell your data</h2>
            <p className="text-m2p-muted">
              We do not sell your personal information to third parties. We may share data only as described in the next section (e.g. service providers, legal requirements).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-6 mb-2 text-m2p-ink">6. Sharing and third parties</h2>
            <p className="text-m2p-muted">
              We may share data with: (a) <strong>Service providers</strong> that help us operate the site and tools (e.g. hosting, analytics, payment processing, authentication, AI processing). For example, we use Supabase for authentication and database; Lemon Squeezy for payments; and, for certain features, third-party AI providers (e.g. Anthropic) to process content you submit—under agreements that restrict use of your content to providing the service. (b) <strong>Legal and safety:</strong> where required by law or to protect our rights and users. (c) <strong>Business transfers:</strong> in connection with a merger, sale, or acquisition, subject to the same privacy commitments.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-6 mb-2 text-m2p-ink">7. Cookies and similar technologies</h2>
            <p className="text-m2p-muted">
              We use cookies and similar technologies for essential operation (e.g. sign-in), and may use them for analytics or preferences. Details are in our <Link href="/cookies" className="text-[#F05A28] hover:underline">Cookie Policy</Link>. Where required by law, we obtain consent for non-essential cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-6 mb-2 text-m2p-ink">8. Security</h2>
            <p className="text-m2p-muted">
              We use industry-standard measures to protect your data (e.g. encryption in transit, access controls, secure processing). No system is completely secure; we will notify you and regulators where required if a breach affects your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-6 mb-2 text-m2p-ink">9. Your rights</h2>
            <p className="text-m2p-muted">
              Depending on where you live, you may have the right to: access, correct, or delete your personal data; restrict or object to processing; data portability; and withdraw consent. In the EU/EEA and UK, you may lodge a complaint with a supervisory authority. To exercise your rights, contact us via <Link href="/contact" className="text-[#F05A28] hover:underline">Contact</Link>. We will respond within the timeframes required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-6 mb-2 text-m2p-ink">10. International transfers</h2>
            <p className="text-m2p-muted">
              Our service providers may process data in the United States or other countries. Where we transfer data from the EU/EEA or UK, we use appropriate safeguards (e.g. standard contractual clauses or adequacy decisions) as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-6 mb-2 text-m2p-ink">11. Children</h2>
            <p className="text-m2p-muted">
              Our Services are not directed at children under 16. We do not knowingly collect personal data from children. If you believe we have collected a child’s data, please contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-6 mb-2 text-m2p-ink">12. Changes</h2>
            <p className="text-m2p-muted">
              We may update this Privacy Policy from time to time. We will post the revised policy here and update the “Last updated” date. Material changes may be communicated by email or a notice on the site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-6 mb-2 text-m2p-ink">13. Contact</h2>
            <p className="text-m2p-muted">
              For privacy-related questions or to exercise your rights, contact us via <Link href="/contact" className="text-[#F05A28] hover:underline">Contact</Link> or the email address listed there.
            </p>
          </section>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
