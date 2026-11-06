"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { BrandWordmark } from "@/components/BrandWordmark";
import { NavToolsDropdown } from "@/components/NavToolsDropdown";
import SocialLinks from "@/components/SocialLinks";
import { cn } from "@/lib/utils";

// Blog-only header and footer, matching the redesigned KDP PDF Checker page.
// The rest of the site still uses SiteShell until the full redo.

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F05A28] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7EE]";

const NAV_LINKS: Array<{ href: string; label: string; active?: boolean }> = [
  { href: "/kdp-pdf-checker", label: "KDP PDF Checker" },
  { href: "/blog", label: "Publishing Guides", active: true },
  { href: "/kdp-pdf-checker#pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

const MOBILE_TOOL_LINKS = [
  { href: "/spine-calculator", label: "Spine Width Calculator" },
  { href: "/royalty-calculator", label: "Royalty Calculator" },
  { href: "/page-count-estimator", label: "Page Count Estimator" },
  { href: "/title-metadata-check", label: "Title & Metadata Check" },
];

const FOOTER_LINKS = [
  { href: "/kdp-pdf-checker", label: "KDP PDF Checker" },
  { href: "/blog", label: "Publishing Guides" },
  { href: "/kdp-pdf-checker#pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function BlogShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF7EE] text-[#1A1208]">
      <header className="sticky top-0 z-30 border-b border-[#E0D8C4]/70 bg-[#FAF7EE]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-6">
          <Link href="/" className={cn("flex shrink-0 items-center gap-2.5 rounded-lg", FOCUS)}>
            <Image src="/MANNY AVATAR.png" alt="" width={44} height={44} className="rounded-full" priority />
            <BrandWordmark variant="onLight" className="text-2xl sm:text-[1.7rem]" />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.slice(0, 2).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={l.active ? "page" : undefined}
                className={cn(
                  "rounded text-[15px] font-medium transition-colors",
                  l.active
                    ? "border-b-2 border-[#F05A28] pb-0.5 text-[#F05A28]"
                    : "text-[#1A1208] hover:text-[#F05A28]",
                  FOCUS,
                )}
              >
                {l.label}
              </Link>
            ))}
            <NavToolsDropdown />
            {NAV_LINKS.slice(2).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn("rounded text-[15px] font-medium text-[#1A1208] transition-colors hover:text-[#F05A28]", FOCUS)}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className={cn("rounded-lg p-2 text-[#1A1208] md:hidden", FOCUS)}
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-nav"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            {mobileNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileNavOpen && (
          <nav id="mobile-nav" aria-label="Main" className="border-t border-[#E0D8C4] bg-[#FAF7EE] px-5 pb-4 pt-2 md:hidden">
            {[...NAV_LINKS, ...MOBILE_TOOL_LINKS].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileNavOpen(false)}
                className={cn("block rounded-md py-2.5 text-base font-medium text-[#1A1208] hover:text-[#F05A28]", FOCUS)}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#E0D8C4]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-6 sm:px-6 lg:flex-row lg:justify-between">
          <Link href="/" className={cn("flex shrink-0 items-center gap-2.5 rounded-lg", FOCUS)}>
            <Image src="/MANNY AVATAR.png" alt="" width={40} height={40} className="rounded-full" />
            <BrandWordmark variant="onLight" className="text-2xl" />
          </Link>
          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium">
            {FOOTER_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded transition-colors hover:text-[#F05A28]",
                  l.href === "/blog" ? "text-[#F05A28]" : "text-[#1A1208]",
                  FOCUS,
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <SocialLinks variant="light" size="sm" />
        </div>
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 border-t border-[#E0D8C4]/70 px-5 py-4 text-xs text-[#6B6151] sm:flex-row sm:justify-between sm:px-6">
          <p>© 2026 manu2print.com · KDP tools for indie authors</p>
          <div className="flex gap-4">
            <Link href="/privacy" className={cn("rounded hover:text-[#F05A28]", FOCUS)}>Privacy</Link>
            <Link href="/terms" className={cn("rounded hover:text-[#F05A28]", FOCUS)}>Terms</Link>
            <Link href="/refunds" className={cn("rounded hover:text-[#F05A28]", FOCUS)}>Refunds</Link>
            <Link href="/cookies" className={cn("rounded hover:text-[#F05A28]", FOCUS)}>Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
