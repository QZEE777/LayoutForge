"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const APP_URL = "https://www.manu2print.com";

// ── Session persistence ────────────────────────────────────────────────────────
const PARTNER_SESSION_KEY = "m2p_partner_session";
const PARTNER_SESSION_TTL = 45 * 60 * 1000; // 45 minutes

function savePartnerSession(data: AffiliateData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PARTNER_SESSION_KEY, JSON.stringify({
    data,
    expiresAt: Date.now() + PARTNER_SESSION_TTL,
  }));
}

function loadPartnerSession(): AffiliateData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PARTNER_SESSION_KEY);
    if (!raw) return null;
    const { data, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) { localStorage.removeItem(PARTNER_SESSION_KEY); return null; }
    return data as AffiliateData;
  } catch { return null; }
}

function clearPartnerSession() {
  if (typeof window !== "undefined") localStorage.removeItem(PARTNER_SESSION_KEY);
}

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
    website?: string | null;
    reason?: string | null;
    paypal_email?: string | null;
    wise_email?: string | null;
    avatar_url?: string | null;
  };
  stats: {
    totalConversions: number;
    totalEarned: number;
    totalPaid: number;
    pendingPayout: number;
  };
  referrals: Referral[];
  sessionToken: string;
  sessionExpiresAt: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
function formatCents(c: number) {
  return `$${(c / 100).toFixed(2)}`;
}

function InitialsAvatar({ name, imageUrl, size = 36 }: { name: string; imageUrl?: string | null; size?: number }) {
  const initials = name.trim().split(/\s+/).map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase();
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={name} className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, background: "#f05a28", fontSize: Math.round(size * 0.38) }}>
      {initials}
    </div>
  );
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
  { q: "How do payouts work?", a: "Monthly via PayPal or Wise. Minimum payout threshold is $20. Add your payout details in the Payouts tab of your partner dashboard." },
  { q: "How do I track performance?", a: "Your partner dashboard shows clicks, conversions, total earned, paid out, and pending balance — all updated in real time." },
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
          <Image src="/MANNY AVATAR.png" alt="manu2print" width={32} height={32} className="rounded-full" />
          <span>
            <span style={{ color: "#F05A28", fontWeight: "bold", fontSize: "1.15rem" }}>manu</span>
            <span style={{ color: "#4cd964", fontWeight: "bold", fontSize: "1.15rem" }}>2print</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/partners/apply"
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

