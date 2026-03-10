import SiteShell from "@/components/SiteShell";

export default function ContactPage() {
  return (
    <SiteShell>
      <section className="bg-[#FAF7EE] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#F05A28] mb-2 uppercase tracking-[0.1em] text-sm" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            GET IN TOUCH
          </p>
          <h1 className="text-[#1A1208] leading-tight mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            CONTACT
          </h1>
          <p className="text-[#6B6151] max-w-2xl" style={{ fontFamily: "Inter, sans-serif" }}>
            Get in touch for support or partnerships. Content coming soon.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
