import Link from "next/link";

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
  { id: "kdp-formatter-pdf", title: "KDP Formatter (PDF)", description: "Convert PDF to KDP-ready print PDF.", href: "/kdp-formatter-pdf", available: true, iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "keyword-research-pdf", title: "7 Keyword Research (PDF)", description: "Get 7 KDP keyword phrases from your PDF manuscript.", href: "/keyword-research-pdf", available: true, iconPath: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" },
  { id: "description-generator-pdf", title: "Amazon Description Generator (PDF)", description: "Full Amazon listing package — book description, author bio, BISAC categories. PDF only.", href: "/description-generator-pdf", available: true, iconPath: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
];

const kindleTools: Tool[] = [
  { id: "epub-maker", title: "Kindle EPUB Maker", description: "Manuscript to Kindle-ready EPUB. Chapter structure, metadata.", href: "/epub-maker", available: false, iconPath: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
];

const publishingTools: Tool[] = [
  { id: "royalty-calculator", title: "KDP Royalty Calculator", description: "Earnings by page count, trim size, marketplace, royalty rate.", href: "/royalty-calculator", available: false, iconPath: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
];

const CARD_BG = "#1A1612";
const CARD_BORDER = "#2A2420";
const GOLD = "#F5A623";
const WARM_WHITE = "#FAF7F2";

function ToolCard({ tool, btnClass, iconClass }: { tool: Tool; btnClass: string; iconClass: string }) {
  return (
    <div
      className="relative rounded-xl border flex flex-col transition-all duration-200 min-h-0 p-4 hover:border-[#F5A623] hover:shadow-[0_0_12px_rgba(245,166,35,0.15)]"
      style={{
        backgroundColor: CARD_BG,
        borderColor: CARD_BORDER,
      }}
    >
      <div className="absolute top-3 right-3">
        {tool.available ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 border border-green-500/30 px-2 py-0.5 text-xs font-medium text-green-300">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        ) : (
          <span className="rounded-full bg-[#2A2420] border border-[#3d3630] px-2 py-0.5 text-xs font-medium text-[#9c958a]">Coming Soon</span>
        )}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${iconClass}`} style={{ backgroundColor: "rgba(245,166,35,0.15)" }}>
        <svg className="w-5 h-5" fill="none" stroke={GOLD} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tool.iconPath} />
        </svg>
      </div>
      <h3 className="font-serif text-lg font-bold pr-20 mb-2" style={{ color: WARM_WHITE }}>{tool.title}</h3>
      <p className="text-sm leading-relaxed flex-1 mb-4" style={{ color: "#a8a29e" }}>{tool.description}</p>
      {tool.available ? (
        <Link
          href={tool.href}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${btnClass}`}
          style={{ backgroundColor: GOLD, color: "#0F0D0B" }}
        >
          Launch Tool
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Link>
      ) : (
        <button disabled className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-[#9c958a] bg-[#2A2420] cursor-not-allowed border border-[#3d3630]">
          Coming Soon
        </button>
      )}
    </div>
  );
}

function ToolRow({ title, titleClass, tools }: { title: string; titleClass: string; tools: Tool[] }) {
  return (
    <div className="mb-10">
      <h3 className={`font-bebas text-sm uppercase tracking-wider mb-3 px-3 py-1.5 rounded-md inline-block ${titleClass}`}>{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} btnClass="hover:opacity-90" iconClass="" />
        ))}
      </div>
    </div>
  );
}

