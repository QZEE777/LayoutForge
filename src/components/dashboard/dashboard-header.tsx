"use client";

import { ActiveView } from "./sidebar";
import { Button } from "@/components/ui/button";
import { Menu, Bell, HelpCircle } from "lucide-react";
import Link from "next/link";

const viewMeta: Record<ActiveView, { title: string; subtitle: string }> = {
  upload:   { title: "Check Your PDF",    subtitle: "Validate against all 26 KDP rules before you publish" },
  history:  { title: "My Scans",          subtitle: "View your previous PDF checks and reports" },
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
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b shrink-0"
      style={{ background: "var(--d-card)", borderColor: "var(--d-border)" }}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-base font-semibold" style={{ color: "var(--d-fg)" }}>{title}</h1>
          <p className="text-xs hidden sm:block" style={{ color: "var(--d-fg-muted)" }}>{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Link href="/" target="_blank">
          <Button variant="ghost" size="icon">
            <HelpCircle className="w-5 h-5" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
