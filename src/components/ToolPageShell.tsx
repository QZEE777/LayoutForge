import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import SiteFooter from "@/components/SiteFooter";
import { BrandWordmark } from "@/components/BrandWordmark";

interface ToolPageShellProps {
  children: ReactNode;
}

export default function ToolPageShell({ children }: ToolPageShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-m2p-ivory">
      {/* Minimal tool nav */}
      <header className="border-b border-m2p-border bg-m2p-ivory">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center justify-between">
          {/* Logo: Manny + wordmark */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/MANNY AVATAR.png"
              alt="Manny"
              width={120}
              height={120}
              className="rounded-full"
            />
            <BrandWordmark variant="onLight" className="text-lg" />
          </Link>
          {/* Right side: Home link + CTA */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-m2p-muted hover:text-m2p-orange transition-colors"
            >
              Home
            </Link>
            <Link
              href="/kdp-pdf-checker"
              className="inline-flex items-center rounded-full bg-m2p-orange px-4 py-1.5 text-xs font-bold text-white hover:bg-m2p-orange-hover transition-colors"
            >
              Check My PDF — $9
            </Link>
          </div>
        </div>
      </header>
      {/* Page content */}
      <main className="flex-1">{children}</main>
      {/* Footer always present */}
      <SiteFooter />
    </div>
  );
}
