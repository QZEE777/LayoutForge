import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export default function CookiesPage() {
  return (
    <SiteShell>
      <section className="bg-m2p-ivory py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            POLICY
          </p>
          <h1 className="font-bebas text-m2p-ink leading-tight mb-2 text-[clamp(2rem,4vw,3rem)]">
            COOKIE POLICY
          </h1>
          <p className="text-sm text-m2p-muted mb-10" >Last updated: [DATE — tweak before publish]</p>

          <div className="prose prose-sm max-w-none space-y-8 [&_h2]:text-m2p-ink [&_p]:text-m2p-muted [&_ul]:text-m2p-muted [&_a]:text-m2p-orange [&_a]:hover:underline" >
          <section>
            <p className="text-m2p-muted">
              This Cookie Policy explains how manu2print uses cookies and similar technologies on our website. For how we use your personal data more broadly, see our <Link href="/privacy" className="text-m2p-orange hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-m2p-ink mt-6 mb-2">1. What are cookies?</h2>
            <p className="text-m2p-muted">
              Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences, keep you signed in, and understand how the site is used. We may also use similar technologies such as local storage or pixels where relevant.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-m2p-ink mt-6 mb-2">2. How we use cookies</h2>
            <ul className="list-disc pl-5 text-[#6B6151] space-y-2">
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
            <h2 className="text-lg font-semibold text-m2p-ink mt-6 mb-2">3. Third-party cookies</h2>
            <p className="text-m2p-muted">
              Our payment provider (Lemon Squeezy), authentication provider (Supabase), and any embedded content or analytics may set their own cookies. Their use is governed by their respective privacy and cookie policies. We do not control those cookies; we recommend reviewing their policies if you want to manage third-party tracking.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-m2p-ink mt-6 mb-2">4. How to manage cookies</h2>
            <p className="text-m2p-muted">
              You can control cookies through your browser settings. Most browsers let you block or delete cookies; note that blocking strictly necessary cookies may prevent sign-in or other core features from working. For more on your privacy rights, see our <Link href="/privacy" className="text-m2p-orange hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-m2p-ink mt-6 mb-2">5. Updates</h2>
            <p className="text-m2p-muted">
              We may update this Cookie Policy when we change how we use cookies. The “Last updated” date at the top will be revised, and we may notify you of material changes via the site or email.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-m2p-ink mt-6 mb-2">6. Contact</h2>
            <p className="text-m2p-muted">
              Questions about cookies? Contact us via <Link href="/contact" className="text-m2p-orange hover:underline">Contact</Link>.
            </p>
          </section>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
