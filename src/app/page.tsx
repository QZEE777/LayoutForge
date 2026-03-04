import Link from "next/link";
import AuthNav from "@/components/AuthNav";
import { PLATFORMS, getToolsForPlatform, type Platform, type Tool } from "@/data/platformTools";

/** Compact platform box on homepage: logo + tagline + small tool buttons + big Launch. */
function PlatformBox({ platform, tools }: { platform: Platform; tools: Tool[] }) {
  const initial = platform.name.charAt(0);
  const platformHref = `/platform/${platform.id}`;
  return (
    <section className="rounded-xl border border-brand-cardHover bg-brand-card overflow-hidden mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5">
        {/* Logo + name + tagline */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-brand-cardHover flex items-center justify-center flex-shrink-0 text-xl font-bebas tracking-wide text-brand-gold">
            {initial}
          </div>
          <div>
            <h3 className="font-bebas text-xl tracking-wide text-brand-cream">{platform.name}</h3>
            <p className="font-sans text-xs text-brand-muted mt-0.5">{platform.tagline}</p>
          </div>
        </div>
        {/* Small tool buttons (wrap) + big Launch */}
        <div className="flex flex-col gap-3 sm:items-end">
          {tools.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tools.slice(0, 8).map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="rounded-md border border-brand-cardHover px-3 py-1.5 text-xs font-sans text-brand-cream hover:bg-white/5 hover:border-brand-gold/50 transition-colors"
                >
                  {tool.title.replace(/ \(DOCX\)| \(PDF\)| \(free\)/i, "")}
                </Link>
              ))}
              {tools.length > 8 && (
                <span className="rounded-md px-3 py-1.5 text-xs text-brand-muted">+{tools.length - 8} more</span>
              )}
            </div>
          )}
          <Link
            href={platformHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold bg-brand-gold text-brand-bg hover:opacity-90 transition-opacity w-full sm:w-auto"
          >
            <span className="font-bebas tracking-wide">Launch</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
      {tools.length === 0 && (
        <div className="px-5 pb-5">
          <Link
            href={platformHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold bg-brand-gold text-brand-bg hover:opacity-90 transition-opacity"
          >
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

      {/* Hero — formatter-style typography and hierarchy */}
      <section className="px-6 pt-16 pb-12">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-bebas text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-brand-cream mb-4">
            Your Manuscript Deserves a <span className="text-brand-gold">Professional Finish</span>
          </h1>
          <p className="font-sans text-lg sm:text-xl leading-relaxed text-brand-muted mb-8">
            manu2print gives indie authors the same formatting, keyword, and listing tools that traditional publishers use — without the agency price tag.
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
            <Link
              href="/pdf-compress"
              className="rounded-lg border border-brand-cardHover px-8 py-4 text-base font-semibold text-brand-cream hover:bg-white/5 transition-colors text-center"
            >
              Try Free PDF Compressor
            </Link>
          </div>
        </div>
      </section>

      {/* Stats — brand palette, builds trust */}
      <div className="border-y border-white/5 py-6 mb-10 bg-brand-card/50">
        <div className="mx-auto max-w-4xl px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="font-bebas text-2xl tracking-wide text-brand-gold">7</p>
            <p className="font-sans text-sm mt-1 text-brand-muted">Tools Live</p>
          </div>
          <div>
            <p className="font-bebas text-2xl tracking-wide text-brand-gold">2</p>
            <p className="font-sans text-sm mt-1 text-brand-muted">Coming Soon</p>
          </div>
          <div>
            <p className="font-bebas text-2xl tracking-wide text-brand-gold">Free</p>
            <p className="font-sans text-sm mt-1 text-brand-muted">During Beta</p>
          </div>
          <div>
            <p className="font-bebas text-2xl tracking-wide text-brand-gold">50MB</p>
            <p className="font-sans text-sm mt-1 text-brand-muted">PDF Support</p>
          </div>
        </div>
      </div>

      {/* Social proof — gold accent for warmth and credibility */}
      <section className="py-4 mb-10 overflow-hidden bg-brand-card border-y border-white/5">
        <div className="flex w-[200%] animate-marquee">
          <span className="text-sm font-sans whitespace-nowrap flex-shrink-0 w-1/2 pr-16 text-brand-gold/90">
            ✦ Trusted By Indie Authors On Amazon KDP ✦ Format Once, Publish Everywhere ✦ No Account Required To Start ✦
          </span>
          <span className="text-sm font-sans whitespace-nowrap flex-shrink-0 w-1/2 pr-16 text-brand-gold/90">
            ✦ Trusted By Indie Authors On Amazon KDP ✦ Format Once, Publish Everywhere ✦ No Account Required To Start ✦
          </span>
        </div>
      </section>

      {/* Tools by platform */}
      <section id="tools" className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-bebas text-2xl sm:text-3xl tracking-wide text-brand-cream mb-2">
            Tools by platform
          </h2>
          <p className="font-sans text-brand-muted mb-8">
            Pick your platform. Everything you need in one place.
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
            <Link href="/formatter" className="hover:text-brand-gold transition-colors">Formatting tools</Link>
          </p>
        </div>
        <p className="mx-auto max-w-6xl text-center text-sm mt-3 text-brand-muted">
          © 2026 manu2print. Built for indie authors.
        </p>
      </footer>
    </div>
  );
}
