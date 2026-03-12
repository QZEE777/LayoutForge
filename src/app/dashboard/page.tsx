"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { PLATFORMS, getToolsForPlatform, type Tool } from "@/data/platformTools";

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
      <div className="min-h-screen flex items-center justify-center bg-m2p-ivory">
        <p className="text-m2p-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-m2p-ivory">
      <header className="border-b border-m2p-border sticky top-0 z-10 bg-m2p-ivory backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-m2p-orange">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <path d="M8 7h8" />
                <path d="M8 11h8" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-m2p-ink">
              manu2print
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/" className="rounded-lg px-4 py-2 text-sm font-medium text-m2p-muted hover:text-brave transition-colors">
              Home
            </Link>
            <Link href="/dashboard/profile" className="rounded-lg px-4 py-2 text-sm font-medium text-m2p-muted hover:text-brave transition-colors">
              Profile
            </Link>
            <button
              type="button"
              onClick={async () => {
                const client = createClient();
                await client.auth.signOut();
                router.replace("/auth");
              }}
              className="rounded-lg px-4 py-2 text-sm font-medium text-m2p-muted hover:text-brave transition-colors"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h1 className="font-bebas text-3xl tracking-wide text-m2p-ink mb-1">
            Dashboard
          </h1>
          <p className="text-sm text-m2p-muted">
            Welcome back. Your tools and usage in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="rounded-xl border-l-4 border-l-brave border border-m2p-border bg-white p-6">
            <h2 className="font-semibold mb-4 text-m2p-ink">
              Account
            </h2>
            <p className="text-sm mb-1 text-m2p-muted">Email</p>
            <p className="font-medium truncate mb-3 text-m2p-ink">{user.email}</p>
            <Link
              href="/dashboard/profile"
              className="text-sm font-medium text-brave hover:underline"
            >
              Edit profile (e.g. first name)
            </Link>
            {usage?.is_founder && (
              <span className="inline-flex items-center mt-3 rounded-full px-2.5 py-0.5 text-xs font-medium bg-freeGreen/20 text-freeGreen">
                Founder — FREE Access
              </span>
            )}
          </div>
          <div className="rounded-xl border-l-4 border-l-brave border border-m2p-border bg-white p-6">
            <h2 className="font-semibold mb-4 text-m2p-ink">
              Usage
            </h2>
            <p className="text-sm mb-1 text-m2p-muted">FREE uses this period</p>
            <p className="text-2xl font-bold text-m2p-ink">
              {usage?.usage_count ?? 0}
              {usage?.is_founder ? "" : " / 10"}
            </p>
            {usage && !usage.is_founder && usage.uses_remaining !== null && (
              <p className="text-sm mt-1 text-m2p-muted">
                {usage.uses_remaining} remaining
              </p>
            )}
          </div>
        </div>

        <section className="mb-10">
          <h2 className="font-bebas text-lg tracking-wide text-m2p-ink mb-1">
            FREE tools
          </h2>
          <p className="text-sm mb-4 text-m2p-muted">
            No sign-in or payment required.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FREE_TOOLS.map((t) => (
              <li key={t.id}>
                <Link
                  href={t.href}
                  className="flex items-center justify-between gap-2 rounded-xl border border-m2p-border px-4 py-3.5 text-sm font-medium text-m2p-ink transition-all hover:border-freeGreen hover:bg-freeGreen/10"
                >
                  <span>{t.title}</span>
                  <span className="shrink-0 rounded px-2 py-0.5 text-xs font-bold uppercase text-freeGreen bg-freeGreen/20">
                    FREE
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-bebas text-lg tracking-wide text-m2p-ink mb-1">
            Paid tools
          </h2>
          <p className="text-sm mb-4 text-m2p-muted">
            Pay per use or unlock with a 6‑month pass.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PAID_TOOLS.map((t) => (
              <li key={t.id}>
                <Link
                  href={t.href}
                  className="block rounded-xl border border-m2p-border px-4 py-3.5 text-sm font-medium text-m2p-ink transition-all hover:border-brave hover:bg-m2p-orange/10"
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
