"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

const GOLD = "#F5A623";
const WARM_WHITE = "#FAF7F2";

type NavTheme = "dark" | "light";

export default function AuthNav({ theme = "dark" }: { theme?: NavTheme }) {
  const isLight = theme === "light";
  const textColor = isLight ? "text-amazon-navy" : "";
  const muteColor = isLight ? "text-soft-muted" : "";
  const linkStyle = isLight ? undefined : { color: WARM_WHITE };
  const btnStyle = isLight ? undefined : { backgroundColor: GOLD, color: "#0F0D0B" };
  const borderStyleInline = isLight ? undefined : { borderColor: "#2A2420", color: "#a8a29e" };
  const avatarBg = isLight ? "bg-burnt/20 text-burnt" : "";
  const avatarStyle = isLight ? undefined : { backgroundColor: "rgba(245,166,35,0.25)", color: GOLD };
  const loadingStyle = isLight ? undefined : { color: WARM_WHITE };
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
      <div
        className={`rounded-lg px-4 py-2 text-sm font-medium opacity-70 ${isLight ? "text-soft-muted" : ""}`}
        style={loadingStyle}
      >
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
          className={`hidden sm:inline text-sm truncate max-w-[160px] ${muteColor}`}
          style={isLight ? undefined : { color: "#a8a29e" }}
          title={email}
        >
          {email}
        </span>
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${avatarBg}`}
          style={avatarStyle}
        >
          {initial}
        </span>
        <Link
          href="/dashboard"
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90 ${textColor}`}
          style={linkStyle}
        >
          Dashboard
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${isLight ? "hover:bg-soft-white border-amazon-navy/20 text-amazon-navy" : "hover:bg-white/5"} ${muteColor}`}
          style={borderStyleInline}
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
        className={`rounded-lg px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90 ${textColor}`}
        style={linkStyle}
      >
        Sign In
      </Link>
      <Link
        href="/auth"
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:opacity-90 ${isLight ? "bg-burnt text-white hover:bg-burnt/90" : ""}`}
        style={btnStyle}
      >
        Get Started
      </Link>
    </div>
  );
}
