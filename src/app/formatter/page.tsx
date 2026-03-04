"use client";

import { useState } from "react";
import Link from "next/link";

/** FREE tools — shown in top row with bold FREE badge (green). */
const FREE_TOOLS: { title: string; description: string; href: string }[] = [
  { title: "PDF Compressor", description: "Shrink PDFs up to 50MB. No account needed.", href: "/pdf-compress" },
  { title: "PDF Print Optimizer", description: "Shrink / print-optimize your PDF.", href: "/kdp-formatter-pdf" },
];

const PAID_TOOLS: { title: string; description: React.ReactNode; href: string; pricing: string; comingSoon?: boolean }[] = [
  { title: "KDP Formatter (DOCX)", description: "Format DOCX for Amazon KDP print. Trim size, bleed, print-ready PDF.", href: "/kdp-formatter", pricing: "$7 per use · $27 for 6 months" },
  { title: "KDP PDF Checker", description: <>Check your PDF against KDP specs.<br />Trim, page count, issues.</>, href: "/kdp-pdf-checker", pricing: "$7 per use · $27 for 6 months" },
  { title: "Kindle EPUB Maker", description: "Manuscript to Kindle-ready EPUB. Chapter structure, metadata.", href: "/epub-maker", pricing: "$7 per use · $27 for 6 months" },
  { title: "KDP Format Review", description: "Paste or upload your manuscript — AI review for margins, spacing, headings, lists, KDP rules. Optional preview with KDP params.", href: "#", pricing: "Coming soon", comingSoon: true },
];