// Base64 SVG noise for texture (feTurbulence-based)
const NOISE_DATA =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`
  );

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0F0D0B" }}>
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b backdrop-blur-sm" style={{ borderColor: "#2A2420", backgroundColor: "rgba(15,13,11,0.9)" }}>
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: GOLD }}>
              <svg className="w-4 h-4" fill="none" stroke="#0F0D0B" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: WARM_WHITE }}>
              <span className="font-serif">Scribe</span>
              <span className="font-sans">Stack</span>
            </span>
          </Link>
          <a
            href="#tools"
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: GOLD, color: "#0F0D0B" }}
          >
            Get Started
          </a>
        </div>
      </header>

      {/* Hero section — three zones on desktop: 25% | 50% | 25% */}
      <section className="relative px-6 pt-16 pb-14 overflow-hidden">
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url("${NOISE_DATA}")`,
            backgroundRepeat: "repeat",
          }}
        />
        <div className="relative mx-auto max-w-6xl flex flex-col lg:flex-row lg:items-stretch gap-6">
          {/* Left placeholder — hidden on mobile */}
          <div className="hidden lg:flex w-full lg:w-[25%] rounded-xl border items-center justify-center min-h-[280px]" style={{ backgroundColor: CARD_BG, borderColor: "#2A2420" }}>
            <p className="text-sm" style={{ color: "rgba(245,166,35,0.7)" }}>[Illustration Coming]</p>
          </div>
          {/* Center: headline, subheading, buttons */}
          <div className="flex-1 flex flex-col justify-center items-center text-center lg:w-[50%]">
            <div className="font-bebas uppercase tracking-wide leading-none text-center max-w-xl mx-auto mb-5">
              <div className="text-5xl text-white">YOUR MANUSCRIPT</div>
              <div className="text-7xl lg:text-8xl" style={{ color: GOLD }}>DESERVES</div>
              <div className="text-5xl text-white">A PROFESSIONAL FINISH</div>
            </div>
            <p
              className="text-lg sm:text-xl leading-relaxed mb-9 max-w-lg mx-auto text-balance"
              style={{ color: "#a8a29e" }}
            >
              ScribeStack gives indie authors the same formatting, keyword, and listing tools that traditional publishers use — without the agency price tag.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#tools"
                className="rounded-lg px-8 py-4 text-lg font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: GOLD, color: "#0F0D0B" }}
              >
                Browse Tools
              </a>
              <Link
                href="/tools/pdf-compress"
                className="rounded-lg border px-8 py-4 text-lg font-semibold transition-colors hover:bg-white/5"
                style={{ borderColor: "#2A2420", color: WARM_WHITE }}
              >
                Try Free PDF Compressor
              </Link>
            </div>
          </div>
          {/* Right placeholder — hidden on mobile */}
          <div className="hidden lg:flex w-full lg:w-[25%] rounded-xl border items-center justify-center min-h-[280px]" style={{ backgroundColor: CARD_BG, borderColor: "#2A2420" }}>
            <p className="text-sm" style={{ color: "rgba(245,166,35,0.7)" }}>[Illustration Coming]</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="border-y py-6 mb-12" style={{ borderColor: "#2A2420", backgroundColor: "rgba(26,22,18,0.6)" }}>
        <div className="mx-auto max-w-4xl px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold" style={{ color: WARM_WHITE }}>7</p>
            <p className="text-sm mt-1" style={{ color: "#a8a29e" }}>Tools Live</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: WARM_WHITE }}>2</p>
            <p className="text-sm mt-1" style={{ color: "#a8a29e" }}>Coming Soon</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: WARM_WHITE }}>Free</p>
            <p className="text-sm mt-1" style={{ color: "#a8a29e" }}>During Beta</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: WARM_WHITE }}>50MB</p>
            <p className="text-sm mt-1" style={{ color: "#a8a29e" }}>PDF Support</p>
          </div>
        </div>
      </div>

      {/* Social proof strip */}
      <section className="py-4 mb-4 overflow-hidden" style={{ backgroundColor: CARD_BG }}>
        <div className="flex w-[200%] animate-marquee">
          <span className="text-sm whitespace-nowrap flex-shrink-0 w-1/2 pr-16" style={{ color: "rgba(245,166,35,0.85)" }}>
            ✦ Trusted By Indie Authors On Amazon KDP ✦ Format Once, Publish Everywhere ✦ No Account Required To Start ✦
          </span>
          <span className="text-sm whitespace-nowrap flex-shrink-0 w-1/2 pr-16" style={{ color: "rgba(245,166,35,0.85)" }}>
            ✦ Trusted By Indie Authors On Amazon KDP ✦ Format Once, Publish Everywhere ✦ No Account Required To Start ✦
          </span>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h2 className="font-bebas text-3xl uppercase tracking-wide mb-2" style={{ color: WARM_WHITE }}>The Tools</h2>
            <p style={{ color: "#a8a29e" }}>Each one does a single job — and does it right.</p>
          </div>

          <ToolRow title="DOCX TOOLS" titleClass="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" tools={docxTools} />
          <ToolRow title="PDF TOOLS" titleClass="bg-amber-500/20 text-amber-300 border border-amber-500/30" tools={pdfTools} />
          <ToolRow title="KINDLE & EPUB" titleClass="bg-orange-500/20 text-orange-300 border border-orange-500/30" tools={kindleTools} />
          <ToolRow title="PUBLISHING TOOLS" titleClass="bg-violet-500/20 text-violet-300 border border-violet-500/30" tools={publishingTools} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8" style={{ borderColor: "#2A2420", backgroundColor: "rgba(15,13,11,0.8)" }}>
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: "#78716c" }}>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: GOLD }}>
              <svg className="w-3 h-3" fill="none" stroke="#0F0D0B" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="font-medium" style={{ color: "#a8a29e" }}>ScribeStack</span>
          </div>
          <p>Your files are processed securely and never stored permanently.</p>
        </div>
        <p className="mx-auto max-w-6xl text-center text-sm mt-3" style={{ color: "#78716c" }}>
          © 2026 ScribeStack. Built for indie authors.
        </p>
      </footer>
    </div>
  );
}
