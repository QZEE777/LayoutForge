"use client";

import { useState } from "react";

export default function PlatformWaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/platform-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, platform: "ingram", source: "homepage" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong.");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-xl border border-[#2D6A2D]/40 bg-[#2D6A2D]/10 px-6 py-4 text-center">
        <p className="text-[#2D6A2D] font-semibold text-base">
          You&apos;re on the list. We&apos;ll be in touch.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="flex-1 rounded-xl border border-[#1A1208]/20 bg-white px-4 py-3 text-sm text-[#1A1208] placeholder-[#1A1208]/40 focus:outline-none focus:ring-2 focus:ring-[#F05A28]"
        disabled={status === "loading"}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-xl bg-[#F05A28] hover:bg-[#D94E20] text-white font-bold px-6 py-3 text-sm transition-colors disabled:opacity-60 whitespace-nowrap"
      >
        {status === "loading" ? "Joining…" : "Get Early Access"}
      </button>
      {status === "error" && (
        <p className="w-full text-center text-sm text-red-600 mt-1">{errorMsg}</p>
      )}
    </form>
  );
}
