"use client";

import { useState } from "react";
import Link from "next/link";

export default function AffiliateApplyPage() {
  const [form, setForm] = useState({ name: "", email: "", website: "", reason: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "existing" | "error">("idle");
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("loading");
    try {
      const res = await fetch("/api/affiliates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStatus("error");
      } else if (data.existing) {
        setStatus("existing");
      } else {
        setStatus("done");
      }
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-m2p-ink flex flex-col">
      {/* Nav */}
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <span>
              <span className="font-bold text-xl" style={{ color: "#F05A28" }}>manu</span>
              <span className="font-bold text-xl" style={{ color: "#4cd964" }}>2print</span>
            </span>
          </Link>
          <Link href="/partners" className="text-xs text-white/50 hover:text-white transition-colors">
            Already a partner? →
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">

          {status === "done" ? (
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h1 className="font-bebas text-4xl text-white mb-3 tracking-wide">Application received!</h1>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                We&apos;ll review your application and send your unique referral link to <strong className="text-white">{form.email}</strong> within 48 hours.
              </p>
              <p className="text-white/40 text-xs mb-8">
                Questions? Email us at <span className="text-white/60">hello@manu2print.com</span>
              </p>
              <Link href="/" className="inline-block text-white/40 hover:text-white text-sm underline">
                ← Back to home
              </Link>
            </div>
          ) : status === "existing" ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📋</div>
              <h1 className="font-bebas text-4xl text-white mb-3 tracking-wide">Already applied</h1>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                We already have an application from <strong className="text-white">{form.email}</strong>.
                If you&apos;ve been approved, you can view your dashboard below.
              </p>
              <Link
                href="/partners"
                className="inline-block bg-m2p-orange text-white font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity mb-4"
              >
                Go to my dashboard →
              </Link>
              <br />
              <Link href="/" className="inline-block text-white/40 hover:text-white text-sm underline mt-4">
                ← Back to home
              </Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-block bg-m2p-green/20 text-m2p-green text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
                  Partner Program
                </div>
                <h1 className="font-bebas text-5xl text-white mb-3 tracking-wide">Earn 40%</h1>
                <p className="text-white/60 text-sm leading-relaxed">
                  Refer KDP authors to manu2print and earn 40% on every pack sale.
                  <span className="block mt-1 text-white/40">Up to $31.60 per sale. 12-month cookie. No cap.</span>
                </p>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { label: "Commission", value: "40%" },
                  { label: "Top pack", value: "$31.60" },
                  { label: "Cookie", value: "12 months" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <p className="font-bebas text-2xl text-white">{s.value}</p>
                    <p className="text-white/40 text-xs">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Form */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 text-xs font-medium mb-1.5">Full name *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder="Jane Smith"
                        required
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-m2p-green"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-xs font-medium mb-1.5">Email address *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        placeholder="jane@example.com"
                        required
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-m2p-green"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/70 text-xs font-medium mb-1.5">
                      Website / Social / YouTube <span className="text-white/30">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.website}
                      onChange={(e) => set("website", e.target.value)}
                      placeholder="https://yourblog.com or @yourhandle"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-m2p-green"
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 text-xs font-medium mb-1.5">
                      How will you promote manu2print? <span className="text-white/30">(optional)</span>
                    </label>
                    <textarea
                      value={form.reason}
                      onChange={(e) => set("reason", e.target.value)}
                      placeholder="e.g. I run a KDP author community of 5,000 members..."
                      rows={3}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-m2p-green resize-none"
                    />
                  </div>

                  {error && <p className="text-red-400 text-xs">{error}</p>}

                  <button
                    type="submit"
                    disabled={status === "loading" || !form.name || !form.email}
                    className="w-full bg-m2p-orange hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-opacity text-sm"
                  >
                    {status === "loading" ? "Submitting…" : "Apply to join →"}
                  </button>

                  <p className="text-white/30 text-xs text-center">
                    Free to join. We review all applications within 48 hours.
                  </p>
                </form>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
