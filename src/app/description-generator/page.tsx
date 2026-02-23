import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">ScribeStack</span>
          </Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Tools
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 border border-slate-700 px-4 py-1.5 text-sm text-slate-400 mb-6">
            Coming Soon
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Amazon Description Generator</h1>
          <p className="text-lg text-slate-400 leading-relaxed mb-10">
            AI-powered book descriptions with SEO keywords baked in. Optimize your blurb for Amazon search and convert more browsers into buyers.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to All Tools
          </Link>
          <p className="mt-6 text-sm text-slate-600">
            In the meantime, try the{" "}
            <Link href="/kdp-formatter" className="text-blue-400 hover:text-blue-300 underline">
              KDP Formatter
            </Link>{" "}
            — it is live now.
          </p>
        </div>
      </main>
    </div>
  );
}
