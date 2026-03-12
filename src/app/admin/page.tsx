"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const ADMIN_KEY = "Manu2Print_admin_auth";
const ADMIN_PWD_KEY = "Manu2Print_admin_pwd";

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
  } | null>(null);
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

  const exportSubscriptionsCsv = () => {
    const headers = ["Email", "Plan", "Status", "Period end", "Created"];
    const rows = subscriptions.map((s) => [
      s.email ?? "",
      s.plan ?? "",
      s.status ?? "",
      s.current_period_end ? formatDate(s.current_period_end) : "",
      s.created_at ? formatDate(s.created_at) : "",
    ]);
    downloadCsv("subscriptions.csv", [headers, ...rows]);
  };

  const exportBetaCsv = () => {
    const headers = ["Date", "Email", "Tool"];
    const rows = betaAccess.map((b) => [formatDate(b.created_at), b.email ?? "", b.tool ?? ""]);
    downloadCsv("beta-usage.csv", [headers, ...rows]);
  };

  const exportFormatterLeadsCsv = () => {
    const headers = ["Date", "Email", "Name"];
    const rows = formatterLeads.map((f) => [
      f.created_at ? formatDate(f.created_at) : "",
      f.email ?? "",
      f.name ?? "",
    ]);
    downloadCsv("formatter-leads.csv", [headers, ...rows]);
  };

  const exportEmailCapturesCsv = () => {
    const headers = ["Date", "Email", "Tool"];
    const rows = emailCaptures.map((e) => [
      e.created_at ? formatDate(e.created_at) : "",
      e.email ?? "",
      e.tool ?? "",
    ]);
    downloadCsv("email-captures.csv", [headers, ...rows]);
  };

  const exportLeadsFromStorageCsv = () => {
    const headers = ["Date", "Email", "Source"];
    const rows = leadsFromStorage.map((l) => [
      new Date(l.createdAt).toLocaleString(),
      l.email,
      l.source,
    ]);
    downloadCsv("leads-manuscript.csv", [headers, ...rows]);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-m2p-ivory flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="font-bebas text-xl tracking-wide text-m2p-ink mb-4">Admin</h1>
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
        <div className="flex items-center gap-2 mb-6">
          <Image src="/MANNY AVATAR.png" alt="Manny" width={28} height={28} style={{ borderRadius: "50%" }} />
          <span><span style={{ color: "#F05A28", fontWeight: "bold" }}>manu</span><span style={{ color: "#4cd964", fontWeight: "bold" }}>2print</span></span>
        </div>
        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="rounded-xl border border-m2p-border bg-m2p-ivory p-4">
                <p className="text-xs text-soft-muted mb-1">Total revenue</p>
                <p className="text-2xl font-bold text-brave">
                  ${(stats.totalRevenue / 100).toFixed(2)}
                </p>
                <p className="text-[10px] text-soft-muted mt-1">Completed one-time + subscription</p>
              </div>
              <div className="rounded-xl border border-m2p-border bg-m2p-ivory p-4">
                <p className="text-xs text-soft-muted mb-1">Paying customers</p>
                <p className="text-2xl font-bold">{stats.totalPayingCustomers}</p>
              </div>
              <div className="rounded-xl border border-m2p-border bg-m2p-ivory p-4">
                <p className="text-xs text-soft-muted mb-1">Active subscriptions</p>
                <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
              </div>
              <div className="rounded-xl border border-m2p-border bg-m2p-ivory p-4">
                <p className="text-xs text-soft-muted mb-1">Beta users</p>
                <p className="text-2xl font-bold">{stats.betaUsers}</p>
              </div>
            </div>
            {latestPaymentAt && (
              <p className="text-xs text-soft-muted mb-8">
                Latest payment recorded: {formatDate(latestPaymentAt)} — if this is stale, check webhook URL in Lemon Squeezy.
              </p>
            )}

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
                    {payments.map((p) => (
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
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-bold">Active subscriptions</h2>
                <button
                  type="button"
                  onClick={exportSubscriptionsCsv}
                  className="text-sm text-m2p-orange hover:underline"
                >
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-m2p-border bg-m2p-ivory">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-m2p-border text-left text-soft-muted">
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Plan</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((s, i) => (
                      <tr key={i} className="border-b border-m2p-border/80">
                        <td className="px-4 py-3">{s.email || "—"}</td>
                        <td className="px-4 py-3">{s.plan || "—"}</td>
                        <td className={`px-4 py-3 ${statusColor(s.status)}`}>{s.status || "—"}</td>
                        <td className="px-4 py-3">
                          {s.current_period_end ? formatDate(s.current_period_end) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {subscriptions.length === 0 && (
                  <div className="px-4 py-8 text-center text-soft-muted">No subscriptions.</div>
                )}
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-bold">Beta usage</h2>
                <button
                  type="button"
                  onClick={exportBetaCsv}
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
                    </tr>
                  </thead>
                  <tbody>
                    {betaAccess.map((b) => (
                      <tr key={b.created_at + (b.email || "")} className="border-b border-m2p-border/80">
                        <td className="px-4 py-3">{formatDate(b.created_at)}</td>
                        <td className="px-4 py-3">{b.email || "—"}</td>
                        <td className="px-4 py-3">{b.tool || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {betaAccess.length === 0 && (
                  <div className="px-4 py-8 text-center text-soft-muted">No beta usage yet.</div>
                )}
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-bold">Formatter leads</h2>
                <button
                  type="button"
                  onClick={exportFormatterLeadsCsv}
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
                      <th className="px-4 py-3 font-medium">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formatterLeads.map((f, i) => (
                      <tr key={f.id ?? i} className="border-b border-m2p-border/80">
                        <td className="px-4 py-3">{f.created_at ? formatDate(f.created_at) : "—"}</td>
                        <td className="px-4 py-3">{f.email ?? "—"}</td>
                        <td className="px-4 py-3">{f.name ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {formatterLeads.length === 0 && (
                  <div className="px-4 py-8 text-center text-soft-muted">No formatter leads.</div>
                )}
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-bold">Email captures</h2>
                <button
                  type="button"
                  onClick={exportEmailCapturesCsv}
                  className="text-sm text-m2p-orange hover:underline"
                >
                  Export CSV
                </button>
              </div>
              <p className="text-xs text-soft-muted mb-2">e.g. PDF Compressor signups.</p>
              <div className="overflow-x-auto rounded-xl border border-m2p-border bg-m2p-ivory">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-m2p-border text-left text-soft-muted">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Tool</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailCaptures.map((e, i) => (
                      <tr key={e.id ?? i} className="border-b border-m2p-border/80">
                        <td className="px-4 py-3">{e.created_at ? formatDate(e.created_at) : "—"}</td>
                        <td className="px-4 py-3">{e.email ?? "—"}</td>
                        <td className="px-4 py-3">{e.tool ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {emailCaptures.length === 0 && (
                  <div className="px-4 py-8 text-center text-soft-muted">No email captures.</div>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-bold">Leads (manuscript)</h2>
                <button
                  type="button"
                  onClick={exportLeadsFromStorageCsv}
                  className="text-sm text-m2p-orange hover:underline"
                >
                  Export CSV
                </button>
              </div>
              <p className="text-xs text-soft-muted mb-2">From manuscript meta (leadEmail).</p>
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
                    {leadsFromStorage.map((l) => (
                      <tr key={l.id} className="border-b border-m2p-border/80">
                        <td className="px-4 py-3">{new Date(l.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3">{l.email}</td>
                        <td className="px-4 py-3">{l.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {leadsFromStorage.length === 0 && (
                  <div className="px-4 py-8 text-center text-soft-muted">No manuscript leads.</div>
                )}
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
