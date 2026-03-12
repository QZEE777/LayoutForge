import SiteShell from "@/components/SiteShell";

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
          <p className="text-m2p-muted max-w-2xl" >
            Get in touch for support or partnerships. Content coming soon.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
