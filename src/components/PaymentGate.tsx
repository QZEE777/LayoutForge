"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

const STORED_EMAIL_KEY = "manu2print_email";
const STORED_CHECKOUT_PENDING_PREFIX = "manu2print_checkout_pending_";

function getCheckoutPendingKey(downloadId: string) {
  return `${STORED_CHECKOUT_PENDING_PREFIX}${downloadId}`;
}

function getStoredEmail(): string {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem(STORED_EMAIL_KEY) || "").trim();
}

type GateState = "processing" | "verifying" | "preview" | "unlocked";
type CreditStep = "idle" | "sending" | "code" | "redeeming" | "error";

interface PaymentGateProps {
  tool: string;
  children: React.ReactNode;
  isProcessing?: boolean;
  /** When provided, used for checkout and verify-access; enables real checkout buttons. */
  downloadId?: string;
  /**
   * When true, we do NOT mount `children` while the user is locked/verifying.
   * This prevents expensive previews (e.g. PDF.js) from rendering before payment.
   */
  hideChildrenUntilUnlocked?: boolean;
  /** Safety timeout for verify-access. */
  verifyTimeoutMs?: number;
}

export default function PaymentGate({
  tool,
  children,
  isProcessing = false,
  downloadId,
  hideChildrenUntilUnlocked = false,
  verifyTimeoutMs = 20_000,
}: PaymentGateProps) {
  const [state, setState] = useState<GateState>(() => {
    if (isProcessing) return "processing";
    if (!downloadId) return "preview";
    // Only show "Confirming your purchase" if we know the user already initiated checkout.
    if (typeof window === "undefined") return "preview";
    const pending = localStorage.getItem(getCheckoutPendingKey(downloadId)) === "1";
    return pending ? "verifying" : "preview";
  });
  const [showBetaInput, setShowBetaInput] = useState(false);
  const [betaCode, setBetaCode] = useState("");
  const [betaError, setBetaError] = useState("");
  const [betaLoading, setBetaLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [verifyTimedOut, setVerifyTimedOut] = useState(false);

  // Credit redemption state
  const [creditStep, setCreditStep] = useState<CreditStep>("idle");
  const [creditCode, setCreditCode] = useState("");
  const [creditToken, setCreditToken] = useState("");
  const [creditExpiresAt, setCreditExpiresAt] = useState(0);
  const [creditError, setCreditError] = useState("");

  /** Supabase session email — used for instant credit redeem + prefilled checkout email */
  const [sessionSignedInEmail, setSessionSignedInEmail] = useState<string | null>(null);
  const [sessionCreditsRemaining, setSessionCreditsRemaining] = useState<number | null>(null);
  const [sessionRedeemLoading, setSessionRedeemLoading] = useState(false);
  const [sessionRedeemError, setSessionRedeemError] = useState("");

  useEffect(() => {
    setUserEmail((prev) => (prev ? prev : getStoredEmail()));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled || !user?.email) return;
        const e = user.email.trim();
        const lower = e.toLowerCase();
        setSessionSignedInEmail(lower);
        // Signed-in identity is the source of truth for account credits.
        // Always align the prefilled email so credit/pay flows don't drift to stale localStorage values.
        setUserEmail(e);
        if (typeof window !== "undefined") localStorage.setItem(STORED_EMAIL_KEY, e);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionSignedInEmail) {
      setSessionCreditsRemaining(null);
      return;
    }
    let cancelled = false;
    fetch("/api/credits/balance")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { remaining?: number } | null) => {
        if (cancelled || !data || typeof data.remaining !== "number") return;
        setSessionCreditsRemaining(data.remaining);
      })
      .catch(() => {
        if (!cancelled) setSessionCreditsRemaining(null);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionSignedInEmail]);

  const handleSessionCreditRedeem = useCallback(async () => {
    if (!downloadId) return;
    setSessionRedeemLoading(true);
    setSessionRedeemError("");
    setCheckoutError("");
    try {
      const res = await fetch("/api/credits/use-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSessionRedeemError(typeof data.error === "string" ? data.error : "Could not apply credit.");
        return;
      }
      if (typeof data.balance === "number") setSessionCreditsRemaining(data.balance);
      setState("unlocked");
    } catch {
      setSessionRedeemError("Network error. Try again.");
    } finally {
      setSessionRedeemLoading(false);
    }
  }, [downloadId]);

  const sessionInstantCreditBlock =
    sessionSignedInEmail &&
    sessionCreditsRemaining !== null &&
    sessionCreditsRemaining > 0 &&
    downloadId ? (
      <div className="rounded-lg border border-[#4ade80]/50 bg-black/20 px-3 py-3 text-left space-y-2">
        <p className="text-xs text-white/90 leading-relaxed">
          Signed in as <span className="font-semibold text-white">{sessionSignedInEmail}</span>
          <span className="text-white/75">
            {" "}
            — {sessionCreditsRemaining} credit{sessionCreditsRemaining !== 1 ? "s" : ""} on this account. No email
            code needed.
          </span>
        </p>
        <button
          type="button"
          onClick={handleSessionCreditRedeem}
          disabled={sessionRedeemLoading || checkoutLoading}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold bg-m2p-green text-white hover:opacity-90 disabled:opacity-50"
        >
          {sessionRedeemLoading ? "Applying…" : "Use 1 credit now"}
        </button>
        {sessionRedeemError ? <p className="text-sm text-red-400">{sessionRedeemError}</p> : null}
      </div>
    ) : null;
  const canUseSessionCreditInstantly = Boolean(
    sessionSignedInEmail &&
      sessionCreditsRemaining !== null &&
      sessionCreditsRemaining > 0 &&
      downloadId
  );

  useEffect(() => {
    if (isProcessing) setState((s) => (s === "unlocked" ? "unlocked" : "processing"));
    else if (!downloadId) setState((s) => (s === "unlocked" ? "unlocked" : "preview"));
  }, [isProcessing, downloadId]);

  useEffect(() => {
    if (!downloadId) return;
    const emailToSend = (userEmail || getStoredEmail()) || undefined;
    setVerifyTimedOut(false);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), verifyTimeoutMs);
    fetch("/api/verify-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ downloadId, email: emailToSend, tool }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.access) {
          // If they paid, clear the checkout-pending flag so we don't re-show "verifying".
          if (typeof window !== "undefined") {
            localStorage.removeItem(getCheckoutPendingKey(downloadId));
          }
          setState("unlocked");
        } else {
          // If checkout was initiated but webhook hasn't confirmed yet, keep the verifying overlay.
          if (typeof window !== "undefined") {
            const pending = localStorage.getItem(getCheckoutPendingKey(downloadId)) === "1";
            setState(pending ? "verifying" : "preview");
          } else {
            setState("preview");
          }
        }
      })
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") {
          setVerifyTimedOut(true);
          // Keep showing verifying if user is mid-checkout; otherwise drop to preview.
          if (typeof window !== "undefined") {
            const pending = localStorage.getItem(getCheckoutPendingKey(downloadId)) === "1";
            setState(pending ? "verifying" : "preview");
          } else {
            setState("preview");
          }
        } else {
          setState("preview");
        }
      })
      .finally(() => clearTimeout(timer));
    // Omit userEmail to avoid re-running on every keystroke
  }, [downloadId, tool]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state === "processing") {
    return <>{children}</>;
  }

  if (state === "verifying") {
    return (
      <div className="relative">
        {!hideChildrenUntilUnlocked && <div className="select-none pointer-events-none blur-sm">{children}</div>}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-[2px]">
          <div className="max-w-md w-full rounded-2xl border border-white/10 p-8 text-center space-y-4 shadow-2xl" style={{ background: "linear-gradient(180deg, #1A6B2A 0%, #0D3D18 100%)" }}>
            <div className="inline-block w-9 h-9 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" aria-hidden />
            <h2 className="text-xl font-black text-white tracking-tight">Confirming your purchase…</h2>
            <p className="text-sm text-white/90 leading-relaxed">
              {verifyTimedOut ? "Still verifying. If you already paid, refresh in ~1 minute. Otherwise, continue below." : "We’re checking your payment. This usually takes a few seconds."}
            </p>
            <p className="text-xs text-white/65 leading-relaxed">
              If this takes longer than a minute, refresh the page or open this link again in a new tab.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state === "unlocked") {
    return <>{children}</>;
  }

  const handleBetaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBetaError("");
    setBetaLoading(true);
    try {
      const res = await fetch("/api/beta-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: betaCode.trim(), tool }),
      });
      const data = await res.json();
      if (data.valid) setState("unlocked");
      else setBetaError("Invalid code. Please try again.");
    } finally {
      setBetaLoading(false);
    }
  };

  const saveEmailForNextTime = (email: string) => {
    const trimmed = email.trim();
    if (trimmed && typeof window !== "undefined") localStorage.setItem(STORED_EMAIL_KEY, trimmed);
  };

  const captureNudge = (email: string) => {
    if (!email || !downloadId) return;
    fetch("/api/nudge-subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, downloadId }),
    }).catch(() => { /* non-fatal */ });
  };

  const handleSingleUse = async () => {
    const email = userEmail.trim();
    saveEmailForNextTime(email);
    captureNudge(email);
    if (downloadId && typeof window !== "undefined") {
      localStorage.setItem(getCheckoutPendingKey(downloadId), "1");
    }
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceType: "single_use",
          tool,
          downloadId: downloadId ?? "",
          email: email || "",
        }),
      });
      const data = await res.json();
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setCheckoutError(data?.error ?? "Checkout unavailable — please try again or contact support.");
      }
    } catch {
      setCheckoutError("Network error — please check your connection and try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCreditSendCode = async () => {
    if (canUseSessionCreditInstantly) {
      await handleSessionCreditRedeem();
      return;
    }
    const email = (sessionSignedInEmail ?? userEmail.trim()).trim();
    if (!email) { setCreditError("Enter your email first."); return; }
    if (sessionSignedInEmail) {
      setUserEmail(sessionSignedInEmail);
    }
    saveEmailForNextTime(email);
    // Note: no captureNudge here — credit holders shouldn't receive a "pay $9" nudge
    setCreditError("");
    setCreditStep("sending");
    try {
      const res = await fetch("/api/credits/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setCreditError(data.error ?? "Failed to send code."); setCreditStep("error"); return; }
      if (!data.token) {
        // No credits on that email — don't reveal, just show no-credits message
        setCreditError("No scan credits found for that email. Buy a pack to get credits.");
        setCreditStep("error");
        return;
      }
      setCreditToken(data.token);
      setCreditExpiresAt(data.expiresAt);
      setCreditStep("code");
    } catch {
      setCreditError("Network error. Try again.");
      setCreditStep("error");
    }
  };

  const handleCreditRedeem = async () => {
    if (creditCode.length !== 6) return;
    setCreditStep("redeeming");
    setCreditError("");
    try {
      const res = await fetch("/api/credits/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail.trim(),
          code: creditCode,
          token: creditToken,
          expiresAt: creditExpiresAt,
          downloadId: downloadId ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreditError(data.error ?? "Redemption failed."); setCreditStep("error"); return; }
      setState("unlocked");
    } catch {
      setCreditError("Network error. Try again.");
      setCreditStep("error");
    }
  };

  const resetCredit = () => {
    setCreditStep("idle");
    setCreditCode("");
    setCreditToken("");
    setCreditExpiresAt(0);
    setCreditError("");
  };

  // When hideChildrenUntilUnlocked (checker flow), render inline below the teaser — no full-screen overlay
  if (hideChildrenUntilUnlocked) {
    return (
      <div
        className="rounded-2xl border p-6 sm:p-7 text-center space-y-4 mt-4 shadow-[0_20px_50px_-15px_rgba(13,61,24,0.45)] overflow-hidden"
        style={{ background: "linear-gradient(165deg, #143d1f 0%, #0a2412 55%, #1a0f0a 100%)", borderColor: "rgba(197,232,58,0.2)" }}
      >
        <div className="h-0.5 w-16 mx-auto rounded-full bg-[#C5E83A]/60" aria-hidden />
        <h2 className="text-lg font-black text-white tracking-tight">Unlock your full report</h2>
        <p className="text-sm text-white/75 leading-relaxed max-w-sm mx-auto">See every issue, which pages are affected, how to fix each one<br />and your annotated PDF.</p>
        <input
          type="email"
          placeholder="Your email (for receipt / credits)"
          value={userEmail}
          onChange={(e) => { setUserEmail(e.target.value); resetCredit(); }}
          className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-m2p-orange"
        />
        {sessionInstantCreditBlock}
        {creditStep === "code" ? (
          <div className="space-y-3">
            <p className="text-sm text-white/80">6-digit code sent — enter it to redeem your credit:</p>
            <input
              type="text"
              value={creditCode}
              onChange={(e) => setCreditCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full rounded-lg border border-white/20 bg-m2p-ink/95 px-4 py-2 text-center text-2xl font-bold tracking-widest text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-m2p-green"
            />
            {creditError && <p className="text-sm text-red-400">{creditError}</p>}
            <div className="flex gap-2 justify-center">
              <button type="button" onClick={handleCreditRedeem} disabled={creditCode.length !== 6}
                className="rounded-lg px-5 py-2.5 text-sm font-semibold bg-m2p-green text-white hover:opacity-90 disabled:opacity-50">
                Redeem credit →
              </button>
              <button type="button" onClick={resetCredit} className="rounded-lg px-4 py-2.5 text-sm text-white/60 hover:text-white">Cancel</button>
            </div>
          </div>
        ) : creditStep === "redeeming" ? (
          <p className="text-sm text-white/70">Redeeming your credit…</p>
        ) : creditStep === "sending" ? (
          <p className="text-sm text-white/70">Sending verification code…</p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button type="button" onClick={handleSingleUse} disabled={checkoutLoading}
                className="rounded-lg px-5 py-3 text-sm font-semibold bg-m2p-orange text-white hover:opacity-90 disabled:opacity-60">
                {checkoutLoading ? "Redirecting…" : "$9 — Pay Now"}
              </button>
              {!canUseSessionCreditInstantly && (
                <button type="button" onClick={handleCreditSendCode} disabled={checkoutLoading}
                  className="rounded-lg px-5 py-3 text-sm font-semibold bg-m2p-green text-white hover:opacity-90 disabled:opacity-60">
                  Use a Scan Credit →
                </button>
              )}
            </div>
            {checkoutError && <p className="text-sm text-red-400">{checkoutError}</p>}
            {creditStep === "error" && creditError && (
              <div className="space-y-2">
                <p className="text-sm text-red-400">{creditError}</p>
                {creditError.includes("No scan credits") && (
                  <Link href="/#pricing" className="text-xs text-m2p-orange hover:underline">Buy a pack →</Link>
                )}
                <button type="button" onClick={resetCredit} className="block mx-auto text-xs text-white/40 hover:text-white underline">Try again</button>
              </div>
            )}
            {!showBetaInput ? (
              <button type="button" onClick={() => setShowBetaInput(true)}
                className="text-xs text-white/40 hover:text-white/70 underline">
                Have a beta access code?
              </button>
            ) : (
              <form onSubmit={handleBetaSubmit} className="space-y-2">
                <input type="text" placeholder="Enter beta code" value={betaCode}
                  onChange={(e) => { setBetaCode(e.target.value); setBetaError(""); }}
                  className="w-full rounded-lg border border-white/20 bg-m2p-ink/95 px-4 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-m2p-orange"
                />
                {betaError && <p className="text-xs text-red-400">{betaError}</p>}
                <div className="flex gap-2 justify-center">
                  <button type="submit" disabled={betaLoading}
                    className="rounded-lg px-4 py-2 text-sm font-medium bg-m2p-orange text-white hover:opacity-90 disabled:opacity-60">
                    {betaLoading ? "Checking…" : "Unlock →"}
                  </button>
                  <button type="button" onClick={() => setShowBetaInput(false)}
                    className="rounded-lg px-4 py-2 text-sm text-white/60 hover:text-white">Cancel</button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    );
  }

  return (
      <div className="relative">
      {!hideChildrenUntilUnlocked && (
        <div className="select-none pointer-events-none blur-sm">
          {children}
        </div>
      )}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-[2px]">
        <div className="max-w-md w-full rounded-2xl border border-white/10 p-8 text-center space-y-5 shadow-2xl" style={{ background: "linear-gradient(180deg, #1A6B2A 0%, #0D3D18 100%)" }}>
          <div className="h-0.5 w-14 mx-auto rounded-full bg-[#C5E83A]/50" aria-hidden />
          <h2 className="text-xl font-black text-white tracking-tight">Your file is ready.</h2>
          <p className="text-sm text-white/90">Choose how you&apos;d like to access it.</p>
          <input
            type="email"
            placeholder="Your email (for receipt / credits)"
            value={userEmail}
            onChange={(e) => { setUserEmail(e.target.value); resetCredit(); }}
            className="w-full rounded-lg border border-white/20 bg-m2p-ink/95 px-4 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-m2p-orange"
          />

          {sessionInstantCreditBlock}

          {/* Credit redemption flow */}
          {creditStep === "code" ? (
            <div className="space-y-3">
              <p className="text-sm text-white/80">6-digit code sent — enter it to redeem your credit:</p>
              <input
                type="text"
                value={creditCode}
                onChange={(e) => setCreditCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full rounded-lg border border-white/20 bg-m2p-ink/95 px-4 py-2 text-center text-2xl font-bold tracking-widest text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-m2p-green"
              />
              {creditError && <p className="text-sm text-red-400">{creditError}</p>}
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={handleCreditRedeem}
                  disabled={creditCode.length !== 6}
                  className="rounded-lg px-5 py-2.5 text-sm font-semibold bg-m2p-green text-white hover:opacity-90 disabled:opacity-50"
                >
                  Redeem credit →
                </button>
                <button type="button" onClick={resetCredit} className="rounded-lg px-4 py-2.5 text-sm text-white/60 hover:text-white">Cancel</button>
              </div>
            </div>
          ) : creditStep === "redeeming" ? (
            <p className="text-sm text-white/70">Redeeming your credit…</p>
          ) : creditStep === "sending" ? (
            <p className="text-sm text-white/70">Sending verification code…</p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleSingleUse}
                  disabled={checkoutLoading}
                  className="rounded-lg px-5 py-3 text-sm font-semibold bg-m2p-orange text-white border border-m2p-orange-hover hover:bg-m2p-orange-hover disabled:opacity-60"
                >
                  {checkoutLoading ? "Redirecting…" : "$9 — Pay Now"}
                </button>
                {!canUseSessionCreditInstantly && (
                  <button
                    type="button"
                    onClick={handleCreditSendCode}
                    disabled={checkoutLoading}
                    className="rounded-lg px-5 py-3 text-sm font-semibold bg-m2p-green text-white hover:opacity-90 disabled:opacity-60"
                  >
                    Use a Scan Credit →
                  </button>
                )}
              </div>
              {checkoutError && <p className="text-sm text-red-400">{checkoutError}</p>}
              {creditStep === "error" && creditError && (
                <div className="space-y-2">
                  <p className="text-sm text-red-400">{creditError}</p>
                  {creditError.includes("No scan credits") && (
                    <Link href="/#pricing" className="text-xs text-m2p-orange hover:underline">Buy a pack →</Link>
                  )}
                  <button type="button" onClick={resetCredit} className="block mx-auto text-xs text-white/40 hover:text-white underline">Try again</button>
                </div>
              )}
              <p className="text-white/70 text-sm">or</p>
              {!showBetaInput ? (
                <button
                  type="button"
                  onClick={() => setShowBetaInput(true)}
                  className="text-sm text-m2p-orange hover:underline"
                >
                  Have a beta access code?
                </button>
              ) : (
                <form onSubmit={handleBetaSubmit} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Enter beta code"
                    value={betaCode}
                    onChange={(e) => { setBetaCode(e.target.value); setBetaError(""); }}
                    className="w-full rounded-lg border border-white/20 bg-m2p-ink/95 px-4 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-m2p-orange"
                  />
                  <div className="flex gap-2 justify-center">
                    <button
                      type="submit"
                      disabled={betaLoading}
                      className="rounded-lg px-4 py-2 text-sm font-medium bg-m2p-orange text-white hover:bg-m2p-orange-hover disabled:opacity-60"
                    >
                      {betaLoading ? "Checking…" : "Unlock"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowBetaInput(false); setBetaCode(""); setBetaError(""); }}
                      className="rounded-lg px-4 py-2 text-sm text-white/80 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  {betaError && <p className="text-sm text-red-400">{betaError}</p>}
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
