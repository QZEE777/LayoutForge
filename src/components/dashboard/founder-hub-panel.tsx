"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Crown, Gift, LifeBuoy, Sparkles, Copy, Check } from "lucide-react";

const SUPPORT_EMAIL = "hello@manu2print.com";

export function FounderHubPanel() {
  const [copied, setCopied] = useState(false);

  function copyEmail() {
    navigator.clipboard.writeText(SUPPORT_EMAIL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="d-animate-in mx-auto max-w-3xl space-y-5">
      <div className="d-hero-intro">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="font-bebas text-2xl tracking-wide text-[var(--d-fg)]">Founder Hub</p>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
              Founder status active. Use this area for founder support, campaign links, and giveaways.
            </p>
          </div>
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center self-center rounded-2xl shadow-md sm:self-start"
            style={{
              background: "linear-gradient(145deg, rgba(240,90,40,0.12), rgba(76,217,100,0.14))",
            }}
          >
            <Crown className="h-8 w-8" style={{ color: "var(--d-primary)" }} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Sparkles, title: "Lifetime access", detail: "Founder access is enabled on your account." },
          { icon: Gift, title: "Giveaway credits", detail: "Monthly giveaway rollout is in progress." },
          { icon: LifeBuoy, title: "Priority support", detail: "Use founder support for campaign/account help." },
        ].map(({ icon: Icon, title, detail }) => (
          <Card key={title} className="d-card-quiet border-[var(--d-border-strong)] p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--d-muted)" }}>
              <Icon className="h-5 w-5" style={{ color: "var(--d-primary)" }} />
            </div>
            <p className="text-sm font-bold" style={{ color: "var(--d-fg)" }}>{title}</p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>{detail}</p>
          </Card>
        ))}
      </div>

      <Card className="d-card-hero border-[var(--d-border-strong)] p-5">
        <p className="text-sm font-bold" style={{ color: "var(--d-fg)" }}>Founder support inbox</p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
          For founder campaigns, account support, or giveaway setup, contact the founder inbox.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button onClick={copyEmail} className="d-cta d-cta-md inline-flex items-center justify-center gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : SUPPORT_EMAIL}
          </button>
        </div>
      </Card>
    </div>
  );
}
