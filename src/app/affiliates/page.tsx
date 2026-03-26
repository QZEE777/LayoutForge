"use client";

import { useState, useRef } from "react";
import Link from "next/link";

const APP_URL = "https://www.manu2print.com";

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
function formatCents(c: number) {
  return `$${(c / 100).toFixed(2)}`;
}

// ── Commission data ───────────────────────────────────────────────────────────

const COMMISSIONS = [
  { product: "Single Scan",    price: "$9",  rate: "30%", earn: "$2.70", note: "Entry product" },
  { product: "Author Pack",    price: "$19", rate: "40%", earn: "$7.60", note: "3 scans" },
  { product: "Indie Pack",     price: "$39", rate: "40%", earn: "$15.60", note: "10 scans" },
  { product: "Pro / Studio",   price: "$79", rate: "40%", earn: "$31.60", note: "25 scans" },
];

// ── FAQ data ──────────────────────────────────────────────────────────────────

const FAQS = [
  { q: "Who is this for?", a: "Anyone with an audience of indie authors, self-publishers, Canva users, or KDP creators. Book coaches, YouTubers, bloggers, newsletter writers, Facebook group admins. If your audience uploads to KDP, this is relevant to them." },
  { q: "What am I promoting?", a: "The KDP PDF Checker — a tool that checks manuscript PDFs against Amazon KDP's formatting requirements before submission. It finds margin issues, font problems, bleed errors, and more — page by page, in minutes." },
  { q: "Is it free to join?", a: "Yes. Applying is free. Once approved, you get a unique referral link and access to your dashboard immediately." },
  { q: "How does the commission work?", a: "30% on Single Scans ($9), 40% on all packs ($19/$39/$79). You earn on every sale traced to your link within a 12-month attribution window." },
  { q: "Do I need a large audience?", a: "No. A small engaged audience converts better than a large disengaged one. If you consistently talk to authors about the publishing process, your referrals will convert." },
  { q: "How do payouts work?", a: "Monthly via PayPal. Minimum payout threshold is $20. Once approved, reply to your welcome email to register your PayPal details." },
  { q: "How do I track performance?", a: "Your affiliate dashboard shows clicks, conversions, total earned, paid out, and pending balance — all updated in real time." },
  { q: "What is the cookie duration?", a: "12 months. If someone clicks your link and purchases anytime within 12 months, you earn the commission." },
];

// ── Accordion ─────────────────────────────────────────────────────────────────

