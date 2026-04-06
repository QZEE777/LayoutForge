"use client";

import { Card } from "@/components/ui/card";
import { Gift, DollarSign, Users, TrendingUp, Copy, Check, ExternalLink, Share2, Clock, Sparkles } from "lucide-react";
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

      <div className="d-animate-in mx-auto max-w-3xl space-y-5">

        {/* 7-day banner fallback after modal is dismissed */}
        {atThreshold && <PartnerUpgradeBanner />}

        <div className="d-hero-intro">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="font-bebas text-2xl tracking-wide text-[var(--d-fg)]">Earn</p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
                Share your checker link. Each qualifying referral counts toward free scans and Partner status.
              </p>
            </div>
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center self-center rounded-2xl shadow-md sm:self-start"
              style={{
                background: "linear-gradient(145deg, rgba(76,217,100,0.2), rgba(240,90,40,0.08))",
              }}
            >
              <Gift className="h-8 w-8" style={{ color: "var(--d-primary)" }} />
            </div>
          </div>
        </div>

        {/* Share-to-earn card — shown to all non-partners */}
        <Card className="d-card-hero overflow-hidden border-[var(--d-border-strong)]">
          <div
            className="relative px-5 pb-5 pt-6 sm:px-6"
            style={{
              background: atThreshold
                ? "linear-gradient(160deg, rgba(76,217,100,0.12) 0%, rgba(255,248,244,0.95) 45%, var(--d-card) 100%)"
                : "linear-gradient(160deg, rgba(240,90,40,0.08) 0%, rgba(255,248,244,0.9) 40%, var(--d-card) 100%)",
            }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
              <div
                className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm sm:mx-0 sm:h-11 sm:w-11"
                style={{
                  background: atThreshold ? "rgba(76,217,100,0.2)" : "rgba(76,217,100,0.14)",
                }}
              >
                <Share2 className="h-6 w-6 sm:h-5 sm:w-5" style={{ color: atThreshold ? "#2d8f47" : "#4cd964" }} />
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="mb-1 text-base font-bold sm:text-lg" style={{ color: "var(--d-fg)" }}>
                  {atThreshold
                    ? "You are ready for cash commissions"
                    : "Share your result, earn free scans"}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
                  {atThreshold
                    ? "You have referred enough people to unlock Partner mode — earn 30–40% cash on every sale."
                    : "When someone checks their file from your link, you get a free scan."}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                <div className="text-center sm:text-left">
                  <p
                    className="text-3xl font-black tabular-nums leading-none tracking-tight"
                    style={{ color: atThreshold ? "#2d8f47" : "var(--d-primary)" }}
                  >
                    {progress}
                    <span className="text-lg font-bold" style={{ color: "var(--d-fg-muted)" }}>
                      /{PARTNER_THRESHOLD}
                    </span>
                  </p>
                  <p className="mt-1 text-xs font-medium" style={{ color: "var(--d-fg-muted)" }}>
                    conversions toward Partner
                  </p>
                </div>
                {pending > 0 && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ background: "var(--d-muted)", color: "var(--d-fg-muted)" }}
                  >
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {pending} pending
                  </span>
                )}
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--d-border)" }}>
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{
                    width: `${(progress / PARTNER_THRESHOLD) * 100}%`,
                    background: atThreshold
                      ? "linear-gradient(90deg, #34d399, #4cd964)"
                      : "linear-gradient(90deg, #ff7a4a, #F05A28)",
                    boxShadow: atThreshold ? "0 0 12px rgba(76,217,100,0.35)" : "0 0 12px rgba(240,90,40,0.2)",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t px-5 py-5 sm:px-6" style={{ borderColor: "var(--d-border)" }}>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--d-fg-muted)" }}>
                Your share link
              </p>
              {shareData ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input readOnly value={shareLink} className="d-field-mono min-w-0 flex-1 truncate" />
                  <button
                    type="button"
                    onClick={copyShareLink}
                    className={
                      shareLinkCopied
                        ? "d-btn-outline-success flex shrink-0 items-center justify-center gap-1.5 sm:w-auto sm:min-w-[7.5rem]"
                        : "d-cta d-cta-md flex shrink-0 items-center justify-center gap-1.5 sm:w-auto sm:min-w-[7.5rem]"
                    }
                  >
                    {shareLinkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {shareLinkCopied ? "Copied" : "Copy"}
                  </button>
                </div>
              ) : (
                <button type="button" onClick={generateShareToken} className="d-cta d-cta-md w-full">
                  Get my share link
                </button>
              )}
            </div>

            {atThreshold && (
              <div
                className="flex items-start gap-3 rounded-xl border p-3.5 text-sm leading-snug"
                style={{
                  background: "rgba(76,217,100,0.07)",
                  borderColor: "rgba(76,217,100,0.22)",
                  color: "var(--d-fg)",
                }}
              >
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#2d8f47" }} />
                <span>
                  <span className="font-semibold" style={{ color: "#2d8f47" }}>
                    Ready for cash earnings.
                  </span>{" "}
                  Activate Partner mode to unlock commissions on every sale.
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Partner program card */}
        <Card className="d-card-hero overflow-hidden border-[var(--d-border-strong)]">
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
          <div className="d-surface-stats grid grid-cols-3 divide-x border-t" style={{ borderColor: "var(--d-border)" }}>
            {[
              { value: "30–40%", label: "Commission rate" },
              { value: "$0",     label: "Minimum payout" },
              { value: "Lifetime", label: "Cookie duration" },
            ].map(({ value, label }) => (
              <div key={label} className="min-w-0 px-2 py-4 text-center sm:p-5">
                <div className="mb-0.5 text-lg font-bold tabular-nums sm:text-2xl" style={{ color: "var(--d-primary)" }}>
                  {value}
                </div>
                <p className="text-[10px] leading-tight sm:text-xs" style={{ color: "var(--d-fg-muted)" }}>
                  {label}
                </p>
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
            <Card key={step} className="d-card-quiet border-[var(--d-border-strong)] p-3 sm:p-4">
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm" style={{ background: "linear-gradient(135deg, #ff7a4a, #f05a28)" }}>{step}</div>
              <p className="mb-0.5 text-sm font-bold" style={{ color: "var(--d-fg)" }}>{title}</p>
              <p className="text-[11px] leading-snug sm:text-xs" style={{ color: "var(--d-fg-muted)" }}>{desc}</p>
            </Card>
          ))}
        </div>
        {/* Scan Credits — non-partner */}
        {creditBalance !== null && creditBalance.total > 0 && (
          <Card className="d-card-quiet border-[var(--d-border-strong)] p-5">
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
    <div className="d-animate-in mx-auto max-w-3xl space-y-5">
      <div className="d-hero-intro">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="font-bebas text-2xl tracking-wide text-[var(--d-fg)]">Partner dashboard</p>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
              Track earnings, copy your payout link, and use scan credits at checkout.
            </p>
          </div>
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center self-center rounded-2xl shadow-md sm:self-start"
            style={{
              background: "linear-gradient(145deg, rgba(240,90,40,0.12), rgba(76,217,100,0.14))",
            }}
          >
            <TrendingUp className="h-8 w-8" style={{ color: "var(--d-primary)" }} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { icon: DollarSign, label: "Total earned",    value: stats ? fmt(stats.totalEarned)    : "—", color: "#F05A28", bg: "rgba(240,90,40,0.1)" },
          { icon: TrendingUp, label: "Pending payout",  value: stats ? fmt(stats.pendingPayout)  : "—", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
          { icon: Users,      label: "Conversions",     value: stats ? String(stats.conversions) : "—", color: "var(--d-fg-muted)", bg: "var(--d-muted)" },
          { icon: Gift,       label: "Commission rate", value: (affiliate.commission_rate && affiliate.commission_rate !== 0.3) ? `${Math.round(affiliate.commission_rate * 100)}%` : "30–40%", color: "var(--d-fg-muted)", bg: "var(--d-muted)" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label} className="d-card-quiet border-[var(--d-border-strong)] p-4">
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

      <Card className="d-card-hero border-[var(--d-border-strong)] p-5">
        <h3 className="mb-1 font-bold" style={{ color: "var(--d-fg)" }}>Your referral link</h3>
        <p className="mb-4 text-xs" style={{ color: "var(--d-fg-muted)" }}>
          Copy and share anywhere you talk to authors — social, email, or your site.
        </p>
        {affiliate.ls_affiliate_code ? (
          <>
            <p className="mb-2 text-xs font-semibold" style={{ color: "#059669" }}>
              Payout link — share this URL to earn commissions
            </p>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                readOnly
                value={`https://manu2print.lemonsqueezy.com/?aff=${affiliate.ls_affiliate_code}`}
                className="d-field-mono min-w-0 flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`https://manu2print.lemonsqueezy.com/?aff=${affiliate.ls_affiliate_code}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={
                  copied
                    ? "d-btn-outline-success flex shrink-0 items-center justify-center gap-2 sm:min-w-[7.5rem]"
                    : "d-btn-outline flex shrink-0 items-center justify-center gap-2 sm:min-w-[7.5rem]"
                }
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mb-0 text-xs leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
              30% on $9 singles · 40% on packs. Lemon Squeezy pays you automatically at $25.
            </p>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
              Haven&apos;t been paid before? In Lemon Squeezy, open{" "}
              <strong style={{ color: "var(--d-fg)" }}>Settings → Payouts</strong> and connect bank or PayPal so they can
              send your commissions.
            </p>
          </>
        ) : (
          <>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input readOnly value={referralLink} className="d-field-mono min-w-0 flex-1" />
              <button
                type="button"
                onClick={copyLink}
                className={
                  copied
                    ? "d-btn-outline-success flex shrink-0 items-center justify-center gap-2 sm:min-w-[7.5rem]"
                    : "d-btn-outline flex shrink-0 items-center justify-center gap-2 sm:min-w-[7.5rem]"
                }
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div
              className="rounded-xl border p-4 sm:p-5"
              style={{
                borderColor: "rgba(240, 90, 40, 0.22)",
                background: "linear-gradient(180deg, rgba(255,248,244,0.98) 0%, rgba(254,240,235,0.5) 100%)",
              }}
            >
              <p className="text-sm font-bold" style={{ color: "var(--d-fg)" }}>
                Your commission checkout link is still connecting
              </p>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
                <strong style={{ color: "var(--d-fg)" }}>Why Lemon Squeezy?</strong> We use them to run checkout and pay
                your affiliate commissions. You need a free Lemon Squeezy account with a payout method (bank or PayPal) so
                they can send you money — manu2print never holds your commission.
              </p>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
                <strong style={{ color: "var(--d-fg)" }}>What to do:</strong> Watch for an email from Lemon Squeezy to
                finish affiliate setup. No account yet? Create one with the same email you use here, then add payout
                details under account settings.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <a
                  href="https://app.lemonsqueezy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="d-cta d-cta-md inline-flex items-center justify-center gap-2"
                >
                  Open Lemon Squeezy
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a
                  href="mailto:hello@manu2print.com?subject=Partner%20payout%20link%20setup"
                  className="d-btn-outline inline-flex items-center justify-center gap-2"
                >
                  Email support
                </a>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Scan Credits */}
      {creditBalance !== null && (
        <Card className="d-card-quiet border-[var(--d-border-strong)] p-5">
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

      <Card className="d-card-quiet border-[var(--d-border-strong)] p-5">
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
        <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: "var(--d-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--d-fg-muted)" }}>
            How you get paid
          </p>
          <ul className="list-disc space-y-2 pl-4 text-xs leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
            <li>
              Lemon Squeezy processes customer payments and sends your share when you reach the{" "}
              <strong style={{ color: "var(--d-fg)" }}>$25 minimum</strong>. You must have a payout method on file with
              them (bank or PayPal).
            </li>
            <li>
              <strong style={{ color: "var(--d-fg)" }}>New to Lemon Squeezy?</strong> Sign up free, use the same email as
              your manu2print account if possible, then open{" "}
              <strong style={{ color: "var(--d-fg)" }}>Settings → Payouts</strong> and connect how you want to be paid.
            </li>
            <li>
              <strong style={{ color: "var(--d-fg)" }}>Already use Lemon Squeezy?</strong> Log in and confirm payouts
              aren&apos;t paused and your details are current.
            </li>
          </ul>
          <a
            href="https://app.lemonsqueezy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="d-cta d-cta-md inline-flex w-full items-center justify-center gap-2 sm:w-auto"
          >
            Open Lemon Squeezy dashboard
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </Card>
    </div>
  );
}
