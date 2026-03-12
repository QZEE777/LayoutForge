"use client";

import { useState, useEffect } from "react";

const STORED_EMAIL_KEY = "manu2print_email";

function getStoredEmail(): string {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem(STORED_EMAIL_KEY) || "").trim();
}

type GateState = "processing" | "verifying" | "preview" | "unlocked";

interface PaymentGateProps {
  tool: string;
  children: React.ReactNode;
  isProcessing?: boolean;
  /** When provided, used for checkout and verify-access; enables real checkout buttons. */
  downloadId?: string;
}

export default function PaymentGate({ tool, children, isProcessing = false, downloadId }: PaymentGateProps) {
  const [state, setState] = useState<GateState>(downloadId && !isProcessing ? "verifying" : isProcessing ? "processing" : "preview");
  const [showBetaInput, setShowBetaInput] = useState(false);
  const [betaCode, setBetaCode] = useState("");
  const [betaError, setBetaError] = useState("");
  const [betaLoading, setBetaLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    setUserEmail((prev) => (prev ? prev : getStoredEmail()));
  }, []);

  useEffect(() => {
    if (isProcessing) setState((s) => (s === "unlocked" ? "unlocked" : "processing"));
    else if (!downloadId) setState((s) => (s === "unlocked" ? "unlocked" : "preview"));
  }, [isProcessing, downloadId]);

  useEffect(() => {
    if (!downloadId) return;
    const emailToSend = (userEmail || getStoredEmail()) || undefined;
    fetch("/api/verify-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ downloadId, email: emailToSend, tool }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.access) setState("unlocked");
        else setState("preview");
      })
      .catch(() => setState("preview"));
    // Omit userEmail to avoid re-running on every keystroke
  }, [downloadId, tool]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state === "processing") {
    return <>{children}</>;
  }

  if (state === "verifying") {
    return (
      <div className="relative">
        <div className="select-none pointer-events-none blur-sm">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/70 rounded-lg min-h-[200px]">
          <div className="max-w-md w-full text-center space-y-4">
            <h2 className="text-xl font-bold text-white">Confirming your purchase…</h2>
            <p className="text-sm text-slate-300">
              We’re checking your payment. This usually takes a few seconds.
            </p>
            <p className="text-xs text-slate-500">
              If this takes longer than a minute, refresh the page or open this link again in a new tab.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state === "unlocked") {
    return (
      <div className="relative">
        {children}
        <p className="mb-6 flex items-center gap-2 text-sm text-m2p-orange">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Access granted
        </p>
      </div>
    );
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

  const handleSingleUse = async () => {
    const email = userEmail.trim();
    saveEmailForNextTime(email);
    setCheckoutLoading(true);
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
      if (data?.checkoutUrl) window.location.href = data.checkoutUrl;
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="select-none pointer-events-none blur-sm">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/70 rounded-lg min-h-[280px]">
        <div className="max-w-md w-full text-center space-y-5">
          <h2 className="text-xl font-bold text-white">Your file is ready.</h2>
          <p className="text-sm text-slate-300">Choose how you&apos;d like to access it.</p>
          <input
            type="email"
            placeholder="Your email (for receipt)"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900/90 px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-m2p-orange"
          />
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={handleSingleUse}
              disabled={checkoutLoading}
              className="rounded-lg px-5 py-3 text-sm font-semibold bg-m2p-orange text-white border border-m2p-orange-hover hover:bg-m2p-orange-hover disabled:opacity-60"
            >
              {checkoutLoading ? "Redirecting…" : "$9 — One-Time Use"}
            </button>
          </div>
          <p className="text-slate-500 text-sm">or</p>
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
                className="w-full rounded-lg border border-slate-600 bg-slate-900/90 px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-m2p-orange"
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
                  className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
              {betaError && <p className="text-sm text-red-400">{betaError}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
