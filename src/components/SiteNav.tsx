"use client";

import Link from "next/link";
import AuthNav from "@/components/AuthNav";
import { BrandWordmark } from "@/components/BrandWordmark";
import { NavToolsDropdown } from "@/components/NavToolsDropdown";

export default function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 overflow-visible border-b border-m2p-border bg-m2p-ivory/98 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex items-center overflow-visible">
          <BrandWordmark variant="onLight" className="text-xl" />
        </Link>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <NavToolsDropdown />
          <Link href="/#how-it-works" className="m2p-link-nav">
            How It Works
          </Link>
          <Link href="/#pricing" className="m2p-link-nav">
            Pricing
          </Link>
          <Link href="/blog" className="m2p-link-nav">
            Blog
          </Link>
          <Link href="/partners/apply" className="m2p-link-nav text-m2p-live hover:opacity-80">
            Earn 40%
          </Link>
          <Link
            href="/kdp-pdf-checker"
            className="m2p-btn-primary"
          >
            Check My PDF
          </Link>
          <AuthNav theme="light" />
        </div>
      </div>
    </nav>
  );
}
