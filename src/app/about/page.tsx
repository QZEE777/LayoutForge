import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="bg-m2p-ivory py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm font-bebas">
            WHO WE ARE
          </p>
          <h1 className="text-m2p-ink leading-tight mb-6 font-bebas" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            ABOUT
          </h1>
          <p className="text-m2p-muted max-w-2xl" style={{ fontFamily: "Inter, sans-serif" }}>
            Who we are and why we built manu2print for indie authors. <Link href="/founders" className="text-m2p-orange hover:underline">Founders</Link> — apply to join our program. Content coming soon.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
