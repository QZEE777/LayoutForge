import Link from "next/link";

interface ComingSoonLayoutProps {
  title: string;
  description: string;
  iconPath?: string;
  suggestedToolHref?: string;
  suggestedToolLabel?: string;
}

export default function ComingSoonLayout({
  title,
  description,
  iconPath,
  suggestedToolHref,
  suggestedToolLabel,
}: ComingSoonLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-slate-900">
            ScribeStack
          </Link>
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        {iconPath && (
          <div className="mb-6 flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-600">
              <svg
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={iconPath}
                />
              </svg>
            </span>
          </div>
        )}
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-3 text-slate-600">{description}</p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800">
          Coming soon
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            Back to Home
          </Link>
          {suggestedToolHref && suggestedToolLabel && (
            <Link
              href={suggestedToolHref}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Try {suggestedToolLabel}
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
