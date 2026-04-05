"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { BrandWordmark } from "@/components/BrandWordmark";

const ADMIN_KEY = "Manu2Print_admin_auth";
const ADMIN_PWD_KEY = "Manu2Print_admin_pwd";
const PAGE_SIZE = 10;

function usePagination<T>(items: T[]) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const slice = items.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  return {
    slice,
    page: safePage,
    totalPages,
    total: items.length,
    setPage,
    from: items.length === 0 ? 0 : safePage * PAGE_SIZE + 1,
    to: Math.min(safePage * PAGE_SIZE + PAGE_SIZE, items.length),
  };
}

function Pager({ from, to, total, page, totalPages, setPage }: {
  from: number; to: number; total: number;
  page: number; totalPages: number;
  setPage: (p: number) => void;
}) {
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-m2p-border text-xs text-soft-muted">
      <span>{from}–{to} of {total}</span>
      <div className="flex gap-2">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
          className="px-3 py-1 rounded border border-m2p-border hover:border-m2p-orange disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages - 1}
          className="px-3 py-1 rounded border border-m2p-border hover:border-m2p-orange disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalRevenue: number;
    totalPayingCustomers: number;
    activeSubscriptions: number;
    betaUsers: number;
    pendingAffiliates: number;
    activeAffiliates: number;
    revenueByType: Record<string, number>;
    totalCreditsIssued: number;
    totalCreditsUsed: number;
  } | null>(null);
  const [userLookupEmail, setUserLookupEmail] = useState("");
  const [userLookupLoading, setUserLookupLoading] = useState(false);
  const [userLookupResult, setUserLookupResult] = useState<{
    profile: { id: string; full_name: string | null; created_at: string } | null;
    email: string;
    credits: { total: number; used: number; remaining: number; rows: Array<{ credits: number; used: number; note: string | null; created_at: string }> };
    payments: Array<{ id: string; amount: number | null; payment_type: string | null; status: string | null; gateway_order_id: string | null; created_at: string }>;
    scans: Array<{ download_id: string | null; created_at: string }>;
  } | null>(null);
  const [userLookupError, setUserLookupError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Array<{
    id: string;
    email: string | null;
    tool: string | null;
    payment_type: string | null;
    amount: number | null;
    status: string | null;
    created_at: string;
    gateway_order_id?: string | null;
  }>>([]);
  const [subscriptions, setSubscriptions] = useState<Array<{
    email: string | null;
    plan: string | null;
    status: string | null;
    current_period_end: string | null;
    created_at: string;
  }>>([]);
  const [betaAccess, setBetaAccess] = useState<Array<{
    email: string | null;
    tool: string | null;
    created_at: string;
  }>>([]);
  const [latestPaymentAt, setLatestPaymentAt] = useState<string | null>(null);
  const [formatterLeads, setFormatterLeads] = useState<Array<{ id?: string; email?: string | null; name?: string | null; created_at?: string }>>([]);
  const [emailCaptures, setEmailCaptures] = useState<Array<{ id?: string; email?: string | null; tool?: string | null; created_at?: string }>>([]);
  const [leadsFromStorage, setLeadsFromStorage] = useState<Array<{ id: string; email: string; source: string; createdAt: number }>>([]);
  const [affiliates, setAffiliates] = useState<Array<{
    id: string;
    name: string;
    email: string;
    code: string;
    status: string;
    commission_rate: number;
    website?: string | null;
    reason?: string | null;
    created_at: string;
    ls_affiliate_code?: string | null;
  }>>([]);
  const [lsCodeInputs, setLsCodeInputs] = useState<Record<string, string>>({});
  const [referrals, setReferrals] = useState<Array<{
    id: string;
    affiliate_code: string;
    converted: boolean;
    sale_amount: number | null;
    commission_amount: number | null;
    paid_out: boolean;
    created_at: string;
  }>>([]);
  const [affiliateLoading, setAffiliateLoading] = useState(false);
  const [lsNudge, setLsNudge] = useState<{ name: string; email: string } | null>(null);
  const [shareRewards, setShareRewards] = useState<Array<{
    reward_id: string;
    sharer_email: string;
    order_id: string;
    credits_amount: number;
    status: string;
    refund_window_closes_at: string;
    fraud_hold_reason: string | null;
    fraud_hold_until: string | null;
    created_at: string;
    token: string;
  }>>([]);
  const [shareRewardsLoading, setShareRewardsLoading] = useState(false);
  const allLeads = [
    ...formatterLeads.map((f) => ({
      date: f.created_at ?? "",
      email: f.email ?? "—",
      source: "formatter",
    })),
    ...emailCaptures.map((e) => ({
      date: e.created_at ?? "",
      email: e.email ?? "—",
      source: e.tool ?? "email-capture",
    })),
    ...leadsFromStorage.map((l) => ({
      date: new Date(l.createdAt).toISOString(),
      email: l.email,
      source: l.source ?? "manuscript",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const paymentsPager = usePagination(payments);
  const allLeadsPager = usePagination(allLeads);

  const [grantEmail, setGrantEmail] = useState("");
  const [grantCredits, setGrantCredits] = useState("5");
  const [grantNote, setGrantNote] = useState("beta_grant");
  const [grantStatus, setGrantStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [grantMsg, setGrantMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ADMIN_KEY);
      if (stored) setAuthed(true);
    }
  }, []);

  const loadData = async (pwd: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-password": pwd },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 503 && data?.code === "NOT_CONFIGURED") {
          setError("Admin password not set. In Vercel, add ADMIN_PASSWORD_MANU2 for Production and redeploy.");
        } else if (res.status === 401) {
          setError("Invalid password.");
        } else if (res.status === 429) {
          setError("Too many requests. Wait a minute and try again.");
        } else {
          setError("Failed to load data.");
        }
        return false;
      }
      const data = await res.json();
      setStats({
        totalRevenue: data.totalRevenue ?? 0,
        totalPayingCustomers: data.totalPayingCustomers ?? 0,
        activeSubscriptions: data.activeSubscriptions ?? 0,
        betaUsers: data.betaUsers ?? 0,
        pendingAffiliates: data.pendingAffiliates ?? 0,
        activeAffiliates: data.activeAffiliates ?? 0,
        revenueByType: data.revenueByType ?? {},
        totalCreditsIssued: data.totalCreditsIssued ?? 0,
        totalCreditsUsed: data.totalCreditsUsed ?? 0,
      });
      setPayments(data.recentPayments || []);
      setSubscriptions(data.subscriptions || []);
      setBetaAccess(data.betaUsage || []);
      setLatestPaymentAt(data.latestPaymentAt ?? null);
      setFormatterLeads(data.formatterLeads || []);
      setEmailCaptures(data.emailCaptures || []);
      try {
        const leadsRes = await fetch("/api/admin/leads", { headers: { "x-admin-password": pwd } });
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          setLeadsFromStorage(leadsData.leads || []);
        }
      } catch {
        /* ignore */
      }
      try {
        const affRes = await fetch("/api/admin/affiliates", { headers: { "x-admin-password": pwd } });
        if (affRes.ok) {
          const affData = await affRes.json();
          setAffiliates(affData.affiliates || []);
          setReferrals(affData.referrals || []);
        }
      } catch {
        /* ignore */
      }
      try {
        const srRes = await fetch("/api/admin/share-rewards", { headers: { "x-admin-password": pwd } });
        if (srRes.ok) {
          const srData = await srRes.json();
          setShareRewards(srData.rewards || []);
        }
      } catch {
        /* ignore */
      }
      return true;
    } catch {
      setError("Request failed.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Enter password.");
      return;
    }
    setError(null);
    const pwd = password.trim();
    const ok = await loadData(pwd);
    if (ok) {
      setAuthed(true);
      localStorage.setItem(ADMIN_KEY, "1");
      sessionStorage.setItem(ADMIN_PWD_KEY, pwd);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_KEY);
    sessionStorage.removeItem(ADMIN_PWD_KEY);
    setAuthed(false);
    setStats(null);
    setPayments([]);
    setSubscriptions([]);
    setBetaAccess([]);
    setLatestPaymentAt(null);
    setFormatterLeads([]);
    setEmailCaptures([]);
    setLeadsFromStorage([]);
    setAffiliates([]);
    setReferrals([]);
    setUserLookupResult(null);
    setUserLookupError(null);
    setUserLookupEmail("");
  };

  const handleUserLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwd = typeof window !== "undefined" ? sessionStorage.getItem(ADMIN_PWD_KEY) : null;
    if (!pwd || !userLookupEmail.trim()) return;
    setUserLookupLoading(true);
    setUserLookupResult(null);
    setUserLookupError(null);
    try {
      const res = await fetch(`/api/admin/user-lookup?email=${encodeURIComponent(userLookupEmail.trim())}`, {
        headers: { "x-admin-password": pwd },
      });
      const data = await res.json();
      if (!res.ok) {
        setUserLookupError(data.error ?? "Lookup failed");
      } else {
        setUserLookupResult(data);
      }
    } catch {
      setUserLookupError("Network error");
    } finally {
      setUserLookupLoading(false);
    }
  };

  const handleRefresh = () => {
    const pwd = typeof window !== "undefined" ? sessionStorage.getItem(ADMIN_PWD_KEY) : null;
    if (authed && pwd) loadData(pwd);
  };

  useEffect(() => {
    if (!authed || stats !== null || loading) return;
    const pwd = typeof window !== "undefined" ? sessionStorage.getItem(ADMIN_PWD_KEY) : null;
    if (pwd) loadData(pwd);
  }, [authed, loading, stats]);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  };

  const formatAmount = (cents: number | null) => {
    if (cents == null) return "—";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const statusColor = (status: string | null) => {
    if (status === "complete" || status === "active") return "text-green-400";
    if (status === "failed" || status === "cancelled" || status === "expired") return "text-red-400";
    return "text-amber-400";
  };

  const downloadCsv = (filename: string, rows: string[][]) => {
    const escaped = rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob([escaped.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportPaymentsCsv = () => {
    const headers = ["Date", "Email", "Tool", "Type", "Amount (cents)", "Status", "Order ID"];
    const rows = payments.map((p) => [
      formatDate(p.created_at),
      p.email ?? "",
      p.tool ?? "",
      p.payment_type ?? "",
      String(p.amount ?? ""),
      p.status ?? "",
      p.gateway_order_id ?? "",
    ]);
    downloadCsv("payments.csv", [headers, ...rows]);
  };

  const exportAllLeadsCsv = () => {
    const headers = ["Date", "Email", "Source"];
    const rows = allLeads.map((l) => [l.date ? formatDate(l.date) : "—", l.email, l.source]);
    downloadCsv("leads.csv", [headers, ...rows]);
  };

  const affiliateAction = async (action: string, id: string) => {
    const pwd = typeof window !== "undefined" ? sessionStorage.getItem(ADMIN_PWD_KEY) : null;
    if (!pwd) return;
    setAffiliateLoading(true);
    // Capture affiliate details before approval for the LS nudge
    const target = action === "approve" ? affiliates.find((a) => a.id === id) : null;
    try {
      await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pwd },
        body: JSON.stringify({ action, id }),
      });
      // Refresh affiliates list
      const res = await fetch("/api/admin/affiliates", { headers: { "x-admin-password": pwd } });
      if (res.ok) {
        const data = await res.json();
        setAffiliates(data.affiliates || []);
        setReferrals(data.referrals || []);
      }
      // Show LemonSqueezy nudge after approval
      if (action === "approve" && target) {
        setLsNudge({ name: target.name, email: target.email });
      }
    } finally {
      setAffiliateLoading(false);
    }
  };

  const handleGrantCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwd = typeof window !== "undefined" ? sessionStorage.getItem(ADMIN_PWD_KEY) : null;
    if (!pwd) return;
    setGrantStatus("loading");
    setGrantMsg("");
    try {
      const res = await fetch("/api/admin/grant-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pwd },
        body: JSON.stringify({ email: grantEmail, credits: parseInt(grantCredits, 10), note: grantNote }),
      });
      const data = await res.json();
      if (res.ok) {
        setGrantStatus("ok");
        setGrantMsg(`✓ ${data.credits} credits granted to ${data.email}`);
        setGrantEmail("");
      } else {
        setGrantStatus("error");
        setGrantMsg(data.error ?? "Failed");
      }
    } catch {
      setGrantStatus("error");
      setGrantMsg("Network error");
    }
    setTimeout(() => setGrantStatus("idle"), 4000);
  };

  const saveLsCode = async (affiliateId: string) => {
    const pwd = typeof window !== "undefined" ? sessionStorage.getItem(ADMIN_PWD_KEY) : null;
    const code = lsCodeInputs[affiliateId]?.trim();
    if (!pwd || !code) return;
    await fetch("/api/admin/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": pwd },
      body: JSON.stringify({ action: "save-ls-code", id: affiliateId, ls_code: code }),
    });
    // Refresh list
    const res = await fetch("/api/admin/affiliates", { headers: { "x-admin-password": pwd } });
    if (res.ok) {
      const data = await res.json();
      setAffiliates(data.affiliates || []);
    }
  };


  // Show login form when not authed, OR when authed but sessionStorage pwd is gone
  // (new tab / browser restart clears sessionStorage — localStorage flag persists but pwd does not)
  const sessionPwd = typeof window !== "undefined" ? sessionStorage.getItem(ADMIN_PWD_KEY) : null;
  const needsPassword = !authed || !sessionPwd;

  if (needsPassword) {
    return (
      <div className="min-h-screen bg-m2p-ivory flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="font-bebas text-xl tracking-wide text-m2p-ink mb-4">Admin</h1>
          {authed && !sessionPwd && (
            <p className="text-sm text-m2p-muted mb-3">Session expired — re-enter your password to continue.</p>
          )}
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="Password"
              className="w-full rounded-lg border border-m2p-border bg-m2p-ivory px-4 py-2.5 text-m2p-ink placeholder-m2p-muted focus:outline-none focus:ring-2 focus:ring-m2p-orange"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-m2p-orange text-white font-semibold py-2.5 hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Checking…" : "Log in"}
            </button>
          </form>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <Link href="/" className="block mt-4 text-sm text-m2p-muted hover:text-m2p-orange transition-colors">
            ← Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-m2p-ivory text-m2p-ink">
      <header className="border-b border-m2p-border bg-m2p-ivory/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-bold text-m2p-ink">Payments &amp; Beta</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="text-sm text-m2p-orange hover:underline disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-soft-muted hover:text-m2p-ink"
            >
              Log out
            </button>
            <Link href="/" className="text-sm text-soft-muted hover:text-m2p-ink">
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-center gap-1 mb-6 w-full">
          <Image src="/MANNY AVATAR.png" alt="Manny" width={120} height={120} style={{ borderRadius: "50%" }} />
          <BrandWordmark variant="onLight" className="text-2xl" />
        </div>
        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
              <div className="rounded-xl border border-m2p-border bg-m2p-ivory p-4">
                <p className="text-xs text-soft-muted mb-1">Total revenue</p>
                <p className="text-2xl font-bold text-brave">${(stats.totalRevenue / 100).toFixed(2)}</p>
                <p className="text-[10px] text-soft-muted mt-1">All completed payments</p>
              </div>
              <div className="rounded-xl border border-m2p-border bg-m2p-ivory p-4">
                <p className="text-xs text-soft-muted mb-1">Paying customers</p>
                <p className="text-2xl font-bold">{stats.totalPayingCustomers}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(stats.revenueByType).map(([type, cents]) => (
                    <span key={type} className="text-[10px] bg-m2p-border rounded px-1.5 py-0.5">
                      {type}: ${(cents / 100).toFixed(0)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-m2p-border bg-m2p-ivory p-4">
                <p className="text-xs text-soft-muted mb-1">Credits issued / used</p>
                <p className="text-2xl font-bold">{stats.totalCreditsIssued}</p>
                <p className="text-[10px] text-soft-muted mt-1">{stats.totalCreditsUsed} used · {Math.max(0, stats.totalCreditsIssued - stats.totalCreditsUsed)} remaining</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className={`rounded-xl border p-4 ${stats.pendingAffiliates > 0 ? "border-amber-300 bg-amber-50" : "border-m2p-border bg-m2p-ivory"}`}>
                  <p className="text-xs text-soft-muted mb-1">Partners pending</p>
                  <p className={`text-2xl font-bold ${stats.pendingAffiliates > 0 ? "text-amber-600" : ""}`}>{stats.pendingAffiliates}</p>
                </div>
                <div className="rounded-xl border border-m2p-border bg-m2p-ivory p-4">
                  <p className="text-xs text-soft-muted mb-1">Active partners</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeAffiliates}</p>
                </div>
              </div>
            </div>

            {/* Pending partner alert */}
            {stats.pendingAffiliates > 0 && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
                <span className="text-amber-600 font-bold text-sm">⚠ {stats.pendingAffiliates} partner application{stats.pendingAffiliates > 1 ? "s" : ""} waiting for review</span>
                <a href="#partners" className="ml-auto text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-1.5 rounded-lg">Review now →</a>
              </div>
            )}

            {latestPaymentAt && (
              <p className="text-xs text-soft-muted mb-8">
                Latest payment recorded: {formatDate(latestPaymentAt)} — if this is stale, check webhook URL in Lemon Squeezy.
              </p>
            )}

            {/* ── User Lookup ───────────────────────────────────── */}
            <section className="mb-10">
              <h2 className="text-lg font-bold mb-2">User Lookup</h2>
              <p className="text-xs text-soft-muted mb-4">Search any user by email — credits, payments, scan history in one view.</p>
              <form onSubmit={handleUserLookup} className="flex gap-3 mb-4">
                <input
                  type="email"
                  required
                  value={userLookupEmail}
                  onChange={(e) => setUserLookupEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="border rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:border-m2p-orange"
                />
                <button
                  type="submit"
                  disabled={userLookupLoading}
                  className="bg-m2p-orange hover:opacity-90 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm"
                >
                  {userLookupLoading ? "Looking up…" : "Look up"}
                </button>
              </form>
              {userLookupError && <p className="text-sm text-red-500 mb-4">{userLookupError}</p>}
              {userLookupResult && (
                <div className="rounded-xl border border-m2p-border bg-m2p-ivory p-5 space-y-5">
                  {/* Profile */}
                  <div>
                    <p className="text-xs text-soft-muted mb-1 font-medium uppercase tracking-wide">Account</p>
                    <p className="font-semibold">{userLookupResult.profile?.full_name || <span className="text-soft-muted italic">No name set</span>}</p>
                    <p className="text-sm text-soft-muted">{userLookupResult.email}</p>
                    {userLookupResult.profile?.created_at && (
                      <p className="text-xs text-soft-muted mt-0.5">Joined {formatDate(userLookupResult.profile.created_at)}</p>
                    )}
                    {!userLookupResult.profile && (
                      <p className="text-xs text-amber-600 mt-1">⚠ No profile row — user may not have completed sign-up</p>
                    )}
                  </div>
                  {/* Credits */}
                  <div>
                    <p className="text-xs text-soft-muted mb-2 font-medium uppercase tracking-wide">Credits</p>
                    <div className="flex gap-4 mb-2">
                      <span className="text-sm"><span className="font-bold text-green-600">{userLookupResult.credits.remaining}</span> remaining</span>
                      <span className="text-sm text-soft-muted">{userLookupResult.credits.used} used of {userLookupResult.credits.total} issued</span>
                    </div>
                    {userLookupResult.credits.rows.length > 0 && (
                      <div className="text-xs text-soft-muted space-y-0.5">
                        {userLookupResult.credits.rows.map((r, i) => (
                          <div key={i} className="flex gap-3">
                            <span>{formatDate(r.created_at)}</span>
                            <span>+{r.credits} credits</span>
                            <span className="bg-m2p-border rounded px-1">{r.note ?? "—"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Payments */}
                  <div>
                    <p className="text-xs text-soft-muted mb-2 font-medium uppercase tracking-wide">Payments ({userLookupResult.payments.length})</p>
                    {userLookupResult.payments.length === 0 ? (
                      <p className="text-sm text-soft-muted">No payments.</p>
                    ) : (
                      <div className="space-y-1">
                        {userLookupResult.payments.map((p, i) => (
                          <div key={i} className="flex gap-3 text-sm items-center">
                            <span className="text-soft-muted text-xs">{formatDate(p.created_at)}</span>
                            <span className="font-semibold">{formatAmount(p.amount)}</span>
                            <span className="text-xs bg-m2p-border rounded px-1.5 py-0.5">{p.payment_type ?? "—"}</span>
                            <span className={`text-xs ${statusColor(p.status)}`}>{p.status}</span>
                            {p.gateway_order_id && (
                              <a href={`https://app.lemonsqueezy.com/orders/${p.gateway_order_id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-m2p-orange hover:underline ml-auto">
                                Order →
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Scans */}
                  <div>
                    <p className="text-xs text-soft-muted mb-2 font-medium uppercase tracking-wide">Scan history ({userLookupResult.scans.length})</p>
                    {userLookupResult.scans.length === 0 ? (
                      <p className="text-sm text-soft-muted">No scans recorded.</p>
                    ) : (
                      <div className="space-y-1">
                        {userLookupResult.scans.slice(0, 10).map((s, i) => (
                          <div key={i} className="flex gap-3 text-xs text-soft-muted">
                            <span>{formatDate(s.created_at)}</span>
                            <span className="font-mono truncate max-w-[240px]">{s.download_id ?? "—"}</span>
                          </div>
                        ))}
                        {userLookupResult.scans.length > 10 && (
                          <p className="text-xs text-soft-muted">+ {userLookupResult.scans.length - 10} more</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className="mb-10">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-bold">Recent payments</h2>
                <button
                  type="button"
                  onClick={exportPaymentsCsv}
                  className="text-sm text-m2p-orange hover:underline"
                >
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-m2p-border bg-m2p-ivory">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-m2p-border text-left text-soft-muted">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Tool</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Order ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentsPager.slice.map((p) => (
                      <tr key={p.id} className="border-b border-m2p-border/80">
                        <td className="px-4 py-3">{formatDate(p.created_at)}</td>
                        <td className="px-4 py-3">{p.email || "—"}</td>
                        <td className="px-4 py-3">{p.tool || "—"}</td>
                        <td className="px-4 py-3">{p.payment_type || "—"}</td>
                        <td className="px-4 py-3">{formatAmount(p.amount)}</td>
                        <td className={`px-4 py-3 ${statusColor(p.status)}`}>{p.status || "—"}</td>
                        <td className="px-4 py-3">
                          {p.gateway_order_id ? (
                            <a
                              href={`https://app.lemonsqueezy.com/orders/${p.gateway_order_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-m2p-orange hover:underline"
                            >
                              {p.gateway_order_id}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {payments.length === 0 && (
                  <div className="px-4 py-8 text-center text-soft-muted">No payments yet.</div>
                )}
                <Pager {...paymentsPager} />
              </div>
            </section>

            {/* Subscriptions section hidden — manu2print is pay-per-scan, not subscription-based */}

            {/* Beta usage, Formatter leads, Email captures — consolidated into Leads section below */}

            {/* ── Grant Credits ────────────────────────────────── */}
            <section className="mb-10">
              <h2 className="text-lg font-bold mb-2">Grant Free Credits</h2>
              <p className="text-xs text-soft-muted mb-4">Beta testers, manual overrides. Credits never expire.</p>
              <form onSubmit={handleGrantCredits} className="flex flex-wrap items-end gap-3 p-4 rounded-xl border border-m2p-border bg-m2p-ivory">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-soft-muted">Email</label>
                  <input
                    type="email"
                    required
                    value={grantEmail}
                    onChange={(e) => setGrantEmail(e.target.value)}
                    placeholder="tester@example.com"
                    className="border rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:border-m2p-orange"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-soft-muted">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={grantCredits}
                    onChange={(e) => setGrantCredits(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm w-20 focus:outline-none focus:border-m2p-orange"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-soft-muted">Note (source label)</label>
                  <input
                    type="text"
                    value={grantNote}
                    onChange={(e) => setGrantNote(e.target.value)}
                    placeholder="beta_grant"
                    className="border rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:border-m2p-orange"
                  />
                </div>
                <button
                  type="submit"
                  disabled={grantStatus === "loading"}
                  className="bg-m2p-orange hover:opacity-90 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm"
                >
                  {grantStatus === "loading" ? "Granting…" : "Grant Credits"}
                </button>
                {grantMsg && (
                  <p className={`text-sm font-medium ${grantStatus === "ok" ? "text-green-600" : "text-red-500"}`}>
                    {grantMsg}
                  </p>
                )}
              </form>
            </section>

            <section id="partners" className="mb-10">
              <div className="flex items-center justify-between gap-4 mb-2">
                <h2 className="text-lg font-bold">Partners</h2>
                <span className="text-xs text-soft-muted">{affiliateLoading ? "Saving…" : ""}</span>
              </div>

              {/* LemonSqueezy invite nudge — appears after approving a partner */}
              {lsNudge && (
                <div className="flex items-center justify-between gap-4 mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>✓ {lsNudge.name} approved</strong> — now invite them in LemonSqueezy so they can earn commissions and get paid automatically.
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href="https://app.lemonsqueezy.com/affiliates"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded-lg"
                    >
                      Invite in LemonSqueezy →
                    </a>
                    <button
                      onClick={() => setLsNudge(null)}
                      className="text-xs text-green-600 hover:text-green-800 px-2 py-1.5"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
              <p className="text-xs text-soft-muted mb-4">Approve applications, suspend bad actors, mark commissions paid.</p>
              <div className="overflow-x-auto rounded-xl border border-m2p-border bg-m2p-ivory">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-m2p-border text-left text-soft-muted">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Name / Email</th>
                      <th className="px-4 py-3 font-medium">Code</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Conversions</th>
                      <th className="px-4 py-3 font-medium">Earned</th>
                      <th className="px-4 py-3 font-medium">Unpaid</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliates.map((a) => {
                      const aRefs = referrals.filter((r) => r.affiliate_code === a.code);
                      const converted = aRefs.filter((r) => r.converted);
                      const totalEarned = converted.reduce((s, r) => s + (r.commission_amount ?? 0), 0);
                      const unpaid = converted.filter((r) => !r.paid_out).reduce((s, r) => s + (r.commission_amount ?? 0), 0);
                      return (
                        <tr key={a.id} className="border-b border-m2p-border/80">
                          <td className="px-4 py-3 whitespace-nowrap">{formatDate(a.created_at)}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{a.name}</p>
                            <p className="text-soft-muted text-xs">{a.email}</p>
                            {a.website && <p className="text-m2p-orange text-xs truncate max-w-[140px]">{a.website}</p>}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{a.code}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              a.status === "active" ? "bg-green-100 text-green-700" :
                              a.status === "pending" ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-600"
                            }`}>{a.status}</span>
                            {a.status === "active" && !a.ls_affiliate_code && (
                              <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                ⚠ No LS
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">{converted.length}</td>
                          <td className="px-4 py-3">{formatAmount(totalEarned)}</td>
                          <td className="px-4 py-3 font-semibold">{unpaid > 0 ? formatAmount(unpaid) : "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {a.status !== "active" && (
                                <button
                                  onClick={() => affiliateAction("approve", a.id)}
                                  disabled={affiliateLoading}
                                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded disabled:opacity-50"
                                >
                                  Approve
                                </button>
                              )}
                              {a.status !== "suspended" && (
                                <button
                                  onClick={() => affiliateAction("suspend", a.id)}
                                  disabled={affiliateLoading}
                                  className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded disabled:opacity-50"
                                >
                                  Suspend
                                </button>
                              )}
                              {unpaid > 0 && (
                                <button
                                  onClick={() => affiliateAction("mark-paid", a.code)}
                                  disabled={affiliateLoading}
                                  className="text-xs bg-m2p-orange hover:opacity-90 text-white px-2 py-1 rounded disabled:opacity-50"
                                >
                                  Mark Paid
                                </button>
                              )}
                            </div>
                            {/* LS affiliate code input — paste from LS dashboard after invite */}
                            {a.status === "active" && (
                              <div className="mt-2 flex items-center gap-1.5">
                                {a.ls_affiliate_code ? (
                                  <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-0.5">
                                    LS: {a.ls_affiliate_code} ✓
                                  </span>
                                ) : (
                                  <>
                                    <input
                                      type="text"
                                      placeholder="Paste LS affiliate code"
                                      value={lsCodeInputs[a.id] ?? ""}
                                      onChange={(e) => setLsCodeInputs((prev) => ({ ...prev, [a.id]: e.target.value }))}
                                      className="text-xs border rounded px-2 py-0.5 w-40 focus:outline-none focus:border-green-400"
                                    />
                                    <button
                                      onClick={() => saveLsCode(a.id)}
                                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded"
                                    >
                                      Save
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {affiliates.length === 0 && (
                  <div className="px-4 py-8 text-center text-soft-muted">No affiliate applications yet.</div>
                )}
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center justify-between gap-4 mb-2">
                <h2 className="text-lg font-bold">Share Rewards</h2>
                <span className="text-xs text-soft-muted">
                  {shareRewards.filter(r => r.status === "pending").length} pending ·{" "}
                  {shareRewards.filter(r => r.fraud_hold_reason).length} fraud holds
                </span>
              </div>
              <p className="text-xs text-soft-muted mb-4">Share-to-earn credits. Pending = refund window open. Awarded = credit released.</p>
              <div className="overflow-x-auto rounded-xl border border-m2p-border bg-m2p-ivory">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-m2p-border text-xs text-soft-muted">
                      <th className="px-4 py-3 text-left">Sharer</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Credits</th>
                      <th className="px-4 py-3 text-left">Refund window closes</th>
                      <th className="px-4 py-3 text-left">Fraud hold</th>
                      <th className="px-4 py-3 text-left">Order</th>
                      <th className="px-4 py-3 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-m2p-border">
                    {shareRewards.map((r) => (
                      <tr key={r.reward_id} className="hover:bg-m2p-border/30">
                        <td className="px-4 py-3 text-xs">{r.sharer_email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            r.status === "awarded"  ? "bg-green-100 text-green-700" :
                            r.status === "pending"  ? "bg-amber-100 text-amber-700" :
                            r.status === "voided"   ? "bg-red-100 text-red-600" :
                            "bg-gray-100 text-gray-500"
                          }`}>{r.status}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold">+{r.credits_amount}</td>
                        <td className="px-4 py-3 text-xs text-soft-muted">
                          {new Date(r.refund_window_closes_at) < new Date()
                            ? <span className="text-green-600">Closed ✓</span>
                            : new Date(r.refund_window_closes_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {r.fraud_hold_reason
                            ? <span className="text-red-600">{r.fraud_hold_reason}</span>
                            : <span className="text-soft-muted">—</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-soft-muted">{r.order_id.slice(0, 10)}…</td>
                        <td className="px-4 py-3 text-xs text-soft-muted">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {shareRewards.length === 0 && (
                  <div className="px-4 py-8 text-center text-soft-muted">No share rewards yet.</div>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-bold">Leads</h2>
                <button
                  type="button"
                  onClick={exportAllLeadsCsv}
                  className="text-sm text-m2p-orange hover:underline"
                >
                  Export CSV
                </button>
              </div>
              <p className="text-xs text-soft-muted mb-2">All follow-up leads — manuscript scans, email captures, formatter signups.</p>
              <div className="overflow-x-auto rounded-xl border border-m2p-border bg-m2p-ivory">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-m2p-border text-left text-soft-muted">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allLeadsPager.slice.map((l, i) => (
                      <tr key={i} className="border-b border-m2p-border/80">
                        <td className="px-4 py-3">{l.date ? formatDate(l.date) : "—"}</td>
                        <td className="px-4 py-3">{l.email}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-m2p-border text-m2p-ink">{l.source}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allLeads.length === 0 && (
                  <div className="px-4 py-8 text-center text-soft-muted">No leads yet.</div>
                )}
                <Pager {...allLeadsPager} />
              </div>
            </section>
          </>
        )}

        {authed && stats === null && !loading && !error && (
          <p className="text-soft-muted">Use Refresh to load data (password was stored at login).</p>
        )}
        <p className="text-center text-m2p-muted text-xs mt-8">© manu2print.com — Built for indie authors</p>
      </main>
    </div>
  );
}
