"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

const PACK_INFO: Record<string, { name: string; credits: number; emoji: string }> = {
  author_pack:  { name: "Author Pack",          credits: 3,  emoji: "📦" },
  indie_pack:   { name: "Indie Publisher Pack",  credits: 10, emoji: "📚" },
  pro_pack:     { name: "Pro / Studio Pack",     credits: 25, emoji: "🚀" },
};

function usePackBalance(email: string, expectedCredits: number) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const MAX_ATTEMPTS = 20; // ~40 seconds

  useEffect(() => {
    if (!email) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/credits/balance-public?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        const bal = data?.remaining ?? 0;
        setRemaining(bal);
        if (bal >= expectedCredits) {
          setConfirmed(true);
          return;
        }
      } catch { /* keep polling */ }

      attemptsRef.current++;
      if (attemptsRef.current < MAX_ATTEMPTS) {
        pollRef.current = setTimeout(poll, 2000);
      }
    };

    poll();
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [email, expectedCredits]);

  return { remaining, confirmed };
}

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const id   = searchParams.get("id")   ?? "";
  const pack = searchParams.get("pack") ?? "";
  const emailParam = searchParams.get("email") ?? "";

  const [access, setAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(!!id);

  // Resolve email: URL param (pack flow) or localStorage (single scan flow)
  const [email, setEmail] = useState(emailParam);
  useEffect(() => {
    if (!email && typeof window !== "undefined") {
      setEmail(localStorage.getItem("manu2print_email") ?? "");
    }
  }, [email]);

  const packInfo = pack ? PACK_INFO[pack] : null;
  const { remaining, confirmed } = usePackBalance(
    packInfo ? email : "",
    packInfo?.credits ?? 0
  );

  useEffect(() => {
    if (!id) { setChecking(false); return; }
    fetch("/api/verify-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ downloadId: id }),
    })
      .then((r) => r.json())
      .then((data) => setAccess(!!data?.access))
      .catch(() => setAccess(false))
      .finally(() => setChecking(false));
  }, [id]);

  // ── Pack purchase success ──────────────────────────────────────────────────
  if (packInfo) {
    return (
      <div className="min-h-screen bg-m2p-ink flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">{packInfo.emoji}</div>
          <h1 className="font-bebas text-4xl text-white mb-2 tracking-wide">
            Credits added!
          </h1>
          <p className="text-white/70 text-base mb-6">
            {packInfo.name} — <strong className="text-m2p-green">{packInfo.credits} scan credits</strong> are now on your account.
          </p>

          {/* Live balance confirmation */}
          <div className="bg-white/10 rounded-xl px-5 py-4 mb-6">
            {confirmed ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">✅</span>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">Credits confirmed</p>
                  <p className="text-m2p-green font-bold text-lg">{remaining} credit{remaining !== 1 ? "s" : ""} available</p>
                </div>
              </div>
            ) : email ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                <p className="text-white/70 text-sm">Confirming your credits…</p>
              </div>
            ) : (
              <p className="text-white/60 text-sm">
                Credits will appear in your balance within seconds.
              </p>
            )}
          </div>

          <div className="bg-white/10 rounded-xl px-5 py-4 mb-6 text-left space-y-2">
            <p className="text-white font-semibold text-sm">How to use your credits</p>
            <p className="text-white/60 text-sm">1. Go to the KDP PDF Checker and upload your manuscript.</p>
            <p className="text-white/60 text-sm">2. When the payment screen appears, click <strong className="text-white">&quot;Use a Scan Credit&quot;</strong>.</p>
            <p className="text-white/60 text-sm">3. Enter the email you used to buy this pack — we&apos;ll send a quick code to verify.</p>
          </div>

          <Link
            href="/kdp-pdf-checker"
            className="inline-block bg-m2p-orange hover:opacity-90 text-white font-bold px-8 py-3 rounded-xl mb-4 transition-opacity"
          >
            Check a PDF now →
          </Link>

          <p className="text-white/40 text-xs mt-2">
            Credits never expire.{" "}
            <Link href="/account" className="text-white/60 underline hover:text-white">
              View my credits
            </Link>
          </p>

          <Link href="/" className="mt-6 inline-block text-white/40 hover:text-white/70 text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  // ── Single scan success ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-m2p-ink flex items-center justify-center px-4">
      <div className="text-center max-w-md">

        <div className="mb-6">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="font-bebas text-4xl text-white mb-2">
            Payment confirmed!
          </h1>
          <p className="text-white/70 text-base">
            Your KDP PDF Check is ready.
          </p>
        </div>

        <div className="bg-white/10 rounded-xl px-5 py-4 mb-6 text-left">
          <p className="text-white font-semibold text-sm mb-1">📧 Check your email</p>
          <p className="text-white/70 text-sm leading-relaxed">
            We&apos;ve sent your download link to your email address.
            <span className="block mt-1 text-white/50 text-xs">
              ⚠ Your file is available for <strong className="text-white/70">24 hours</strong> — save the link or bookmark the download page.
            </span>
          </p>
        </div>

        {checking && (
          <p className="text-white/60 text-sm mb-6">Verifying your purchase…</p>
        )}

        {!checking && id && (
          <>
            {!access && (
              <p className="text-white/60 text-sm mb-4">
                Payment still confirming — if the download page isn&apos;t ready yet, wait a moment and refresh.
              </p>
            )}
            <Link
              href={`/download/${id}`}
              className="inline-block bg-m2p-orange hover:opacity-90 text-white font-bold px-8 py-3 rounded-lg mb-4 transition-opacity"
            >
              Open download page →
            </Link>
          </>
        )}

        <p className="text-white/40 text-xs mt-4">
          Lost your link later?{" "}
          <Link href="/resend-link" className="text-white/60 underline hover:text-white">
            Get it resent
          </Link>
        </p>

        <Link href="/" className="mt-6 inline-block text-white/40 hover:text-white/70 text-sm">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
