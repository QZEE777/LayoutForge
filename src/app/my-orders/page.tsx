"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const SESSION_KEY = "m2p_orders_session";
const SESSION_TTL = 45 * 60 * 1000; // 45 minutes

type Payment = {
  id: string;
  tool: string;
  payment_type: string;
  amount: number;
  status: string;
  created_at: string;
  gateway_order_id: string;
};

type Subscription = {
  id: string;
  plan: string;
  status: string;
  current_period_end: string;
  created_at: string;
};

type BetaAccess = {
  tool: string;
  created_at: string;
};

type OrderData = {
  email: string;
  payments: Payment[];
  subscriptions: Subscription[];
  betaAccess: BetaAccess[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatAmount(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function toolLabel(tool: string) {
  const map: Record<string, string> = {
    "kdp-pdf-checker": "KDP PDF Checker",
    "kdp-formatter": "KDP Formatter",
    "cover-calculator": "Cover Calculator",
    "spine-calculator": "Spine Calculator",
  };
  return map[tool] ?? tool ?? "KDP Tool";
}

function planLabel(plan: string) {
  if (plan === "6_months") return "6-Month Access";
  return plan;
}

function saveSession(data: OrderData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    data,
    expiresAt: Date.now() + SESSION_TTL,
  }));
}

function loadSession(): OrderData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { data, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) { localStorage.removeItem(SESSION_KEY); return null; }
    return data as OrderData;
  } catch { return null; }
}

function clearSession() {
  if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <header className="border-b" style={{ borderColor: "rgba(0,0,0,0.07)", background: "#FAF7EE" }}>
      <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/MANNY AVATAR.png" alt="manu2print" width={32} height={32} className="rounded-full" />
          <span>
            <span style={{ color: "#F05A28", fontWeight: "bold", fontSize: "1.1rem" }}>manu</span>
            <span style={{ color: "#4cd964", fontWeight: "bold", fontSize: "1.1rem" }}>2print</span>
          </span>
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

// ── Step 1: Email entry ───────────────────────────────────────────────────────
function EmailStep({ onNext }: { onNext: (email: string, token: string, expiresAt: number) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
          My Orders
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "#6B6151" }}>
          Enter the email you used at checkout.<br />
          We&apos;ll send a 6-digit code — you stay logged in for 45 minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#1A1208" }}>
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
            style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#1A1208", background: "#fff" }}
          />
        </div>

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
        No purchase yet?{" "}
        <Link href="/kdp-pdf-checker" className="font-medium hover:underline" style={{ color: "#f05a28" }}>
          Check my PDF — $9
        </Link>
      </p>
    </div>
  );
}

