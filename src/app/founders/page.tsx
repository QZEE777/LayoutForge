"use client";

import { useState } from "react";
import Link from "next/link";

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

const PUBLISHING_PLATFORMS = [
  "Amazon KDP",
  "IngramSpark",
  "Draft2Digital",
  "Etsy",
  "Gumroad",
  "Lulu",
  "Barnes & Noble Press",
  "Kobo",
  "Smashwords",
  "PublishDrive",
  "Other",
];

export default function FoundersPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [primaryPlatform, setPrimaryPlatform] = useState("");
  const [platformUrl, setPlatformUrl] = useState("");
  const [followerCount, setFollowerCount] = useState("");
  const [publishingPlatforms, setPublishingPlatforms] = useState<string[]>([]);
  const [audienceDescription, setAudienceDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const togglePublishing = (platform: string) => {
    setPublishingPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
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
          publishing_platforms: publishingPlatforms,
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

  return (
    <div className="min-h-screen bg-brand-bg relative overflow-hidden">
      {/* Ambient gold blur (decorative) */}
      <div className="absolute top-20 -left-20 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute top-1/2 right-0 w-80 h-80 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" aria-hidden />

      {/* Sticky nav */}
      <nav className="sticky top-0 z-20 border-b border-white/5 bg-brand-bg/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/formatter" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-brand-gold">
              <svg className="w-4 h-4" fill="none" stroke="#0F0D0B" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-brand-cream">
              <span className="font-serif">Scribe</span>
              <span className="font-sans">Stack</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/formatter" className="text-sm font-medium text-brand-cream hover:text-brand-gold transition-colors">
              Tools
            </Link>
            <Link href="/founders" className="text-sm font-medium text-brand-cream hover:text-brand-gold transition-colors">
              Founders
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-12 pb-10">
        <div className="mx-auto max-w-2xl text-center">
          {/* Gold S logo circle */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-brand-gold flex items-center justify-center">
              <span className="font-bebas text-3xl text-brand-bg">S</span>
            </div>
          </div>
          <h1 className="font-bebas text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-brand-cream mb-4">
            Become a ScribeStack <span className="text-brand-gold">Founder</span>
          </h1>
          {/* Gold gradient divider */}
          <div className="h-px w-24 mx-auto mb-6 bg-gradient-to-r from-transparent via-brand-gold to-transparent" />
          <p className="font-sans text-lg mb-4 text-brand-muted">
            Free access for life. Earn from every author you refer. Built for publishing influencers with a real audience.
          </p>
          <p className="font-sans text-sm leading-relaxed text-brand-muted">
            We&apos;re opening a limited number of Founder spots to content creators and influencers in the self-publishing space. Founders get full lifetime access to ScribeStack — free, forever — plus affiliate commissions on every author they bring in. To qualify, you need an active presence on at least one platform with a minimum of 1,000 subscribers or followers.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="relative px-6 pb-16">
        <div className="mx-auto max-w-xl">
          {status === "success" ? (
            <div className="rounded-xl border border-brand-cardHover p-8 text-center bg-brand-card">
              <p className="font-sans font-medium mb-2 text-brand-cream">
                Application received.
              </p>
              <p className="font-sans text-sm text-brand-muted">
                We review every application personally and will be in touch within 48 hours.
              </p>
            </div>
          ) : (
            /* Form container with gold gradient top border */
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-brand-cardHover border-t-2 border-t-brand-gold p-6 space-y-5 bg-brand-card"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div>
                <label className={labelClass}>
                  Publishing Platforms You Cover <span className="text-brand-gold">*</span>
                </label>
                <p className="font-sans text-xs mb-2 text-brand-muted/80">
                  Select all that apply.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PUBLISHING_PLATFORMS.map((platform) => (
                    <label
                      key={platform}
                      className="flex items-center gap-2 font-sans text-sm cursor-pointer text-brand-muted"
                    >
                      <input
                        type="checkbox"
                        checked={publishingPlatforms.includes(platform)}
                        onChange={() => togglePublishing(platform)}
                        className="rounded border-brand-cardHover text-brand-gold focus:ring-brand-gold"
                      />
                      {platform}
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
                <p className="font-sans text-xs mt-1 text-brand-muted/80">
                  {audienceDescription.length} / 300
                </p>
              </div>
              {errorMessage && (
                <p className="font-sans text-sm text-red-400">{errorMessage}</p>
              )}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-lg px-4 py-3 font-bebas text-lg uppercase tracking-wide bg-brand-gold text-brand-bg hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {status === "loading" ? "Submitting…" : "Apply for Founder Access"}
              </button>
            </form>
          )}
          <p className="mt-6 text-center">
            <Link
              href="/formatter"
              className="inline-flex items-center gap-1 font-sans text-sm text-brand-muted hover:text-brand-gold transition-colors group"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform inline-block">←</span>
              Back to Formatter
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
