"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

const GOLD = "#F5A623";
const WARM_WHITE = "#FAF7F2";
const CARD_BG = "#1A1612";
const CARD_BORDER = "#2A2420";

const TOOL_LINKS = [
  { href: "/kdp-formatter", label: "KDP Formatter (DOCX)" },
  { href: "/keyword-research", label: "7 Keyword Research (DOCX)" },
  { href: "/description-generator", label: "Description Generator (DOCX)" },
  { href: "/pdf-compress", label: "PDF Compressor" },
  { href: "/kdp-formatter-pdf", label: "KDP Formatter (PDF)" },
  { href: "/keyword-research-pdf", label: "7 Keyword Research (PDF)" },
  { href: "/description-generator-pdf", label: "Description Generator (PDF)" },
];

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
              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: GOLD }}
            >
              <svg className="w-4 h-4" fill="none" stroke="#0F0D0B" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: WARM_WHITE }}>
              <span className="font-serif">Scribe</span>
              <span className="font-sans">Stack</span>
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ color: "#a8a29e" }}
          >
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-serif text-3xl font-bold mb-2" style={{ color: WARM_WHITE }}>
          Dashboard
        </h1>
        <p className="mb-8 text-sm" style={{ color: "#a8a29e" }}>
          Welcome back. Manage your usage and jump to any tool.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div
            className="rounded-xl border p-6"
            style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
          >
            <h2 className="font-semibold mb-4" style={{ color: WARM_WHITE }}>
              Account
            </h2>
            <p className="text-sm mb-1" style={{ color: "#a8a29e" }}>Email</p>
            <p className="font-medium truncate" style={{ color: WARM_WHITE }}>{user.email}</p>
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
            className="rounded-xl border p-6"
            style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
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

        <h2 className="font-semibold mb-4" style={{ color: WARM_WHITE }}>
          Tools
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TOOL_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="block rounded-lg border px-4 py-3 text-sm font-medium transition-colors hover:border-[#F5A623] hover:bg-white/5"
                style={{ borderColor: CARD_BORDER, color: WARM_WHITE }}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
