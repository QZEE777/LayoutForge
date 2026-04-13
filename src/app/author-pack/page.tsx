"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SiteShell from "@/components/SiteShell";

const PACK = {
  priceType: "author_pack",
  name: "Author Pack",
  price: 19,
  scans: 6,
  perScan: "3.17",
  tagline: "Your book. Six chances to get it right.",
  audience: "Perfect for indie authors publishing 1–2 books a year.",
  color: "#F05A28",
};

const INCLUDED = [
  "6 full KDP compliance scans — use across any books",
  "Full annotated PDF report per scan",
  "Exact page numbers for every violation",
  "Margin, trim, bleed, font & image checks",
  "Plain-English fix instructions",
  "Credits never expire — use at your own pace",
];

const CHECKS = [
  { icon: "📐", label: "Trim size validation" },
  { icon: "📏", label: "Margin compliance" },
  { icon: "🩸", label: "Bleed zone analysis" },
  { icon: "🔤", label: "Font embedding check" },
  { icon: "📄", label: "Page count accuracy" },
  { icon: "🖼️", label: "Image resolution" },
  { icon: "📦", label: "File size limits" },
  { icon: "🎨", label: "Color mode (CMYK/RGB)" },
  { icon: "🔲", label: "Safe zone compliance" },
  { icon: "📚", label: "Cover & spine checks" },
  { icon: "⚠️", label: "Page-level error flags" },
  { icon: "✅", label: "26 KDP rules total" },
];

