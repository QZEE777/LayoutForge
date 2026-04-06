import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "Contact — manu2print",
  description: "Contact manu2print for support, billing, or partnerships.",
};

export default function ContactPage() {
  return (
    <SiteShell>
      <section className="bg-m2p-ivory py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            GET IN TOUCH
          </p>
          <h1 className="font-bebas text-m2p-ink leading-tight mb-6 text-[clamp(2rem,4vw,3rem)]">
            CONTACT
          </h1>
          <p className="text-m2p-muted max-w-2xl mb-4">
            For support, billing, partnerships, or anything else — email us and we&apos;ll get back to you.
          </p>
          <p className="text-lg font-semibold text-m2p-ink">
            <a
              href="mailto:hello@manu2print.com"
              className="text-m2p-orange hover:underline"
            >
              hello@manu2print.com
            </a>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
