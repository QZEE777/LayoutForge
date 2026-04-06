"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { Upload, History, Wrench, Gift, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandWordmark } from "@/components/BrandWordmark";

export type ActiveView = "upload" | "history" | "tools" | "earn" | "settings";

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (v: ActiveView) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
  user: { name: string; email: string; scansRemaining: number };
  isPartner?: boolean;
}

const lowerNavItems: { id: Exclude<ActiveView, "upload" | "history">; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "tools", label: "Free Tools", icon: Wrench },
  { id: "earn", label: "Earn 30–40%", icon: Gift, badge: "New" },
  { id: "settings", label: "Settings", icon: Settings },
];

const partnerLowerNav: { id: Exclude<ActiveView, "upload" | "history">; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "tools", label: "Free Tools", icon: Wrench },
  { id: "earn", label: "Partner Dashboard", icon: Gift },
  { id: "settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar({ activeView, setActiveView, sidebarOpen, setSidebarOpen, user, isPartner }: SidebarProps) {
  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const restItems = isPartner ? partnerLowerNav : lowerNavItems;

  const go = (v: ActiveView) => {
    setActiveView(v);
    setSidebarOpen(false);
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-300 lg:translate-x-0",
          "border-r border-[var(--d-border-strong)] bg-gradient-to-b from-white via-[#faf8f5] to-[#f3efe8] shadow-[4px_0_24px_-8px_rgba(26,18,8,0.08)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--d-border)] px-5">
          <Link
            href="/"
            className="flex items-center rounded-lg outline-none ring-offset-2 transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-[var(--d-primary)]"
          >
            <BrandWordmark variant="onLight" className="text-xl" />
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Credits — summary only; primary action is the single Check PDF control below */}
        <div className="p-3">
          <div className="d-sidebar-credits rounded-2xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: "var(--d-fg-muted)" }}>
                Scan credits
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ background: "rgba(76,217,100,0.15)", color: "#15803d" }}
              >
                Active
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black tabular-nums" style={{ color: "var(--d-fg)" }}>
                {user.scansRemaining}
              </span>
              <span className="text-sm" style={{ color: "var(--d-fg-muted)" }}>
                remaining
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-1">
            {/* One primary pill + My Scans nested — avoids duplicate “Check PDF” CTAs */}
            <li className="space-y-0.5">
              <button
                type="button"
                onClick={() => go("upload")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200",
                  activeView === "upload"
                    ? "text-white shadow-[0_6px_20px_-4px_rgba(240,90,40,0.55)] ring-1 ring-white/25"
                    : "text-[var(--d-fg-muted)] hover:bg-white/80 hover:text-[var(--d-fg)] hover:shadow-sm"
                )}
                style={
                  activeView === "upload"
                    ? { background: "linear-gradient(135deg, #ff7a4a 0%, #f05a28 100%)" }
                    : undefined
                }
              >
                <Upload className="h-4 w-4 shrink-0 opacity-95" />
                <span className="min-w-0 flex-1 truncate">Check PDF</span>
              </button>
              <button
                type="button"
                onClick={() => go("history")}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg py-2 pl-9 pr-3 text-left text-xs font-semibold transition-colors",
                  activeView === "history"
                    ? "bg-[#fff8f4] text-[var(--d-primary)] ring-1 ring-[#f05a28]/20"
                    : "text-[var(--d-fg-muted)] hover:bg-white/60 hover:text-[var(--d-fg)]"
                )}
              >
                <History className="h-3.5 w-3.5 shrink-0 opacity-90" />
                My Scans
              </button>
            </li>

            {restItems.map(({ id, label, icon: Icon, badge }) => {
              const active = activeView === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => go(id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200",
                      active
                        ? "text-white shadow-[0_6px_20px_-4px_rgba(240,90,40,0.55)] ring-1 ring-white/25"
                        : "text-[var(--d-fg-muted)] hover:bg-white/80 hover:text-[var(--d-fg)] hover:shadow-sm"
                    )}
                    style={
                      active ? { background: "linear-gradient(135deg, #ff7a4a 0%, #f05a28 100%)" } : undefined
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-95" />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {badge && (
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          active ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-800"
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-[var(--d-border)] bg-white/40 p-4 backdrop-blur-[2px]">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md ring-2 ring-white/40"
              style={{ background: "linear-gradient(135deg, #F05A28, #4cd964)" }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--d-fg)" }}>
                {user.name}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--d-fg-muted)" }}>
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
