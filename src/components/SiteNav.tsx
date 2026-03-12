"use client";

import Link from "next/link";
import Image from "next/image";
import AuthNav from "@/components/AuthNav";

export default function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 overflow-visible border-b border-[#E0D8C4] bg-[#FAF7EE]/98 backdrop-blur-sm" style={{ overflow: "visible" }}>
      <div className="mx-auto max-w-6xl px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 overflow-visible">
          <Image src="/MANNY%20AVATAR.png" alt="Manny" width={32} height={32} unoptimized style={{ flexShrink: 0 }} />
          <span className="font-bold text-xl">
            <span style={{ color: "#F05A28" }}>manu</span>
            <span style={{ color: "#4CAF50" }}>2print</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/#tools" className="font-medium text-[#6B6151] hover:text-[#F05A28] transition-colors text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
            Tools
          </Link>
          <Link href="/#how-it-works" className="font-medium text-[#6B6151] hover:text-[#F05A28] transition-colors text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
            How It Works
          </Link>
          <Link href="/pricing" className="font-medium text-[#6B6151] hover:text-[#F05A28] transition-colors text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
            Pricing
          </Link>
          <Link href="/about" className="font-medium text-[#6B6151] hover:text-[#F05A28] transition-colors text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
            About
          </Link>
          <Link
            href="/kdp-pdf-checker"
            className="bg-[#F05A28] hover:bg-[#D94E20] text-white font-bold px-6 py-2.5 rounded-xl shadow-[0_2px_12px_rgba(240,90,40,0.3)] hover:shadow-[0_4px_16px_rgba(240,90,40,0.4)] transition-all"
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
