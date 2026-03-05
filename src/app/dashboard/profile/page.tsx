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

type ProfileRow = { id: string; email: string; first_name: string | null };

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      setUser(user);
      client
        .from("profiles")
        .select("id, email, first_name")
        .eq("id", user.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setProfile(data as ProfileRow);
            setFirstName((data as ProfileRow).first_name ?? "");
          }
        })
        .finally(() => setLoading(false));
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);
    const client = createClient();
    const { error } = await client
      .from("profiles")
      .update({ first_name: firstName.trim() || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      setMessage({ type: "err", text: "Could not save. Try again." });
      return;
    }
    setProfile((p) => (p ? { ...p, first_name: firstName.trim() || null } : null));
    setMessage({ type: "ok", text: "Saved." });
  }

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
    <div className="min-h-screen" style={{ backgroundColor: "#0F0D0B" }}>
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
              href="/dashboard"
              className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ color: "#a8a29e" }}
            >
              Dashboard
            </Link>
            <span className="rounded-lg px-4 py-2 text-sm font-medium" style={{ color: WARM_WHITE }}>
              Profile
            </span>
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
            Profile
          </h1>
          <p className="text-sm" style={{ color: "#a8a29e" }}>
            We use your first name in emails so they feel personal.
          </p>
        </div>

        <div
          className="rounded-xl border p-6 max-w-md"
          style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium mb-1.5" style={{ color: "#a8a29e" }}>
                First name
              </label>
              <input
                id="first_name"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full rounded-lg border px-4 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                style={{ borderColor: CARD_BORDER, color: WARM_WHITE }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#a8a29e" }}>
                Email
              </label>
              <p className="text-sm truncate" style={{ color: WARM_WHITE }}>
                {profile?.email ?? user.email ?? "—"}
              </p>
              <p className="text-xs mt-1" style={{ color: "#78716c" }}>
                Email is set when you sign in and can’t be changed here.
              </p>
            </div>
            {message && (
              <p
                className="text-sm"
                style={{ color: message.type === "ok" ? "#22c55e" : "#ef4444" }}
              >
                {message.text}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-60 transition-opacity"
              style={{ backgroundColor: GOLD, color: "#0F0D0B" }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
