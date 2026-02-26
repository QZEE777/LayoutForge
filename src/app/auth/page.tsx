"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

const GOLD = "#F5A623";
const WARM_WHITE = "#FAF7F2";
const CARD_BG = "#1A1612";
const CARD_BORDER = "#2A2420";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      const rateLimitRes = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const rateLimitData = await rateLimitRes.json();
      if (!rateLimitRes.ok) {
        setError(
          rateLimitData.error === "rate_limit_exceeded"
            ? "Too many attempts. Try again in an hour."
            : rateLimitData.error || "Something went wrong"
        );
        return;
      }
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (otpError) {
        setError(otpError.message);
        return;
      }
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) setError(oauthError.message);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: "#0F0D0B" }}
    >
      <div
        className="w-full max-w-md rounded-xl border p-8"
        style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 mb-8 justify-center"
        >
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: GOLD }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="#0F0D0B"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>
          <span
            className="text-xl font-bold tracking-tight"
            style={{ color: WARM_WHITE }}
          >
            <span className="font-serif">Scribe</span>
            <span className="font-sans">Stack</span>
          </span>
        </Link>

        <h1
          className="text-2xl font-serif font-bold text-center mb-2"
          style={{ color: WARM_WHITE }}
        >
          Sign in to ScribeStack
        </h1>
        <p
          className="text-center text-sm mb-6"
          style={{ color: "#a8a29e" }}
        >
          Use your email or Google to continue.
        </p>

        {success ? (
          <p
            className="text-center py-4 rounded-lg border mb-4"
            style={{ color: "rgba(245,166,35,0.95)", borderColor: "rgba(245,166,35,0.4)", backgroundColor: "rgba(245,166,35,0.08)" }}
          >
            Check your email for a magic link.
          </p>
        ) : (
          <>
            <form onSubmit={handleMagicLink} className="space-y-4">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border px-4 py-3 bg-[#0F0D0B] text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50"
                style={{ borderColor: CARD_BORDER, color: WARM_WHITE }}
                disabled={loading}
                autoComplete="email"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: GOLD, color: "#0F0D0B" }}
              >
                {loading ? "Sending…" : "Send Magic Link"}
              </button>
            </form>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px" style={{ backgroundColor: CARD_BORDER }} />
              <span className="text-xs uppercase tracking-wider" style={{ color: "#78716c" }}>or</span>
              <div className="flex-1 h-px" style={{ backgroundColor: CARD_BORDER }} />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full rounded-lg border px-4 py-3 text-sm font-medium transition-colors hover:bg-white/5 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ borderColor: CARD_BORDER, color: WARM_WHITE }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
        )}

        <p className="mt-6 text-center">
          <Link href="/" className="text-sm hover:underline" style={{ color: "#a8a29e" }}>
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
