"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Gift, DollarSign, Users, TrendingUp, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface Affiliate {
  id: string;
  name: string | null;
  code: string;
  status: string;
  commission_rate: number | null;
  paypal_email: string | null;
  wise_email: string | null;
  email: string;
}

interface AffiliateStats {
  clicks: number;
  conversions: number;
  totalEarned: number;
  totalPaid: number;
  pendingPayout: number;
}

interface Props {
  affiliate: Affiliate | null;
  stats: AffiliateStats | null;
}

const APP_URL = "https://www.manu2print.com";

function fmt(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

export function EarnPanel({ affiliate, stats }: Props) {
  const [copied, setCopied] = useState(false);
  const referralLink = affiliate ? `${APP_URL}/kdp-pdf-checker?ref=${affiliate.code}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!affiliate) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <Card className="overflow-hidden">
          <div className="p-8 lg:p-10 text-center" style={{ background: "linear-gradient(135deg, rgba(240,90,40,0.06), rgba(76,217,100,0.06))" }}>
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(240,90,40,0.1)" }}>
              <Gift className="w-7 h-7" style={{ color: "#F05A28" }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--d-fg)" }}>Earn 30–40% Commission</h2>
            <p className="text-sm leading-relaxed mb-6 max-w-sm mx-auto" style={{ color: "var(--d-fg-muted)" }}>
              Share manu2print with fellow indie authors and earn on every scan they purchase. No minimums, no waitlist.
            </p>
            <Link href="/partners/apply"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white"
              style={{ background: "#F05A28" }}>
              Become a Partner
              <ExternalLink className="w-4 h-4" />
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

        <div className="grid grid-cols-3 gap-3">
          {[
            { step: 1, title: "Apply",    desc: "Join in under 2 minutes" },
            { step: 2, title: "Share",    desc: "Use your unique referral link" },
            { step: 3, title: "Get paid", desc: "Monthly via PayPal or Wise" },
          ].map(({ step, title, desc }) => (
            <Card key={step} className="p-4">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white mb-2" style={{ background: "#F05A28" }}>{step}</div>
              <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--d-fg)" }}>{title}</p>
              <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>{desc}</p>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: "Total Earned",    value: stats ? fmt(stats.totalEarned)    : "—", color: "#F05A28", bg: "rgba(240,90,40,0.1)" },
          { icon: TrendingUp, label: "Pending Payout",  value: stats ? fmt(stats.pendingPayout)  : "—", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
          { icon: Users,      label: "Conversions",     value: stats ? String(stats.conversions) : "—", color: "var(--d-fg-muted)", bg: "var(--d-muted)" },
          { icon: Gift,       label: "Commission Rate", value: affiliate.commission_rate ? `${affiliate.commission_rate}%` : "30–40%", color: "var(--d-fg-muted)", bg: "var(--d-muted)" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label} className="p-4">
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

      <Card className="p-5">
        <h3 className="font-semibold mb-3" style={{ color: "var(--d-fg)" }}>Your Referral Link</h3>
        <div className="flex gap-2">
          <Input value={referralLink} readOnly className="font-mono text-sm" />
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold border transition-all shrink-0"
            style={{ borderColor: "var(--d-border)", color: copied ? "#10b981" : "var(--d-fg)", background: "var(--d-card)" }}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--d-fg-muted)" }}>
          Earn 30% on $9 singles · 40% on packs. Tracked automatically.
        </p>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold mb-4" style={{ color: "var(--d-fg)" }}>Payout Details</h3>
        <div className="space-y-3 text-sm">
          {[
            { label: "Status",    value: affiliate.status === "active" ? "✓ Active" : affiliate.status },
            { label: "PayPal",    value: affiliate.paypal_email ?? "—" },
            { label: "Wise",      value: affiliate.wise_email   ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <span style={{ color: "var(--d-fg-muted)" }}>{label}</span>
              <span className="font-medium" style={{ color: "var(--d-fg)" }}>{value}</span>
            </div>
          ))}
        </div>
        <p className="text-xs mt-4" style={{ color: "var(--d-fg-muted)" }}>
          Update payment details via the{" "}
          <Link href="/partners" className="underline" style={{ color: "#F05A28" }}>Partners portal</Link>.
          Payouts processed monthly when balance exceeds $20.
        </p>
      </Card>
    </div>
  );
}
