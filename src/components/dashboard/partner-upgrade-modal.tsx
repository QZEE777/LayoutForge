"use client";

import { useEffect, useState } from "react";
import { X, Rocket, TrendingUp, DollarSign, ExternalLink } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "m2p_partner_modal_dismissed_at";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getDismissedAt(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

function setDismissedNow() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {}
}

interface Props {
  visible: boolean;         // parent controls: true when threshold reached
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// PartnerUpgradeModal
// Auto-opens once when share-to-earn threshold (3 conversions) is met.
// On dismiss: 7-day banner fallback shown in EarnPanel.
// ─────────────────────────────────────────────────────────────────────────────
export function PartnerUpgradeModal({ visible, onClose }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const dismissedAt = getDismissedAt();
    const recentlyDismissed = dismissedAt !== null && Date.now() - dismissedAt < SEVEN_DAYS_MS;
    if (!recentlyDismissed) setOpen(true);
  }, [visible]);

  const handleClose = () => {
    setDismissedNow();
    setOpen(false);
    onClose();
  };

  if (!open) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--d-card)", border: "1px solid var(--d-border)" }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--d-fg-muted)" }}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header gradient */}
        <div
          className="px-8 pt-8 pb-6 text-center"
          style={{ background: "linear-gradient(135deg, rgba(240,90,40,0.08), rgba(76,217,100,0.08))" }}
        >
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(76,217,100,0.15)" }}
          >
            <Rocket className="w-8 h-8" style={{ color: "#4cd964" }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--d-fg)" }}>
            You unlocked Partner mode
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
            You&rsquo;ve referred 3 people — enough to graduate from free scan credits
            to <strong style={{ color: "var(--d-fg)" }}>30–40% cash commission</strong> on every sale.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 border-b" style={{ borderColor: "var(--d-border)" }}>
          {[
            { icon: DollarSign, label: "Singles",   value: "30%", color: "#F05A28" },
            { icon: TrendingUp, label: "Packs",      value: "40%", color: "#4cd964" },
            { icon: DollarSign, label: "Max/sale",   value: "$31.60", color: "#F05A28" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="p-4 text-center">
              <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
              <p className="font-bold text-base" style={{ color: "var(--d-fg)" }}>{value}</p>
              <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="p-6 space-y-3">
          <Link
            href="/partners/apply"
            className="d-cta d-cta-lg flex w-full items-center justify-center gap-2"
            onClick={handleClose}
          >
            Activate Partner Mode
            <ExternalLink className="h-4 w-4 shrink-0" />
          </Link>
          <button type="button" onClick={handleClose} className="d-btn-outline w-full py-2.5 text-sm">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PartnerUpgradeBanner
// Shown in place of modal when user has dismissed within the last 7 days.
// ─────────────────────────────────────────────────────────────────────────────
export function PartnerUpgradeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = getDismissedAt();
    const recentlyDismissed = dismissedAt !== null && Date.now() - dismissedAt < SEVEN_DAYS_MS;
    setVisible(recentlyDismissed);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="mb-1 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      style={{
        background: "linear-gradient(135deg, rgba(76,217,100,0.1) 0%, rgba(240,90,40,0.06) 100%)",
        borderColor: "rgba(76,217,100,0.28)",
      }}
    >
      <p className="min-w-0 text-sm font-medium leading-snug" style={{ color: "var(--d-fg)" }}>
        <span className="font-semibold" style={{ color: "#2d8f47" }}>
          Partner eligible.
        </span>{" "}
        <span style={{ color: "var(--d-fg-muted)" }}>
          Earn cash on every referral — activate when you&rsquo;re ready.
        </span>
      </p>
      <Link href="/partners/apply" className="d-cta d-cta-md shrink-0 justify-center sm:w-auto">
        Activate
      </Link>
    </div>
  );
}