function MarketingLanding({ onSignIn, onSignInClick }: { onSignIn: (email: string, token: string, expiresAt: number) => void; onSignInClick?: () => void }) {
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

      {/* ══════════════════════════════════════════════════════
          HERO — dark, bold, number-led
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: "#1A1208" }}>
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-20 md:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — copy */}
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide mb-8"
                style={{ background: "rgba(76,217,100,0.12)", color: "#4cd964", border: "1px solid rgba(76,217,100,0.2)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4cd964" }} />
                Partner Program — Now Open
              </span>

              <h1 className="font-black leading-none mb-6"
                style={{ color: "#fff", fontSize: "clamp(2.6rem,5vw,4rem)", letterSpacing: "-0.03em" }}>
                Refer authors.<br />
                <span style={{ color: "#f05a28" }}>Earn 40%</span> on every<br />
                pack sale.
              </h1>

              <p className="text-base leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.55)", maxWidth: 460 }}>
                Share your link. Earn up to{" "}
                <span className="font-bold" style={{ color: "#fff" }}>$31.60 per pack sale</span>{" "}
                — with a 12-month attribution cookie and monthly payouts.{" "}
                <span style={{ color: "rgba(255,255,255,0.35)" }}>The best partner deal in the KDP space.</span>
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link href="/partners/apply"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "#f05a28", color: "#fff", boxShadow: "0 4px 24px rgba(240,90,40,0.4)" }}>
                  Become a Partner →
                </Link>
                <button onClick={scrollToLogin}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-bold text-sm transition-all hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}>
                  My Dashboard
                </button>
              </div>

              {/* 3 key numbers */}
              <div className="flex flex-wrap gap-6">
                {[
                  { n: "40%", label: "commission on packs" },
                  { n: "12mo", label: "attribution cookie" },
                  { n: "$20", label: "minimum payout" },
                ].map((s) => (
                  <div key={s.n}>
                    <p className="font-black text-xl" style={{ color: "#f05a28", letterSpacing: "-0.02em" }}>{s.n}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — earn table */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="px-5 py-3.5" style={{ background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Your earnings per sale</p>
              </div>
              {COMMISSIONS.map((c, i) => (
                <div key={c.product}
                  className="flex items-center justify-between px-5 py-4"
                  style={{
                    background: i === 3 ? "rgba(76,217,100,0.07)" : "rgba(255,255,255,0.02)",
                    borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                  }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: i === 3 ? "#4cd964" : "rgba(255,255,255,0.85)" }}>
                      {c.product}
                    </p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{c.note} · {c.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xl leading-none" style={{ color: i === 3 ? "#4cd964" : "#fff", letterSpacing: "-0.02em" }}>
                      {c.earn}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{c.rate} commission</p>
                  </div>
                </div>
              ))}
              <div className="px-5 py-3.5" style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Monthly payouts via PayPal or Wise · Real-time dashboard tracking
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHY IT CONVERTS — cream bg
      ══════════════════════════════════════════════════════ */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9B8E7E" }}>Why it works</p>
          <h2 className="font-black text-3xl mb-2" style={{ color: "#1A1208", letterSpacing: "-0.02em" }}>
            The easiest product to promote<br />in the KDP space.
          </h2>
          <p className="text-sm mb-10" style={{ color: "#6B5E4E" }}>
            Your audience has the problem. You have the solution. The conversion happens naturally.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Real problem", body: "KDP rejects files for small formatting issues. Authors lose weeks to rejection cycles. Your audience knows this pain." },
              { label: "Clear solution", body: "Check the PDF before upload. See exactly what will fail — page by page. Simple to explain. Easy to demonstrate." },
              { label: "Fast value", body: "Results in under 90 seconds. No waiting, no setup, no jargon. Your audience sees it work immediately." },
              { label: "Low friction", body: "$9 entry offer. Easy for anyone to say yes to without overthinking. Packs follow naturally." },
              { label: "Massive audience", body: "Indie authors, Canva users, self-publishers, KDP creators. One of the fastest-growing creator segments." },
              { label: "Repeat buyers", body: "Authors scan every book. Once they use it, they buy again. Your referral keeps paying." },
            ].map((c) => (
              <div key={c.label}
                className="rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="w-1.5 h-4 rounded-full mb-4" style={{ background: "#f05a28" }} />
                <p className="font-bold text-sm mb-2" style={{ color: "#1A1208" }}>{c.label}</p>
                <p className="text-sm leading-relaxed" style={{ color: "#6B5E4E" }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHAT YOUR AUDIENCE GETS — dark bg
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: "#1A1208" }}>
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>The product</p>
              <h2 className="font-black text-3xl mb-4" style={{ color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                What your audience<br />actually gets.
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>
                A tool that fits naturally into the publishing workflow — right before the KDP upload step. Practical, fast, and immediately useful.
              </p>
              <div className="space-y-3">
                {[
                  "Page-by-page PDF compliance check against all 26 KDP rules",
                  "Exact page numbers for every violation found",
                  "Annotated PDF showing every problem visually",
                  "Plain-English fix instructions — no technical knowledge needed",
                  "Confidence before submitting to KDP",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "rgba(76,217,100,0.15)" }}>
                      <span className="text-xs" style={{ color: "#4cd964" }}>✓</span>
                    </span>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock report */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>KDP Compliance Report</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(240,90,40,0.15)", color: "#f05a28" }}>3 issues</span>
              </div>
              <div className="p-5">
                {/* Score row */}
                <div className="flex items-center gap-4 rounded-xl px-4 py-3 mb-4"
                  style={{ background: "rgba(240,90,40,0.08)", border: "1px solid rgba(240,90,40,0.15)" }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ border: "2px solid #f05a28" }}>
                    <span className="font-black text-xl" style={{ color: "#f05a28" }}>C</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>Readiness: 58/100</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Issues found — fix before uploading</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { page: "p.3", issue: "Gutter margin too narrow", detail: "0.31\" found — 0.50\" required" },
                    { page: "p.1", issue: "Trim size mismatch", detail: "8.5×11 detected — 6×9 expected" },
                    { page: "p.5", issue: "Image below 300 DPI", detail: "187 DPI — will print blurry" },
                  ].map((item) => (
                    <div key={item.issue} className="flex items-start gap-3 rounded-lg px-3 py-2.5"
                      style={{ background: "rgba(255,255,255,0.03)", borderLeft: "2px solid rgba(240,90,40,0.4)" }}>
                      <span className="text-xs font-mono font-bold shrink-0 px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(240,90,40,0.15)", color: "#f05a28" }}>
                        {item.page}
                      </span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{item.issue}</p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS — 4 steps
      ══════════════════════════════════════════════════════ */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9B8E7E" }}>Process</p>
          <h2 className="font-black text-3xl mb-10" style={{ color: "#1A1208", letterSpacing: "-0.02em" }}>
            Four steps to your first commission.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: "01", title: "Apply", body: "Fill out the short form. Get approved — usually within 24 hours." },
              { step: "02", title: "Share your link", body: "Drop it in content, newsletters, YouTube descriptions, or social posts." },
              { step: "03", title: "Audience converts", body: "They click, scan their PDF, and purchase. You earn on every sale." },
              { step: "04", title: "Get paid", body: "Commission recorded and paid monthly via PayPal or Wise." },
            ].map((s, i) => (
              <div key={s.step} className="rounded-2xl p-5 relative overflow-hidden"
                style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
                <p className="font-black text-6xl absolute top-3 right-4 select-none"
                  style={{ color: "rgba(240,90,40,0.06)", lineHeight: 1, letterSpacing: "-0.04em" }}>{s.step}</p>
                <div className="w-7 h-7 rounded-full flex items-center justify-center mb-4"
                  style={{ background: i === 3 ? "rgba(76,217,100,0.12)" : "rgba(240,90,40,0.08)" }}>
                  <span className="font-black text-xs" style={{ color: i === 3 ? "#2d8a3e" : "#f05a28" }}>{i + 1}</span>
                </div>
                <p className="font-bold text-sm mb-2" style={{ color: "#1A1208" }}>{s.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "#6B5E4E" }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHAT YOU GET — tools strip
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: "#1A1208" }}>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Included</p>
          <h2 className="font-black text-3xl mb-10" style={{ color: "#fff", letterSpacing: "-0.02em" }}>
            Everything you need to start earning.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "🔗", title: "Referral link", body: "Unique link with 12-month attribution built in. Works everywhere." },
              { icon: "📊", title: "Live dashboard", body: "Clicks, conversions, earnings, payout status — all in one place, real time." },
              { icon: "🎯", title: "We handle the sale", body: "Your link goes to a dedicated conversion page. You share it — it closes." },
              { icon: "🛠", title: "Free tools to demo", body: "Your audience can try free tools immediately. No barrier to entry." },
            ].map((c) => (
              <div key={c.title}
                className="rounded-2xl p-5 transition-all hover:-translate-y-0.5 duration-200"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-2xl block mb-3">{c.icon}</span>
                <p className="font-bold text-sm mb-1.5" style={{ color: "rgba(255,255,255,0.9)" }}>{c.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════ */}
      <section>
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9B8E7E" }}>Questions</p>
          <h2 className="font-black text-3xl mb-8" style={{ color: "#1A1208", letterSpacing: "-0.02em" }}>
            Common questions.
          </h2>
          <Accordion items={FAQS} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SIGN IN — dark, minimal
      ══════════════════════════════════════════════════════ */}
      <section ref={loginRef} style={{ background: "#1A1208" }}>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-black text-3xl mb-3" style={{ color: "#fff", letterSpacing: "-0.02em" }}>
                Already a partner?
              </h2>
              <p className="text-base mb-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Sign in to your dashboard — view your link, track earnings, and manage payouts.
              </p>
            </div>
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
                Enter your partner email<span style={{ color: "#f05a28" }}>*</span>
              </p>
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" required
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                />
                {error && <p className="text-xs" style={{ color: "#f05a28" }}>{error}</p>}
                <button type="submit" disabled={loading || !email.trim()}
                  className="w-full rounded-xl py-3 font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                  style={{ background: "#f05a28", color: "#fff" }}>
                  {loading ? "Sending…" : "Send verification code →"}
                </button>
              </form>
              <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.25)" }}>
                Not a partner yet?{" "}
                <Link href="/partners/apply" className="underline hover:opacity-70 transition-opacity" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Apply here →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FINAL CTA — cream, bold
      ══════════════════════════════════════════════════════ */}
      <section>
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#9B8E7E" }}>Ready?</p>
          <h2 className="font-black mb-4" style={{ color: "#1A1208", fontSize: "clamp(2rem,4vw,3rem)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Earn up to{" "}
            <span style={{ color: "#f05a28" }}>$31.60 per sale.</span><br />
            Start today.
          </h2>
          <p className="text-base mb-8 mx-auto" style={{ color: "#6B5E4E", maxWidth: 420 }}>
            Promote a tool that solves a real publishing problem — before it becomes a rejection.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/partners/apply"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-4 font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "#f05a28", color: "#fff", boxShadow: "0 4px 24px rgba(240,90,40,0.35)" }}>
              Become a Partner →
            </Link>
            <button onClick={onSignInClick ?? scrollToLogin}
              className="text-sm font-medium transition-opacity hover:opacity-60"
              style={{ color: "#9B8E7E" }}>
              Already a partner? Sign in →
            </button>
          </div>
        </div>
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

type DashTab = "overview" | "profile" | "payouts";

function Dashboard({ data, onSignOut }: { data: AffiliateData; onSignOut: () => void }) {
  const { affiliate, stats, referrals, sessionToken, sessionExpiresAt } = data;
  const refLink = `${APP_URL}/kdp-pdf-checker?ref=${affiliate.code}`;
  const [copied, setCopied]           = useState(false);
  const [tab, setTab]                 = useState<DashTab>("overview");
  const isPending                     = affiliate.status === "pending";

  // Profile tab state
  const [profileName,      setProfileName]      = useState(affiliate.name);
  const [profileWebsite,   setProfileWebsite]   = useState(affiliate.website ?? "");
  const [profileReason,    setProfileReason]    = useState(affiliate.reason ?? "");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(affiliate.avatar_url ?? "");
  const [profileSaving,    setProfileSaving]    = useState(false);
  const [profileMsg,       setProfileMsg]       = useState("");

  // Payouts tab state
  const [paypalEmail,  setPaypalEmail]  = useState(affiliate.paypal_email ?? "");
  const [wiseEmail,    setWiseEmail]    = useState(affiliate.wise_email ?? "");
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [payoutMsg,    setPayoutMsg]    = useState("");

  function copyLink() {
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg("");
    try {
      const res = await fetch("/api/affiliates/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: affiliate.email,
          sessionToken,
          sessionExpiresAt,
          name: profileName,
          website: profileWebsite,
          reason: profileReason,
          avatar_url: profileAvatarUrl,
        }),
      });
      const d = await res.json();
      if (!res.ok) setProfileMsg(d.error ?? "Save failed.");
      else setProfileMsg("✓ Profile saved");
    } catch { setProfileMsg("Network error."); }
    finally { setProfileSaving(false); }
  }

  async function savePayoutDetails(e: React.FormEvent) {
    e.preventDefault();
    setPayoutSaving(true);
    setPayoutMsg("");
    try {
      const res = await fetch("/api/affiliates/payout-email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: affiliate.email,
          sessionToken,
          sessionExpiresAt,
          paypal_email: paypalEmail,
          wise_email:   wiseEmail,
        }),
      });
      const d = await res.json();
      if (!res.ok) setPayoutMsg(d.error ?? "Save failed.");
      else setPayoutMsg("✓ Payout details saved");
    } catch { setPayoutMsg("Network error."); }
    finally { setPayoutSaving(false); }
  }

  const TABS: { id: DashTab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "profile",  label: "Profile",  icon: "👤" },
    { id: "payouts",  label: "Payouts",  icon: "💳" },
  ];

  const paidReferrals = referrals.filter((r) => r.converted && r.paid_out);

  return (
    <div className="min-h-screen" style={{ background: "#F5F0E8" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b" style={{ background: "#F5F0E8", borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="mx-auto max-w-4xl px-6 flex items-center justify-between" style={{ minHeight: 56 }}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/MANNY AVATAR.png" alt="manu2print" width={30} height={30} className="rounded-full" />
            <span>
              <span style={{ color: "#F05A28", fontWeight: "bold" }}>manu</span>
              <span style={{ color: "#4cd964", fontWeight: "bold" }}>2print</span>
            </span>
          </Link>

          {/* Tab nav */}
          <div className="flex items-center gap-1 px-1 py-1 rounded-full" style={{ background: "rgba(44,24,16,0.06)" }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: tab === t.id ? "#2C1810" : "transparent",
                  color:      tab === t.id ? "#fff"    : "#9B8E7E",
                  boxShadow:  tab === t.id ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
                }}
              >
                <span className="text-xs">{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Right — avatar + name */}
          <div className="flex items-center gap-2.5 shrink-0">
            <InitialsAvatar name={affiliate.name} imageUrl={affiliate.avatar_url} size={32} />
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold leading-none mb-0.5" style={{ color: "#2C1810" }}>
                {affiliate.name.split(" ")[0]}
              </p>
              <button onClick={onSignOut}
                className="text-xs transition-opacity hover:opacity-60"
                style={{ color: "#9B8E7E" }}>
                Sign out
              </button>
            </div>
            <button onClick={onSignOut}
              className="text-xs font-medium underline transition-opacity hover:opacity-60 sm:hidden"
              style={{ color: "#9B8E7E" }}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">

        {/* ── Page title + status badge ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#C4B5A0" }}>
              Partner Dashboard
            </p>
            <h1 className="text-2xl font-bold leading-tight" style={{ color: "#2C1810" }}>
              Hey, {affiliate.name.split(" ")[0]} 👋
            </h1>
          </div>
          <span className="shrink-0 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full mt-0.5"
            style={{
              background: isPending ? "rgba(234,179,8,0.1)" : "rgba(76,217,100,0.12)",
              color:      isPending ? "#92400e"              : "#2d8a3e",
            }}>
            {isPending ? "⏳ Pending" : "✓ Active"}
          </span>
        </div>

        {/* Pending review notice */}
        {isPending && (
          <div className="rounded-xl px-5 py-4"
            style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.18)" }}>
            <p className="font-semibold text-sm" style={{ color: "#92400e" }}>Application under review</p>
            <p className="text-xs mt-1" style={{ color: "#92400e", opacity: 0.75 }}>
              We&apos;ll email <strong>{affiliate.email}</strong> within 48 hours once you&apos;re approved.
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* ── OVERVIEW TAB ── */}
        {/* ═══════════════════════════════════════════ */}
        {tab === "overview" && (
          <>
            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Sales",        value: stats.totalConversions.toString(), icon: "🎯", accent: "#2C1810",  bg: "rgba(44,24,16,0.05)" },
                { label: "Total earned", value: formatCents(stats.totalEarned),    icon: "💰", accent: "#2d8a3e",  bg: "rgba(76,217,100,0.08)" },
                { label: "Paid out",     value: formatCents(stats.totalPaid),      icon: "✅", accent: "#2C1810",  bg: "rgba(44,24,16,0.05)" },
                { label: "Pending",      value: formatCents(stats.pendingPayout),  icon: "⏳", accent: stats.pendingPayout > 0 ? "#f05a28" : "#9B8E7E", bg: stats.pendingPayout > 0 ? "rgba(240,90,40,0.07)" : "rgba(44,24,16,0.03)" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl px-5 py-4"
                  style={{ background: s.bg, border: `1px solid ${s.accent}18` }}>
                  <p className="text-lg mb-1">{s.icon}</p>
                  <p className="text-2xl font-black leading-none mb-1" style={{ color: s.accent }}>{s.value}</p>
                  <p className="text-xs font-medium" style={{ color: "#9B8E7E" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Referral link — dark card */}
            <div className="rounded-2xl p-6" style={{ background: "#2C1810" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: "rgba(255,255,255,0.3)" }}>
                Your referral link
              </p>
              <div className="flex items-center gap-3 mb-4">
                <code className="flex-1 text-sm font-mono truncate rounded-xl px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.07)", color: "#4cd964", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {refLink}
                </code>
                <button onClick={copyLink}
                  className="shrink-0 font-bold text-xs px-4 py-3 rounded-xl transition-all hover:opacity-90"
                  style={{ background: copied ? "#4cd964" : "#f05a28", color: "#fff", minWidth: 90 }}>
                  {copied ? "✓ Copied" : "Copy link"}
                </button>
              </div>
              <div className="flex flex-wrap gap-5 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                <span>12-month cookie</span>
                <span>30% singles · 40% packs</span>
                <span>Monthly PayPal payout</span>
              </div>
            </div>

            {/* Payout-ready nudge */}
            {stats.pendingPayout >= 2000 && (
              <div className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
                style={{ background: "rgba(76,217,100,0.07)", border: "1px solid rgba(76,217,100,0.18)" }}>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#2d8a3e" }}>
                    💰 {formatCents(stats.pendingPayout)} ready for payout
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#6B5E4E" }}>
                    Add your PayPal or Wise email in the Payouts tab to receive your payment.
                  </p>
                </div>
                <button onClick={() => setTab("payouts")}
                  className="shrink-0 text-xs font-bold px-4 py-2 rounded-xl transition-all hover:opacity-90"
                  style={{ background: "#4cd964", color: "#fff" }}>
                  Set up →
                </button>
              </div>
            )}

            {/* Referral history */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: "#9B8E7E" }}>
                Referral History
              </h2>
              {referrals.length === 0 ? (
                <div className="rounded-2xl border py-12 px-6 text-center"
                  style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)", borderStyle: "dashed" }}>
                  <p className="text-3xl mb-3">📭</p>
                  <p className="font-semibold text-sm mb-1" style={{ color: "#2C1810" }}>No referrals yet</p>
                  <p className="text-xs" style={{ color: "#9B8E7E" }}>Copy and share your link above to start earning.</p>
                </div>
              ) : (
                <div className="rounded-2xl border overflow-hidden"
                  style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
                  {referrals.map((r, i) => (
                    <div key={r.id}
                      className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-black/[0.015]"
                      style={{ borderTop: i > 0 ? "1px solid rgba(0,0,0,0.05)" : undefined }}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{r.converted ? "✅" : "👁"}</span>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "#2C1810" }}>
                            {r.converted ? "Sale" : "Click"}
                          </p>
                          <p className="text-xs" style={{ color: "#9B8E7E" }}>{formatDate(r.created_at)}</p>
                        </div>
                      </div>
                      {r.converted && (
                        <div className="text-right">
                          <p className="font-bold text-sm mb-0.5" style={{ color: "#2C1810" }}>
                            {formatCents(r.commission_amount)}
                          </p>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{
                              background: r.paid_out ? "rgba(76,217,100,0.1)"  : "rgba(234,179,8,0.1)",
                              color:      r.paid_out ? "#2d8a3e"                : "#92400e",
                            }}>
                            {r.paid_out ? "Paid" : "Pending"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* ── PROFILE TAB ── */}
        {/* ═══════════════════════════════════════════ */}
        {tab === "profile" && (
          <div className="space-y-5">
            <div className="rounded-2xl border p-6" style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
              <h2 className="text-base font-bold mb-1" style={{ color: "#2C1810" }}>Your Profile</h2>
              <p className="text-xs mb-6" style={{ color: "#9B8E7E" }}>
                Keep your details current so we can support you better.
              </p>
              <form onSubmit={saveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#6B5E4E" }}>
                      Full name *
                    </label>
                    <input
                      type="text" value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                      style={{ borderColor: "rgba(0,0,0,0.12)", color: "#2C1810" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#6B5E4E" }}>
                      Email address
                    </label>
                    <input
                      type="email" value={affiliate.email} readOnly
                      className="w-full border rounded-xl px-4 py-3 text-sm"
                      style={{
                        borderColor: "rgba(0,0,0,0.07)", color: "#9B8E7E",
                        background: "rgba(0,0,0,0.02)", cursor: "not-allowed",
                      }}
                    />
                    <p className="text-xs mt-1" style={{ color: "#C4B5A0" }}>Email cannot be changed</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#6B5E4E" }}>
                    Website / Social{" "}
                    <span style={{ fontWeight: "normal", color: "#C4B5A0" }}>(optional)</span>
                  </label>
                  <input
                    type="text" value={profileWebsite}
                    onChange={(e) => setProfileWebsite(e.target.value)}
                    placeholder="https://yourblog.com or @yourhandle"
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none"
                    style={{ borderColor: "rgba(0,0,0,0.12)", color: "#2C1810" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#6B5E4E" }}>
                    How do you promote manu2print?{" "}
                    <span style={{ fontWeight: "normal", color: "#C4B5A0" }}>(optional)</span>
                  </label>
                  <textarea
                    value={profileReason}
                    onChange={(e) => setProfileReason(e.target.value)}
                    rows={3}
                    placeholder="e.g. I run a KDP author newsletter of 5,000 subscribers..."
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
                    style={{ borderColor: "rgba(0,0,0,0.12)", color: "#2C1810" }}
                  />
                </div>

                {/* Profile photo */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#6B5E4E" }}>
                    Profile photo{" "}
                    <span style={{ fontWeight: "normal", color: "#C4B5A0" }}>(optional)</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <InitialsAvatar name={profileName || affiliate.name} imageUrl={profileAvatarUrl} size={52} />
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:opacity-80"
                        style={{ borderColor: "rgba(0,0,0,0.12)", color: "#2C1810", background: "#fff" }}>
                        <span>📷</span>
                        <span>Upload photo</span>
                        <input
                          type="file" accept="image/*" className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) { alert("Max 2MB"); return; }
                            const form = new FormData();
                            form.append("file", file);
                            form.append("email", affiliate.email);
                            const res = await fetch("/api/affiliates/avatar", { method: "POST", body: form });
                            const d = await res.json();
                            if (d.url) setProfileAvatarUrl(d.url);
                          }}
                        />
                      </label>
                      {profileAvatarUrl && (
                        <button type="button" onClick={() => setProfileAvatarUrl("")}
                          className="ml-3 text-xs underline hover:opacity-70"
                          style={{ color: "#9B8E7E" }}>
                          Remove
                        </button>
                      )}
                      <p className="text-xs mt-1.5" style={{ color: "#C4B5A0" }}>
                        JPG or PNG · Max 2MB · Shown in your dashboard header
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <button
                    type="submit"
                    disabled={profileSaving || !profileName.trim()}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "#f05a28", color: "#fff" }}
                  >
                    {profileSaving ? "Saving…" : "Save changes"}
                  </button>
                  {profileMsg && (
                    <span className="text-sm font-medium"
                      style={{ color: profileMsg.startsWith("✓") ? "#2d8a3e" : "#dc2626" }}>
                      {profileMsg}
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* Read-only info strip */}
            <div className="rounded-2xl border p-5" style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
              <h3 className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: "#9B8E7E" }}>
                Account Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Referral code", value: affiliate.code },
                  { label: "Status",        value: affiliate.status.charAt(0).toUpperCase() + affiliate.status.slice(1) },
                  { label: "Member since",  value: formatDate(affiliate.created_at) },
                ].map((row) => (
                  <div key={row.label}>
                    <p className="text-xs mb-0.5" style={{ color: "#9B8E7E" }}>{row.label}</p>
                    <p className="text-sm font-semibold" style={{ color: "#2C1810" }}>{row.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* ── PAYOUTS TAB ── */}
        {/* ═══════════════════════════════════════════ */}
        {tab === "payouts" && (
          <div className="space-y-5">

            {/* Balance summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Total earned",
                  value: formatCents(stats.totalEarned),
                  note: "All time",
                  accent: false,
                },
                {
                  label: "Paid out",
                  value: formatCents(stats.totalPaid),
                  note: "Processed",
                  accent: false,
                },
                {
                  label: "Pending balance",
                  value: formatCents(stats.pendingPayout),
                  note: stats.pendingPayout >= 2000
                    ? "✓ Eligible for payout"
                    : `$${((2000 - stats.pendingPayout) / 100).toFixed(2)} to threshold`,
                  accent: stats.pendingPayout >= 2000,
                },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border px-5 py-4"
                  style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
                  <p className="text-2xl font-bold mb-0.5"
                    style={{ color: s.accent ? "#2d8a3e" : "#2C1810" }}>
                    {s.value}
                  </p>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "#6B5E4E" }}>{s.label}</p>
                  <p className="text-xs" style={{ color: s.accent ? "#2d8a3e" : "#9B8E7E" }}>{s.note}</p>
                </div>
              ))}
            </div>

            {/* Payout methods */}
            <div className="rounded-2xl border p-6" style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-base font-bold mb-0.5" style={{ color: "#2C1810" }}>
                    Payout Details
                  </h2>
                  <p className="text-xs" style={{ color: "#9B8E7E" }}>
                    Add at least one payout method. We&apos;ll use whichever you provide.
                  </p>
                </div>
                {(affiliate.paypal_email || affiliate.wise_email) && (
                  <span className="shrink-0 text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: "rgba(76,217,100,0.1)", color: "#2d8a3e" }}>
                    ✓ Configured
                  </span>
                )}
              </div>

              {/* Current values */}
              {(affiliate.paypal_email || affiliate.wise_email) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  {affiliate.paypal_email && (
                    <div className="rounded-xl px-4 py-3 flex items-center gap-3"
                      style={{ background: "rgba(76,217,100,0.06)", border: "1px solid rgba(76,217,100,0.15)" }}>
                      <span>💳</span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#2d8a3e" }}>PayPal</p>
                        <p className="text-sm font-bold truncate" style={{ color: "#2C1810" }}>{affiliate.paypal_email}</p>
                      </div>
                    </div>
                  )}
                  {affiliate.wise_email && (
                    <div className="rounded-xl px-4 py-3 flex items-center gap-3"
                      style={{ background: "rgba(76,217,100,0.06)", border: "1px solid rgba(76,217,100,0.15)" }}>
                      <span>🌍</span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#2d8a3e" }}>Wise</p>
                        <p className="text-sm font-bold truncate" style={{ color: "#2C1810" }}>{affiliate.wise_email}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={savePayoutDetails} className="space-y-4">
                {/* PayPal */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold mb-1.5" style={{ color: "#6B5E4E" }}>
                    <span>💳</span> PayPal email
                  </label>
                  <input
                    type="email" value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="your-paypal@email.com"
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none"
                    style={{ borderColor: "rgba(0,0,0,0.12)", color: "#2C1810" }}
                  />
                </div>

                {/* Wise */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold mb-1.5" style={{ color: "#6B5E4E" }}>
                    <span>🌍</span> Wise email
                    <span className="font-normal" style={{ color: "#9B8E7E" }}>— best for international</span>
                  </label>
                  <input
                    type="email" value={wiseEmail}
                    onChange={(e) => setWiseEmail(e.target.value)}
                    placeholder="your-wise@email.com"
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none"
                    style={{ borderColor: "rgba(0,0,0,0.12)", color: "#2C1810" }}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={payoutSaving || (!paypalEmail.trim() && !wiseEmail.trim())}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "#f05a28", color: "#fff" }}
                  >
                    {payoutSaving ? "Saving…" : "Save payout details"}
                  </button>
                  {payoutMsg && (
                    <span className="text-sm font-medium"
                      style={{ color: payoutMsg.startsWith("✓") ? "#2d8a3e" : "#dc2626" }}>
                      {payoutMsg}
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* Payout rules */}
            <div className="rounded-2xl p-5"
              style={{ background: "rgba(44,24,16,0.03)", border: "1px solid rgba(44,24,16,0.07)" }}>
              <p className="text-sm font-semibold mb-3" style={{ color: "#2C1810" }}>How payouts work</p>
              <ul className="space-y-2">
                {[
                  "Payouts are processed on the 1st of each month",
                  "Minimum payout threshold is $20",
                  "Payouts via PayPal or Wise — whichever you configure",
                  "Commissions are earned on confirmed, non-refunded sales only",
                  "Pending balance becomes payout-eligible after 14-day refund window",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs" style={{ color: "#6B5E4E" }}>
                    <span className="shrink-0 mt-0.5" style={{ color: "#f05a28" }}>→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Completed payouts */}
            {paidReferrals.length > 0 && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#9B8E7E" }}>
                  Paid History
                </h3>
                <div className="rounded-2xl border overflow-hidden"
                  style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
                  {paidReferrals.map((r, i) => (
                    <div key={r.id}
                      className="flex items-center justify-between px-5 py-3.5"
                      style={{ borderTop: i > 0 ? "1px solid rgba(0,0,0,0.05)" : undefined }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#2C1810" }}>
                          {formatCents(r.commission_amount)}
                        </p>
                        <p className="text-xs" style={{ color: "#9B8E7E" }}>{formatDate(r.created_at)}</p>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full"
                        style={{ background: "rgba(76,217,100,0.1)", color: "#2d8a3e" }}>
                        Paid
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

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

// ── Inline Sign-In View (shown when ?signin=1) ────────────────────────────────

function SignInView({ onSignIn }: { onSignIn: (email: string, token: string, expiresAt: number) => void }) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/affiliates/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const d = await res.json();
      if (res.status === 429) { setError(d.error ?? "Too many attempts."); return; }
      if (!res.ok) { setError(d.error ?? "Something went wrong."); return; }
      if (d.token && d.expiresAt) {
        onSignIn(email.trim().toLowerCase(), d.token, d.expiresAt);
      } else {
        // Email not in system — guide them to apply
        setError("No partner account found. Not a partner yet?");
      }
    } catch { setError("Network error. Try again."); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#F5F0E8" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Image src="/MANNY AVATAR.png" alt="manu2print" width={36} height={36} className="rounded-full" />
          <span>
            <span style={{ color: "#F05A28", fontWeight: "bold", fontSize: "1.2rem" }}>manu</span>
            <span style={{ color: "#4cd964", fontWeight: "bold", fontSize: "1.2rem" }}>2print</span>
          </span>
        </div>

        <div className="rounded-2xl border p-8" style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
          <h1 className="text-xl font-bold mb-1" style={{ color: "#2C1810" }}>Partner Dashboard</h1>
          <p className="text-sm mb-7" style={{ color: "#9B8E7E" }}>Enter your email to receive a sign-in code.</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email" required autoFocus
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none"
              style={{ borderColor: "rgba(0,0,0,0.12)", color: "#2C1810" }}
            />
            {error && (
              <p className="text-xs" style={{ color: "#dc2626" }}>
                {error}{" "}
                {error.includes("Not a partner") && (
                  <Link href="/partners/apply" className="underline font-semibold" style={{ color: "#f05a28" }}>Apply here →</Link>
                )}
              </p>
            )}
            <button
              type="submit" disabled={loading || !email.trim()}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "#f05a28", color: "#fff" }}>
              {loading ? "Sending…" : "Send verification code →"}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: "#C4B5A0" }}>
            Not a partner yet?{" "}
            <Link href="/partners/apply" className="underline hover:opacity-70" style={{ color: "#6B5E4E" }}>Apply here →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AffiliatesPage() {
  const [step,      setStep]      = useState<"landing" | "signin" | "code" | "dashboard">("landing");
  const [email,     setEmail]     = useState("");
  const [token,     setToken]     = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [data,      setData]      = useState<AffiliateData | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Restore saved session first — skip login entirely if valid
    const saved = loadPartnerSession();
    if (saved) {
      setData(saved);
      setStep("dashboard");
      return;
    }
    // ?signin=1 → skip marketing, go straight to email entry
    if (searchParams.get("signin") === "1") {
      setStep("signin");
      return;
    }
    // ?email=... → from apply page, auto-trigger code send
    const paramEmail = searchParams.get("email");
    if (!paramEmail) return;
    const lower = paramEmail.trim().toLowerCase();
    setEmail(lower);
    fetch("/api/affiliates/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: lower }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.token && d.expiresAt) { setToken(d.token); setExpiresAt(d.expiresAt); setStep("code"); }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (step === "landing") {
    return (
      <div style={{ background: "#F5F0E8" }}>
        <Nav onSignInClick={() => setStep("signin")} />
        <MarketingLanding
          onSignIn={(e, t, exp) => { setEmail(e); setToken(t); setExpiresAt(exp); setStep("code"); }}
          onSignInClick={() => setStep("signin")}
        />
      </div>
    );
  }

  if (step === "signin") {
    return (
      <SignInView
        onSignIn={(e, t, exp) => { setEmail(e); setToken(t); setExpiresAt(exp); setStep("code"); }}
      />
    );
  }

  if (step === "code") {
    return (
      <CodeStep
        email={email} token={token} expiresAt={expiresAt}
        onVerified={(d) => { savePartnerSession(d); setData(d); setStep("dashboard"); }}
        onBack={() => setStep("signin")}
      />
    );
  }

  if (step === "dashboard" && data) {
    return (
      <Dashboard
        data={data}
        onSignOut={() => { clearPartnerSession(); setData(null); setEmail(""); setToken(""); setStep("landing"); }}
      />
    );
  }

  return null;
}
