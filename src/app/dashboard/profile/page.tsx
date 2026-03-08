"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";


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
      Promise.resolve(
        client
          .from("profiles")
          .select("id, email, first_name")
          .eq("id", user.id)
          .single()
      )
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
        className="min-h-screen flex items-center justify-center bg-ivory"
      >
        <p className="text-soft-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-soft-border sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-brave"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <path d="M8 7h8" />
                <path d="M8 11h8" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight" className="text-lg font-bold tracking-tight text-amazon-navy">
              manu2print
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              className="rounded-lg px-4 py-2 text-sm font-medium text-soft-muted hover:text-brave transition-colors"
            >
              Dashboard
            </Link>
            <span className="rounded-lg px-4 py-2 text-sm font-medium text-amazon-navy">
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
              className="rounded-lg px-4 py-2 text-sm font-medium text-soft-muted hover:text-brave transition-colors"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h1 className="font-bebas text-3xl tracking-wide text-amazon-navy mb-1">
            Profile
          </h1>
          <p className="text-sm text-soft-muted">
            We use your first name in emails so they feel personal.
          </p>
        </div>

        <div
className="rounded-xl border border-soft-border bg-white p-6 max-w-md"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium mb-1.5 text-soft-muted">
                First name
              </label>
              <input
                id="first_name"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full rounded-lg border border-soft-border px-4 py-2.5 text-sm bg-ivory text-amazon-navy focus:outline-none focus:ring-2 focus:ring-brave"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-soft-muted">
                Email
              </label>
              <p className="text-sm truncate text-amazon-navy">
                {profile?.email ?? user.email ?? "—"}
              </p>
              <p className="text-xs mt-1 text-soft-muted">
                Email is set when you sign in and can’t be changed here.
              </p>
            </div>
            {message && (
              <p
                className={`text-sm ${message.type === "ok" ? "text-freeGreen" : "text-red-500"}`}
              >
                {message.text}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg px-5 py-2.5 text-sm font-medium bg-brave text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
