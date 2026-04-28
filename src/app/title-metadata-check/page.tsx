import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "Title & Metadata Check — Coming Soon | manu2print",
  description:
    "Scan your KDP title, subtitle, and keywords for banned or restricted terms before you publish. Coming soon from manu2print.",
};

export default function TitleMetadataCheckPage() {
  return (
    <SiteShell>
      <section className="bg-m2p-ivory py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            Coming Soon
          </p>
          <h1
            className="font-black leading-tight mb-4"
            style={{
              color: "#1A1208",
              fontSize: "clamp(2rem,4vw,2.8rem)",
              letterSpacing: "-0.025em",
            }}
          >
            Title &amp; Metadata Check
          </h1>
          <p className="text-base leading-relaxed mb-8" style={{ color: "#6B6151" }}>
            Scan your KDP title, subtitle, and keywords for banned or restricted terms —
            before Amazon flags your listing. We&apos;re finishing this tool now.
          </p>

          <div
            className="rounded-2xl p-8 mb-8 text-left"
            style={{
              background: "rgba(240,90,40,0.04)",
              border: "1px solid rgba(240,90,40,0.12)",
            }}
          >
            <p className="font-bold text-sm mb-4" style={{ color: "#1A1208" }}>
              What it will check:
            </p>
            <div className="space-y-2.5">
              {[
                "Banned and restricted keywords in title and subtitle",
                "Misleading claims (e.g. \"bestseller\", \"#1\") that violate KDP policy",
                "Series numbering format compliance",
                "Character limits for title and subtitle fields",
                "Common keyword stuffing patterns KDP flags",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="shrink-0 mt-0.5" style={{ color: "#f05a28" }}>✦</span>
                  <span className="text-sm leading-relaxed" style={{ color: "#6B6151" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/kdp-pdf-checker"
            className="inline-flex items-center gap-2 rounded-xl font-black text-base px-8 py-4 transition-opacity hover:opacity-90 mb-4"
            style={{ background: "#f05a28", color: "#fff" }}
          >
            Check your PDF now →
          </Link>
          <p className="text-xs" style={{ color: "#9B8E7E" }}>
            While you wait — run a free KDP PDF compliance scan on your interior file.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
