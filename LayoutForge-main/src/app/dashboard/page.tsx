"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { PLATFORMS, getToolsForPlatform, type Tool } from "@/data/platformTools";

const GOLD = "#F5A623";
const WARM_WHITE = "#FAF7F2";
const CARD_BG = "#1A1612";
const CARD_BORDER = "#2A2420";
const FREE_GREEN = "#22c55e";

const kdp = PLATFORMS.find((p) => p.id === "kdp");
const ALL_TOOLS: Tool[] = kdp ? getToolsForPlatform(kdp.toolIds) : [];
const FREE_TOOLS = ALL_TOOLS.filter((t) => t.free);
const PAID_TOOLS = ALL_TOOLS.filter((t) => !t.free);

type Usage = {
  usage_count: number;
  is_founder: boolean;
  uses_remaining: number | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      setUser(user);
      fetch("/api/track-usage", { method: "GET", credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data)
            setUsage({
              usage_count: data.usage_count,
              is_founder: !!data.is_founder,
              uses_remaining: data.uses_remaining ?? null,
            });
        })
        .finally(() => setLoading(false));
    });
  }, [router]);

  if (loading || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0F0D0B" }}
      >
        <p style={{ color: "#a8a29e" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#0F0D0B" }}
    >
      <header
        className="border-b sticky top-0 z-10 backdrop-blur-sm"
        style={{ borderColor: CARD_BORDER, backgroundColor: "rgba(15,13,11,0.9)" }}
      >
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: GOLD }}
            >
              <svg className="w-4 h-4" fill="none" stroke="#0F0D0B" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <path d="M8 7h8" />
                <path d="M8 11h8" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: WARM_WHITE }}>
              manu2print
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ color: "#a8a29e" }}
            >
              Home
            </Link>
            <Link
              href="/dashboard/profile"
              className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ color: "#a8a29e" }}
            >
              Profile
            </Link>
            <button
              type="button"
              onClick={async () => {
                const client = createClient();
                await client.auth.signOut();
                router.replace("/auth");
              }}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ color: "#a8a29e" }}
            >
              Log out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1" style={{ color: WARM_WHITE }}>
            Dashboard
          </h1>
          <p className="text-sm" style={{ color: "#a8a29e" }}>
            Welcome back. Your tools and usage in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div
            className="rounded-xl border-l-4 border p-6"
            style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER, borderLeftColor: GOLD }}
          >
            <h2 className="font-semibold mb-4" style={{ color: WARM_WHITE }}>
              Account
            </h2>
            <p className="text-sm mb-1" style={{ color: "#a8a29e" }}>Email</p>
            <p className="font-medium truncate mb-3" style={{ color: WARM_WHITE }}>{user.email}</p>
            <Link
              href="/dashboard/profile"
              className="text-sm font-medium transition-opacity hover:opacity-90"
              style={{ color: GOLD }}
            >
              Edit profile (e.g. first name)
            </Link>
            {usage?.is_founder && (
              <span
                className="inline-flex items-center mt-3 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ backgroundColor: "rgba(245,166,35,0.2)", color: GOLD }}
              >
                Founder — Free Access
              </span>
            )}
          </div>
          <div
            className="rounded-xl border-l-4 border p-6"
            style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER, borderLeftColor: GOLD }}
          >
            <h2 className="font-semibold mb-4" style={{ color: WARM_WHITE }}>
              Usage
            </h2>
            <p className="text-sm mb-1" style={{ color: "#a8a29e" }}>Free uses this period</p>
            <p className="text-2xl font-bold" style={{ color: WARM_WHITE }}>
              {usage?.usage_count ?? 0}
              {usage?.is_founder ? "" : " / 10"}
            </p>
            {usage && !usage.is_founder && usage.uses_remaining !== null && (
              <p className="text-sm mt-1" style={{ color: "#a8a29e" }}>
                {usage.uses_remaining} remaining
              </p>
            )}
          </div>
        </div>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-1" style={{ color: WARM_WHITE }}>
            Free tools
          </h2>
          <p className="text-sm mb-4" style={{ color: "#a8a29e" }}>
            No sign-in or payment required.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FREE_TOOLS.map((t) => (
              <li key={t.id}>
                <Link
                  href={t.href}
                  className="flex items-center justify-between gap-2 rounded-xl border px-4 py-3.5 text-sm font-medium transition-all hover:border-[#22c55e] hover:bg-[#22c55e]/10"
                  style={{ borderColor: CARD_BORDER, color: WARM_WHITE }}
                >
                  <span>{t.title}</span>
                  <span
                    className="shrink-0 rounded px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: "rgba(34,197,94,0.2)", color: FREE_GREEN }}
                  >
                    Free
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1" style={{ color: WARM_WHITE }}>
            Paid tools
          </h2>
          <p className="text-sm mb-4" style={{ color: "#a8a29e" }}>
            Pay per use or unlock with a 6‑month pass.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PAID_TOOLS.map((t) => (
              <li key={t.id}>
                <Link
                  href={t.href}
                  className="block rounded-xl border px-4 py-3.5 text-sm font-medium transition-all hover:border-[#F5A623] hover:bg-[#F5A623]/10"
                  style={{ borderColor: CARD_BORDER, color: WARM_WHITE }}
                >
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
