"use client";

import Link from "next/link";

interface ToolBreadcrumbProps {
  /** Link to tools list (e.g. / or /formatter) */
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
    <nav aria-label="Breadcrumb" className={`text-sm text-slate-500 ${className}`}>
      <Link href={backHref} className="text-slate-400 hover:text-white transition-colors">
        {backLabel}
      </Link>
      {currentLabel && (
        <>
          <span className="mx-2 text-slate-600" aria-hidden>→</span>
          <span className="text-slate-400">{currentLabel}</span>
        </>
      )}
    </nav>
  );
}
