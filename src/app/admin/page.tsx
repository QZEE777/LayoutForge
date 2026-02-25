"use client";

import { useState } from "react";
import Link from "next/link";

interface LeadEntry {
  id: string;
  email: string;
  source: "pdf-compress" | "manuscript";
  createdAt: number;
  jobId?: string;
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [leads, setLeads] = useState<LeadEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = async () => {
    if (!secret.trim()) {
      setError("Enter the admin secret.");
      return;
    }
    setError(null);
    setLeads(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/leads", {
        headers: { Authorization: `Bearer ${secret.trim()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Failed to load leads.");
        return;
      }
      setLeads(data.leads ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts: number) => {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return String(ts);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-bold text-white">Back office</span>
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            ← Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-2">Lead capture</h1>
        <p className="text-slate-400 text-sm mb-6">
          Emails are stored in upload meta (<code className="text-slate-500">*.compression.json</code>, <code className="text-slate-500">*.meta.json</code>). This view lists them for review. <strong className="text-amber-400/90">Auth TBD</strong> – protect this route in production (e.g. NextAuth, middleware).
        </p>

        <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-6 mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-2">Admin secret</label>
          <div className="flex gap-3 flex-wrap">
            <input
              type="password"
              value={secret}
              onChange={(e) => { setSecret(e.target.value); setError(null); }}
              placeholder="ADMIN_SECRET"
              className="flex-1 min-w-[200px] rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            />
            <button
              type="button"
              onClick={loadLeads}
              disabled={loading}
              className="rounded-lg bg-slate-600 px-4 py-2 font-medium text-white hover:bg-slate-500 disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load leads"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Set ADMIN_SECRET in .env; use it here to view leads.</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {leads && (
          <div className="rounded-xl bg-slate-800/60 border border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700 text-sm font-medium text-slate-300">
              {leads.length} lead{leads.length !== 1 ? "s" : ""}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left text-slate-400">
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Job ID</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-700/80 hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-white">{lead.email}</td>
                      <td className="px-4 py-3 text-slate-300">{lead.source}</td>
                      <td className="px-4 py-3 text-slate-400">{formatDate(lead.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{lead.jobId ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {leads.length === 0 && (
              <div className="px-4 py-8 text-center text-slate-500">No leads yet.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