export default function AuthorPackPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceType: PACK.priceType }),
      });
      const data = await res.json() as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error || "Checkout failed");
      window.location.href = data.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <SiteShell>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="bg-m2p-ivory">
        <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-start">

            {/* LEFT — copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-m2p-orange/10 border border-m2p-orange/20 px-3 py-1 mb-5">
                <span className="w-2 h-2 rounded-full bg-m2p-orange animate-pulse" />
                <span className="text-xs font-semibold text-m2p-orange uppercase tracking-wide">
                  6 Scans · $3.17 each · No Subscription
                </span>
              </div>

              <h1 className="font-bebas text-5xl lg:text-6xl tracking-wide text-m2p-ink leading-none mb-4">
                Author<br />
                <span className="text-m2p-orange">Pack</span>
              </h1>

              <p className="text-m2p-ink/80 text-lg leading-relaxed mb-3">
                {PACK.tagline}
              </p>
              <p className="text-m2p-muted text-sm mb-6">
                {PACK.audience} Get <strong>6 full KDP compliance scans</strong> — use them across any books,
                any time. Check your draft, your revision, and your final file before you hit publish.
              </p>
              <p className="text-m2p-muted text-sm mb-8">
                Every scan checks all 26 KDP rules and returns a fully annotated PDF report
                with exact page numbers for every issue found.
              </p>

              {/* What's included */}
              <div className="rounded-2xl border border-m2p-border bg-white p-5 mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-m2p-green mb-3">
                  What&apos;s included in your Author Pack
                </p>
                <ul className="space-y-2">
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-m2p-ink/80">
                      <span className="text-m2p-green mt-0.5 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap gap-4 text-xs text-m2p-muted">
                {["🔒 Secure checkout", "⚡ Credits added instantly", "🚫 No account needed", "💳 One-time $19"].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>

            {/* RIGHT — buy card */}
            <div className="lg:sticky lg:top-8">
              <div className="rounded-2xl border-2 border-m2p-border bg-white shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="bg-m2p-ink px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm">Author Pack</p>
                    <p className="text-white/50 text-xs">6 KDP PDF scans · use any time</p>
                  </div>
                  <div className="text-right">
                    <p className="text-m2p-orange font-bebas text-2xl">$19</p>
                    <p className="text-white/40 text-xs">one-time</p>
                  </div>
                </div>

                <div className="p-6">
                  {/* Scan count visual */}
                  <div className="flex gap-3 mb-6 justify-center">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <div key={n} className="flex-1 rounded-xl border-2 border-m2p-orange/30 bg-m2p-orange/5 p-3 text-center">
                        <div className="text-2xl mb-1">📄</div>
                        <p className="text-xs text-m2p-muted font-medium">Scan {n}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-m2p-ivory border border-m2p-border p-4 mb-5">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-m2p-muted">6 scans</span>
                      <span className="text-m2p-ink font-medium">$19.00</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-m2p-muted">Per scan</span>
                      <span className="text-m2p-green font-medium">$3.17 each</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-m2p-border flex justify-between text-xs text-m2p-muted">
                      <span>vs. $9 single scan</span>
                      <span className="text-m2p-green">Save 47%</span>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleBuy}
                    disabled={loading}
                    className="w-full rounded-xl bg-m2p-orange hover:bg-m2p-orange-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 text-base transition-colors"
                  >
                    {loading ? "Redirecting…" : "Get Author Pack — $19 →"}
                  </button>

                  <p className="text-center text-xs text-m2p-muted mt-3">
                    Credits added to your account instantly after purchase
                  </p>
                </div>
              </div>

              {/* Manny note */}
              <div className="mt-4 rounded-xl border border-m2p-border bg-m2p-ivory p-4 flex items-start gap-3">
                <Image src="/MANNY AVATAR.png" alt="Manny" width={36} height={36} className="rounded-full shrink-0 mt-0.5" />
                <p className="text-xs text-m2p-muted leading-relaxed">
                  <strong className="text-m2p-ink">Pro tip:</strong> Run your first scan early — not just before publishing.
                  Finding margin issues on page 1 before you&apos;ve formatted 300 pages saves hours.
                </p>
              </div>

              <p className="text-center text-xs text-m2p-muted mt-4">
                Need more scans?{" "}
                <Link href="/indie-pack" className="text-m2p-orange hover:underline">Indie Pack (14 scans, $39) →</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT WE CHECK ─────────────────────────────────────── */}
      <section className="bg-m2p-ink py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-10">
            <h2 className="font-bebas text-4xl text-m2p-ivory tracking-wide mb-2">
              26 KDP Rules. <span className="text-m2p-orange">Every One.</span>
            </h2>
            <p className="text-m2p-ivory/60 text-sm max-w-lg mx-auto">
              Each scan runs your PDF through the same compliance checks Amazon uses —
              so you know exactly what to fix before you upload.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CHECKS.map((check) => (
              <div key={check.label} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3">
                <span className="text-xl shrink-0">{check.icon}</span>
                <span className="text-white/80 text-sm">{check.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="bg-m2p-ivory py-14">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-bebas text-4xl text-m2p-ink tracking-wide text-center mb-10">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "01", icon: "💳", title: "Buy the Pack", desc: "One-time $19 payment. 6 scan credits added to your account instantly." },
              { step: "02", icon: "📤", title: "Upload Your PDF", desc: "Go to the KDP PDF Checker, upload your manuscript. Your credit is deducted automatically." },
              { step: "03", icon: "📥", title: "Download & Fix", desc: "Get your annotated report in under 90 seconds. Fix the issues, publish with confidence." },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border border-m2p-border bg-white p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-bebas text-m2p-orange text-3xl leading-none">{s.step}</span>
                  <span className="text-2xl">{s.icon}</span>
                </div>
                <h3 className="font-semibold text-m2p-ink mb-2">{s.title}</h3>
                <p className="text-m2p-muted text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/kdp-pdf-checker"
              className="inline-flex items-center gap-2 rounded-xl border border-m2p-border bg-white px-6 py-3 text-sm font-medium text-m2p-ink hover:border-m2p-orange hover:text-m2p-orange transition-colors"
            >
              Already have credits? Go to KDP PDF Checker →
            </Link>
          </div>
        </div>
      </section>

      {/* ── COMPARE PACKS ─────────────────────────────────────── */}
      <section className="bg-m2p-border/30 border-t border-m2p-border py-10">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-m2p-muted mb-6">Compare all packs</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { name: "Author Pack", price: "$19", scans: "6 scans", per: "$3.17/scan", href: "/author-pack", active: true },
              { name: "Indie Pack", price: "$39", scans: "14 scans", per: "$2.79/scan", href: "/indie-pack", active: false },
              { name: "Pro Pack", price: "$79", scans: "30 scans", per: "$2.63/scan", href: "/pro-pack", active: false },
            ].map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className={`rounded-xl border p-4 text-center transition-colors ${
                  p.active
                    ? "border-m2p-orange bg-m2p-orange/5 cursor-default"
                    : "border-m2p-border bg-white hover:border-m2p-orange"
                }`}
              >
                <p className="font-semibold text-m2p-ink text-sm">{p.name}</p>
                <p className="font-bebas text-m2p-orange text-2xl mt-1">{p.price}</p>
                <p className="text-xs text-m2p-muted">{p.scans}</p>
                <p className="text-xs text-m2p-green font-medium mt-1">{p.per}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </SiteShell>
  );
}
