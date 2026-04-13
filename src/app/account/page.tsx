"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { BrandWordmark } from "@/components/BrandWordmark";

const SESSION_KEY = "m2p_account_session";
const SESSION_TTL = 45 * 60 * 1000;

type CreditRow = {
  credits: number;
  source: string;
  order_id: string | null;
  created_at: string;
  expires_at: string | null;
};

type Payment = {
  id: string;
  tool: string;
  payment_type: string;
  amount: number;
  status: string;
  created_at: string;
};

type AccountData = {
  email: string;
  credits: {
    remaining: number;
    total: number;
    used: number;
    ledger: CreditRow[];
  };
  payments: Payment[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatAmount(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function sourceLabel(source: string) {
  const map: Record<string, string> = {
    author_pack:  "Author Pack (6 credits)",
    indie_pack:   "Indie Pack (14 credits)",
    pro_pack:     "Pro Pack (30 credits)",
    scan_used:    "Credit used",
    share_reward: "Share reward",
  };
  return map[source] ?? source;
}

function toolLabel(tool: string) {
  const map: Record<string, string> = {
    "kdp-pdf-checker": "KDP PDF Checker",
    "kdp-formatter":   "KDP Formatter",
  };
  return map[tool] ?? tool ?? "KDP Tool";
}

function saveSession(data: AccountData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ data, expiresAt: Date.now() + SESSION_TTL }));
}

function loadSession(): AccountData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { data, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) { localStorage.removeItem(SESSION_KEY); return null; }
    return data as AccountData;
  } catch { return null; }
}

function clearSession() {
  if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <header className="border-b" style={{ borderColor: "rgba(0,0,0,0.07)", background: "#FAF7EE" }}>
      <div className="mx-auto max-w-4xl px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <Link href="/" className="flex items-center gap-3 shrink-0 min-w-0">
          <Image src="/MANNY AVATAR.png" alt="manu2print" width={100} height={100} className="rounded-full shrink-0" />
          <BrandWordmark variant="onLight" className="text-lg" />
        </Link>
        <Link href="/kdp-pdf-checker"
          className="text-xs font-medium hover:opacity-70 transition-opacity"
          style={{ color: "#9B8E7E" }}>
          Check my PDF →
        </Link>
      </div>
    </header>
  );
}

