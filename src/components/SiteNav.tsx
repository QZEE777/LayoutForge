"use client";

import Link from "next/link";
import AuthNav from "@/components/AuthNav";
import { BrandWordmark } from "@/components/BrandWordmark";

export default function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 overflow-visible border-b border-m2p-border bg-m2p-ivory/98 backdrop-blur-sm" style={{ overflow: "visible" }}>
      <div className="mx-auto max-w-6xl px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex items-center overflow-visible">
          <BrandWordmark variant="onLight" className="text-xl" />
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/#tools" className="font-medium text-m2p-muted hover:text-m2p-orange transition-colors text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
            Tools
          </Link>
          <Link href="/#how-it-works" className="font-medium text-m2p-muted hover:text-m2p-orange transition-colors text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
            How It Works
          </Link>
          <Link href="/#pricing" className="font-medium text-m2p-muted hover:text-m2p-orange transition-colors text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
            Pricing
          </Link>
          <Link href="/about" className="font-medium text-m2p-muted hover:text-m2p-orange transition-colors text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
            About
          </Link>
          <Link href="/partners/apply" className="font-medium text-m2p-live hover:opacity-75 transition-opacity text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
            Earn 40%
          </Link>
          <Link
            href="/kdp-pdf-checker"
            className="bg-m2p-orange hover:bg-m2p-orange-hover text-white font-bold px-6 py-2.5 rounded-xl shadow-[0_2px_12px_rgba(240,90,40,0.3)] hover:shadow-[0_4px_16px_rgba(240,90,40,0.4)] transition-all"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Check My PDF
          </Link>
          <AuthNav theme="light" />
        </div>
      </div>
    </nav>
  );
}
