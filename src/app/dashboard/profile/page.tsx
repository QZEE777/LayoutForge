"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
      if (!user) { router.replace("/auth"); return; }
      setUser(user);
      client.from("profiles").select("id, email, first_name").eq("id", user.id).single()
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
    const { error } = await client.from("profiles").update({ first_name: firstName.trim() || null }).eq("id", user.id);
    setSaving(false);
    if (error) { setMessage({ type: "err", text: "Could not save. Try again." }); return; }
    setProfile((p) => (p ? { ...p, first_name: firstName.trim() || null } : null));
    setMessage({ type: "ok", text: "Saved." });
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F0E8" }}>
        <div className="w-8 h-8 rounded-full border-4 animate-spin"
          style={{ borderColor: "rgba(240,90,40,0.15)", borderTopColor: "#f05a28" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F0E8" }}>
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b" style={{ background: "#F5F0E8", borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/MANNY AVATAR.png" alt="manu2print" width={32} height={32} className="rounded-full" />
            <span>
              <span style={{ color: "#F05A28", fontWeight: "bold", fontSize: "1.15rem" }}>manu</span>
              <span style={{ color: "#4cd964", fontWeight: "bold", fontSize: "1.15rem" }}>2print</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: "#6B5E4E" }}>Dashboard</Link>
            <span className="rounded-lg px-3 py-2 text-sm font-bold" style={{ color: "#2C1810" }}>Profile</span>
            <button type="button"
              onClick={async () => { const c = createClient(); await c.auth.signOut(); router.replace("/auth"); }}
              className="rounded-lg px-3 py-2 text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ color: "#6B5E4E" }}>
              Log out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        {/* Page header */}
        <div className="flex items-center gap-4 mb-10">
          <Image src="/MANNY AVATAR.png" alt="manu2print" width={56} height={56} className="rounded-full shrink-0" />
          <div>
            <h1 className="text-2xl font-black" style={{ color: "#2C1810", letterSpacing: "-0.02em" }}>
              Account Settings
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#9B8E7E" }}>{user.email}</p>
          </div>
        </div>

        {/* Profile card */}
        <div className="rounded-2xl border p-6 mb-5" style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: "#9B8E7E" }}>Profile</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium mb-1.5" style={{ color: "#2C1810" }}>
                First name
              </label>
              <input
                id="first_name"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#1A1208", background: "#FAF7EE" }}
              />
              <p className="text-xs mt-1.5" style={{ color: "#9B8E7E" }}>Used in emails to make them feel personal.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#2C1810" }}>Email</label>
              <p className="text-sm px-4 py-3 rounded-xl" style={{ color: "#6B5E4E", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
                {profile?.email ?? user.email ?? "—"}
              </p>
              <p className="text-xs mt-1.5" style={{ color: "#9B8E7E" }}>Set at sign-in. Cannot be changed here.</p>
            </div>
            {message && (
              <p className="text-sm font-medium" style={{ color: message.type === "ok" ? "#2d8a3e" : "#DC2626" }}>
                {message.text}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl px-6 py-2.5 text-sm font-bold transition-opacity disabled:opacity-50 hover:opacity-90"
              style={{ background: "#f05a28", color: "#fff" }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>

        {/* Quick links */}
        <div className="rounded-2xl border p-6" style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "#9B8E7E" }}>Quick Links</h2>
          <div className="space-y-2">
            <Link href="/my-orders"
              className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ background: "#FAF7EE", color: "#2C1810", border: "1px solid rgba(0,0,0,0.07)" }}>
              <span>Purchase history</span>
              <span style={{ color: "#9B8E7E" }}>→</span>
            </Link>
            <Link href="/partners"
              className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ background: "#FAF7EE", color: "#2C1810", border: "1px solid rgba(0,0,0,0.07)" }}>
              <span>Partner program — earn 30–40%</span>
              <span style={{ color: "#9B8E7E" }}>→</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
