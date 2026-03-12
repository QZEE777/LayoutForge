"use client";

import Link from "next/link";

interface ToolBreadcrumbProps {
  /** Link to tools list (e.g. / or /platform/kdp) */
  backHref?: string;
  /** Label for the back link */
  backLabel?: string;
  /** Current page label (optional, e.g. "KDP Formatter") */
  currentLabel?: string;
  className?: string;
}

/**
 * Optional breadcrumb for tool pages: "All Tools" or "All Tools → Current tool".
 */
export function ToolBreadcrumb({
  backHref = "/",
  backLabel = "All Tools",
  currentLabel,
  className = "",
}: ToolBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`text-sm text-m2p-muted ${className}`}>
      <Link href={backHref} className="text-m2p-muted hover:text-m2p-orange transition-colors">
        {backLabel}
      </Link>
      {currentLabel && (
        <>
          <span className="mx-2 text-m2p-muted" aria-hidden>→</span>
          <span className="text-m2p-muted">{currentLabel}</span>
        </>
      )}
    </nav>
  );
}