/** Mini tools — calculator, estimators, etc. */
const MINI_TOOLS: { title: string; description: string; href: string; live: boolean }[] = [
  { title: "KDP Royalty Calculator", description: "Earnings by page count, trim size, list price. 60% or 35% royalty.", href: "/royalty-calculator", live: true },
  { title: "Page Count Estimator", description: "Estimate interior pages from word count and trim size.", href: "/page-count-estimator", live: true },
  { title: "Trim Size Comparison", description: "Compare print costs and royalties across trim sizes.", href: "/trim-size-comparison", live: true },
  { title: "Spine width calculator", description: "Spine width and full-wrap cover dimensions for KDP paperbacks.", href: "/spine-calculator", live: true },
  { title: "Full-wrap cover calculator", description: "Cover canvas size in inches and pixels (300 DPI) for Canva and design tools.", href: "/cover-calculator", live: true },
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
  const [leadsName, setLeadsName] = useState("");
  const [leadsEmail, setLeadsEmail] = useState("");
  const [leadsStatus, setLeadsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [leadsSuccessName, setLeadsSuccessName] = useState("");
  const [leadsErrorMsg, setLeadsErrorMsg] = useState("");
  const [notifyErrorMsg, setNotifyErrorMsg] = useState("");

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyModal) return;
    setNotifyStatus("loading");
    setNotifyErrorMsg("");
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
        setNotifyErrorMsg((data?.error as string) || "Something went wrong. Please try again.");
        return;
      }
      setNotifyStatus("success");
      setNotifyEmail("");
      setNotifyAll(false);
      setNotifyErrorMsg("");
    } catch {
      setNotifyStatus("error");
      setNotifyErrorMsg("Something went wrong. Please try again.");
    }
  };

  const handleLeadsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadsStatus("loading");
    setLeadsErrorMsg("");
    try {
      const res = await fetch("/api/formatter-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: leadsName.trim(), email: leadsEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLeadsStatus("error");
        setLeadsErrorMsg((data?.error as string) || "Something went wrong. Please try again.");
        return;
      }
      setLeadsStatus("success");
      setLeadsSuccessName(data.name ?? leadsName.trim());
      setLeadsName("");
      setLeadsEmail("");
      setLeadsErrorMsg("");
    } catch {
      setLeadsStatus("error");
      setLeadsErrorMsg("Something went wrong. Please try again.");
    }
  };

  const closeNotifyModal = () => {
    setNotifyModal(null);
    setNotifyStatus("idle");
    setNotifyEmail("");
    setNotifyAll(false);
    setNotifyErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Sticky nav */}
      <nav className="sticky top-0 z-20 border-b border-white/5 bg-brand-bg/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-brand-gold">
              <svg className="w-4 h-4" fill="none" stroke="#0F0D0B" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span
              className="text-lg font-bold tracking-tight text-brand-cream"
              style={{
                textShadow: "0 0 24px rgba(250,247,242,0.25), 0 0 48px rgba(245,166,35,0.12)",
              }}
            >
              <span className="font-serif">manu</span>
              <span className="font-sans">2print</span>
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
      <section className="px-6 pt-16 pb-12">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-bebas text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-brand-cream mb-4">
            Professional Book Formatting — <span className="text-brand-gold">Done in Minutes</span>
          </h1>
          <p className="font-sans text-lg sm:text-xl leading-relaxed text-brand-muted">
            Format your manuscript for any publishing platform — KDP, IngramSpark, Draft2Digital and more. Free tools for indie authors.
          </p>
        </div>
      </section>

      {/* FREE tools — top row, FREE in caps bold green */}
      <section className="px-6 pb-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-bebas text-xl tracking-wide text-brand-cream text-center mb-4">
            Free tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FREE_TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group relative rounded-xl border-l-4 border-brand-gold p-6 flex flex-col bg-brand-card border border-brand-cardHover hover:shadow-gold-glow hover:border-brand-cardHover transition-all overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" aria-hidden />
                <div className="relative flex flex-col items-center text-center">
                  <h3 className="font-bebas text-xl tracking-wide text-brand-cream mb-1">
                    {tool.title}
                  </h3>
                  <p className="font-bebas text-2xl font-bold tracking-widest uppercase mb-2 text-[#22c55e]">
                    FREE
                  </p>
                  <p className="font-sans text-sm flex-1 mb-4 text-brand-muted">
                    {tool.description}
                  </p>
                  <span className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold w-fit bg-brand-gold text-brand-bg group-hover:opacity-90 transition-opacity">
                    Launch
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Paid tools — 3 columns desktop, stacked mobile */}
      <section className="px-6 pb-14">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PAID_TOOLS.map((tool) =>
              tool.comingSoon ? (
                <div
                  key={tool.title}
                  className="group relative rounded-xl border-l-4 border-brand-gold/60 p-5 flex flex-col bg-brand-card border border-brand-cardHover opacity-85 overflow-hidden"
                >
                  <span className="rounded-full bg-brand-locked border border-brand-cardHover px-2 py-0.5 text-xs font-medium text-brand-muted w-fit mb-2 self-center">
                    Coming soon
                  </span>
                  <div className="relative flex flex-col items-center text-center">
                    <h3 className="font-bebas text-xl tracking-wide text-brand-cream mb-2">
                      {tool.title}
                    </h3>
                    <p className="font-sans text-sm flex-1 mb-2 text-brand-muted">
                      {tool.description}
                    </p>
                    <p className="font-sans text-xs text-brand-muted">
                      {tool.pricing}
                    </p>
                  </div>
                </div>
              ) : (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group relative rounded-xl border-l-4 border-brand-gold p-5 flex flex-col bg-brand-card border border-brand-cardHover hover:shadow-gold-glow hover:border-brand-cardHover transition-all overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" aria-hidden />
                  <div className="relative flex flex-col items-center text-center">
                    <h3 className="font-bebas text-xl tracking-wide text-brand-cream mb-2">
                      {tool.title}
                    </h3>
                    <p className="font-sans text-sm flex-1 mb-2 text-brand-muted">
                      {tool.description}
                    </p>
                    <p className="font-sans text-xs text-white mb-4">
                      {tool.pricing}
                    </p>
                    <span className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold w-fit bg-brand-gold text-brand-bg group-hover:opacity-90 transition-opacity">
                      Launch
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* Mini tools — calculator, estimators, placeholders */}
      <section className="px-6 pb-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-bebas text-xl tracking-wide text-brand-cream text-center mb-4">
            Mini tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MINI_TOOLS.map((tool) =>
              tool.live ? (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group relative rounded-xl border-l-4 border-brand-gold p-5 flex flex-col bg-brand-card border border-brand-cardHover hover:shadow-gold-glow hover:border-brand-cardHover transition-all overflow-hidden"
                >
                  <div className="relative flex flex-col items-center text-center">
                    <h3 className="font-bebas text-xl tracking-wide text-brand-cream mb-2">
                      {tool.title}
                    </h3>
                    <p className="font-sans text-sm flex-1 mb-4 text-brand-muted">
                      {tool.description}
                    </p>
                    <span className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold w-fit bg-brand-gold text-brand-bg group-hover:opacity-90 transition-opacity">
                      Launch
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ) : (
                <div
                  key={tool.title}
                  className="group relative rounded-xl border-l-4 border-brand-gold/60 p-5 flex flex-col bg-brand-card border border-brand-cardHover opacity-85 overflow-hidden"
                >
                  <span className="rounded-full bg-brand-locked border border-brand-cardHover px-2 py-0.5 text-xs font-medium text-brand-muted w-fit mb-2 self-center">
                    Coming soon
                  </span>
                  <div className="relative flex flex-col items-center text-center">
                    <h3 className="font-bebas text-xl tracking-wide text-brand-cream mb-2">
                      {tool.title}
                    </h3>
                    <p className="font-sans text-sm flex-1 text-brand-muted">
                      {tool.description}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section className="px-6 pb-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-bebas text-2xl sm:text-3xl tracking-wide text-brand-cream text-center mb-2">
            More publishing platforms. More tools. Coming soon.
          </h2>
          <p className="font-sans text-sm text-brand-muted text-center mb-8">
            manu2print is expanding to every major publishing platform. Sign up to be notified when your platform launches.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMING_SOON.map((item) => (
              <div
                key={item.platform}
                className="rounded-xl border p-4 flex flex-col bg-brand-card border-brand-locked opacity-80 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-200"
              >
                <span className="rounded-full bg-brand-locked border border-brand-cardHover px-2 py-0.5 text-xs font-medium text-brand-muted w-fit mb-2">
                  Coming Soon
                </span>
                <h3 className="font-bebas text-lg tracking-wide text-brand-muted">
                  {item.platform}
                </h3>
                <p className="font-sans text-sm flex-1 mb-4 text-brand-muted/80">
                  {item.description}
                </p>
                <button
                  type="button"
                  onClick={() => setNotifyModal({ platform: item.platform })}
                  className="rounded-lg border border-brand-cardHover px-4 py-2 text-sm font-medium w-fit text-brand-muted hover:bg-white/5 transition-colors"
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
          <h2 className="font-bebas text-xl tracking-wide text-brand-cream mb-4">
            Get formatting tips and tool updates
          </h2>
          {leadsStatus === "success" ? (
            <p className="font-sans text-sm text-brand-gold">
              Thanks{leadsSuccessName ? ` ${leadsSuccessName}` : ""}! You&apos;re on the list.
            </p>
          ) : (
            <form onSubmit={handleLeadsSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Your name"
                value={leadsName}
                onChange={(e) => setLeadsName(e.target.value)}
                required
                className="w-full rounded-lg border border-brand-cardHover px-4 py-2.5 bg-brand-card font-sans text-sm text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={leadsEmail}
                  onChange={(e) => setLeadsEmail(e.target.value)}
                  required
                  className="flex-1 rounded-lg border border-brand-cardHover px-4 py-2.5 bg-brand-card font-sans text-sm text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={leadsStatus === "loading"}
                  className="rounded-lg px-5 py-2.5 text-sm font-semibold bg-brand-gold text-brand-bg hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {leadsStatus === "loading" ? "Submitting…" : "Submit"}
                </button>
              </div>
            </form>
          )}
          {leadsStatus === "error" && leadsErrorMsg && (
            <p className="mt-2 font-sans text-sm text-red-400">{leadsErrorMsg}</p>
          )}
        </div>
      </section>

      {/* Founder CTA — full width, gold gradient borders */}
      <section className="relative border-t-2 border-b-2 border-brand-gold/60 bg-brand-card">
        <div className="mx-auto max-w-2xl px-6 py-14 text-center">
          <h2 className="font-bebas text-3xl sm:text-4xl tracking-wide text-brand-cream mb-3">
            This isn&apos;t just a tool. It&apos;s a publishing business.
          </h2>
          <p className="font-sans text-sm leading-relaxed text-brand-muted mb-6">
            manu2print is building the publishing stack every indie author needs — whatever platform they publish on. Founders get in free forever and earn from every author they refer.
            <br />
            <span className="font-bebas text-2xl tracking-widest text-brand-gold uppercase">LIMITED INVITATIONS.</span>
          </p>
          <Link
            href="/founders"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold bg-brand-gold text-brand-bg hover:opacity-90 transition-opacity"
          >
            Apply for Founder Access
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Notify Me modal */}
      {notifyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={closeNotifyModal}
        >
          <div
            className="w-full max-w-md rounded-xl border border-brand-cardHover p-6 shadow-gold-glow-lg bg-brand-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bebas text-xl tracking-wide text-brand-cream mb-4">
              Get notified when {notifyModal.platform} launches
            </h3>
            {notifyStatus === "success" ? (
              <p className="font-sans text-sm mb-4 text-brand-gold">
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
                  className="w-full rounded-lg border border-brand-cardHover px-4 py-2.5 bg-brand-bg font-sans text-sm text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
                <label className="flex items-center gap-2 font-sans text-sm cursor-pointer text-brand-muted">
                  <input
                    type="checkbox"
                    checked={notifyAll}
                    onChange={(e) => setNotifyAll(e.target.checked)}
                    className="rounded border-brand-cardHover"
                  />
                  Also notify me about all new manu2print tools
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeNotifyModal}
                    className="rounded-lg border border-brand-cardHover px-4 py-2 text-sm font-medium text-brand-muted hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={notifyStatus === "loading"}
                    className="rounded-lg px-4 py-2 text-sm font-semibold bg-brand-gold text-brand-bg hover:opacity-90 disabled:opacity-60"
                  >
                    {notifyStatus === "loading" ? "Submitting…" : "Notify Me"}
                  </button>
                </div>
              </form>
            )}
            {notifyStatus === "error" && notifyErrorMsg && (
              <p className="mt-2 font-sans text-sm text-red-400">{notifyErrorMsg}</p>
            )}
            {notifyStatus === "success" && (
              <button
                type="button"
                onClick={closeNotifyModal}
                className="rounded-lg border border-brand-cardHover px-4 py-2 text-sm font-medium text-brand-muted mt-2"
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
