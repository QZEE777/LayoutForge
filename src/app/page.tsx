import Link from "next/link";

interface Tool {
  id: string;
  title: string;
  description: string;
  href: string;
  available: boolean;
  color: string;
  iconPath: string;
}

const tools: Tool[] = [
  {
    id: "kdp-formatter",
    title: "KDP Formatter",
    description: "Format your manuscript for Amazon KDP print. Upload DOCX or PDF, choose your trim size, and get a print-ready PDF in seconds.",
    href: "/kdp-formatter",
    available: true,
    color: "blue",
    iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    id: "epub-maker",
    title: "Kindle EPUB Maker",
    description: "Convert your manuscript to a Kindle-ready EPUB file. Proper chapter structure, metadata, and formatting for eBook distribution.",
    href: "/epub-maker",
    available: false,
    color: "purple",
    iconPath: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    id: "keyword-research",
    title: "7 Keyword Research",
    description: "Get 7 Amazon KDP keyword phrases from your manuscript. Claude-powered, no guesswork.",
    href: "/keyword-research",
    available: true,
    color: "emerald",
    iconPath: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7",
  },
  {
    id: "description-generator",
    title: "Amazon Description Generator",
    description: "AI-powered book descriptions with SEO keywords baked in. Write once, rank everywhere on Amazon search.",
    href: "/description-generator",
    available: true,
    color: "amber",
    iconPath: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  },
  {
    id: "royalty-calculator",
    title: "KDP Royalty Calculator",
    description: "Calculate your exact earnings before you publish. Factor in page count, trim size, marketplace, and royalty rate.",
    href: "/royalty-calculator",
    available: false,
    color: "green",
    iconPath: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
  },
];

const colors: Record<string, Record<string, string>> = {
  blue:   { icon: "text-blue-400",   hover: "hover:border-blue-500/50",   btn: "bg-blue-600 hover:bg-blue-700" },
  purple: { icon: "text-purple-400", hover: "hover:border-purple-500/50", btn: "bg-purple-600 hover:bg-purple-700" },
  amber:  { icon: "text-amber-400",  hover: "hover:border-amber-500/50",  btn: "bg-amber-600 hover:bg-amber-700" },
  green:  { icon: "text-green-400",  hover: "hover:border-green-500/50",  btn: "bg-green-600 hover:bg-green-700" },
  emerald: { icon: "text-emerald-400", hover: "hover:border-emerald-500/50", btn: "bg-emerald-600 hover:bg-emerald-700" },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">ScribeStack</span>
          </div>
          <Link
            href="/kdp-formatter"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <section className="px-6 pt-20 pb-16 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Built for indie authors and self-publishers
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight mb-6 leading-tight">
            One platform.{" "}
            <span className="text-blue-400">Every publishing tool</span>{" "}
            you need.
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed mb-10 max-w-2xl mx-auto">
            Stop bouncing between apps. ScribeStack gives indie authors
            professional-grade tools — each one focused on doing a single job
            exceptionally well.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#tools"
              className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/30"
            >
              Browse Tools
            </a>
            <Link
              href="/kdp-formatter"
              className="rounded-lg border border-slate-600 px-8 py-4 text-lg font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Try KDP Formatter Free
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="border-y border-slate-800 bg-slate-900/50 py-6 mb-16">
        <div className="mx-auto max-w-4xl px-6 grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-2xl font-bold text-white">4</p>
            <p className="text-sm text-slate-400 mt-1">Tools planned</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">1</p>
            <p className="text-sm text-slate-400 mt-1">Live now</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">Free</p>
            <p className="text-sm text-slate-400 mt-1">During beta</p>
          </div>
        </div>
      </div>

      {/* Tools grid */}
      <section id="tools" className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">The Tools</h2>
            <p className="text-slate-400">Each one does a single job — and does it right.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {tools.map((tool) => {
              const c = colors[tool.color];
              return (
                <div
                  key={tool.id}
                  className={`relative rounded-2xl border border-slate-700/60 bg-slate-800/50 p-8 flex flex-col transition-all duration-200 ${c.hover}`}
                >
                  {/* Status badge */}
                  <div className="absolute top-5 right-5">
                    {tool.available ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 border border-green-500/30 px-2.5 py-1 text-xs font-medium text-green-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Live
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-700 border border-slate-600 px-2.5 py-1 text-xs font-medium text-slate-400">
                        Coming Soon
                      </span>
                    )}
                  </div>

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-slate-700/80 flex items-center justify-center mb-5 ${c.icon}`}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tool.iconPath} />
                    </svg>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 pr-20">{tool.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-6">
                    {tool.description}
                  </p>

                  {tool.available ? (
                    <Link
                      href={tool.href}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-colors ${c.btn}`}
                    >
                      Launch Tool
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-slate-500 bg-slate-700/40 cursor-not-allowed border border-slate-700/60"
                    >
                      Notify Me When Ready
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/60 px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="font-medium text-slate-400">ScribeStack</span>
            <span>{new Date().getFullYear()}</span>
          </div>
          <p>Files auto-deleted after 24 hours. No personal data stored.</p>
        </div>
      </footer>

    </div>
  );
}