// ── Email step ────────────────────────────────────────────────────────────────
function EmailStep({ onNext }: { onNext: (email: string, token: string, expiresAt: number) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill from localStorage if available
  useEffect(() => {
    const stored = localStorage.getItem("manu2print_email") ?? "";
    if (stored) setEmail(stored);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/my-orders/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setError(data.error ?? "Too many attempts. Try again later.");
      } else if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        onNext(email.trim().toLowerCase(), data.token ?? "", data.expiresAt ?? 0);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black mb-2" style={{ color: "#1A1208", letterSpacing: "-0.02em" }}>
          My Account
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "#6B6151" }}>
          Enter the email you used at checkout to see your scan credits and order history.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
          style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#1A1208", background: "#fff" }}
        />
        {error && <p className="text-xs" style={{ color: "#DC2626" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full font-bold py-3 rounded-xl text-sm transition-opacity disabled:opacity-50"
          style={{ background: "#f05a28", color: "#fff" }}
        >
          {loading ? "Sending code…" : "Send verification code →"}
        </button>
      </form>

      <p className="text-center text-xs mt-6" style={{ color: "#9B8E7E" }}>
        No account yet?{" "}
        <Link href="/kdp-pdf-checker" className="font-medium hover:underline" style={{ color: "#f05a28" }}>
          Check a PDF — $9
        </Link>
      </p>
    </div>
  );
}

// ── Code step ─────────────────────────────────────────────────────────────────
function CodeStep({
  email, token, expiresAt, onVerified, onBack,
}: {
  email: string;
  token: string;
  expiresAt: number;
  onVerified: (data: AccountData) => void;
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
      const res = await fetch("/api/my-orders/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim(), token, expiresAt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
      } else {
        onVerified(data as AccountData);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">📧</div>
        <h1 className="text-3xl font-black mb-2" style={{ color: "#1A1208", letterSpacing: "-0.02em" }}>
          Check your email
        </h1>
        <p className="text-sm" style={{ color: "#6B6151" }}>
          6-digit code sent to <span className="font-semibold" style={{ color: "#1A1208" }}>{email}</span>
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          required
          className="w-full rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest focus:outline-none"
          style={{ border: "1px solid rgba(240,90,40,0.4)", color: "#1A1208", background: "#fff" }}
        />
        {error && <p className="text-xs text-center" style={{ color: "#DC2626" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full font-bold py-3 rounded-xl text-sm disabled:opacity-50"
          style={{ background: "#f05a28", color: "#fff" }}
        >
          {loading ? "Verifying…" : "View my account →"}
        </button>
      </form>
      <p className="text-center mt-4">
        <button onClick={onBack} className="text-xs underline hover:opacity-70" style={{ color: "#9B8E7E" }}>
          ← Use a different email
        </button>
      </p>
    </div>
  );
}

// ── Account dashboard ─────────────────────────────────────────────────────────
function AccountView({ data, onSignOut }: { data: AccountData; onSignOut: () => void }) {
  const { credits, payments } = data;
  const grants    = credits.ledger.filter((r) => r.credits > 0);
  const deductions = credits.ledger.filter((r) => r.credits < 0);

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black" style={{ color: "#1A1208", letterSpacing: "-0.02em" }}>
            My Account
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#9B8E7E" }}>{data.email}</p>
        </div>
        <button onClick={onSignOut} className="text-xs underline hover:opacity-70" style={{ color: "#9B8E7E" }}>
          Sign out
        </button>
      </div>

      {/* Credits balance card */}
      <div className="rounded-2xl px-6 py-5 mb-8 flex items-center justify-between gap-6"
        style={{ background: "#1A1208" }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Scan Credits
          </p>
          <p className="font-black" style={{ color: "#4cd964", fontSize: "3rem", lineHeight: 1 }}>
            {credits.remaining}
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            {credits.total} purchased · {credits.used} used
          </p>
        </div>
        <div className="text-right">
          <Link href="/kdp-pdf-checker"
            className="inline-block font-bold px-5 py-3 rounded-xl text-sm transition-opacity hover:opacity-90 mb-2"
            style={{ background: "#f05a28", color: "#fff" }}>
            Use a credit →
          </Link>
          <p className="text-xs block" style={{ color: "rgba(255,255,255,0.3)" }}>
            Credits never expire
          </p>
        </div>
      </div>

      {/* No credits yet */}
      {credits.total === 0 && (
        <div className="rounded-xl px-5 py-6 mb-8 text-center"
          style={{ border: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}>
          <p className="text-sm mb-3" style={{ color: "#6B6151" }}>No scan credits yet.</p>
          <Link href="/#pricing"
            className="inline-block font-bold px-6 py-3 rounded-xl text-sm"
            style={{ background: "#f05a28", color: "#fff" }}>
            Buy a pack →
          </Link>
        </div>
      )}

      {/* Credit history */}
      {credits.ledger.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#9B8E7E" }}>
            Credit History
          </h2>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            {grants.map((row, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5"
                style={{ background: i % 2 === 0 ? "#fff" : "#FAF7EE", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#1A1208" }}>{sourceLabel(row.source)}</p>
                  <p className="text-xs" style={{ color: "#9B8E7E" }}>{formatDate(row.created_at)}</p>
                </div>
                <span className="font-bold text-sm" style={{ color: "#2d8a3e" }}>+{row.credits}</span>
              </div>
            ))}
            {deductions.map((row, i) => (
              <div key={`d-${i}`} className="flex items-center justify-between px-5 py-3.5"
                style={{ background: "#FAF7EE", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#1A1208" }}>Credit used — PDF check</p>
                  <p className="text-xs" style={{ color: "#9B8E7E" }}>{formatDate(row.created_at)}</p>
                </div>
                <span className="font-bold text-sm" style={{ color: "#9B8E7E" }}>{row.credits}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Purchase history */}
      {payments.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#9B8E7E" }}>
            Purchase History
          </h2>
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="rounded-xl px-5 py-4 flex items-center justify-between gap-4"
                style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "#1A1208" }}>
                    {toolLabel(p.tool)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#9B8E7E" }}>
                    {p.payment_type === "single_use" ? "Single scan" : sourceLabel(p.payment_type)} · {formatDate(p.created_at)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm" style={{ color: "#1A1208" }}>{formatAmount(p.amount)}</p>
                  <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1"
                    style={{ background: "rgba(76,217,100,0.12)", color: "#2d8a3e" }}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {payments.length === 0 && credits.total === 0 && (
        <div className="text-center py-10 rounded-xl mb-8"
          style={{ border: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}>
          <p className="text-sm mb-4" style={{ color: "#9B8E7E" }}>No purchases found for this email.</p>
          <Link href="/kdp-pdf-checker"
            className="inline-block font-bold px-6 py-3 rounded-xl text-sm"
            style={{ background: "#f05a28", color: "#fff" }}>
            Check my PDF — $9
          </Link>
        </div>
      )}

      <p className="text-center mt-2">
        <Link href="/" className="text-xs underline hover:opacity-70" style={{ color: "#9B8E7E" }}>
          ← Back to home
        </Link>
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AccountPage() {
  const [step, setStep] = useState<"email" | "code" | "account">("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [accountData, setAccountData] = useState<AccountData | null>(null);

  useEffect(() => {
    const saved = loadSession();
    if (saved) { setAccountData(saved); setStep("account"); }
  }, []);

  function handleVerified(data: AccountData) {
    saveSession(data);
    setAccountData(data);
    setStep("account");
  }

  function handleSignOut() {
    clearSession();
    setAccountData(null);
    setEmail("");
    setToken("");
    setExpiresAt(0);
    setStep("email");
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAF7EE" }}>
      <Nav />
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        {step === "email" && (
          <EmailStep onNext={(e, t, exp) => { setEmail(e); setToken(t); setExpiresAt(exp); setStep("code"); }} />
        )}
        {step === "code" && (
          <CodeStep email={email} token={token} expiresAt={expiresAt} onVerified={handleVerified} onBack={() => setStep("email")} />
        )}
        {step === "account" && accountData && (
          <AccountView data={accountData} onSignOut={handleSignOut} />
        )}
      </main>
    </div>
  );
}
