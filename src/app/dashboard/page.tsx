"use client";

import { useEffect, useState, useCallback } from "react";
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
  paypal_email: string | null;
  wise_email: string | null;
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

  const [user, setUser]               = useState<User | null>(null);
  const [summary, setSummary]         = useState<Summary | null>(null);
  const [affiliate, setAffiliate]     = useState<Affiliate | null | undefined>(undefined);
  const [affStats, setAffStats]       = useState<AffiliateStats | null>(null);
  const [firstName, setFirstName]       = useState("");
  const [avatarUrl, setAvatarUrl]       = useState<string | undefined>(undefined);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [profileMsg, setProfileMsg]     = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab]                 = useState<ActiveView>(() => {
    const t = searchParams.get("tab");
    if (t === "earn" || t === "settings" || t === "history" || t === "tools") return t;
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
        client.from("profiles").select("first_name, avatar_url").eq("id", u.id).maybeSingle(),
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
    })();
  }, [router]);

  // ── Profile save ────────────────────────────────────────────────────────
  const handleProfileSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setProfileMsg(null);
    try {
      const client = createClient();
      const { error } = await client.from("profiles").upsert({ id: user.id, first_name: firstName.trim() });
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
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--d-bg)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#F05A28", borderTopColor: "transparent" }} />
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
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader activeView={tab} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          {tab === "upload" && (
            <UploadPanel scansRemaining={userInfo.scansRemaining} />
          )}
          {tab === "history" && (
            <ScanHistoryPanel scans={summary?.recentScans ?? []} />
          )}
          {tab === "tools" && <ToolsPanel />}
          {tab === "earn" && (
            <EarnPanel
              affiliate={affiliate === undefined ? null : affiliate}
              stats={affStats}
            />
          )}
          {tab === "settings" && (
            <SettingsPanel
              user={userInfo}
              affiliate={affiliate === undefined ? null : affiliate}
              firstName={firstName}
              setFirstName={setFirstName}
              saving={saving}
              profileMsg={profileMsg}
              onSave={handleProfileSave}
              onSignOut={handleSignOut}
              avatarUrl={avatarUrl}
              avatarUploading={avatarUploading}
              onAvatarChange={handleAvatarUpload}
            />
          )}
        </main>
      </div>
    </div>
  );
}
