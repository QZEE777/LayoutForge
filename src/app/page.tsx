import Link from "next/link";
import AuthNav from "@/components/AuthNav";

interface Tool {
  id: string;
  title: string;
  description: string;
  href: string;
  available: boolean;
  iconPath: string;
}

const docxTools: Tool[] = [
  { id: "kdp-formatter", title: "KDP Formatter (DOCX)", description: "Format DOCX for Amazon KDP print. Trim size, bleed, print-ready PDF.", href: "/kdp-formatter", available: true, iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "keyword-research", title: "7 Keyword Research (DOCX)", description: "Get 7 KDP keyword phrases from your DOCX manuscript.", href: "/keyword-research", available: true, iconPath: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" },
  { id: "description-generator", title: "Amazon Description Generator (DOCX)", description: "Full Amazon listing package — book description, author bio, BISAC categories. DOCX only.", href: "/description-generator", available: true, iconPath: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
];

const pdfTools: Tool[] = [
  { id: "pdf-compress", title: "PDF Compressor (free)", description: "Shrink PDFs up to 50MB. Free — no account needed. Email required for download.", href: "/pdf-compress", available: true, iconPath: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0l-4-4m4 4V4" },
  { id: "pdf-optimizer", title: "PDF Print Optimizer", description: "Shrink / print-optimize your PDF. FREE.", href: "/kdp-formatter-pdf", available: true, iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "kdp-pdf-checker", title: "KDP PDF Checker", description: "Check your PDF against Amazon KDP specs before you upload. $7 per use · $27 for 6 months.", href: "/kdp-pdf-checker", available: true, iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { id: "keyword-research-pdf", title: "7 Keyword Research (PDF)", description: "Get 7 KDP keyword phrases from your PDF manuscript.", href: "/keyword-research-pdf", available: true, iconPath: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" },
  { id: "description-generator-pdf", title: "Amazon Description Generator (PDF)", description: "Full Amazon listing package — book description, author bio, BISAC categories. PDF only.", href: "/description-generator-pdf", available: true, iconPath: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
];

const kindleTools: Tool[] = [
  { id: "epub-maker", title: "Kindle EPUB Maker", description: "Manuscript to Kindle-ready EPUB. Chapter structure, metadata.", href: "/epub-maker", available: false, iconPath: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
];

const publishingTools: Tool[] = [
  { id: "royalty-calculator", title: "KDP Royalty Calculator", description: "Earnings by page count, trim size, list price, 60% or 35% royalty.", href: "/royalty-calculator", available: true, iconPath: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
];

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <div className="relative rounded-xl border-l-4 border-brand-gold border border-brand-cardHover flex flex-col min-h-0 p-5 bg-brand-card hover:shadow-gold-glow hover:border-brand-cardHover transition-all overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" aria-hidden />
      <div className="relative">
        <div className="absolute top-0 right-0">
          {tool.available ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 border border-green-500/30 px-2 py-0.5 text-xs font-medium text-green-300">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          ) : (
            <span className="rounded-full bg-brand-locked border border-brand-cardHover px-2 py-0.5 text-xs font-medium text-brand-muted">Coming Soon</span>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-brand-gold/15">
          <svg className="w-5 h-5 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tool.iconPath} />
          </svg>
        </div>
        <h3 className="font-bebas text-xl tracking-wide text-brand-cream pr-24 mb-2">{tool.title}</h3>
        <p className="font-sans text-sm leading-relaxed flex-1 mb-4 text-brand-muted">{tool.description}</p>
        {tool.available ? (
          <Link
            href={tool.href}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold bg-brand-gold text-brand-bg hover:opacity-90 transition-opacity"
          >
            Launch Tool
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        ) : (
          <button disabled className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-brand-muted bg-brand-locked cursor-not-allowed border border-brand-cardHover">
            Coming Soon
          </button>
        )}
      </div>
    </div>
  );
}

function ToolRow({ title, tools }: { title: string; tools: Tool[] }) {
  return (
    <div className="mb-10">
      <h3 className="font-bebas text-lg tracking-wide text-brand-cream mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
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

      {/* Tools */}
      <section id="tools" className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-bebas text-2xl sm:text-3xl tracking-wide text-brand-cream mb-2">
            The Tools
          </h2>
          <p className="font-sans text-brand-muted mb-8">
            Each one does a single job — and does it right.
          </p>

          <ToolRow title="DOCX tools" tools={docxTools} />
          <ToolRow title="PDF tools" tools={pdfTools} />
          <ToolRow title="Kindle & EPUB" tools={kindleTools} />
          <ToolRow title="Publishing tools" tools={publishingTools} />
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
