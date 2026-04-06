"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

import { DashboardSidebar, type ActiveView } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { UploadPanel } from "@/components/dashboard/upload-panel";
import { ScanHistoryPanel } from "@/components/dashboard/scan-history-panel";
import { ToolsPanel } from "@/components/dashboard/tools-panel";
import { EarnPanel } from "@/components/dashboard/earn-panel";
import { SettingsPanel } from "@/components/dashboard/settings-panel";
import { FounderHubPanel } from "@/components/dashboard/founder-hub-panel";

type Scan = {
  id: string;
  fileName: string;
  scanDate: string;
  grade: string | null;
  gradeLabel: string | null;
  score: number | null;
  issueCount: number;
  kdpReady: boolean;
  riskLevel: string | null;
  creationTool: string | null;
};

type Summary = {
  recentScans: Scan[];
  credits: { total: number; used: number; remaining: number };
};

type Affiliate = {
  id: string;
  name: string | null;
  code: string;
  status: string;
  commission_rate: number | null;
  created_at: string;
  email: string;
};

type AffiliateStats = {
  clicks: number;
  conversions: number;
  totalEarned: number;
  totalPaid: number;
  pendingPayout: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expandOrdersFromUrl = searchParams.get("orders") === "1";

  const [user, setUser]               = useState<User | null>(null);
  const [summary, setSummary]         = useState<Summary | null>(null);
  const [affiliate, setAffiliate]     = useState<Affiliate | null | undefined>(undefined);
  const [affStats, setAffStats]       = useState<AffiliateStats | null>(null);
  const [isFounder, setIsFounder]     = useState(false);
  const [firstName, setFirstName]       = useState("");
  const [avatarUrl, setAvatarUrl]       = useState<string | undefined>(undefined);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [profileMsg, setProfileMsg]     = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab]                 = useState<ActiveView>(() => {
    const t = searchParams.get("tab");
    if (t === "earn" || t === "settings" || t === "history" || t === "tools" || t === "founder") return t;
    return "upload";
  });

  // ── Auth + data fetch ───────────────────────────────────────────────────
  useEffect(() => {
    const client = createClient();
    (async () => {
      const { data: { user: u } } = await client.auth.getUser();
      if (!u) { router.replace("/auth"); return; }
      setUser(u);

      const [summaryRes, affiliateRes, profileRes] = await Promise.all([
        fetch("/api/dashboard/summary"),
        fetch("/api/affiliates/me"),
        client.from("profiles").select("first_name, avatar_url, is_founder").eq("id", u.id).maybeSingle(),
      ]);

      if (summaryRes.ok) {
        const d = await summaryRes.json();
        setSummary(d);
      }

      if (affiliateRes.ok) {
        const d = await affiliateRes.json();
        setAffiliate(d.affiliate ?? null);
        if (d.stats) setAffStats(d.stats);
      } else {
        setAffiliate(null);
      }

      if (profileRes.data?.first_name) setFirstName(profileRes.data.first_name);
      if (profileRes.data?.avatar_url)  setAvatarUrl(profileRes.data.avatar_url);
      setIsFounder(Boolean(profileRes.data?.is_founder));
    })();
  }, [router]);

  // Keep ?tab= in sync when switching views (shareable / refresh-safe)
  useEffect(() => {
    if (!isFounder && tab === "founder") setTab("upload");
  }, [isFounder, tab]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = "/dashboard";
    const next = tab === "upload" ? path : `${path}?tab=${encodeURIComponent(tab)}`;
    const cur = window.location.pathname + window.location.search;
    if (cur !== next) window.history.replaceState(null, "", next);
  }, [tab]);

  // ── Profile save ────────────────────────────────────────────────────────
  const handleProfileSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setProfileMsg(null);
    try {
      const client = createClient();
      const { error } = await client.from("profiles").update({ first_name: firstName.trim() }).eq("id", user.id);
      setProfileMsg(error ? { type: "err", text: "Failed to save." } : { type: "ok", text: "Saved!" });
    } finally {
      setSaving(false);
    }
  }, [user, firstName]);

  // ── Avatar upload ────────────────────────────────────────────────────────
  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!user) return;
    setAvatarUploading(true);
    setProfileMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("userId", user.id);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setProfileMsg({ type: "err", text: json.error ?? "Upload failed." });
      } else {
        setAvatarUrl(json.url);
        setProfileMsg({ type: "ok", text: "Photo updated!" });
      }
    } catch {
      setProfileMsg({ type: "err", text: "Upload failed." });
    } finally {
      setAvatarUploading(false);
    }
  }, [user]);

  // ── Sign out ─────────────────────────────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    const client = createClient();
    await client.auth.signOut();
    router.replace("/auth");
  }, [router]);

  // ── Loading state ───────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-6" style={{ background: "var(--d-bg)" }}>
        <div
          className="h-10 w-10 rounded-full border-[3px] border-t-transparent animate-spin"
          style={{ borderColor: "#f05a28", borderTopColor: "transparent" }}
          aria-hidden
        />
        <p className="text-sm font-medium" style={{ color: "var(--d-fg-muted)" }}>Loading your dashboard…</p>
      </div>
    );
  }

  const displayName = firstName
    ? `${firstName} ${user.email?.split("@")[0] ?? ""}`.trim()
    : user.email?.split("@")[0] ?? "User";

  const userInfo = {
    name: displayName,
    email: user.email ?? "",
    scansRemaining: summary?.credits?.remaining ?? 0,
  };

  return (
    <div className="flex h-full overflow-hidden">
      <DashboardSidebar
        activeView={tab}
        setActiveView={setTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={userInfo}
        isPartner={affiliate?.status === "active"}
        isFounder={isFounder}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader activeView={tab} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto p-5 lg:p-8 lg:pl-10">
          {tab === "upload" && (
            <UploadPanel
              scansRemaining={userInfo.scansRemaining}
              recentScans={summary?.recentScans ?? []}
              onViewAllScans={() => setTab("history")}
            />
          )}
          {tab === "history" && (
            <ScanHistoryPanel scans={summary?.recentScans ?? []} />
          )}
          {tab === "tools" && <ToolsPanel />}
          {tab === "earn" && (
            <>
              <div className="mb-4 flex justify-start">
                <Image
                  src="/MANNY AVATAR.png"
                  alt="Manny"
                  width={100}
                  height={100}
                  className="h-[100px] w-[100px] shrink-0 rounded-full object-cover shadow-md ring-2 ring-white/90"
                  style={{ boxShadow: "0 8px 24px -8px rgba(26,18,8,0.2)" }}
                  priority
                />
              </div>
              <EarnPanel
                affiliate={affiliate === undefined ? null : affiliate}
                stats={affStats}
                isFounder={isFounder}
              />
            </>
          )}
          {tab === "settings" && (
            <SettingsPanel
              user={userInfo}
              firstName={firstName}
              setFirstName={setFirstName}
              saving={saving}
              profileMsg={profileMsg}
              onSave={handleProfileSave}
              onSignOut={handleSignOut}
              avatarUrl={avatarUrl}
              avatarUploading={avatarUploading}
              onAvatarChange={handleAvatarUpload}
              initialExpandPurchaseHistory={expandOrdersFromUrl}
            />
          )}
          {tab === "founder" && isFounder && <FounderHubPanel />}
        </main>
      </div>
    </div>
  );
}
