"use client";

import Link from "next/link";
import Image from "next/image";
import AuthNav from "@/components/AuthNav";
import { BrandWordmark } from "@/components/BrandWordmark";
import { NavToolsDropdown } from "@/components/NavToolsDropdown";

export default function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 overflow-visible border-b border-m2p-border bg-m2p-ivory/98 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image
            src="/MANNY AVATAR.png"
            alt="Manny"
            width={36}
            height={36}
            className="rounded-full shrink-0"
          />
          <Link href="/" className="flex items-center overflow-visible">
            <BrandWordmark variant="onLight" className="text-xl" />
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <NavToolsDropdown />
          <Link href="/blog" className="m2p-link-nav">
            Blog
          </Link>
          <Link href="/contact" className="m2p-link-nav">
            Contact
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
