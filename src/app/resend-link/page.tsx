"use client";

import { useState } from "react";
import Link from "next/link";

export default function ResendLinkPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/resend-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok || res.status === 429) {
        setStatus(res.status === 429 ? "error" : "sent");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-m2p-ink flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span>
              <span className="font-bold text-2xl" style={{ color: "#F05A28" }}>manu</span>
              <span className="font-bold text-2xl" style={{ color: "#4cd964" }}>2print</span>
            </span>
          </Link>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {status === "sent" ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <h1 className="font-bebas text-3xl text-white mb-3">Check your inbox</h1>
              <p className="text-white/70 text-sm leading-relaxed mb-6">
                If we have a purchase on record for that email, we&apos;ve sent you download instructions now.
              </p>
              <p className="text-white/40 text-xs mb-6">
                Check your spam folder if you don&apos;t see it within a minute.
              </p>
              <Link
                href="/"
                className="inline-block text-white/60 hover:text-white text-sm underline"
              >
                ← Back to home
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-bebas text-3xl text-white mb-2 text-center">
                Resend my download link
              </h1>
              <p className="text-white/60 text-sm text-center mb-8 leading-relaxed">
                Lost your download email? Enter the address you paid with and we&apos;ll resend your link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Email address used at checkout
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-m2p-green"
                  />
                </div>

                {status === "error" && (
                  <p className="text-red-400 text-xs">
                    Too many attempts or something went wrong. Try again in a moment.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading" || !email.trim()}
                  className="w-full bg-m2p-orange hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-opacity text-sm"
                >
                  {status === "loading" ? "Sending…" : "Send my link →"}
                </button>
              </form>

              <p className="text-white/30 text-xs text-center mt-6">
                Haven&apos;t purchased yet?{" "}
                <Link href="/kdp-pdf-checker" className="text-white/50 underline hover:text-white">
                  Check my PDF — $9
                </Link>
              </p>

              <p className="text-center mt-4">
                <Link href="/" className="text-white/30 hover:text-white/60 text-xs">
                  ← Back to home
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