function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
      {items.map((item, i) => (
        <div key={i}>
          <button
            className="w-full flex items-center justify-between gap-4 py-4 text-left transition-colors hover:opacity-70"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="font-semibold text-sm" style={{ color: "#2C1810" }}>{item.q}</span>
            <span className="shrink-0 text-lg leading-none transition-transform duration-200"
              style={{ color: "#f05a28", transform: open === i ? "rotate(45deg)" : "rotate(0deg)" }}>
              +
            </span>
          </button>
          {open === i && (
            <p className="text-sm pb-4 leading-relaxed" style={{ color: "#6B5E4E" }}>{item.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav({ onSignInClick }: { onSignInClick?: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b" style={{ background: "#F5F0E8", borderColor: "rgba(0,0,0,0.08)" }}>
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "#f05a28" }}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><path d="M8 7h8" /><path d="M8 11h8" />
            </svg>
          </div>
          <span>
            <span style={{ color: "#F05A28", fontWeight: "bold", fontSize: "1.15rem" }}>manu</span>
            <span style={{ color: "#4cd964", fontWeight: "bold", fontSize: "1.15rem" }}>2print</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/affiliates/apply"
            className="text-sm font-semibold rounded-xl px-4 py-2 transition-all hover:opacity-80"
            style={{ background: "#f05a28", color: "#fff" }}>
            Join the Program
          </Link>
          {onSignInClick && (
            <button onClick={onSignInClick}
              className="text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: "#6B5E4E" }}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Marketing Landing ─────────────────────────────────────────────────────────

function MarketingLanding({ onSignIn }: { onSignIn: (email: string, token: string, expiresAt: number) => void }) {
  const loginRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function scrollToLogin() {
    loginRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleEmailSubmit(e: React.FormEvent) {
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
      else { onSignIn(email.trim().toLowerCase(), data.token ?? "", data.expiresAt ?? 0); }
    } catch { setError("Network error. Try again."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ background: "#F5F0E8" }}>
      {/* ── HERO ── */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide mb-6"
            style={{ background: "rgba(76,217,100,0.12)", color: "#2d8a3e" }}>
            ● Partner Program — Now Open
          </span>
          <h1 className="font-bebas text-5xl md:text-7xl tracking-wide leading-none mb-6" style={{ color: "#2C1810" }}>
            Partner With<br />
            <span style={{ color: "#f05a28" }}>manu</span><span style={{ color: "#4cd964" }}>2print</span>
          </h1>
          <p className="text-xl leading-relaxed mb-3" style={{ color: "#2C1810", maxWidth: 560 }}>
            Earn by sharing a tool indie authors actually need — before they upload to KDP.
          </p>
          <p className="text-base mb-10" style={{ color: "#6B5E4E", maxWidth: 520 }}>
            Help your audience avoid rejection cycles — and earn from every successful referral.
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <Link href="/affiliates/apply"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-bold text-base transition-all hover:scale-[1.02]"
              style={{ background: "#f05a28", color: "#fff", boxShadow: "0 4px 20px rgba(240,90,40,0.3)" }}>
              Join the Partner Program →
            </Link>
            <button onClick={scrollToLogin}
              className="text-sm font-medium transition-colors hover:opacity-70 underline underline-offset-2"
              style={{ color: "#6B5E4E" }}>
              Already a partner? Sign in
            </button>
          </div>
          <p className="text-xs mt-6" style={{ color: "#9B8E7E" }}>
            Clear product. Clear value. Easy to promote.
          </p>
        </div>
      </section>

      {/* ── WHY THIS CONVERTS ── */}
      <section style={{ background: "#2C1810" }}>
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Why It Works
          </p>
          <h2 className="font-bebas text-4xl tracking-wide mb-10" style={{ color: "#fff" }}>
            Why manu2print Is Easy to Promote
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "📌", title: "Real problem", body: "KDP rejects files for small formatting issues. Authors lose weeks to rejection cycles." },
              { icon: "✅", title: "Clear solution", body: "Check the PDF before upload. See exactly what will fail — page by page." },
              { icon: "⚡", title: "Fast value", body: "Results in under 90 seconds. No waiting. No technical setup." },
              { icon: "🎯", title: "Low friction", body: "Simple $9 entry offer. Easy for your audience to understand and act on." },
              { icon: "👥", title: "Right audience", body: "Indie authors, Canva users, self-publishers, KDP creators. Massive, growing market." },
              { icon: "💰", title: "Packs convert", body: "Authors who scan once want to scan again. Pack purchases mean higher commissions." },
            ].map((c) => (
              <div key={c.title}
                className="rounded-2xl p-5 transition-all hover:translate-y-[-2px]"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-2xl block mb-3">{c.icon}</span>
                <p className="font-semibold text-sm mb-1.5" style={{ color: "rgba(255,255,255,0.9)" }}>{c.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT YOU EARN ── */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9B8E7E" }}>Earnings</p>
        <h2 className="font-bebas text-4xl tracking-wide mb-2" style={{ color: "#2C1810" }}>What You Earn</h2>
        <p className="text-sm mb-10" style={{ color: "#6B5E4E" }}>Transparent tracking. Simple payouts. No surprises.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {COMMISSIONS.map((c) => (
            <div key={c.product}
              className="rounded-2xl border p-5 transition-all hover:shadow-md hover:translate-y-[-2px]"
              style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#9B8E7E" }}>{c.note}</p>
              <p className="font-bebas text-xl tracking-wide mb-1" style={{ color: "#2C1810" }}>{c.product}</p>
              <p className="text-sm mb-3" style={{ color: "#9B8E7E" }}>Sale price: {c.price}</p>
              <div className="flex items-end gap-2">
                <span className="font-bebas text-3xl leading-none" style={{ color: "#4cd964" }}>{c.earn}</span>
                <span className="text-xs font-bold mb-0.5" style={{ color: "#4cd964" }}>{c.rate}</span>
              </div>
              <p className="text-xs mt-1.5" style={{ color: "#9B8E7E" }}>per sale</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-6 text-sm" style={{ color: "#6B5E4E" }}>
          <span>⏱ 12-month attribution cookie</span>
          <span>💳 Monthly PayPal payouts</span>
          <span>📊 Real-time dashboard tracking</span>
          <span>🔓 $20 minimum payout</span>
        </div>
      </section>

      {/* ── WHAT YOUR AUDIENCE GETS ── */}
      <section style={{ background: "#2C1810" }}>
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>The Value</p>
              <h2 className="font-bebas text-4xl tracking-wide mb-6" style={{ color: "#fff" }}>
                What Your Audience Gets
              </h2>
              <p className="text-base mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                A practical tool that fits naturally into the publishing process — right before the KDP upload.
              </p>
              <div className="space-y-3">
                {[
                  "Page-by-page PDF compliance check",
                  "Clear issue detection with exact page numbers",
                  "Annotated PDF download showing problems visually",
                  "Confidence before uploading to KDP",
                  "Fewer rejections. Less delay. Faster publishing.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0" style={{ color: "#4cd964" }}>✓</span>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Mock report card */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>
                  KDP Compliance Report
                </p>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-4 rounded-xl px-4 py-3"
                  style={{ background: "rgba(240,90,40,0.1)", border: "1px solid rgba(240,90,40,0.2)" }}>
                  <span className="font-bebas text-4xl leading-none" style={{ color: "#f05a28" }}>C</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Issues Found</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>3 problems — fix before uploading</p>
                  </div>
                  <span className="ml-auto font-bebas text-xl" style={{ color: "#f05a28" }}>58<span className="text-xs">/100</span></span>
                </div>
                {[
                  { page: "p.3", issue: "Gutter margin too narrow", detail: "0.31\" found — 0.50\" required" },
                  { page: "p.1", issue: "Trim size mismatch", detail: "8.5×11 detected — 6×9 expected" },
                  { page: "p.5", issue: "Image below 300 DPI", detail: "187 DPI — will print blurry" },
                ].map((item) => (
                  <div key={item.issue} className="flex items-start gap-3 px-3 py-2 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.04)", borderLeft: "2px solid rgba(240,90,40,0.5)" }}>
                    <span className="text-xs font-mono font-bold shrink-0 px-1.5 py-0.5 rounded mt-0.5"
                      style={{ background: "rgba(240,90,40,0.15)", color: "#f05a28" }}>
                      {item.page}
                    </span>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{item.issue}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9B8E7E" }}>Process</p>
        <h2 className="font-bebas text-4xl tracking-wide mb-10" style={{ color: "#2C1810" }}>How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { step: "01", title: "Join the program", body: "Apply and get approved. Receive your unique referral link." },
            { step: "02", title: "Share your link", body: "Add it to content, newsletters, YouTube, or social posts." },
            { step: "03", title: "Audience converts", body: "Your audience clicks, tries the tool, and purchases." },
            { step: "04", title: "You earn", body: "Commission recorded. Paid monthly via PayPal." },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border p-5"
              style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
              <p className="font-bebas text-3xl mb-3" style={{ color: "rgba(240,90,40,0.25)" }}>{s.step}</p>
              <p className="font-semibold text-sm mb-2" style={{ color: "#2C1810" }}>{s.title}</p>
              <p className="text-sm leading-relaxed" style={{ color: "#6B5E4E" }}>{s.body}</p>
            </div>
          ))}
        </div>
        <p className="text-sm mt-8" style={{ color: "#9B8E7E" }}>
          Track clicks, conversions, and earnings in your affiliate dashboard — updated in real time.
        </p>
      </section>

      {/* ── PARTNER TOOLS ── */}
      <section style={{ background: "rgba(240,90,40,0.04)", borderTop: "1px solid rgba(240,90,40,0.1)", borderBottom: "1px solid rgba(240,90,40,0.1)" }}>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9B8E7E" }}>What's included</p>
          <h2 className="font-bebas text-4xl tracking-wide mb-10" style={{ color: "#2C1810" }}>What You Get as a Partner</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "🔗", title: "Unique referral link", body: "Your personalised link with 12-month tracking built in." },
              { icon: "📊", title: "Performance dashboard", body: "Clicks, conversions, earnings, and payout status — all in one place." },
              { icon: "🎯", title: "Conversion-ready pages", body: "You're linking to pages that are designed to convert." },
              { icon: "🛠 ", title: "Real tools to demo", body: "Free tools your audience can use right now — no barrier to entry." },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl border p-5 transition-all hover:shadow-sm"
                style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
                <span className="text-2xl block mb-3">{c.icon}</span>
                <p className="font-semibold text-sm mb-1.5" style={{ color: "#2C1810" }}>{c.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "#6B5E4E" }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9B8E7E" }}>Questions</p>
        <h2 className="font-bebas text-4xl tracking-wide mb-8" style={{ color: "#2C1810" }}>Common Questions</h2>
        <Accordion items={FAQS} />
      </section>

      {/* ── SIGN IN ── */}
      <section ref={loginRef} style={{ background: "#2C1810" }}>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-bebas text-5xl tracking-wide mb-4" style={{ color: "#fff" }}>
                Already a Partner?
              </h2>
              <p className="text-base mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>
                Sign in to your affiliate dashboard — view your link, track earnings, and check payouts.
              </p>
            </div>
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.9)" }}>
                Enter your affiliate email
              </p>
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" required
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                />
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <button type="submit" disabled={loading || !email.trim()}
                  className="w-full rounded-xl py-3 font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: "#f05a28", color: "#fff" }}>
                  {loading ? "Sending code…" : "Send verification code →"}
                </button>
              </form>
              <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.3)" }}>
                Not an affiliate yet?{" "}
                <Link href="/affiliates/apply" className="underline hover:opacity-70" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Apply here →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="font-bebas text-5xl tracking-wide mb-4" style={{ color: "#2C1810" }}>
          Ready to Partner With manu2print?
        </h2>
        <p className="text-lg mb-8 mx-auto" style={{ color: "#6B5E4E", maxWidth: 480 }}>
          Promote a tool that solves a real publishing problem — before it becomes a rejection.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/affiliates/apply"
            className="inline-flex items-center gap-2 rounded-xl px-7 py-4 font-bold text-base transition-all hover:scale-[1.02]"
            style={{ background: "#f05a28", color: "#fff", boxShadow: "0 4px 20px rgba(240,90,40,0.3)" }}>
            Join the Partner Program
          </Link>
          <button onClick={scrollToLogin}
            className="text-sm font-medium transition-colors hover:opacity-70 underline underline-offset-2"
            style={{ color: "#6B5E4E" }}>
            Sign In to Dashboard
          </button>
        </div>
        <p className="text-xs mt-6" style={{ color: "#9B8E7E" }}>Simple to start. Easy to share.</p>
      </section>

      <footer className="border-t py-6 text-center" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
        <p className="text-xs" style={{ color: "#C4B5A0" }}>© manu2print.com — Built for indie authors</p>
      </footer>
    </div>
  );
}

// ── Code Step ─────────────────────────────────────────────────────────────────

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
    <div className="min-h-screen flex flex-col" style={{ background: "#F5F0E8" }}>
      <Nav />
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border p-8 text-center" style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(240,90,40,0.1)" }}>
              <span className="text-2xl">📧</span>
            </div>
            <h1 className="font-bebas text-3xl tracking-wide mb-2" style={{ color: "#2C1810" }}>Check Your Email</h1>
            <p className="text-sm mb-6" style={{ color: "#6B5E4E" }}>
              6-digit code sent to <span className="font-semibold" style={{ color: "#2C1810" }}>{email}</span>
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text" value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000" maxLength={6} required
                className="w-full border rounded-xl px-4 py-3 text-2xl font-bold tracking-widest text-center focus:outline-none transition-colors"
                style={{ borderColor: code.length === 6 ? "#f05a28" : "rgba(0,0,0,0.12)", color: "#2C1810" }}
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button type="submit" disabled={loading || code.length !== 6}
                className="w-full rounded-xl py-3 font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "#f05a28", color: "#fff" }}>
                {loading ? "Verifying…" : "View my dashboard →"}
              </button>
            </form>
            <button onClick={onBack}
              className="text-xs underline mt-4 block mx-auto hover:opacity-70 transition-opacity"
              style={{ color: "#9B8E7E" }}>
              ← Use a different email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

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
    <div className="min-h-screen" style={{ background: "#F5F0E8" }}>
      <header className="sticky top-0 z-20 border-b" style={{ background: "#F5F0E8", borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#f05a28" }}>
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <span>
              <span style={{ color: "#F05A28", fontWeight: "bold" }}>manu</span>
              <span style={{ color: "#4cd964", fontWeight: "bold" }}>2print</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: "#9B8E7E" }}>{affiliate.email}</span>
            <button onClick={onSignOut}
              className="text-xs font-medium underline transition-opacity hover:opacity-60"
              style={{ color: "#9B8E7E" }}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-bebas text-4xl tracking-wide mb-1" style={{ color: "#2C1810" }}>
            Hey, {affiliate.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm" style={{ color: "#9B8E7E" }}>Affiliate Dashboard</p>
        </div>

        {/* Pending banner */}
        {isPending && (
          <div className="rounded-xl px-5 py-4"
            style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)" }}>
            <p className="font-semibold text-sm" style={{ color: "#92400e" }}>⏳ Application pending review</p>
            <p className="text-xs mt-1" style={{ color: "#92400e", opacity: 0.8 }}>
              We&apos;ll email you at <strong>{affiliate.email}</strong> within 48 hours once approved.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Conversions",   value: stats.totalConversions.toString(), color: "#2C1810" },
            { label: "Total earned",  value: formatCents(stats.totalEarned),    color: "#4cd964" },
            { label: "Paid out",      value: formatCents(stats.totalPaid),      color: "#2C1810" },
            { label: "Pending",       value: formatCents(stats.pendingPayout),  color: stats.pendingPayout > 0 ? "#f05a28" : "#2C1810" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border p-5 text-center"
              style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
              <p className="font-bebas text-3xl leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs" style={{ color: "#9B8E7E" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Referral link */}
        <div className="rounded-2xl p-6" style={{ background: "#2C1810" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Your referral link
          </p>
          <div className="flex items-center gap-3 mb-4">
            <code className="flex-1 text-sm font-mono truncate rounded-xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.07)", color: "#4cd964", border: "1px solid rgba(255,255,255,0.08)" }}>
              {refLink}
            </code>
            <button onClick={copyLink}
              className="shrink-0 font-bold text-xs px-4 py-3 rounded-xl transition-all hover:opacity-90"
              style={{ background: copied ? "#4cd964" : "#f05a28", color: "#fff", minWidth: 80 }}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="flex flex-wrap gap-4 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            <span>12-month attribution cookie</span>
            <span>30% on single scans · 40% on packs</span>
            <span>Monthly PayPal payout</span>
          </div>
        </div>

        {/* Payout alert */}
        {stats.pendingPayout >= 2000 && (
          <div className="rounded-2xl px-5 py-4"
            style={{ background: "rgba(76,217,100,0.08)", border: "1px solid rgba(76,217,100,0.2)" }}>
            <p className="font-semibold text-sm" style={{ color: "#2d8a3e" }}>
              💰 {formatCents(stats.pendingPayout)} pending payout
            </p>
            <p className="text-xs mt-1" style={{ color: "#6B5E4E" }}>
              Minimum payout is $20. We pay monthly via PayPal. Reply to your welcome email to register your payout details.
            </p>
          </div>
        )}

        {/* Referral history */}
        <section>
          <h2 className="font-bebas text-2xl tracking-wide mb-4" style={{ color: "#2C1810" }}>Referral History</h2>
          {referrals.length === 0 ? (
            <div className="rounded-2xl border py-10 px-6 text-center"
              style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)", borderStyle: "dashed" }}>
              <p className="font-semibold text-sm mb-1" style={{ color: "#2C1810" }}>No referrals yet</p>
              <p className="text-xs" style={{ color: "#9B8E7E" }}>Share your link to start earning.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {referrals.map((r) => (
                <div key={r.id}
                  className="rounded-xl border px-4 py-3 flex items-center justify-between gap-3 transition-all hover:shadow-sm"
                  style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#2C1810" }}>
                      {r.converted ? "✅ Sale" : "👁 Click"}
                    </p>
                    <p className="text-xs" style={{ color: "#9B8E7E" }}>{formatDate(r.created_at)}</p>
                  </div>
                  <div className="text-right">
                    {r.converted && (
                      <p className="font-bold text-sm mb-0.5" style={{ color: "#2C1810" }}>
                        {formatCents(r.commission_amount)}
                      </p>
                    )}
                    {r.converted && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: r.paid_out ? "rgba(76,217,100,0.12)" : "rgba(234,179,8,0.12)",
                          color: r.paid_out ? "#2d8a3e" : "#92400e",
                        }}>
                        {r.paid_out ? "Paid" : "Pending"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-center pt-4">
          <Link href="/" className="text-xs underline hover:opacity-70 transition-opacity"
            style={{ color: "#9B8E7E" }}>
            ← Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AffiliatesPage() {
  const [step,      setStep]      = useState<"landing" | "code" | "dashboard">("landing");
  const [email,     setEmail]     = useState("");
  const [token,     setToken]     = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [data,      setData]      = useState<AffiliateData | null>(null);

  if (step === "landing") {
    return (
      <div style={{ background: "#F5F0E8" }}>
        <Nav />
        <MarketingLanding
          onSignIn={(e, t, exp) => { setEmail(e); setToken(t); setExpiresAt(exp); setStep("code"); }}
        />
      </div>
    );
  }

  if (step === "code") {
    return (
      <CodeStep
        email={email} token={token} expiresAt={expiresAt}
        onVerified={(d) => { setData(d); setStep("dashboard"); }}
        onBack={() => setStep("landing")}
      />
    );
  }

  if (step === "dashboard" && data) {
    return (
      <Dashboard
        data={data}
        onSignOut={() => { setData(null); setEmail(""); setToken(""); setStep("landing"); }}
      />
    );
  }

  return null;
}
