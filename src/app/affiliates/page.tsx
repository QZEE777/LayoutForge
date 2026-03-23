"use client";

import { useState } from "react";
import Link from "next/link";

const APP_URL = "https://www.manu2print.com";

type Referral = {
  id: string;
  converted: boolean;
  sale_amount: number;
  commission_amount: number;
  paid_out: boolean;
  created_at: string;
  converted_at: string | null;
};

type AffiliateData = {
  affiliate: {
    name: string;
    code: string;
    status: string;
    commission_rate: number;
    email: string;
    created_at: string;
  };
  stats: {
    totalConversions: number;
    totalEarned: number;
    totalPaid: number;
    pendingPayout: number;
  };
  referrals: Referral[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
function formatCents(c: number) {
  return `$${(c / 100).toFixed(2)}`;
}

// ── Email Step ───────────────────────────────────────────────────────────────
function EmailStep({ onNext }: { onNext: (email: string, token: string, expiresAt: number) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/affiliates/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.status === 429) { setError(data.error ?? "Too many attempts."); }
      else if (!res.ok) { setError(data.error ?? "Something went wrong."); }
      else { onNext(email.trim().toLowerCase(), data.token ?? "", data.expiresAt ?? 0); }
    } catch { setError("Network error. Try again."); }
    finally { setLoading(false); }
  }

  return (
    <div className="w-full max-w-md mx-auto text-center">
      <div className="inline-block bg-m2p-green/20 text-m2p-green text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">Affiliate Portal</div>
      <h1 className="font-bebas text-4xl text-m2p-ink mb-2 tracking-wide">My Dashboard</h1>
      <p className="text-m2p-muted text-sm mb-8">Enter your affiliate email to access your stats and referral link.</p>
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com" required
          className="w-full border border-m2p-border rounded-xl px-4 py-3 text-m2p-ink placeholder-m2p-muted text-sm focus:outline-none focus:border-m2p-green bg-white"
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button type="submit" disabled={loading || !email.trim()}
          className="w-full bg-m2p-orange hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-opacity">
          {loading ? "Sending code…" : "Send verification code →"}
        </button>
      </form>
      <p className="text-m2p-muted text-xs mt-6">
        Not an affiliate yet?{" "}
        <Link href="/affiliates/apply" className="text-m2p-orange hover:underline font-medium">Apply here →</Link>
      </p>
    </div>
  );
}

