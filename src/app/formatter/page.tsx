"use client";

import { useState } from "react";
import Link from "next/link";

const CARD_BG = "#1A1612";
const CARD_BORDER = "#2A2420";
const GOLD = "#F5A623";
const WARM_WHITE = "#FAF7F2";

const LIVE_TOOLS = [
  { title: "KDP Formatter (DOCX)", description: "Format DOCX for Amazon KDP print. Trim size, bleed, print-ready PDF.", href: "/kdp-formatter", badge: null },
  { title: "KDP Formatter (PDF)", description: "Convert PDF to KDP-ready print PDF.", href: "/kdp-formatter-pdf", badge: null },
  { title: "Kindle EPUB Maker", description: "Manuscript to Kindle-ready EPUB. Chapter structure, metadata.", href: "/epub-maker", badge: null },
  { title: "PDF Compressor", description: "Shrink PDFs up to 50MB. No account needed.", href: "/pdf-compress", badge: "Free" },
];

const COMING_SOON = [
  { platform: "IngramSpark Formatter", description: "Print-ready files for IngramSpark distribution." },
  { platform: "Gumroad Digital Product Formatter", description: "Format ebooks and low-content for Gumroad." },
  { platform: "Etsy Low Content Book Formatter", description: "Templates and interiors for Etsy KDP sellers." },
  { platform: "Draft2Digital Package Builder", description: "Single manuscript to multi-format D2D package." },
  { platform: "Barnes & Noble Press Formatter", description: "BNP-ready print and EPUB." },
  { platform: "Kobo EPUB Optimizer", description: "Kobo-specific EPUB optimization." },
  { platform: "Lulu Print Formatter", description: "Print-ready files for Lulu." },
  { platform: "Smashwords Style Formatter", description: "Meatgrinder-ready formatting." },
  { platform: "PublishDrive Formatter", description: "Wide distribution formatting." },
  { platform: "StreetLib Formatter", description: "StreetLib-ready exports." },
];

