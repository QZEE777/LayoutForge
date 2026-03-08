import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-ivory px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-brave hover:underline text-sm font-medium mb-6 inline-block">
          ← manu2print
        </Link>
        <h1 className="font-bebas text-3xl text-amazon-navy mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-soft-muted mb-10">Last updated: [DATE — tweak before publish]</p>

        <div className="prose prose-sm max-w-none text-amazon-navy space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">1. Acceptance</h2>
            <p className="text-soft-muted">
              By using the manu2print website and tools (“Services”), you agree to these Terms &amp; Conditions. If you do not agree, do not use our Services. We may update these terms; continued use after changes means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">2. Services</h2>
            <p className="text-soft-muted">
              manu2print provides tools for authors and publishers, including but not limited to KDP formatting, PDF checking, keyword research, description generation, and related utilities. We do not guarantee that use of our tools will result in approval by Amazon KDP or any other platform. You are responsible for complying with each platform’s guidelines and policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">3. Account and use</h2>
            <p className="text-soft-muted">
              You may need to create an account or sign in to use certain features. You must provide accurate information and keep your credentials secure. You are responsible for all activity under your account. We may suspend or terminate access if we believe you have violated these terms or applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">4. Payment and subscriptions</h2>
            <p className="text-soft-muted">
              Payments for paid tools and bundles are processed by Lemon Squeezy (“Merchant”). Their terms and payment policies apply to transactions. Refunds are handled in accordance with our <Link href="/refunds" className="text-brave hover:underline">Refund Policy</Link> and the Merchant’s policy. By purchasing, you agree to the Merchant’s terms and our refund terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">5. No guarantee of platform approval</h2>
            <p className="text-soft-muted">
              Our tools are designed to help you prepare content; they do not guarantee acceptance by Amazon KDP, Kindle Direct Publishing, or any other platform. Final approval decisions are made solely by those platforms. We are not liable for rejection of your work.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">6. Acceptable use</h2>
            <p className="text-soft-muted">
              You must not use our Services to upload, process, or distribute illegal content, infringing content, malware, or material that violates third-party rights or platform policies. You must not attempt to gain unauthorized access to our systems or other users’ data. We may remove content and terminate access for violations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">7. Intellectual property</h2>
            <p className="text-soft-muted">
              We own or license the manu2print brand, website, and tool software. You retain ownership of content you upload. By using our Services, you grant us a limited license to process your content only as necessary to provide the Services (e.g. formatting, analysis). We do not use your content for training AI models or for marketing without your consent, as described in our <Link href="/privacy" className="text-brave hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">8. Disclaimers</h2>
            <p className="text-soft-muted">
              The Services are provided “as is” and “as available.” We disclaim all warranties, express or implied, including merchantability and fitness for a particular purpose. We do not warrant that the Services will be uninterrupted or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">9. Limitation of liability</h2>
            <p className="text-soft-muted">
              To the maximum extent permitted by law, manu2print and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, or business opportunities. Our total liability for any claims arising from the Services shall not exceed the amount you paid us in the twelve (12) months before the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">10. Refunds</h2>
            <p className="text-soft-muted">
              Refund eligibility and process are set out in our <Link href="/refunds" className="text-brave hover:underline">Refund Policy</Link>. Requests are handled in line with that policy and the Merchant’s procedures.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">11. Termination</h2>
            <p className="text-soft-muted">
              We may suspend or terminate your access at any time for breach of these terms or for any other reason. You may stop using the Services at any time. Sections that by their nature should survive (e.g. liability, IP, dispute resolution) will survive termination.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">12. Changes to terms</h2>
            <p className="text-soft-muted">
              We may update these Terms from time to time. We will post the revised terms on this page and update the “Last updated” date. Material changes may be communicated via email or a notice on the site. Continued use after the effective date constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">13. Governing law</h2>
            <p className="text-soft-muted">
              These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict of laws. Any disputes shall be resolved in the courts of Delaware. If you are in the EU/EEA, UK, South Africa, New Zealand, or another jurisdiction with mandatory consumer or privacy laws, you may have statutory rights that are not limited by these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">14. Contact</h2>
            <p className="text-soft-muted">
              For questions about these Terms, contact us at <Link href="/contact" className="text-brave hover:underline">Contact</Link> or the email address listed there.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
