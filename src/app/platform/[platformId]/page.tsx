"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PlatformLogoBadge from "@/components/PlatformLogoBadge";
import { PLATFORMS, getToolsForPlatform, type Tool } from "@/data/platformTools";

const isAmazon = (id: string) => id === "kdp";

const FREE_GREEN = "#22c55e";

/** Small tool card. Shows green FREE badge when tool.free. */
function CompactToolCard({ tool, amazon }: { tool: Tool; amazon: boolean }) {
  const cardClass = amazon
    ? "rounded-lg border-l-2 border-amazon-orange border border-amazon-orange/20 p-3 bg-amazon-card hover:border-amazon-orange/50 transition-all"
    : "rounded-lg border-l-2 border-brand-gold border border-brand-cardHover p-3 bg-brand-card hover:shadow-gold-glow hover:border-brand-cardHover transition-all";
  const titleClass = amazon ? "font-bebas text-base tracking-wide text-white truncate" : "font-bebas text-base tracking-wide text-brand-cream truncate";
  const descClass = amazon ? "font-sans text-xs text-amazon-muted mt-0.5 line-clamp-2" : "font-sans text-xs text-brand-muted mt-0.5 line-clamp-2";
  const openClass = amazon
    ? "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold bg-amazon-orange text-black hover:opacity-90"
    : "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold bg-brand-gold text-brand-bg hover:opacity-90";
  const soonClass = amazon
    ? "rounded-md px-3 py-1.5 text-xs font-medium text-amazon-muted bg-amazon-dark border border-amazon-orange/20"
    : "rounded-md px-3 py-1.5 text-xs font-medium text-brand-muted bg-brand-locked border border-brand-cardHover";

  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={titleClass}>{tool.title}</h4>
            {tool.free && (
              <span className="font-bold text-[10px] uppercase tracking-wide shrink-0" style={{ color: FREE_GREEN }}>FREE</span>
            )}
          </div>
          <p className={descClass}>{tool.description}</p>
          {tool.pricing && (
            <p className={amazon ? "font-sans text-[11px] text-amazon-orange mt-1.5 font-medium" : "font-sans text-[11px] text-brand-gold mt-1.5 font-medium"}>
              {tool.pricing}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          {tool.available ? (
            <Link href={tool.href} className={openClass}>
              Open
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          ) : (
            <span className={soonClass}>Soon</span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Placeholder for coming-soon tools. */
function ComingSoonCard({ title, amazon }: { title: string; amazon: boolean }) {
  const cardClass = amazon
    ? "rounded-lg border border-amazon-orange/20 border-dashed p-3 bg-amazon-card/70 opacity-90"
    : "rounded-lg border border-brand-cardHover border-dashed p-3 bg-brand-card/50 opacity-80";
  const titleCls = amazon ? "font-bebas text-base tracking-wide text-amazon-muted" : "font-bebas text-base tracking-wide text-brand-muted";
  const subCls = amazon ? "font-sans text-xs text-amazon-muted mt-1" : "font-sans text-xs text-brand-muted mt-1";

  return (
    <div className={cardClass}>
      <h4 className={titleCls}>{title}</h4>
      <p className={subCls}>Coming soon</p>
    </div>
  );
}

const COMING_SOON_KDP = ["KDP Format Review"];

/**
 * Archived: coming-soon tools for non-KDP platforms.
 * Not used in the current KDP/Kindle-only build but kept for potential future expansion.
 */
const COMING_SOON_INGRAM = ["IngramSpark Formatter", "Print-ready PDF"];
const COMING_SOON_GUMROAD = ["Gumroad Formatter", "Digital product pack"];

function getComingSoonTitles(platformId: string): string[] {
  if (platformId === "kdp") return COMING_SOON_KDP;
  if (platformId === "ingramspark") return COMING_SOON_INGRAM;
  if (platformId === "gumroad") return COMING_SOON_GUMROAD;
  return [];
}

export default function PlatformPage() {
  const params = useParams();
  const platformId = (params?.platformId as string) ?? "";
  const platform = PLATFORMS.find((p) => p.id === platformId);
  const allTools = platform ? getToolsForPlatform(platform.toolIds) : [];
  const freeTools = allTools.filter((t) => t.free);
  const paidTools = allTools.filter((t) => !t.free);
  const comingSoonTitles = getComingSoonTitles(platformId);
  const amazon = isAmazon(platformId);

  const [leadsName, setLeadsName] = useState("");
  const [leadsEmail, setLeadsEmail] = useState("");
  const [leadsStatus, setLeadsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [leadsSuccessName, setLeadsSuccessName] = useState("");
  const [leadsErrorMsg, setLeadsErrorMsg] = useState("");
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
    } catch {
      setLeadsStatus("error");
      setLeadsErrorMsg("Something went wrong. Please try again.");
    }
  };

  if (!platform) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-6">
        <p className="font-sans text-brand-muted mb-4">Platform not found.</p>
        <Link href="/" className="text-brand-gold hover:underline">Back to home</Link>
      </div>
    );
  }

  const pageBg = amazon ? "min-h-screen bg-amazon-dark" : "min-h-screen bg-brand-bg";
  const navClass = amazon
    ? "sticky top-0 z-20 border-b border-amazon-orange/20 bg-amazon-dark/95 backdrop-blur-sm"
    : "sticky top-0 z-20 border-b border-white/5 bg-brand-bg/80 backdrop-blur-sm";
  const navLinkClass = amazon ? "text-sm font-medium text-white hover:text-amazon-orange transition-colors" : "text-sm font-medium text-brand-cream hover:text-brand-gold transition-colors";
  const h1Class = amazon ? "font-bebas text-2xl sm:text-3xl tracking-wide text-white" : "font-bebas text-2xl sm:text-3xl tracking-wide text-brand-cream";
  const taglineClass = amazon ? "font-sans text-sm text-amazon-muted mt-0.5" : "font-sans text-sm text-brand-muted mt-0.5";
  const backClass = amazon ? "font-sans text-sm text-amazon-orange hover:underline" : "font-sans text-sm text-brand-gold hover:underline";
  const sectionTitleClass = amazon ? "font-bebas text-lg tracking-wide text-white mb-3" : "font-bebas text-lg tracking-wide text-brand-cream mb-3";

  return (
    <div className={pageBg}>
      <nav className={navClass}>
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            {amazon ? (
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-amazon-orange">
                <svg className="w-4 h-4" fill="none" stroke="black" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-brand-gold">
                <svg className="w-4 h-4" fill="none" stroke="#0F0D0B" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            )}
            <span className={amazon ? "text-lg font-bold tracking-tight text-white" : "text-lg font-bold tracking-tight text-brand-cream"}>
              <span className="font-serif">manu</span>
              <span className="font-sans">2print</span>
            </span>
          </Link>
          <Link href="/#tools" className={navLinkClass}>
            All tools
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {amazon && (
          <section className="mb-10 rounded-xl border border-amazon-orange/30 bg-amazon-card/80 p-6 sm:p-8">
            <h2 className="font-bebas text-2xl sm:text-3xl tracking-wide text-white">
              Format, list &amp; publish — all in one place
            </h2>
            <p className="font-sans text-base text-amazon-orange/90 mt-1">
              Professional Book Formatting — Done in Minutes
            </p>
            <p className="font-sans text-sm text-amazon-muted mt-2 max-w-xl">
              FREE calculators and compressors. Paid tools: one-time or 6‑month access. No subscription.
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-sans text-sm text-white">
              <li className="flex items-center gap-1.5">
                <span className="text-amazon-orange">✓</span> Print-ready PDFs, KDP specs &amp; Kindle EPUB
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-amazon-orange">✓</span> Keywords &amp; Amazon listing copy
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-amazon-orange">✓</span> Pay per use or 6 months — your choice
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/#tools"
                className="inline-flex items-center gap-2 rounded-lg bg-amazon-orange px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90"
              >
                Try FREE tools
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
              <Link
                href="/kdp-formatter"
                className="inline-flex items-center gap-2 rounded-lg border border-amazon-orange/50 px-4 py-2.5 text-sm font-medium text-white hover:bg-amazon-orange/10"
              >
                Get started with formatter
              </Link>
            </div>
          </section>
        )}
        <div className="flex flex-col mb-6">
          <h1 className={h1Class}>{platform.name}</h1>
          <div className="mt-3">
            <PlatformLogoBadge platformId={platform.id} platformName={platform.name} size="lg" />
          </div>
          <p className={`${taglineClass} mt-3`}>{platform.tagline}</p>
        </div>

        {freeTools.length > 0 && (
          <div className="mb-6">
            <h2 className={sectionTitleClass} style={{ color: FREE_GREEN }}>FREE tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {freeTools.map((tool) => (
                <CompactToolCard key={tool.id} tool={tool} amazon={amazon} />
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          {paidTools.length > 0 && <h2 className={sectionTitleClass}>Tools</h2>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {paidTools.map((tool) => (
              <CompactToolCard key={tool.id} tool={tool} amazon={amazon} />
            ))}
            {comingSoonTitles.map((title) => (
              <ComingSoonCard key={title} title={title} amazon={amazon} />
            ))}
          </div>
        </div>

        <Link href="/#tools" className={backClass}>
          ← Back to all tools
        </Link>

        {amazon && (
          <>
            <section className="mt-12 mb-10 max-w-xl">
              <h2 className={sectionTitleClass}>Get formatting tips and tool updates</h2>
              {leadsStatus === "success" ? (
                <p className="font-sans text-sm text-amazon-orange">
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
                    className="w-full rounded-lg border border-amazon-orange/30 px-4 py-2.5 bg-amazon-card font-sans text-sm text-white placeholder-amazon-muted focus:outline-none focus:ring-2 focus:ring-amazon-orange"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={leadsEmail}
                      onChange={(e) => setLeadsEmail(e.target.value)}
                      required
                      className="flex-1 rounded-lg border border-amazon-orange/30 px-4 py-2.5 bg-amazon-card font-sans text-sm text-white placeholder-amazon-muted focus:outline-none focus:ring-2 focus:ring-amazon-orange"
                    />
                    <button
                      type="submit"
                      disabled={leadsStatus === "loading"}
                      className="rounded-lg px-5 py-2.5 text-sm font-semibold bg-amazon-orange text-black hover:opacity-90 disabled:opacity-60"
                    >
                      {leadsStatus === "loading" ? "Submitting…" : "Submit"}
                    </button>
                  </div>
                </form>
              )}
              {leadsStatus === "error" && leadsErrorMsg && (
                <p className="mt-2 font-sans text-sm text-red-400">{leadsErrorMsg}</p>
              )}
            </section>
            <section className="border-t-2 border-b-2 border-amazon-orange/40 bg-amazon-card/50 rounded-xl py-12 px-6">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="font-bebas text-2xl sm:text-3xl tracking-wide text-white mb-3">
                  This isn&apos;t just a tool. It&apos;s a publishing business.
                </h2>
                <p className="font-sans text-sm leading-relaxed text-amazon-muted mb-6">
                  manu2print is building the publishing stack every indie author needs. Founders get in FREE forever and earn from every author they refer.
                  <br />
                  <span className="font-bebas text-xl tracking-widest text-amazon-orange uppercase mt-2 inline-block">Limited invitations.</span>
                </p>
                <Link
                  href="/founders"
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold bg-amazon-orange text-black hover:opacity-90"
                >
                  Apply for Founder Access
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
