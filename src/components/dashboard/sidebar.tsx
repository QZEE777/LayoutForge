"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { Upload, History, Wrench, Gift, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ActiveView = "upload" | "history" | "tools" | "earn" | "settings";

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (v: ActiveView) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
  user: { name: string; email: string; scansRemaining: number };
}

const navItems: { id: ActiveView; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "upload",   label: "Check PDF",    icon: Upload },
  { id: "history",  label: "My Scans",     icon: History },
  { id: "tools",    label: "Free Tools",   icon: Wrench },
  { id: "earn",     label: "Earn 30–40%",  icon: Gift,    badge: "New" },
  { id: "settings", label: "Settings",     icon: Settings },
];

export function DashboardSidebar({ activeView, setActiveView, sidebarOpen, setSidebarOpen, user }: SidebarProps) {
  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0",
        "bg-[var(--d-card)] border-r border-[var(--d-border)]",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--d-border)]">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-black tracking-tight">
              <span style={{ color: "#F05A28" }}>manu</span>
              <span style={{ color: "#4cd964" }}>2print</span>
            </span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Credits card */}
        <div className="p-3">
          <div className="rounded-xl p-4 border" style={{ background: "rgba(240,90,40,0.05)", borderColor: "rgba(240,90,40,0.2)" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: "var(--d-fg-muted)" }}>Scan Credits</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>Active</span>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-black" style={{ color: "var(--d-fg)" }}>{user.scansRemaining}</span>
              <span className="text-sm" style={{ color: "var(--d-fg-muted)" }}>remaining</span>
            </div>
            <button
              onClick={() => setActiveView("upload")}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#F05A28" }}
            >
              <Upload className="w-4 h-4" />
              Check PDF Now
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-1 overflow-y-auto">
          <ul className="space-y-0.5">
            {navItems.map(({ id, label, icon: Icon, badge }) => {
              const active = activeView === id;
              return (
                <li key={id}>
                  <button
                    onClick={() => { setActiveView(id); setSidebarOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "text-white shadow-md"
                        : "text-[var(--d-fg-muted)] hover:bg-[var(--d-muted)] hover:text-[var(--d-fg)]"
                    )}
                    style={active ? { background: "#F05A28" } : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{label}</span>
                    {badge && (
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full",
                        active ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-[var(--d-border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: "linear-gradient(135deg, #F05A28, #4cd964)" }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--d-fg)" }}>{user.name}</p>
              <p className="text-xs truncate" style={{ color: "var(--d-fg-muted)" }}>{user.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
