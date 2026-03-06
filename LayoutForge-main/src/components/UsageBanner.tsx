"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const GOLD = "#F5A623";
const FREE_LIMIT = 10;

type Usage = {
  usage_count: number;
  is_founder: boolean;
  uses_remaining: number | null;
};

export default function UsageBanner() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/track-usage", { method: "GET", credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.usage_count === "number") {
          setUsage({
            usage_count: data.usage_count,
            is_founder: !!data.is_founder,
            uses_remaining: data.uses_remaining ?? null,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || usage === null) return null;

  const paywallActive = process.env.NEXT_PUBLIC_PAYWALL_ACTIVE === "true";
  const atLimit =
    !usage.is_founder &&
    paywallActive &&
    usage.usage_count >= FREE_LIMIT;

  return (
    <div
      className="border-b px-4 py-2 text-sm"
      style={{
        borderColor: "#2A2420",
        backgroundColor: "rgba(26,22,18,0.95)",
        color: "#FAF7F2",
      }}
    >
      <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-2">
        {usage.is_founder ? (
          <span
            className="font-medium"
            style={{ color: "rgba(245,166,35,0.95)" }}
          >
            Founder — Free Access
          </span>
        ) : atLimit ? (
          <>
            <span className="text-amber-300/90">Free limit reached.</span>
            <Link
              href="/dashboard"
              className="rounded px-3 py-1 font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: GOLD, color: "#0F0D0B" }}
            >
              Upgrade
            </Link>
          </>
        ) : (
          <>
            <span style={{ color: "#a8a29e" }}>
              {(usage.uses_remaining ?? FREE_LIMIT - usage.usage_count)} of {FREE_LIMIT} free uses remaining
            </span>
            <div className="w-32 h-1.5 rounded-full bg-[#2A2420] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (usage.usage_count / FREE_LIMIT) * 100)}%`,
                  backgroundColor: GOLD,
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
