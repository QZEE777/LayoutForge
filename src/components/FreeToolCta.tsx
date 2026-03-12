import Link from "next/link";

/**
 * Soft CTA after free tool use: nudge toward a paid tool without blocking.
 */
export default function FreeToolCta({
  title = "Ready for the next step?",
  description,
  href,
  buttonText,
}: {
  title?: string;
  description: string;
  href: string;
  buttonText: string;
}) {
  return (
    <div className="mt-8 rounded-xl border border-m2p-border bg-m2p-orange-soft/50 p-5">
      <p className="font-sans text-sm font-medium text-m2p-ink mb-1">{title}</p>
      <p className="font-sans text-sm text-m2p-muted mb-4">{description}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-lg bg-m2p-orange px-4 py-2.5 text-sm font-semibold text-white hover:bg-m2p-orange-hover"
      >
        {buttonText}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
