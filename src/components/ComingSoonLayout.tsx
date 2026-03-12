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
    <div className="min-h-screen bg-m2p-ivory text-m2p-ink antialiased">
      <header className="border-b border-m2p-border bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-m2p-ink">
            <span className="w-6 h-6 rounded bg-m2p-orange flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </span>
            manu2print
          </Link>
          <Link href="/" className="text-sm text-m2p-muted hover:text-m2p-orange transition-colors">
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        {iconPath && (
          <div className="mb-6 flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-m2p-orange-soft text-m2p-orange">
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
        <h1 className="font-bebas text-2xl sm:text-3xl tracking-wide text-m2p-ink">{title}</h1>
        <p className="mt-3 text-m2p-muted">{description}</p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-m2p-live/20 px-4 py-2 text-sm font-bold uppercase tracking-wider text-m2p-live">
          Coming soon
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-lg bg-m2p-orange px-5 py-2.5 text-sm font-medium text-white hover:bg-m2p-orange-hover transition-colors"
          >
            Back to Home
          </Link>
          {suggestedToolHref && suggestedToolLabel && (
            <Link
              href={suggestedToolHref}
              className="rounded-lg border-2 border-m2p-ink px-5 py-2.5 text-sm font-medium text-m2p-ink hover:bg-m2p-ink hover:text-white transition-colors"
            >
              Try {suggestedToolLabel}
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
