"use client";

import { useState } from "react";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";

const PRIMARY_PLATFORMS = [
  "YouTube",
  "TikTok",
  "Instagram",
  "Facebook",
  "Blog or Website",
  "Podcast",
  "Other",
];

const FOLLOWER_COUNTS = [
  "1,000–5,000",
  "5,000–25,000",
  "25,000–100,000",
  "100,000+",
];

const AUDIENCE_PUBLISHING = [
  "Amazon KDP (print)",
  "Kindle eBooks",
  "Both KDP & Kindle",
  "Other",
];

export default function FoundersPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [primaryPlatform, setPrimaryPlatform] = useState("");
  const [platformUrl, setPlatformUrl] = useState("");
  const [followerCount, setFollowerCount] = useState("");
  const [audiencePublishing, setAudiencePublishing] = useState<string[]>([]);
  const [audienceDescription, setAudienceDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const toggleAudiencePublishing = (value: string) => {
    setAudiencePublishing((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (audiencePublishing.length === 0) {
      setErrorMessage("Please select at least one option for where your audience publishes.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/founder-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          primary_platform: primaryPlatform,
          platform_url: platformUrl.trim(),
          follower_count: followerCount,
          publishing_platforms: audiencePublishing,
          audience_description: audienceDescription.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data?.error || "Something went wrong.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-brand-cardHover px-4 py-2.5 bg-brand-bg font-sans text-sm text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent appearance-none";
  const labelClass = "block font-sans text-sm font-medium mb-1.5 text-brand-muted";
  const benefitCards = [
    {
      title: "Lifetime access",
      body: "Use manu2print tools while you create and teach - no monthly fee for approved Founders.",
    },
    {
      title: "Partner earnings",
      body: "Earn 30 to 40 percent commissions through your verified partner link.",
    },
    {
      title: "Giveaway credits",
      body: "Run limited, trackable scan-credit giveaways for your audience.",
    },
    {
      title: "Priority support",
      body: "Founder inbox path for faster campaign and account support.",
    },
  ];

  return (
    <SiteShell>
      <div className="relative overflow-hidden bg-brand-bg">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(245,166,35,0.12),transparent_60%)]" aria-hidden />
        <div className="absolute top-24 -left-24 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute top-1/2 right-0 h-80 w-80 rounded-full bg-brand-gold/5 blur-3xl pointer-events-none" aria-hidden />

        <section className="relative px-6 pt-14 pb-10">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-3 font-bebas text-sm tracking-[0.18em] uppercase text-brand-gold">Founder Circle</p>
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-gold shadow-[0_0_0_5px_rgba(245,166,35,0.14)]">
                <span className="font-bebas text-xl tracking-wide text-brand-bg">M2P</span>
              </div>
            </div>
            <h1 className="mb-4 font-bebas text-4xl font-normal tracking-wide text-brand-cream sm:text-5xl md:text-6xl">
              Become a <span className="text-brand-gold">manu2print</span> Founder
            </h1>
            <p className="mx-auto mb-2 max-w-3xl font-sans text-lg text-brand-cream/90">
              Lifetime access. Real partner earnings. Creator-grade giveaway tools for your audience.
            </p>
            <p className="mx-auto max-w-2xl font-sans text-sm leading-relaxed text-brand-muted">
              Built for serious KDP and Kindle educators with engaged audiences. Limited intake. Every application is reviewed manually.
            </p>
            <div className="mx-auto mt-7 h-px w-28 bg-gradient-to-r from-transparent via-brand-gold to-transparent" />
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {["Lifetime access", "30–40% commissions", "Monthly giveaway credits", "Priority support"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-brand-gold/35 bg-brand-card px-3 py-1.5 font-sans text-xs font-semibold text-brand-cream/90"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="relative px-6 pb-6">
          <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2">
            {benefitCards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-brand-cardHover bg-brand-card/90 p-5 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.5)]"
              >
                <p className="font-bebas text-xl tracking-wide text-brand-gold">{card.title}</p>
                <p className="mt-1.5 font-sans text-sm leading-relaxed text-brand-muted">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative px-6 pb-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 rounded-xl border border-brand-cardHover bg-brand-card p-5">
              <p className="font-bebas text-base tracking-[0.08em] uppercase text-brand-gold">Who this is for</p>
              <p className="mt-2 font-sans text-sm leading-relaxed text-brand-muted">
                Content creators with at least 1,000 followers on one active platform, whose audience publishes on Amazon KDP, Kindle, or both.
              </p>
              <p className="mt-2 font-sans text-xs leading-relaxed text-brand-muted/90">
                Founders promote responsibly: no guaranteed-approval claims, no misleading scarcity, and clear giveaway terms.
              </p>
            </div>

            {status === "success" ? (
              <div className="rounded-xl border border-brand-cardHover bg-brand-card p-8 text-center">
                <p className="mb-2 font-sans font-medium text-brand-cream">Application received.</p>
                <p className="font-sans text-sm text-brand-muted">
                  We review every application personally and typically respond within 48 hours.
                </p>
                <p className="mt-3 font-sans text-xs text-brand-muted">
                  Questions while you wait? Email <a className="text-brand-gold hover:underline" href="mailto:hello@manu2print.com">hello@manu2print.com</a>
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-5 rounded-xl border border-brand-cardHover border-t-2 border-t-brand-gold bg-brand-card p-6 shadow-[0_22px_42px_-28px_rgba(245,166,35,0.35)]"
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Full Name <span className="text-brand-gold">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Email <span className="text-brand-gold">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Primary Platform <span className="text-brand-gold">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={primaryPlatform}
                        onChange={(e) => setPrimaryPlatform(e.target.value)}
                        required
                        className={`${inputClass} pr-10`}
                      >
                        <option value="">Select…</option>
                        {PRIMARY_PLATFORMS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>
                      Link to your channel, profile, or website <span className="text-brand-gold">*</span>
                    </label>
                    <input
                      type="text"
                      value={platformUrl}
                      onChange={(e) => setPlatformUrl(e.target.value)}
                      required
                      placeholder="https://… or @handle"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>
                    Subscriber / Follower Count <span className="text-brand-gold">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={followerCount}
                      onChange={(e) => setFollowerCount(e.target.value)}
                      required
                      className={`${inputClass} pr-10`}
                    >
                      <option value="">Select…</option>
                      {FOLLOWER_COUNTS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>
                    Where does your audience publish? <span className="text-brand-gold">*</span>
                  </label>
                  <p className="mb-2 font-sans text-xs text-brand-muted/80">
                    manu2print supports KDP &amp; Kindle only. Select what best describes your audience.
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {AUDIENCE_PUBLISHING.map((value) => (
                      <label
                        key={value}
                        className="flex cursor-pointer items-center gap-2 font-sans text-sm text-brand-muted"
                      >
                        <input
                          type="checkbox"
                          checked={audiencePublishing.includes(value)}
                          onChange={() => toggleAudiencePublishing(value)}
                          className="rounded border-brand-cardHover text-brand-gold focus:ring-brand-gold"
                        />
                        {value}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>
                    Who do you create content for and what topics do you cover? <span className="text-brand-gold">*</span>
                  </label>
                  <textarea
                    value={audienceDescription}
                    onChange={(e) => setAudienceDescription(e.target.value)}
                    required
                    maxLength={300}
                    rows={4}
                    className={inputClass}
                  />
                  <p className="mt-1 font-sans text-xs text-brand-muted/80">
                    {audienceDescription.length} / 300
                  </p>
                </div>
                {errorMessage && (
                  <p className="font-sans text-sm text-red-400">{errorMessage}</p>
                )}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full rounded-lg bg-brand-gold px-4 py-3 font-bebas text-lg uppercase tracking-wide text-brand-bg transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {status === "loading" ? "Submitting…" : "Apply for Founder Access"}
                </button>
                <p className="text-center font-sans text-xs text-brand-muted">
                  Manual review. Typical response time: 48 hours.
                </p>
              </form>
            )}

            <p className="mt-6 text-center">
              <Link
                href="/platform/kdp"
                className="group inline-flex items-center gap-1 font-sans text-sm text-brand-muted transition-colors hover:text-brand-gold"
              >
                <span className="inline-block transition-transform group-hover:-translate-x-0.5">←</span>
                Back to Tools
              </Link>
            </p>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
