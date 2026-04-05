"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Gift, DollarSign, Users, TrendingUp, Copy, Check, ExternalLink, Share2, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PartnerUpgradeModal, PartnerUpgradeBanner } from "@/components/dashboard/partner-upgrade-modal";

interface Affiliate {
  id: string;
  name: string | null;
  code: string;
  status: string;
  commission_rate: number | null;
  email: string;
  ls_affiliate_code?: string | null;
}

interface AffiliateStats {
  clicks: number;
  conversions: number;
  totalEarned: number;
  totalPaid: number;
  pendingPayout: number;
}

interface ShareTokenData {
  token: string;
  total_conversions: number;
  total_conversions_pending: number;
}

interface Props {
  affiliate: Affiliate | null;
  stats: AffiliateStats | null;
}

const APP_URL = "https://www.manu2print.com";
const PARTNER_THRESHOLD = 3;

function fmt(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

export function EarnPanel({ affiliate, stats }: Props) {
  const [copied, setCopied] = useState(false);
  const [shareData, setShareData] = useState<ShareTokenData | null>(null);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [modalDismissed, setModalDismissed] = useState(false);
  const [creditBalance, setCreditBalance] = useState<{ total: number; used: number; remaining: number } | null>(null);
  const referralLink = affiliate ? `${APP_URL}/go/${affiliate.code}` : "";

  // Fetch share token data for non-partner users
  useEffect(() => {
    if (affiliate) return;
    fetch("/api/share/token")
      .then((r) => r.json())
      .then((d) => { if (d?.token) setShareData(d.token); })
      .catch(() => {});
  }, [affiliate]);

  // Fetch scan credit balance for all users
  useEffect(() => {
    fetch("/api/credits/balance")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setCreditBalance(d); })
      .catch(() => {});
  }, []);

  const shareLink = shareData ? `${APP_URL}/kdp-pdf-checker?sh=${shareData.token}` : "";

  const copyShareLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setShareLinkCopied(true);
    setTimeout(() => setShareLinkCopied(false), 2500);
  };

  const generateShareToken = async () => {
    try {
      const res = await fetch("/api/share/token", { method: "POST" });
      const d = await res.json();
      if (d?.token) {
        setShareData(d.token);
      } else {
        console.error("Share token error:", d);
        alert("Couldn't generate your link — please try again or contact hello@manu2print.com");
      }
    } catch (e) {
      console.error("Share token fetch error:", e);
      alert("Something went wrong — please try again.");
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!affiliate) {
    const conversions = shareData?.total_conversions ?? 0;
    const pending     = shareData?.total_conversions_pending ?? 0;
    const progress    = Math.min(conversions + pending, PARTNER_THRESHOLD);
    const atThreshold = progress >= PARTNER_THRESHOLD;

    return (
      <>
        {/* Partner upgrade modal — auto-fires once when threshold reached */}
        <PartnerUpgradeModal
          visible={atThreshold && !modalDismissed}
          onClose={() => setModalDismissed(true)}
        />

      <div className="max-w-2xl mx-auto space-y-5">

        {/* 7-day banner fallback after modal is dismissed */}
        {atThreshold && <PartnerUpgradeBanner />}

        {/* Share-to-earn card — shown to all non-partners */}
        <Card className="d-card-elevated overflow-hidden border-[var(--d-border-strong)]">
          <div className="p-6" style={{ borderBottom: "1px solid var(--d-border)" }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(76,217,100,0.12)" }}>
                <Share2 className="w-5 h-5" style={{ color: "#4cd964" }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold mb-0.5" style={{ color: "var(--d-fg)" }}>
                  {atThreshold
                    ? "You're ready to earn cash commissions"
                    : "Share your result. Earn free scans."}
                </p>
                <p className="text-sm" style={{ color: "var(--d-fg-muted)" }}>
                  {atThreshold
                    ? "You've referred enough people to unlock Partner mode — earn 30–40% cash on every sale."
                    : "When someone checks their file from your link, you get a free scan."}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--d-fg-muted)" }}>
                <span>{progress} of {PARTNER_THRESHOLD} toward Partner status</span>
                {pending > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {pending} pending
                  </span>
                )}
              </div>
              <div className="w-full rounded-full h-2" style={{ background: "var(--d-border)" }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${(progress / PARTNER_THRESHOLD) * 100}%`,
                    background: atThreshold ? "#4cd964" : "#F05A28",
                  }}
                />
              </div>
            </div>

            {/* Share link */}
            <div className="mt-4">
              {shareData ? (
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={shareLink}
                    className="flex-1 rounded-lg border px-3 py-2 text-xs font-mono truncate"
                    style={{ borderColor: "var(--d-border)", background: "var(--d-muted)", color: "var(--d-fg-muted)" }}
                  />
                  <button
                    type="button"
                    onClick={copyShareLink}
                    className={
                      shareLinkCopied
                        ? "flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow-sm"
                        : "d-cta d-cta-md flex shrink-0 items-center gap-1.5"
                    }
                  >
                    {shareLinkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {shareLinkCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              ) : (
                <button type="button" onClick={generateShareToken} className="d-cta d-cta-md w-full">
                  Get my share link
                </button>
              )}
            </div>

            {atThreshold && (
              <div className="mt-4 rounded-lg p-3 text-sm" style={{ background: "rgba(76,217,100,0.08)", border: "1px solid rgba(76,217,100,0.2)", color: "#4cd964" }}>
                🎉 Ready to earn cash — activate Partner mode to unlock commissions.
              </div>
            )}
          </div>
        </Card>

        {/* Partner program card */}
        <Card className="d-card-elevated overflow-hidden border-[var(--d-border-strong)]">
          <div
            className="p-8 text-center lg:p-10"
            style={{ background: "linear-gradient(135deg, rgba(255,248,244,0.95) 0%, rgba(232,245,233,0.4) 100%)" }}
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-md" style={{ background: "rgba(240,90,40,0.12)" }}>
              <Gift className="h-7 w-7" style={{ color: "#F05A28" }} />
            </div>
            <h2 className="mb-2 text-2xl font-bold" style={{ color: "var(--d-fg)" }}>Earn 30–40% commission</h2>
            <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
              Share manu2print with fellow indie authors and earn on every scan they purchase. No minimums, no waitlist.
            </p>
            <Link href="/partners/apply" className="d-cta d-cta-lg inline-flex">
              {atThreshold ? "Activate partner mode" : "Become a partner"}
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 divide-x border-t" style={{ borderColor: "var(--d-border)" }}>
            {[
              { value: "30–40%", label: "Commission Rate" },
              { value: "$0",     label: "Minimum Payout" },
              { value: "Lifetime", label: "Cookie Duration" },
            ].map(({ value, label }) => (
              <div key={label} className="p-5 text-center">
                <div className="text-2xl font-bold mb-0.5" style={{ color: "var(--d-primary)" }}>{value}</div>
                <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>{label}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { step: 1, title: "Apply",    desc: "Join in under 2 minutes" },
            { step: 2, title: "Share",    desc: "Use your unique referral link" },
            { step: 3, title: "Get paid", desc: "Automatically via LemonSqueezy" },
          ].map(({ step, title, desc }) => (
            <Card key={step} className="d-card-elevated border-[var(--d-border-strong)] p-3 sm:p-4">
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm" style={{ background: "linear-gradient(135deg, #ff7a4a, #f05a28)" }}>{step}</div>
              <p className="mb-0.5 text-sm font-bold" style={{ color: "var(--d-fg)" }}>{title}</p>
              <p className="text-[11px] leading-snug sm:text-xs" style={{ color: "var(--d-fg-muted)" }}>{desc}</p>
            </Card>
          ))}
        </div>
        {/* Scan Credits — non-partner */}
        {creditBalance !== null && creditBalance.total > 0 && (
          <Card className="d-card-elevated border-[var(--d-border-strong)] p-5">
            <h3 className="mb-3 font-bold" style={{ color: "var(--d-fg)" }}>
              <Gift className="mr-2 inline h-4 w-4 opacity-60" />
              Scan credits
            </h3>
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="text-center flex-1 rounded-lg p-3" style={{ background: "var(--d-bg)" }}>
                <p className="text-2xl font-black" style={{ color: "#F05A28" }}>{creditBalance.remaining}</p>
                <p className="text-xs mt-1" style={{ color: "var(--d-fg-muted)" }}>remaining</p>
              </div>
              <div className="text-center flex-1 rounded-lg p-3" style={{ background: "var(--d-bg)" }}>
                <p className="text-2xl font-black" style={{ color: "var(--d-fg)" }}>{creditBalance.total}</p>
                <p className="text-xs mt-1" style={{ color: "var(--d-fg-muted)" }}>granted</p>
              </div>
              <div className="text-center flex-1 rounded-lg p-3" style={{ background: "var(--d-bg)" }}>
                <p className="text-2xl font-black" style={{ color: "var(--d-fg-muted)" }}>{creditBalance.used}</p>
                <p className="text-xs mt-1" style={{ color: "var(--d-fg-muted)" }}>used</p>
              </div>
            </div>
            <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>
              Use at checkout — enter your email and click &quot;Use a Scan Credit&quot;.
            </p>
          </Card>
        )}
      </div>
      </>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { icon: DollarSign, label: "Total earned",    value: stats ? fmt(stats.totalEarned)    : "—", color: "#F05A28", bg: "rgba(240,90,40,0.1)" },
          { icon: TrendingUp, label: "Pending payout",  value: stats ? fmt(stats.pendingPayout)  : "—", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
          { icon: Users,      label: "Conversions",     value: stats ? String(stats.conversions) : "—", color: "var(--d-fg-muted)", bg: "var(--d-muted)" },
          { icon: Gift,       label: "Commission rate", value: (affiliate.commission_rate && affiliate.commission_rate !== 0.3) ? `${Math.round(affiliate.commission_rate * 100)}%` : "30–40%", color: "var(--d-fg-muted)", bg: "var(--d-muted)" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label} className="d-card-elevated border-[var(--d-border-strong)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: "var(--d-fg)" }}>{value}</p>
                <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="d-card-elevated border-[var(--d-border-strong)] p-5">
        <h3 className="mb-3 font-bold" style={{ color: "var(--d-fg)" }}>Your referral link</h3>
        {affiliate.ls_affiliate_code ? (
          <>
            {/* LS payout link — primary */}
            <p className="text-xs font-semibold mb-1.5" style={{ color: "#10b981" }}>
              ✓ Payout link — share this one to earn commissions
            </p>
            <div className="flex gap-2 mb-3">
              <Input
                value={`https://manu2print.lemonsqueezy.com/?aff=${affiliate.ls_affiliate_code}`}
                readOnly
                className="font-mono text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://manu2print.lemonsqueezy.com/?aff=${affiliate.ls_affiliate_code}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold border transition-all shrink-0"
                style={{ borderColor: "var(--d-border)", color: copied ? "#10b981" : "var(--d-fg)", background: "var(--d-card)" }}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--d-fg-muted)" }}>
              Earn 30% on $9 singles · 40% on packs. LemonSqueezy pays you automatically at $25.
            </p>
          </>
        ) : (
          <>
            <div className="flex gap-2 mb-2">
              <Input value={referralLink} readOnly className="font-mono text-sm" />
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold border transition-all shrink-0"
                style={{ borderColor: "var(--d-border)", color: copied ? "#10b981" : "var(--d-fg)", background: "var(--d-card)" }}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-xs p-2 rounded-lg mb-1" style={{ color: "#92400e", background: "#fef3c7" }}>
              ⏳ Your LemonSqueezy payout link is being set up. Check your email from LemonSqueezy or contact us at hello@manu2print.com.
            </p>
          </>
        )}
      </Card>

      {/* Scan Credits */}
      {creditBalance !== null && (
        <Card className="d-card-elevated border-[var(--d-border-strong)] p-5">
          <h3 className="mb-3 font-bold" style={{ color: "var(--d-fg)" }}>
            <Gift className="mr-2 inline h-4 w-4 opacity-60" />
            Scan credits
          </h3>
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="text-center flex-1 rounded-lg p-3" style={{ background: "var(--d-bg)" }}>
              <p className="text-2xl font-black" style={{ color: "#F05A28" }}>{creditBalance.remaining}</p>
              <p className="text-xs mt-1" style={{ color: "var(--d-fg-muted)" }}>remaining</p>
            </div>
            <div className="text-center flex-1 rounded-lg p-3" style={{ background: "var(--d-bg)" }}>
              <p className="text-2xl font-black" style={{ color: "var(--d-fg)" }}>{creditBalance.total}</p>
              <p className="text-xs mt-1" style={{ color: "var(--d-fg-muted)" }}>granted</p>
            </div>
            <div className="text-center flex-1 rounded-lg p-3" style={{ background: "var(--d-bg)" }}>
              <p className="text-2xl font-black" style={{ color: "var(--d-fg-muted)" }}>{creditBalance.used}</p>
              <p className="text-xs mt-1" style={{ color: "var(--d-fg-muted)" }}>used</p>
            </div>
          </div>
          {creditBalance.remaining > 0 ? (
            <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>
              Use credits at checkout — enter your email and click &quot;Use a Scan Credit&quot;.
            </p>
          ) : (
            <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>
              No credits remaining.{" "}
              <Link href="/kdp-pdf-checker" className="d-link">
                Run a scan for $9 →
              </Link>
            </p>
          )}
        </Card>
      )}

      <Card className="d-card-elevated border-[var(--d-border-strong)] p-5">
        <h3 className="mb-4 font-bold" style={{ color: "var(--d-fg)" }}>Payout details</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span style={{ color: "var(--d-fg-muted)" }}>Status</span>
            <span className="font-medium" style={{ color: affiliate.status === "active" ? "#10b981" : "var(--d-fg)" }}>
              {affiliate.status === "active" ? "✓ Active" : affiliate.status}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span style={{ color: "var(--d-fg-muted)" }}>Commission</span>
            <span className="font-medium" style={{ color: "var(--d-fg)" }}>
              {(affiliate.commission_rate && affiliate.commission_rate !== 0.3) ? `${Math.round(affiliate.commission_rate * 100)}% (custom rate)` : "30% singles · 40% packs"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span style={{ color: "var(--d-fg-muted)" }}>Payouts</span>
            <span className="font-medium" style={{ color: "var(--d-fg)" }}>via LemonSqueezy</span>
          </div>
        </div>
        <p className="text-xs mt-4" style={{ color: "var(--d-fg-muted)" }}>
          Payouts are handled automatically by LemonSqueezy at $25 minimum.
          Connect your payout method directly in your{" "}
          <a href="https://app.lemonsqueezy.com" target="_blank" rel="noopener noreferrer" className="d-link">
            LemonSqueezy dashboard →
          </a>
        </p>
      </Card>
    </div>
  );
}
