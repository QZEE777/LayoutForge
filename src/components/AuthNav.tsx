"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

type NavTheme = "dark" | "light";

export default function AuthNav({ theme = "dark" }: { theme?: NavTheme }) {
  const isLight = theme === "light";
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className={`rounded-lg px-4 py-2 text-sm font-medium opacity-70 ${isLight ? "text-m2p-muted" : "text-m2p-ivory/90"}`}>
        …
      </div>
    );
  }

  if (user) {
    const email = user.email ?? "Signed in";
    const initial = email.slice(0, 1).toUpperCase();
    return (
      <div className="flex items-center gap-3">
        <span
          className={`hidden max-w-[160px] truncate text-sm sm:inline ${isLight ? "text-m2p-muted" : "text-m2p-ivory/70"}`}
          title={email}
        >
          {email}
        </span>
        <span
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
            isLight ? "bg-m2p-orange/20 text-m2p-orange" : "bg-m2p-orange/20 text-m2p-ivory"
          }`}
        >
          {initial}
        </span>
        <Link
          href="/dashboard"
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90 ${
            isLight ? "text-m2p-ink" : "text-m2p-ivory"
          }`}
        >
          Dashboard
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            isLight
              ? "border-m2p-border text-m2p-muted hover:bg-m2p-ivory-alt hover:text-m2p-ink"
              : "border-m2p-ivory/20 text-m2p-ivory/80 hover:bg-white/5"
          }`}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/auth"
        className={`rounded-lg px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90 ${
          isLight ? "text-m2p-ink" : "text-m2p-ivory"
        }`}
      >
        Sign In
      </Link>
      <Link
        href="/auth"
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:opacity-90 ${
          isLight ? "bg-m2p-orange text-white hover:bg-m2p-orange-hover" : "bg-m2p-orange text-white hover:bg-m2p-orange-hover"
        }`}
      >
        Get Started
      </Link>
    </div>
  );
}
