"use client";

import { useState, useEffect } from "react";

type GateState = "processing" | "preview" | "unlocked";

interface PaymentGateProps {
  tool: string;
  children: React.ReactNode;
  isProcessing?: boolean;
}

export default function PaymentGate({ tool, children, isProcessing = false }: PaymentGateProps) {
  const [state, setState] = useState<GateState>(isProcessing ? "processing" : "preview");
  const [showBetaInput, setShowBetaInput] = useState(false);
  const [betaCode, setBetaCode] = useState("");
  const [betaError, setBetaError] = useState("");
  const [betaLoading, setBetaLoading] = useState(false);

  useEffect(() => {
    if (isProcessing) setState((s) => (s === "unlocked" ? "unlocked" : "processing"));
    else setState((s) => (s === "unlocked" ? "unlocked" : "preview"));
  }, [isProcessing]);

  if (state === "processing") {
    return <>{children}</>;
  }

  if (state === "unlocked") {
    return (
      <div className="relative">
        {children}
        <p className="mt-3 flex items-center gap-2 text-sm text-green-500">
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

  return (
    <div className="relative">
      <div className="select-none pointer-events-none blur-sm">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/70 rounded-lg min-h-[280px]">
        <div className="max-w-md w-full text-center space-y-5">
          <h2 className="text-xl font-bold text-white">Your file is ready.</h2>
          <p className="text-sm text-slate-300">Choose how you&apos;d like to access it.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              disabled
              className="rounded-lg px-5 py-3 text-sm font-semibold bg-[#2A2420] text-[#8B7355] border border-[#3d3630] cursor-not-allowed"
            >
              $7 One-Time Use — Coming Soon
            </button>
            <button
              type="button"
              disabled
              className="rounded-lg px-5 py-3 text-sm font-semibold bg-[#2A2420] text-[#8B7355] border border-[#3d3630] cursor-not-allowed"
            >
              $27 · Six Month Access — Coming Soon
            </button>
          </div>
          <p className="text-slate-500 text-sm">or</p>
          {!showBetaInput ? (
            <button
              type="button"
              onClick={() => setShowBetaInput(true)}
              className="text-sm text-[#F5A623] hover:underline"
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
                className="w-full rounded-lg border border-slate-600 bg-slate-900/90 px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              />
              <div className="flex gap-2 justify-center">
                <button
                  type="submit"
                  disabled={betaLoading}
                  className="rounded-lg px-4 py-2 text-sm font-medium bg-[#F5A623] text-[#0F0D0B] hover:opacity-90 disabled:opacity-60"
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
