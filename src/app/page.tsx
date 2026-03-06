import Link from "next/link";
import AuthNav from "@/components/AuthNav";
import PlatformLogoBadge from "@/components/PlatformLogoBadge";
import { PLATFORMS, getToolsForPlatform, type Platform, type Tool } from "@/data/platformTools";

const isAmazon = (id: string) => id === "kdp";

const FREE_GREEN = "#22c55e";

/** Compact platform box: free tools in one row at top (FREE in green), then paid, then Launch. */
function PlatformBox({ platform, tools }: { platform: Platform; tools: Tool[] }) {
  const platformHref = `/platform/${platform.id}`;
  const amazon = isAmazon(platform.id);
  const freeTools = tools.filter((t) => t.free);
  const paidTools = tools.filter((t) => !t.free);
  const displayPaid = paidTools.slice(0, 6);
  const moreCount = Math.max(0, paidTools.length - 6);

  const boxClass = amazon
    ? "rounded-xl border border-amazon-orange/30 bg-amazon-dark overflow-hidden mb-8"
    : "rounded-xl border border-brand-cardHover bg-brand-card overflow-hidden mb-8";
  const titleClass = amazon ? "font-bebas text-xl tracking-wide text-white" : "font-bebas text-xl tracking-wide text-brand-cream";
  const taglineClass = amazon ? "font-sans text-xs text-amazon-muted mt-0.5" : "font-sans text-xs text-brand-muted mt-0.5";
  const pillClass = amazon
    ? "rounded-md border border-amazon-orange/40 px-3 py-1.5 text-xs font-sans text-amazon-muted hover:bg-amazon-orange/10 hover:border-amazon-orange/60 transition-colors"
    : "rounded-md border border-brand-cardHover px-3 py-1.5 text-xs font-sans text-brand-cream hover:bg-white/5 hover:border-brand-gold/50 transition-colors";
  const launchClass = amazon
    ? "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold bg-amazon-orange text-black hover:opacity-90 transition-opacity w-full sm:w-auto"
    : "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold bg-brand-gold text-brand-bg hover:opacity-90 transition-opacity w-full sm:w-auto";

  const toolLabel = (t: Tool) => t.title.replace(/ \(DOCX\)| \(PDF\)| \(free\)| \(FREE\)/gi, "").trim();

  return (
    <section className={boxClass}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <PlatformLogoBadge platformId={platform.id} platformName={platform.name} size="md" />
          <div>
            <h3 className={titleClass}>{platform.name}</h3>
            <p className={taglineClass}>{platform.tagline}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          {tools.length > 0 && (
            <>
              {freeTools.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {freeTools.map((tool) => (
                    <Link key={tool.id} href={tool.href} className={`${pillClass} inline-flex items-center gap-1.5`}>
                      <span style={amazon ? {} : {}}>{toolLabel(tool)}</span>
                      <span className="font-bold uppercase text-[10px] tracking-wide" style={{ color: FREE_GREEN }}>FREE</span>
                    </Link>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {displayPaid.map((tool) => (
                  <Link key={tool.id} href={tool.href} className={pillClass}>
                    {toolLabel(tool)}
                  </Link>
                ))}
                {moreCount > 0 && (
                  <span className={amazon ? "text-amazon-muted rounded-md px-3 py-1.5 text-xs" : "text-brand-muted rounded-md px-3 py-1.5 text-xs"}>+{moreCount} more</span>
                )}
              </div>
            </>
          )}
          <Link href={platformHref} className={launchClass}>
            <span className="font-bebas tracking-wide">Launch</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
      {tools.length === 0 && (
        <div className="px-5 pb-5">
          <Link href={platformHref} className={launchClass}>
            Launch
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      )}
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Sticky nav — matches formatter */}
      <nav className="sticky top-0 z-20 border-b border-white/5 bg-brand-bg/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-brand-gold">
              <svg className="w-4 h-4" fill="none" stroke="#0F0D0B" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span
              className="text-lg font-bold tracking-tight text-brand-cream"
              style={{
                textShadow: "0 0 24px rgba(250,247,242,0.25), 0 0 48px rgba(245,166,35,0.12)",
              }}
            >
              <span className="font-serif">manu</span>
              <span className="font-sans">2print</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/formatter" className="text-sm font-medium text-brand-cream hover:text-brand-gold transition-colors">
              Tools
            </Link>
            <Link href="/founders" className="text-sm font-medium text-brand-cream hover:text-brand-gold transition-colors">
              Founders
            </Link>
            <AuthNav />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-12">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-bebas text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-brand-cream mb-4">
            KDP &amp; Kindle Tools <span className="text-brand-gold">for Indie Authors</span>
          </h1>
          <p className="font-sans text-lg sm:text-xl leading-relaxed text-brand-muted mb-8">
            Format interiors, check PDFs, get keywords and listing copy, build Kindle EPUBs. FREE calculators and compressors. Paid tools when you need them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth"
              className="rounded-lg px-8 py-4 text-base font-semibold bg-brand-gold text-brand-bg hover:opacity-90 transition-opacity text-center"
            >
              Get Started
            </Link>
            <a
              href="#tools"
              className="rounded-lg px-8 py-4 text-base font-semibold border border-brand-cardHover text-brand-cream hover:bg-white/5 transition-colors text-center"
            >
              Browse Tools
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="border-y border-white/5 py-6 mb-10 bg-brand-card/50">
        <div className="mx-auto max-w-4xl px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="font-bebas text-2xl tracking-wide text-brand-gold">9</p>
            <p className="font-sans text-sm mt-1 text-emerald-400">FREE Tools</p>
          </div>
          <div>
            <p className="font-bebas text-2xl tracking-wide text-brand-gold">8</p>
            <p className="font-sans text-sm mt-1 text-brand-muted">Paid Tools</p>
          </div>
          <div>
            <p className="font-bebas text-2xl tracking-wide text-brand-gold">50MB</p>
            <p className="font-sans text-sm mt-1 text-brand-muted">PDF / DOCX</p>
          </div>
          <div>
            <p className="font-bebas text-2xl tracking-wide text-brand-gold">KDP</p>
            <p className="font-sans text-sm mt-1 text-brand-muted">+ Kindle</p>
          </div>
        </div>
      </div>

      {/* Social proof — gold accent for warmth and credibility */}
      <section className="py-4 mb-10 overflow-hidden bg-brand-card border-y border-white/5">
        <div className="flex w-[200%] animate-marquee">
          <span className="text-sm font-sans whitespace-nowrap flex-shrink-0 w-1/2 pr-16 text-brand-gold/90">
            ✦ Trusted By Indie Authors On Amazon KDP ✦ Built For KDP & Kindle ✦ No Account Required To Start ✦
          </span>
          <span className="text-sm font-sans whitespace-nowrap flex-shrink-0 w-1/2 pr-16 text-brand-gold/90">
            ✦ Trusted By Indie Authors On Amazon KDP ✦ Built For KDP & Kindle ✦ No Account Required To Start ✦
          </span>
        </div>
      </section>

      {/* Tools by platform */}
      <section id="tools" className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-bebas text-2xl sm:text-3xl tracking-wide text-brand-cream mb-2">
            Tools for KDP &amp; Kindle
          </h2>
          <p className="font-sans text-brand-muted mb-8">
            Built for Amazon KDP and Kindle. Everything you need in one place.
          </p>

          {PLATFORMS.map((platform) => (
            <PlatformBox
              key={platform.id}
              platform={platform}
              tools={getToolsForPlatform(platform.toolIds)}
            />
          ))}
        </div>
      </section>

      {/* Footer — formatter-aligned */}
      <footer className="border-t border-white/5 px-6 py-8 bg-brand-bg">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-brand-muted">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-brand-gold">
              <svg className="w-3 h-3" fill="none" stroke="#0F0D0B" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="font-medium text-brand-cream">manu2print</span>
          </div>
          <p className="flex items-center gap-4 flex-wrap">
            Your files are processed securely and never stored permanently.
            <Link href="/formatter" className="hover:text-brand-gold transition-colors">KDP &amp; Kindle tools</Link>
          </p>
        </div>
        <p className="mx-auto max-w-6xl text-center text-sm mt-3 text-brand-muted">
          © 2026 manu2print. KDP &amp; Kindle tools for indie authors.
        </p>
      </footer>
    </div>
  );
}
