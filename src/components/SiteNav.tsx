"use client";

import Link from "next/link";
import AuthNav from "@/components/AuthNav";

export default function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 overflow-visible border-b border-m2p-border bg-m2p-ivory/98 backdrop-blur-sm" style={{ overflow: "visible" }}>
      <div className="mx-auto max-w-6xl px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 overflow-visible">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/manny-avatar.png" alt="Manny" width={60} height={60} style={{ flexShrink: 0, display: "block", borderRadius: "50%", objectFit: "cover" }} />
          <span className="font-bold text-xl">
            <span className="text-m2p-orange">manu</span>
            <span className="text-m2p-live">2print</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/#tools" className="font-medium text-m2p-muted hover:text-m2p-orange transition-colors text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
            Tools
          </Link>
          <Link href="/#how-it-works" className="font-medium text-m2p-muted hover:text-m2p-orange transition-colors text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
            How It Works
          </Link>
          <Link href="/pricing" className="font-medium text-m2p-muted hover:text-m2p-orange transition-colors text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
            Pricing
          </Link>
          <Link href="/about" className="font-medium text-m2p-muted hover:text-m2p-orange transition-colors text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
            About
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