// ── Step 2: Code verification ─────────────────────────────────────────────────
function CodeStep({
  email, token, expiresAt, onVerified, onBack,
}: {
  email: string;
  token: string;
  expiresAt: number;
  onVerified: (data: OrderData) => void;
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
        onVerified(data as OrderData);
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
        <p className="text-sm leading-relaxed" style={{ color: "#6B6151" }}>
          6-digit code sent to{" "}
          <span className="font-semibold" style={{ color: "#1A1208" }}>{email}</span>
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
          className="w-full font-bold py-3 rounded-xl text-sm transition-opacity disabled:opacity-50"
          style={{ background: "#f05a28", color: "#fff" }}
        >
          {loading ? "Verifying…" : "View my orders →"}
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

// ── Step 3: Orders display ────────────────────────────────────────────────────
function OrdersView({ data, onSignOut }: { data: OrderData; onSignOut: () => void }) {
  const hasOrders = data.payments.length > 0;
  const hasSub = data.subscriptions.length > 0;
  const hasBeta = data.betaAccess.length > 0;
  const activeSub = data.subscriptions.find(
    (s) => s.status === "active" && new Date(s.current_period_end) > new Date()
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black" style={{ color: "#1A1208", letterSpacing: "-0.02em" }}>
            My Orders
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#9B8E7E" }}>{data.email}</p>
        </div>
        <button
          onClick={onSignOut}
          className="text-xs underline hover:opacity-70"
          style={{ color: "#9B8E7E" }}
        >
          Sign out
        </button>
      </div>

      {activeSub && (
        <div className="rounded-xl px-5 py-4 mb-6 flex items-center gap-3"
          style={{ background: "rgba(76,217,100,0.08)", border: "1px solid rgba(76,217,100,0.25)" }}>
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: "#2d8a3e" }}>
              {planLabel(activeSub.plan)} — Active
            </p>
            <p className="text-xs" style={{ color: "#6B6151" }}>
              Access until {formatDate(activeSub.current_period_end)}
            </p>
          </div>
        </div>
      )}

      {hasBeta && (
        <div className="rounded-xl px-5 py-4 mb-6 flex items-center gap-3"
          style={{ background: "rgba(240,90,40,0.07)", border: "1px solid rgba(240,90,40,0.2)" }}>
          <span className="text-2xl">🎟</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: "#f05a28" }}>Beta Access</p>
            <p className="text-xs" style={{ color: "#6B6151" }}>
              {data.betaAccess.map((b) => toolLabel(b.tool)).join(", ")}
            </p>
          </div>
        </div>
      )}

      {!hasOrders && !hasSub && !hasBeta && (
        <div className="text-center py-12 rounded-xl"
          style={{ border: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}>
          <p className="text-sm mb-4" style={{ color: "#9B8E7E" }}>No purchases found for this email.</p>
          <Link href="/kdp-pdf-checker"
            className="inline-block font-bold px-6 py-3 rounded-xl text-sm"
            style={{ background: "#f05a28", color: "#fff" }}>
            Check my PDF — $9
          </Link>
        </div>
      )}

      {hasOrders && (
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "#9B8E7E" }}>
            Purchase History
          </h2>
          <div className="space-y-3">
            {data.payments.map((p) => (
              <div key={p.id}
                className="rounded-xl px-5 py-4 flex items-center justify-between gap-4"
                style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "#1A1208" }}>
                    {toolLabel(p.tool)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#9B8E7E" }}>
                    {p.payment_type === "subscription" ? "6-Month Access" : "Single Use"} · {formatDate(p.created_at)}
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

      <div className="rounded-xl px-6 py-5 flex items-center justify-between gap-4"
        style={{ background: "#1A1208" }}>
        <div>
          <p className="font-semibold text-sm" style={{ color: "#fff" }}>Need to check another PDF?</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>$9 per check — results in minutes</p>
        </div>
        <Link href="/kdp-pdf-checker"
          className="flex-shrink-0 font-bold px-5 py-2.5 rounded-lg text-sm transition-opacity hover:opacity-90"
          style={{ background: "#f05a28", color: "#fff" }}>
          Check my PDF →
        </Link>
      </div>

      <p className="text-center mt-6">
        <Link href="/" className="text-xs underline hover:opacity-70" style={{ color: "#9B8E7E" }}>
          ← Back to home
        </Link>
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyOrdersPage() {
  const [step, setStep] = useState<"email" | "code" | "orders">("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setOrderData(saved);
      setStep("orders");
    }
  }, []);

  function handleVerified(data: OrderData) {
    saveSession(data);
    setOrderData(data);
    setStep("orders");
  }

  function handleSignOut() {
    clearSession();
    setOrderData(null);
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
          <EmailStep
            onNext={(e, t, exp) => {
              setEmail(e);
              setToken(t);
              setExpiresAt(exp);
              setStep("code");
            }}
          />
        )}
        {step === "code" && (
          <CodeStep
            email={email}
            token={token}
            expiresAt={expiresAt}
            onVerified={handleVerified}
            onBack={() => setStep("email")}
          />
        )}
        {step === "orders" && orderData && (
          <OrdersView data={orderData} onSignOut={handleSignOut} />
        )}
      </main>
    </div>
  );
}
