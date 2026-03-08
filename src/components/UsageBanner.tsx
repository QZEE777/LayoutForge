"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BRAVE = "#FB542B";
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
      className="border-b border-brave/30 px-4 py-2 text-sm bg-amazon-navy text-white"
    >
      <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-2">
        {usage.is_founder ? (
          <span
            className="font-medium text-emerald-400"
          >
            Founder — FREE Access
          </span>
        ) : atLimit ? (
          <>
            <span className="text-emerald-400">FREE limit reached.</span>
            <Link
              href="/dashboard"
              className="rounded px-3 py-1 font-medium bg-brave text-white hover:opacity-90 transition-opacity"
            >
              Upgrade
            </Link>
          </>
        ) : (
          <>
            <span className="text-white/80">
              {(usage.uses_remaining ?? FREE_LIMIT - usage.usage_count)} of {FREE_LIMIT} free uses remaining
            </span>
            <div className="w-32 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full transition-all bg-brave"
                style={{
                  width: `${Math.min(100, (usage.usage_count / FREE_LIMIT) * 100)}%`,
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
