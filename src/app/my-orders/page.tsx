"use client";

import { useState } from "react";
import Link from "next/link";

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

// ── Step 1: Email entry ──────────────────────────────────────────────────────
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
        <h1 className="font-bebas text-4xl text-m2p-ink mb-2 tracking-wide">My Orders</h1>
        <p className="text-m2p-muted text-sm leading-relaxed">
          Enter the email address you used at checkout.<br />
          We&apos;ll send you a 6-digit code to verify it&apos;s you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-m2p-ink mb-2">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full border border-m2p-border rounded-xl px-4 py-3 text-m2p-ink placeholder-m2p-muted text-sm focus:outline-none focus:border-m2p-green bg-white"
          />
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full bg-m2p-orange hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-opacity text-sm"
        >
          {loading ? "Sending code…" : "Send verification code →"}
        </button>
      </form>

      <p className="text-center text-m2p-muted text-xs mt-6">
        No purchase yet?{" "}
        <Link href="/kdp-pdf-checker" className="text-m2p-orange hover:underline font-medium">
          Check my PDF — $9
        </Link>
      </p>
    </div>
  );
}

// ── Step 2: Code verification ────────────────────────────────────────────────
function CodeStep({
  email,
  token,
  expiresAt,
  onVerified,
  onBack,
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
        <h1 className="font-bebas text-4xl text-m2p-ink mb-2 tracking-wide">Check your email</h1>
        <p className="text-m2p-muted text-sm leading-relaxed">
          We sent a 6-digit code to<br />
          <span className="font-medium text-m2p-ink">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-m2p-ink mb-2">
            Verification code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            required
            className="w-full border border-m2p-border rounded-xl px-4 py-3 text-m2p-ink text-center text-2xl font-bold tracking-widest placeholder-m2p-muted focus:outline-none focus:border-m2p-green bg-white"
          />
        </div>

        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full bg-m2p-orange hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-opacity text-sm"
        >
          {loading ? "Verifying…" : "View my orders →"}
        </button>
      </form>

      <p className="text-center mt-4">
        <button
          onClick={onBack}
          className="text-m2p-muted hover:text-m2p-ink text-xs underline"
        >
          ← Use a different email
        </button>
      </p>

      <p className="text-center text-m2p-muted text-xs mt-2">
        Code expires in 10 minutes. Check your spam folder if you don&apos;t see it.
      </p>
    </div>
  );
}

// ── Step 3: Orders display ───────────────────────────────────────────────────
function OrdersView({ data, onSignOut }: { data: OrderData; onSignOut: () => void }) {
  const hasOrders = data.payments.length > 0;
  const hasSub = data.subscriptions.length > 0;
  const hasBeta = data.betaAccess.length > 0;

  const activeSub = data.subscriptions.find(
    (s) => s.status === "active" && new Date(s.current_period_end) > new Date()
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bebas text-4xl text-m2p-ink tracking-wide">My Orders</h1>
          <p className="text-m2p-muted text-sm">{data.email}</p>
        </div>
        <button
          onClick={onSignOut}
          className="text-xs text-m2p-muted hover:text-m2p-ink underline"
        >
          Sign out
        </button>
      </div>

      {/* Active subscription banner */}
      {activeSub && (
        <div className="bg-m2p-green/10 border border-m2p-green rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-m2p-green text-sm">
              {planLabel(activeSub.plan)} — Active
            </p>
            <p className="text-xs text-m2p-muted">
              Access until {formatDate(activeSub.current_period_end)}
            </p>
          </div>
        </div>
      )}

      {/* Beta access banner */}
      {hasBeta && (
        <div className="bg-m2p-orange/10 border border-m2p-orange/30 rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">🎟</span>
          <div>
            <p className="font-semibold text-m2p-orange text-sm">Beta Access</p>
            <p className="text-xs text-m2p-muted">
              You have beta access to: {data.betaAccess.map((b) => toolLabel(b.tool)).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* No orders state */}
      {!hasOrders && !hasSub && !hasBeta && (
        <div className="text-center py-12 border border-m2p-border rounded-xl bg-white">
          <p className="text-m2p-muted text-sm mb-4">No purchases found for this email.</p>
          <Link
            href="/kdp-pdf-checker"
            className="inline-block bg-m2p-orange text-white font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            Check my PDF — $9
          </Link>
        </div>
      )}

      {/* Payment history */}
      {hasOrders && (
        <section className="mb-8">
          <h2 className="font-bebas text-xl text-m2p-ink tracking-wide mb-4">Purchase History</h2>
          <div className="space-y-3">
            {data.payments.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-m2p-border rounded-xl px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-m2p-ink text-sm truncate">
                    {toolLabel(p.tool)}
                  </p>
                  <p className="text-xs text-m2p-muted mt-0.5">
                    {p.payment_type === "subscription" ? "6-Month Access" : "Single Use"} · {formatDate(p.created_at)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-m2p-ink text-sm">{formatAmount(p.amount)}</p>
                  <span className="inline-block text-xs bg-m2p-green/15 text-m2p-green font-medium px-2 py-0.5 rounded-full mt-1">
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="bg-m2p-ink rounded-xl px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-white text-sm">Need to check another PDF?</p>
          <p className="text-white/50 text-xs mt-0.5">$9 per check — results in minutes</p>
        </div>
        <Link
          href="/kdp-pdf-checker"
          className="flex-shrink-0 bg-m2p-orange hover:opacity-90 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-opacity"
        >
          Check my PDF →
        </Link>
      </div>

      <p className="text-center mt-6">
        <Link href="/" className="text-m2p-muted hover:text-m2p-ink text-xs underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function MyOrdersPage() {
  const [step, setStep] = useState<"email" | "code" | "orders">("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  return (
    <div className="min-h-screen bg-m2p-ivory flex flex-col">
      {/* Nav */}
      <header className="border-b border-m2p-border bg-m2p-ivory">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="font-bebas text-xl tracking-widest">
              <span className="text-m2p-orange">manu</span>
              <span className="text-m2p-green">2print</span>
            </span>
          </Link>
          <Link href="/kdp-pdf-checker" className="text-xs text-m2p-muted hover:text-m2p-orange transition-colors">
            Check my PDF →
          </Link>
        </div>
      </header>

      {/* Content */}
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
            onVerified={(data) => {
              setOrderData(data);
              setStep("orders");
            }}
            onBack={() => setStep("email")}
          />
        )}
        {step === "orders" && orderData && (
          <OrdersView
            data={orderData}
            onSignOut={() => {
              setOrderData(null);
              setEmail("");
              setToken("");
              setExpiresAt(0);
              setStep("email");
            }}
          />
        )}
      </main>
    </div>
  );
}
