"use client";

import { useState } from "react";
import Link from "next/link";

const CARD_BG = "#1A1612";
const CARD_BORDER = "#2A2420";
const GOLD = "#F5A623";
const WARM_WHITE = "#FAF7F2";

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
    "w-full rounded-lg border px-4 py-2.5 bg-[#0F0D0B] text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50";
  const inputStyle = { borderColor: CARD_BORDER, color: WARM_WHITE };
  const labelClass = "block text-sm font-medium mb-1.5";
  const labelStyle = { color: "#a8a29e" };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0F0D0B" }}>
      {/* Hero */}
      <section className="px-6 pt-16 pb-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1
            className="font-serif text-4xl sm:text-5xl font-bold mb-4"
            style={{ color: WARM_WHITE }}
          >
            Become a ScribeStack Founder
          </h1>
          <p
            className="text-lg mb-4"
            style={{ color: "#a8a29e" }}
          >
            Free access for life. Earn from every author you refer. Built for publishing influencers with a real audience.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#9c958a" }}>
            We&apos;re opening a limited number of Founder spots to content creators and influencers in the self-publishing space. Founders get full lifetime access to ScribeStack — free, forever — plus affiliate commissions on every author they bring in. To qualify, you need an active presence on at least one platform with a minimum of 1,000 subscribers or followers.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-xl">
          {status === "success" ? (
            <div
              className="rounded-xl border p-8 text-center"
              style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
            >
              <p className="font-medium mb-2" style={{ color: WARM_WHITE }}>
                Application received.
              </p>
              <p className="text-sm" style={{ color: "#a8a29e" }}>
                We review every application personally and will be in touch within 48 hours.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border p-6 space-y-5"
              style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
            >
              <div>
                <label className={labelClass} style={labelStyle}>
                  Full Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>
                  Email <span className="text-amber-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>
                  Primary Platform <span className="text-amber-400">*</span>
                </label>
                <select
                  value={primaryPlatform}
                  onChange={(e) => setPrimaryPlatform(e.target.value)}
                  required
                  className={inputClass}
                  style={inputStyle}
                >
                  <option value="">Select…</option>
                  {PRIMARY_PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>
                  Link to your channel, profile, or website <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={platformUrl}
                  onChange={(e) => setPlatformUrl(e.target.value)}
                  required
                  placeholder="https://… or @handle"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>
                  Subscriber / Follower Count <span className="text-amber-400">*</span>
                </label>
                <select
                  value={followerCount}
                  onChange={(e) => setFollowerCount(e.target.value)}
                  required
                  className={inputClass}
                  style={inputStyle}
                >
                  <option value="">Select…</option>
                  {FOLLOWER_COUNTS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>
                  Publishing Platforms You Cover <span className="text-amber-400">*</span>
                </label>
                <p className="text-xs mb-2" style={{ color: "#78716c" }}>
                  Select all that apply.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PUBLISHING_PLATFORMS.map((platform) => (
                    <label
                      key={platform}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                      style={{ color: "#a8a29e" }}
                    >
                      <input
                        type="checkbox"
                        checked={publishingPlatforms.includes(platform)}
                        onChange={() => togglePublishing(platform)}
                        className="rounded border"
                        style={{ borderColor: CARD_BORDER }}
                      />
                      {platform}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>
                  Who do you create content for and what topics do you cover? <span className="text-amber-400">*</span>
                </label>
                <textarea
                  value={audienceDescription}
                  onChange={(e) => setAudienceDescription(e.target.value)}
                  required
                  maxLength={300}
                  rows={4}
                  className={inputClass}
                  style={inputStyle}
                />
                <p className="text-xs mt-1" style={{ color: "#78716c" }}>
                  {audienceDescription.length} / 300
                </p>
              </div>
              {errorMessage && (
                <p className="text-sm text-red-400">{errorMessage}</p>
              )}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-lg px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: GOLD, color: "#0F0D0B" }}
              >
                {status === "loading" ? "Submitting…" : "Apply for Founder Access"}
              </button>
            </form>
          )}
          <p className="mt-6 text-center">
            <Link href="/formatter" className="text-sm hover:underline" style={{ color: "#a8a29e" }}>
              ← Back to Formatter
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
