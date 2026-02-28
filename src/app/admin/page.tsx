"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
        if (res.status === 401) setError("Invalid password.");
        else setError("Failed to load data.");
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
  };

  const handleRefresh = () => {
    const pwd = typeof window !== "undefined" ? sessionStorage.getItem(ADMIN_PWD_KEY) : null;
    if (authed && pwd) loadData(pwd);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!authed || stats !== null || loading) return;
    const pwd = typeof window !== "undefined" ? sessionStorage.getItem(ADMIN_PWD_KEY) : null;
    if (pwd) loadData(pwd);
  }, [authed]);

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

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0F0D0B] flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-bold text-[#FAF7F2] mb-4">Admin</h1>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="Password"
              className="w-full rounded-lg border border-[#2A2420] bg-[#1A1612] px-4 py-2.5 text-[#FAF7F2] placeholder-[#8B7355] focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#F5A623] text-[#0F0D0B] font-semibold py-2.5 hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Checking…" : "Log in"}
            </button>
          </form>
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
          <Link href="/" className="block mt-4 text-sm text-[#8B7355] hover:text-[#FAF7F2]">
            ← Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0D0B] text-[#FAF7F2]">
      <header className="border-b border-[#2A2420] bg-[#1A1612]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-bold">Payments &amp; Beta</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="text-sm text-[#F5A623] hover:underline disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-[#8B7355] hover:text-[#FAF7F2]"
            >
              Log out
            </button>
            <Link href="/" className="text-sm text-[#8B7355] hover:text-[#FAF7F2]">
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="rounded-xl border border-[#2A2420] bg-[#1A1612] p-4">
                <p className="text-xs text-[#8B7355] mb-1">Total revenue</p>
                <p className="text-2xl font-bold text-[#F5A623]">
                  ${(stats.totalRevenue / 100).toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border border-[#2A2420] bg-[#1A1612] p-4">
                <p className="text-xs text-[#8B7355] mb-1">Paying customers</p>
                <p className="text-2xl font-bold">{stats.totalPayingCustomers}</p>
              </div>
              <div className="rounded-xl border border-[#2A2420] bg-[#1A1612] p-4">
                <p className="text-xs text-[#8B7355] mb-1">Active subscriptions</p>
                <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
              </div>
              <div className="rounded-xl border border-[#2A2420] bg-[#1A1612] p-4">
                <p className="text-xs text-[#8B7355] mb-1">Beta users</p>
                <p className="text-2xl font-bold">{stats.betaUsers}</p>
              </div>
            </div>

            <section className="mb-10">
              <h2 className="text-lg font-bold mb-4">Recent payments</h2>
              <div className="overflow-x-auto rounded-xl border border-[#2A2420] bg-[#1A1612]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2A2420] text-left text-[#8B7355]">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Tool</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-[#2A2420]/80">
                        <td className="px-4 py-3">{formatDate(p.created_at)}</td>
                        <td className="px-4 py-3">{p.email || "—"}</td>
                        <td className="px-4 py-3">{p.tool || "—"}</td>
                        <td className="px-4 py-3">{p.payment_type || "—"}</td>
                        <td className="px-4 py-3">{formatAmount(p.amount)}</td>
                        <td className={`px-4 py-3 ${statusColor(p.status)}`}>{p.status || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {payments.length === 0 && (
                  <div className="px-4 py-8 text-center text-[#8B7355]">No payments yet.</div>
                )}
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-lg font-bold mb-4">Active subscriptions</h2>
              <div className="overflow-x-auto rounded-xl border border-[#2A2420] bg-[#1A1612]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2A2420] text-left text-[#8B7355]">
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Plan</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((s, i) => (
                      <tr key={i} className="border-b border-[#2A2420]/80">
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
                  <div className="px-4 py-8 text-center text-[#8B7355]">No subscriptions.</div>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-4">Beta usage</h2>
              <div className="overflow-x-auto rounded-xl border border-[#2A2420] bg-[#1A1612]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2A2420] text-left text-[#8B7355]">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Tool</th>
                    </tr>
                  </thead>
                  <tbody>
                    {betaAccess.map((b) => (
                      <tr key={b.created_at + (b.email || "")} className="border-b border-[#2A2420]/80">
                        <td className="px-4 py-3">{formatDate(b.created_at)}</td>
                        <td className="px-4 py-3">{b.email || "—"}</td>
                        <td className="px-4 py-3">{b.tool || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {betaAccess.length === 0 && (
                  <div className="px-4 py-8 text-center text-[#8B7355]">No beta usage yet.</div>
                )}
              </div>
            </section>
          </>
        )}

        {authed && stats === null && !loading && !error && (
          <p className="text-[#8B7355]">Use Refresh to load data (password was stored at login).</p>
        )}
      </main>
    </div>
  );
}
