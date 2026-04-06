"use client";

import { ActiveView } from "./sidebar";
import { Button } from "@/components/ui/button";
import { Menu, HelpCircle } from "lucide-react";
import Link from "next/link";

const viewMeta: Record<ActiveView, { title: string; subtitle: string }> = {
  upload:   { title: "Overview",          subtitle: "Run a new check and open recent reports in one place" },
  history:  { title: "My Scans",          subtitle: "Full list of PDF checks and download links" },
  tools:    { title: "Free Tools",        subtitle: "Helpful utilities for indie authors — no payment required" },
  earn:     { title: "Partner Program",   subtitle: "Earn 30–40% commission on every referral" },
  settings: { title: "Settings",          subtitle: "Manage your account and preferences" },
};

interface HeaderProps {
  activeView: ActiveView;
  setSidebarOpen: (o: boolean) => void;
}

export function DashboardHeader({ activeView, setSidebarOpen }: HeaderProps) {
  const { title, subtitle } = viewMeta[activeView];
  return (
    <header className="flex shrink-0 flex-col">
      <div className="d-header-surface relative flex h-[4.25rem] items-center px-4 lg:px-6">
        <Button variant="ghost" size="icon" className="relative z-10 shrink-0 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-14 text-center sm:px-24">
          <h1
            className="font-bebas text-xl leading-none tracking-wide sm:text-2xl"
            style={{ color: "var(--d-fg)" }}
          >
            {title}
          </h1>
          <p className="mt-1 hidden max-w-md text-[11px] leading-snug sm:block sm:text-xs" style={{ color: "var(--d-fg-muted)" }}>
            {subtitle}
          </p>
        </div>
        <div className="relative z-10 ml-auto shrink-0">
          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--d-border)] bg-white/90 px-3 py-1.5 text-xs font-semibold shadow-sm transition-all hover:border-[#f05a28]/35 hover:bg-[#fff8f4] hover:text-[var(--d-primary)]"
            style={{ color: "var(--d-fg-muted)" }}
          >
            <HelpCircle className="h-4 w-4 shrink-0 text-[var(--d-primary)]" />
            <span className="hidden sm:inline">Help</span>
          </Link>
        </div>
      </div>
      <div className="d-brand-rule" aria-hidden />
    </header>
  );
}