// ── Code Step ────────────────────────────────────────────────────────────────
function CodeStep({ email, token, expiresAt, onVerified, onBack }: {
  email: string; token: string; expiresAt: number;
  onVerified: (data: AffiliateData) => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/affiliates/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim(), token, expiresAt }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Verification failed."); }
      else { onVerified(data as AffiliateData); }
    } catch { setError("Network error. Try again."); }
    finally { setLoading(false); }
  }

  return (
    <div className="w-full max-w-md mx-auto text-center">
      <div className="text-4xl mb-4">📧</div>
      <h1 className="font-bebas text-4xl text-m2p-ink mb-2 tracking-wide">Check your email</h1>
      <p className="text-m2p-muted text-sm mb-8">
        6-digit code sent to <span className="font-medium text-m2p-ink">{email}</span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text" value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000" maxLength={6} required
          className="w-full border border-m2p-border rounded-xl px-4 py-3 text-m2p-ink text-center text-2xl font-bold tracking-widest placeholder-m2p-muted focus:outline-none focus:border-m2p-green bg-white"
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button type="submit" disabled={loading || code.length !== 6}
          className="w-full bg-m2p-orange hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-opacity">
          {loading ? "Verifying…" : "View my dashboard →"}
        </button>
      </form>
      <button onClick={onBack} className="text-m2p-muted hover:text-m2p-ink text-xs underline mt-4 block mx-auto">
        ← Use a different email
      </button>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ data, onSignOut }: { data: AffiliateData; onSignOut: () => void }) {
  const { affiliate, stats, referrals } = data;
  const refLink = `${APP_URL}/?ref=${affiliate.code}`;
  const [copied, setCopied] = useState(false);
  const isPending = affiliate.status === "pending";

  function copyLink() {
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-bebas text-4xl text-m2p-ink tracking-wide">
            Hey, {affiliate.name.split(" ")[0]} 👋
          </h1>
          <p className="text-m2p-muted text-sm">{affiliate.email}</p>
        </div>
        <button onClick={onSignOut} className="text-xs text-m2p-muted hover:text-m2p-ink underline mt-1">Sign out</button>
      </div>

      {/* Pending banner */}
      {isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
          <p className="font-semibold text-amber-800 text-sm">⏳ Application pending review</p>
          <p className="text-amber-700 text-xs mt-1">
            We&apos;ll email you at <strong>{affiliate.email}</strong> within 48 hours once approved.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Conversions", value: stats.totalConversions.toString() },
          { label: "Total earned", value: formatCents(stats.totalEarned) },
          { label: "Paid out", value: formatCents(stats.totalPaid) },
          { label: "Pending", value: formatCents(stats.pendingPayout) },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-m2p-border rounded-xl p-4 text-center">
            <p className="font-bebas text-2xl text-m2p-ink">{s.value}</p>
            <p className="text-m2p-muted text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="bg-m2p-ink rounded-xl px-5 py-5 mb-6">
        <p className="text-white/60 text-xs font-medium mb-2 uppercase tracking-wide">Your referral link</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 text-m2p-green text-sm font-mono truncate bg-white/5 px-3 py-2 rounded-lg">
            {refLink}
          </code>
          <button
            onClick={copyLink}
            className="flex-shrink-0 bg-m2p-orange hover:opacity-90 text-white text-xs font-bold px-4 py-2 rounded-lg transition-opacity"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-white/30 text-xs mt-3">
          30-day attribution cookie · 30% commission ({Math.round((affiliate.commission_rate ?? 0.3) * 100)}%) per sale
        </p>
      </div>

      {/* Payout info */}
      {stats.pendingPayout > 0 && (
        <div className="bg-m2p-green/10 border border-m2p-green/30 rounded-xl px-5 py-4 mb-6">
          <p className="font-semibold text-m2p-green text-sm">
            💰 {formatCents(stats.pendingPayout)} pending payout
          </p>
          <p className="text-m2p-muted text-xs mt-1">
            Minimum payout is $20. We pay monthly via PayPal. Reply to your welcome email to set up your payout details.
          </p>
        </div>
      )}

      {/* Referral history */}
      <section>
        <h2 className="font-bebas text-xl text-m2p-ink tracking-wide mb-3">Referral History</h2>
        {referrals.length === 0 ? (
          <div className="bg-white border border-m2p-border rounded-xl p-6 text-center text-m2p-muted text-sm">
            No referrals yet. Share your link to start earning!
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((r) => (
              <div key={r.id} className="bg-white border border-m2p-border rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-m2p-ink">
                    {r.converted ? "✅ Sale" : "👁 Click"}
                  </p>
                  <p className="text-xs text-m2p-muted">{formatDate(r.created_at)}</p>
                </div>
                <div className="text-right">
                  {r.converted && (
                    <p className="font-bold text-m2p-ink text-sm">{formatCents(r.commission_amount)}</p>
                  )}
                  {r.converted && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.paid_out ? "bg-m2p-green/15 text-m2p-green" : "bg-amber-100 text-amber-700"}`}>
                      {r.paid_out ? "Paid" : "Pending"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-center mt-8">
        <Link href="/" className="text-m2p-muted hover:text-m2p-ink text-xs underline">← Back to home</Link>
      </p>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AffiliatesPage() {
  const [step, setStep] = useState<"email" | "code" | "dashboard">("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [data, setData] = useState<AffiliateData | null>(null);

  return (
    <div className="min-h-screen bg-m2p-ivory flex flex-col">
      <header className="border-b border-m2p-border bg-m2p-ivory">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="font-bebas text-xl tracking-widest">
              <span className="text-m2p-orange">manu</span><span className="text-m2p-green">2print</span>
            </span>
          </Link>
          <Link href="/affiliates/apply" className="text-xs text-m2p-muted hover:text-m2p-orange transition-colors">
            Apply to join →
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        {step === "email" && (
          <EmailStep onNext={(e, t, exp) => { setEmail(e); setToken(t); setExpiresAt(exp); setStep("code"); }} />
        )}
        {step === "code" && (
          <CodeStep email={email} token={token} expiresAt={expiresAt}
            onVerified={(d) => { setData(d); setStep("dashboard"); }}
            onBack={() => setStep("email")} />
        )}
        {step === "dashboard" && data && (
          <Dashboard data={data} onSignOut={() => { setData(null); setEmail(""); setToken(""); setStep("email"); }} />
        )}
      </main>
    </div>
  );
}
