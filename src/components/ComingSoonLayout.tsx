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
    <div className="min-h-screen bg-ivory text-amazon-navy antialiased">
      <header className="border-b border-soft-border bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-amazon-navy">
            <span className="w-6 h-6 rounded bg-brave flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </span>
            manu2print
          </Link>
          <Link href="/" className="text-sm text-soft-muted hover:text-brave transition-colors">
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        {iconPath && (
          <div className="mb-6 flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brave/10 text-brave">
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
        <h1 className="font-bebas text-2xl sm:text-3xl tracking-wide text-amazon-navy">{title}</h1>
        <p className="mt-3 text-soft-muted">{description}</p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-freeGreen/20 px-4 py-2 text-sm font-bold uppercase tracking-wider text-freeGreen">
          Coming soon
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-lg bg-brave px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Back to Home
          </Link>
          {suggestedToolHref && suggestedToolLabel && (
            <Link
              href={suggestedToolHref}
              className="rounded-lg border-2 border-amazon-navy px-5 py-2.5 text-sm font-medium text-amazon-navy hover:bg-amazon-navy hover:text-white transition-colors"
            >
              Try {suggestedToolLabel}
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
