"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) setError(decodeURIComponent(err));
  }, [searchParams]);

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
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${baseUrl}/auth/callback` },
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${baseUrl}/auth/callback` },
    });
    if (oauthError) setError(oauthError.message);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-ivory">
      <div className="w-full max-w-md rounded-2xl border-t-4 border-t-brave border border-soft-border bg-white shadow-xl p-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 mb-8 justify-center"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-brave">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <path d="M8 7h8" />
              <path d="M8 11h8" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-amazon-navy">
            manu2print
          </span>
        </Link>

        <h1 className="text-2xl font-bold text-center mb-1 text-amazon-navy">
          Sign in
        </h1>
        <p className="text-center text-sm mb-6 text-soft-muted">
          Get access to KDP formatting, keywords, and more.
        </p>

        {success ? (
          <p className="text-center py-4 rounded-lg border border-brave/40 bg-brave/10 text-brave mb-4">
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
                className="w-full rounded-lg border border-soft-border px-4 py-3 bg-ivory text-amazon-navy text-sm focus:outline-none focus:ring-2 focus:ring-brave/50"
                disabled={loading}
                autoComplete="email"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg px-4 py-3 text-sm font-semibold bg-brave text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send Magic Link"}
              </button>
            </form>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-soft-border" />
              <span className="text-xs uppercase tracking-wider text-soft-muted">or</span>
              <div className="flex-1 h-px bg-soft-border" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full rounded-lg border border-soft-border px-4 py-3 text-sm font-medium text-amazon-navy hover:bg-arctic transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
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
          <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
        )}

        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-soft-muted hover:text-brave transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
