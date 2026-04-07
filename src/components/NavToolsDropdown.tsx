"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const TOOL_LINKS: { href: string; label: string }[] = [
  { href: "/pdf-compress", label: "PDF Compressor" },
  { href: "/kdp-pdf-checker", label: "KDP PDF Checker" },
  { href: "/spine-calculator", label: "Spine Width Calculator" },
  { href: "/cover-calculator", label: "Cover Size Calculator" },
  { href: "/royalty-calculator", label: "Royalty Calculator" },
  { href: "/banned-keyword-checker", label: "Banned Keyword Checker" },
  { href: "/page-count-estimator", label: "Page Count Estimator" },
  { href: "/trim-size-comparison", label: "Trim Size Comparison" },
  { href: "/interior-template", label: "Interior Template" },
];

export function NavToolsDropdown() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        id="nav-tools-trigger"
        onClick={() => setOpen((v) => !v)}
        className="m2p-link-nav inline-flex items-center gap-0.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-m2p-orange focus-visible:ring-offset-2 focus-visible:ring-offset-m2p-ivory"
      >
        Tools
        <ChevronDown
          className={`h-4 w-4 shrink-0 opacity-80 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-[60] mt-1.5 min-w-[min(100vw-2rem,16rem)] rounded-lg border border-m2p-border bg-white py-1 shadow-[0_10px_40px_-10px_rgba(26,18,8,0.18)] sm:min-w-[17.5rem]"
          role="menu"
          aria-labelledby="nav-tools-trigger"
        >
          {TOOL_LINKS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              role="menuitem"
              className="block px-4 py-2.5 text-left text-sm text-m2p-ink transition-colors hover:bg-m2p-orange-soft/80"
              onClick={close}
            >
              {t.label}
            </Link>
          ))}
          <div className="my-1 border-t border-m2p-border" role="separator" />
          <Link
            href="/#tools"
            role="menuitem"
            className="block px-4 py-2.5 text-left text-sm font-medium text-m2p-orange hover:bg-m2p-orange-soft/50"
            onClick={close}
          >
            All tools on homepage →
          </Link>
        </div>
      )}
    </div>
  );
}
