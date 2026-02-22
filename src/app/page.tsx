import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">LayoutForge</h1>
          <nav className="flex gap-4">
            <a
              href="#features"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              About
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-5xl sm:text-6xl font-bold tracking-tight text-white mb-6">
            Professional Manuscript Formatting for KDP
          </h2>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Upload your manuscript once. Get a print-ready PDF and formatted file in minutes. 
            Amazon KDP compliant. Professional typography. No design skills required.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/upload"
              className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Upload Manuscript
            </Link>
            <a
              href="#features"
              className="rounded-lg border border-slate-500 px-8 py-4 text-lg font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Learn More
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex justify-center gap-8 text-sm text-slate-400">
            <div>✓ KDP Compliant</div>
            <div>✓ Secure & Private</div>
            <div>✓ No Setup Required</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-16 bg-slate-800/50">
        <div className="mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-white text-center mb-12">
            What LayoutForge Does
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="rounded-lg bg-slate-700/50 p-8 border border-slate-600/50 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Print-Ready PDF
              </h4>
              <p className="text-slate-300">
                Professional PDF with KDP-compliant trim sizes, margins, and bleed settings for perfect paperbacks.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-lg bg-slate-700/50 p-8 border border-slate-600/50 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Easy Customization
              </h4>
              <p className="text-slate-300">
                Choose trim size, font size, and bleed settings. Preview your options before generating the final PDF.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-lg bg-slate-700/50 p-8 border border-slate-600/50 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Instant Results
              </h4>
              <p className="text-slate-300">
                Generate your PDF in seconds. Download and upload directly to Amazon KDP. No waiting, no BS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Formats */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h3 className="text-3xl font-bold text-white text-center mb-8">
            Supported File Formats
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="rounded-lg bg-slate-700/30 p-6 border border-slate-600/50">
              <p className="text-2xl mb-2">📄</p>
              <p className="font-semibold text-white">PDF</p>
              <p className="text-sm text-slate-400">Text extraction</p>
            </div>
            <div className="rounded-lg bg-slate-700/30 p-6 border border-slate-600/50">
              <p className="text-2xl mb-2">📝</p>
              <p className="font-semibold text-white">DOCX</p>
              <p className="text-sm text-slate-400">Full support</p>
            </div>
            <div className="rounded-lg bg-slate-700/30 p-6 border border-slate-600/50">
              <p className="text-2xl mb-2">📚</p>
              <p className="font-semibold text-white">EPUB</p>
              <p className="text-sm text-slate-400">Compatible</p>
            </div>
          </div>
        </div>
      </section>

      {/* KDP Specs */}
      <section id="about" className="px-4 py-16 bg-slate-800/50">
        <div className="mx-auto max-w-4xl">
          <h3 className="text-3xl font-bold text-white text-center mb-8">
            KDP Compliance
          </h3>
          <div className="rounded-lg bg-slate-700/50 p-8 border border-slate-600/50">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-white mb-4">Trim Sizes</h4>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li>• 5" × 8"</li>
                  <li>• 5.5" × 8.5"</li>
                  <li>• 6" × 9" (most popular)</li>
                  <li>• 8.5" × 11"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Features</h4>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li>✓ Professional margins</li>
                  <li>✓ Bleed support (0.125")</li>
                  <li>✓ Page-count based gutter</li>
                  <li>✓ Print-ready quality</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="text-4xl font-bold text-white mb-6">
            Ready to format your manuscript?
          </h3>
          <p className="text-lg text-slate-300 mb-8">
            Get your KDP-ready PDF in minutes, not hours.
          </p>
          <Link
            href="/upload"
            className="inline-block rounded-lg bg-blue-600 px-10 py-4 text-lg font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Start Formatting Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 px-4 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-slate-400">
          <p>LayoutForge © {new Date().getFullYear()} • KDP Manuscript Formatting Tool</p>
          <p className="mt-2">
            Upload files securely • Auto-deleted after 24 hours • No personal data stored
          </p>
        </div>
      </footer>
    </div>
  );
}
