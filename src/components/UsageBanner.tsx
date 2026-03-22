"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Promo bar message — swap this for future campaigns without touching the component
const PROMO_MESSAGE = "KDP rejected your PDF? Check it before you upload — $9";
const PROMO_LINK = "/kdp-pdf-checker";

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
    <Link
      href={PROMO_LINK}
      className="block w-full bg-m2p-ink border-b border-m2p-orange/20 px-4 py-2.5 cursor-pointer group transition-colors hover:bg-[#1f1a0f]"
    >
      <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {usage.is_founder ? (
          /* Founder state — promo bar, not status label */
          <span className="text-sm font-medium text-center transition-colors" style={{ color: "#a8d5a2" }}>
            {PROMO_MESSAGE}
            <span className="ml-2 font-bold group-hover:translate-x-0.5 inline-block transition-all" style={{ color: "#F05A28" }}>
              →
            </span>
          </span>
        ) : atLimit ? (
          /* At limit state */
          <span className="text-sm font-medium text-center transition-colors" style={{ color: "#a8d5a2" }}>
            {PROMO_MESSAGE}
            <span className="ml-2 font-bold group-hover:translate-x-0.5 inline-block transition-all" style={{ color: "#F05A28" }}>
              →
            </span>
          </span>
        ) : (
          /* Free uses remaining state */
          <span className="text-sm font-medium text-center transition-colors" style={{ color: "#a8d5a2" }}>
            {PROMO_MESSAGE}
            <span className="ml-2 font-bold group-hover:translate-x-0.5 inline-block transition-all" style={{ color: "#F05A28" }}>
              →
            </span>
          </span>
        )}
      </div>
    </Link>
  );
}
