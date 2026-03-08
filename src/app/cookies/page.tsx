import Link from "next/link";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-ivory px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-brave hover:underline text-sm font-medium mb-6 inline-block">
          ← manu2print
        </Link>
        <h1 className="font-bebas text-3xl text-amazon-navy mb-2">Cookie Policy</h1>
        <p className="text-sm text-soft-muted mb-10">Last updated: [DATE — tweak before publish]</p>

        <div className="prose prose-sm max-w-none text-amazon-navy space-y-8">
          <section>
            <p className="text-soft-muted">
              This Cookie Policy explains how manu2print uses cookies and similar technologies on our website. For how we use your personal data more broadly, see our <Link href="/privacy" className="text-brave hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">1. What are cookies?</h2>
            <p className="text-soft-muted">
              Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences, keep you signed in, and understand how the site is used. We may also use similar technologies such as local storage or pixels where relevant.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">2. How we use cookies</h2>
            <ul className="list-disc pl-5 text-soft-muted space-y-2">
              <li>
                <strong>Strictly necessary:</strong> Required for the site to work (e.g. authentication, security, load balancing). These do not require consent under laws like the ePrivacy Directive, but you can block them in your browser (some features may then not work).
              </li>
              <li>
                <strong>Functional:</strong> Remember your choices (e.g. language, region) to improve your experience. These may be essential for certain features.
              </li>
              <li>
                <strong>Analytics and performance:</strong> If we use analytics (e.g. to see how many people visit and which pages are used), we will describe them here and, where required by law, ask for your consent before setting non-essential analytics cookies.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">3. Third-party cookies</h2>
            <p className="text-soft-muted">
              Our payment provider (Lemon Squeezy), authentication provider (Supabase), and any embedded content or analytics may set their own cookies. Their use is governed by their respective privacy and cookie policies. We do not control those cookies; we recommend reviewing their policies if you want to manage third-party tracking.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">4. How to manage cookies</h2>
            <p className="text-soft-muted">
              You can control cookies through your browser settings. Most browsers let you block or delete cookies; note that blocking strictly necessary cookies may prevent sign-in or other core features from working. For more on your privacy rights, see our <Link href="/privacy" className="text-brave hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">5. Updates</h2>
            <p className="text-soft-muted">
              We may update this Cookie Policy when we change how we use cookies. The “Last updated” date at the top will be revised, and we may notify you of material changes via the site or email.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-amazon-navy mt-6 mb-2">6. Contact</h2>
            <p className="text-soft-muted">
              Questions about cookies? Contact us via <Link href="/contact" className="text-brave hover:underline">Contact</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