export default function FormatterPage() {
  const [notifyModal, setNotifyModal] = useState<{ platform: string } | null>(null);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyAll, setNotifyAll] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [leadsEmail, setLeadsEmail] = useState("");
  const [leadsStatus, setLeadsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyModal) return;
    setNotifyStatus("loading");
    try {
      const res = await fetch("/api/platform-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: notifyEmail.trim(),
          platform: notifyModal.platform,
          notify_all: notifyAll,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotifyStatus("error");
        return;
      }
      setNotifyStatus("success");
      setNotifyEmail("");
      setNotifyAll(false);
    } catch {
      setNotifyStatus("error");
    }
  };

  const handleLeadsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadsStatus("loading");
    try {
      const res = await fetch("/api/formatter-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: leadsEmail.trim() }),
      });
      if (!res.ok) {
        setLeadsStatus("error");
        return;
      }
      setLeadsStatus("success");
      setLeadsEmail("");
    } catch {
      setLeadsStatus("error");
    }
  };

  const closeNotifyModal = () => {
    setNotifyModal(null);
    setNotifyStatus("idle");
    setNotifyEmail("");
    setNotifyAll(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0F0D0B" }}>
      {/* Hero */}
      <section className="px-6 pt-16 pb-12">
        <div className="mx-auto max-w-3xl text-center">
          <h1
            className="font-serif text-4xl sm:text-5xl font-bold mb-4"
            style={{ color: WARM_WHITE }}
          >
            Professional Book Formatting — Done in Minutes
          </h1>
          <p
            className="text-lg sm:text-xl leading-relaxed"
            style={{ color: "#a8a29e" }}
          >
            Format your manuscript for any publishing platform — KDP, IngramSpark, Draft2Digital and more. Free tools for indie authors.
          </p>
        </div>
      </section>

      {/* Live tools — 2x2 */}
      <section className="px-6 pb-14">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LIVE_TOOLS.map((tool) => (
              <div
                key={tool.href}
                className="rounded-xl border p-5 flex flex-col"
                style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-serif text-lg font-bold" style={{ color: WARM_WHITE }}>
                    {tool.title}
                  </h3>
                  {tool.badge && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0"
                      style={{ backgroundColor: "rgba(34,197,94,0.2)", color: "#86efac" }}
                    >
                      {tool.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm flex-1 mb-4" style={{ color: "#a8a29e" }}>
                  {tool.description}
                </p>
                <Link
                  href={tool.href}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold w-fit transition-opacity hover:opacity-90"
                  style={{ backgroundColor: GOLD, color: "#0F0D0B" }}
                >
                  Launch
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section className="px-6 pb-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-2xl font-bold mb-2" style={{ color: WARM_WHITE }}>
            More publishing platforms. More tools. Coming soon.
          </h2>
          <p className="text-sm mb-6" style={{ color: "#a8a29e" }}>
            ScribeStack is expanding to every major publishing platform. Sign up to be notified when your platform launches.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMING_SOON.map((item) => (
              <div
                key={item.platform}
                className="rounded-xl border p-4 flex flex-col opacity-80"
                style={{ backgroundColor: CARD_BG, borderColor: "#3d3630" }}
              >
                <span className="rounded-full bg-[#2A2420] border border-[#3d3630] px-2 py-0.5 text-xs font-medium text-[#9c958a] w-fit mb-2">
                  Coming Soon
                </span>
                <h3 className="font-serif font-bold mb-1" style={{ color: "#9c958a" }}>
                  {item.platform}
                </h3>
                <p className="text-sm flex-1 mb-4" style={{ color: "#78716c" }}>
                  {item.description}
                </p>
                <button
                  type="button"
                  onClick={() => setNotifyModal({ platform: item.platform })}
                  className="rounded-lg border px-4 py-2 text-sm font-medium w-fit transition-colors hover:bg-white/5"
                  style={{ borderColor: "#3d3630", color: "#9c958a" }}
                >
                  Notify Me
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email capture — formatting tips */}
      <section className="px-6 pb-14">
        <div className="mx-auto max-w-xl">
          <h2 className="font-serif text-xl font-bold mb-4" style={{ color: WARM_WHITE }}>
            Get formatting tips and tool updates
          </h2>
          {leadsStatus === "success" ? (
            <p className="text-sm" style={{ color: "rgba(245,166,35,0.95)" }}>
              Thanks! We&apos;ll send tips and updates to your inbox.
            </p>
          ) : (
            <form onSubmit={handleLeadsSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="you@example.com"
                value={leadsEmail}
                onChange={(e) => setLeadsEmail(e.target.value)}
                required
                className="flex-1 rounded-lg border px-4 py-2.5 bg-[#1A1612] text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50"
                style={{ borderColor: CARD_BORDER, color: WARM_WHITE }}
              />
              <button
                type="submit"
                disabled={leadsStatus === "loading"}
                className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: GOLD, color: "#0F0D0B" }}
              >
                {leadsStatus === "loading" ? "Submitting…" : "Submit"}
              </button>
            </form>
          )}
          {leadsStatus === "error" && (
            <p className="mt-2 text-sm text-red-400">Something went wrong. Please try again.</p>
          )}
        </div>
      </section>

      {/* Founder CTA */}
      <section
        className="px-6 py-12 border-t"
        style={{ backgroundColor: "#1A1612", borderColor: CARD_BORDER }}
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-2xl font-bold mb-3" style={{ color: WARM_WHITE }}>
            This isn&apos;t just a tool. It&apos;s a publishing business.
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "#a8a29e" }}>
            ScribeStack is building the publishing stack every indie author needs — whatever platform they publish on. Founders get in free forever and earn from every author they refer. Limited spots.
          </p>
          <Link
            href="/founders"
            className="inline-flex items-center gap-1.5 rounded-lg px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: GOLD, color: "#0F0D0B" }}
          >
            Apply for Founder Access
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* Notify Me modal */}
      {notifyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={closeNotifyModal}
        >
          <div
            className="w-full max-w-md rounded-xl border p-6 shadow-xl"
            style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-lg font-bold mb-4" style={{ color: WARM_WHITE }}>
              Get notified when {notifyModal.platform} launches
            </h3>
            {notifyStatus === "success" ? (
              <p className="text-sm mb-4" style={{ color: "rgba(245,166,35,0.95)" }}>
                You&apos;re on the list. We&apos;ll notify you the moment it launches.
              </p>
            ) : (
              <form onSubmit={handleNotifySubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border px-4 py-2.5 bg-[#0F0D0B] text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50"
                  style={{ borderColor: CARD_BORDER, color: WARM_WHITE }}
                />
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#a8a29e" }}>
                  <input
                    type="checkbox"
                    checked={notifyAll}
                    onChange={(e) => setNotifyAll(e.target.checked)}
                    className="rounded border"
                    style={{ borderColor: CARD_BORDER }}
                  />
                  Also notify me about all new ScribeStack tools
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeNotifyModal}
                    className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
                    style={{ borderColor: CARD_BORDER, color: "#a8a29e" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={notifyStatus === "loading"}
                    className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: GOLD, color: "#0F0D0B" }}
                  >
                    {notifyStatus === "loading" ? "Submitting…" : "Notify Me"}
                  </button>
                </div>
              </form>
            )}
            {notifyStatus === "error" && (
              <p className="mt-2 text-sm text-red-400">Something went wrong. Please try again.</p>
            )}
            {notifyStatus === "success" && (
              <button
                type="button"
                onClick={closeNotifyModal}
                className="rounded-lg border px-4 py-2 text-sm font-medium mt-2"
                style={{ borderColor: CARD_BORDER, color: "#a8a29e" }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
