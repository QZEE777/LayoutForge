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
    <div className="mt-8 rounded-xl border border-brand-cardHover bg-brand-card/80 p-5">
      <p className="font-sans text-sm font-medium text-brand-cream mb-1">{title}</p>
      <p className="font-sans text-sm text-brand-muted mb-4">{description}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2.5 text-sm font-semibold text-brand-bg hover:opacity-90"
      >
        {buttonText}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
