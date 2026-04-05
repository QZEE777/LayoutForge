"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BrandWordmark } from "@/components/BrandWordmark";
import { createClient } from "@/lib/supabaseClient";

export default function AffiliateApplyPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", website: "", reason: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "existing" | "error">("idle");
  const [error, setError] = useState("");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  // Detect Supabase session on load
  useEffect(() => {
    (async () => {
      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user?.email) return;

      const email = user.email.trim().toLowerCase();
      setSessionEmail(email);
      setForm((f) => ({ ...f, email }));

      // Check if already an approved affiliate — if so, send straight to dashboard
      const res = await fetch("/api/affiliates/me");
      if (res.ok) {
        const d = await res.json();
        if (d.affiliate?.status === "active") {
          router.replace("/dashboard?tab=earn");
        }
      }
    })();
  }, [router]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("loading");
    try {
      const res = await fetch("/api/affiliates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStatus("error");
      } else if (data.existing) {
        if (sessionEmail) {
          router.replace("/dashboard?tab=earn");
          return;
        }
        setStatus("existing");
      } else {
        setStatus("done");
      }
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAF7EE" }}>
      {/* Nav */}
      <header style={{ borderBottom: "1px solid #E0D8C4", background: "#fff" }}>
        <div className="mx-auto max-w-4xl px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <Link href="/" className="flex items-center gap-3 shrink-0 min-w-0">
            <Image src="/MANNY AVATAR.png" alt="manu2print" width={100} height={100} className="rounded-full shrink-0" />
            <BrandWordmark variant="onLight" className="text-xl" />
          </Link>
          {sessionEmail ? (
            <Link href="/dashboard?tab=earn" className="text-xs transition-colors" style={{ color: "#6B6151" }}>
              ← Back to dashboard
            </Link>
          ) : (
            <Link href="/partners?signin=1" className="text-xs transition-colors" style={{ color: "#6B6151" }}>
              Already a partner? Sign in →
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">

          {status === "done" ? (
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h1 className="font-bebas text-4xl mb-3 tracking-wide" style={{ color: "#1A1208" }}>Application received!</h1>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#6B6151" }}>
                We&apos;ll review your application and send your unique referral link to{" "}
                <strong style={{ color: "#1A1208" }}>{form.email}</strong> within 48 hours.
              </p>
              <p className="text-xs mb-8" style={{ color: "#9B9181" }}>
                Questions? Email us at <span style={{ color: "#6B6151" }}>hello@manu2print.com</span>
              </p>
              <Link href="/" className="inline-block text-sm underline" style={{ color: "#9B9181" }}>
                ← Back to home
              </Link>
            </div>
          ) : status === "existing" ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📋</div>
              <h1 className="font-bebas text-4xl mb-3 tracking-wide" style={{ color: "#1A1208" }}>Already applied</h1>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#6B6151" }}>
                We already have an application from{" "}
                <strong style={{ color: "#1A1208" }}>{form.email}</strong>.
                If you&apos;ve been approved, you can view your dashboard below.
              </p>
              <Link
                href={`/partners?email=${encodeURIComponent(form.email)}`}
                className="inline-block text-white font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity mb-4"
                style={{ background: "#F05A28" }}
              >
                Go to my dashboard →
              </Link>
              <br />
              <Link href="/" className="inline-block text-sm underline mt-4" style={{ color: "#9B9181" }}>
                ← Back to home
              </Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div
                  className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-wide uppercase"
                  style={{ background: "rgba(76,217,100,0.12)", color: "#22a843" }}
                >
                  Partner Program
                </div>
                <h1 className="font-bebas text-5xl mb-3 tracking-wide" style={{ color: "#1A1208" }}>
                  EARN UP TO 40%
                </h1>
                <p className="text-sm leading-relaxed" style={{ color: "#6B6151" }}>
                  Refer KDP authors to manu2print and earn 40% on every pack sale.
                  <span className="block mt-1" style={{ color: "#9B9181" }}>Up to $31.60 per sale. 12-month cookie. No cap.</span>
                </p>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { label: "Commission", value: "40%" },
                  { label: "Top pack", value: "$31.60" },
                  { label: "Cookie", value: "12 months" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl p-3 text-center"
                    style={{ background: "#fff", border: "1px solid #E0D8C4" }}
                  >
                    <p className="font-bebas text-2xl" style={{ color: "#F05A28" }}>{s.value}</p>
                    <p className="text-xs" style={{ color: "#9B9181" }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Form */}
              <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #E0D8C4" }}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B6151" }}>Full name *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder="Jane Smith"
                        required
                        className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                        style={{
                          background: "#FAF7EE",
                          border: "1px solid #E0D8C4",
                          color: "#1A1208",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B6151" }}>
                        Email address *
                        {sessionEmail && <span className="ml-1.5 text-xs" style={{ color: "#22a843" }}>✓ from your account</span>}
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => !sessionEmail && set("email", e.target.value)}
                        placeholder="jane@example.com"
                        required
                        readOnly={!!sessionEmail}
                        className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                        style={{
                          background: "#FAF7EE",
                          border: "1px solid #E0D8C4",
                          color: "#1A1208",
                          opacity: sessionEmail ? 0.7 : 1,
                          cursor: sessionEmail ? "default" : "text",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B6151" }}>
                      Website / Social / YouTube <span style={{ color: "#9B9181" }}>(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.website}
                      onChange={(e) => set("website", e.target.value)}
                      placeholder="https://yourblog.com or @yourhandle"
                      className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                      style={{ background: "#FAF7EE", border: "1px solid #E0D8C4", color: "#1A1208" }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B6151" }}>
                      How will you promote manu2print? <span style={{ color: "#9B9181" }}>(optional)</span>
                    </label>
                    <textarea
                      value={form.reason}
                      onChange={(e) => set("reason", e.target.value)}
                      placeholder="e.g. I run a KDP author community of 5,000 members..."
                      rows={3}
                      className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
                      style={{ background: "#FAF7EE", border: "1px solid #E0D8C4", color: "#1A1208" }}
                    />
                  </div>

                  {error && <p className="text-xs" style={{ color: "#dc2626" }}>{error}</p>}

                  <button
                    type="submit"
                    disabled={status === "loading" || !form.name || !form.email}
                    className="w-full text-white font-bold py-3 rounded-xl transition-opacity text-sm"
                    style={{ background: "#F05A28", opacity: (status === "loading" || !form.name || !form.email) ? 0.5 : 1 }}
                  >
                    {status === "loading" ? "Submitting…" : "Apply to join →"}
                  </button>

                  <p className="text-xs text-center" style={{ color: "#9B9181" }}>
                    Free to join. We review all applications within 48 hours.
                  </p>
                </form>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
