"use client";

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

const COMING_SOON_KDP = ["KDP Format Review", "Spine width calculator"];
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
            All platforms
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <PlatformLogoBadge platformId={platform.id} platformName={platform.name} size="lg" />
          <div>
            <h1 className={h1Class}>{platform.name}</h1>
            <p className={taglineClass}>{platform.tagline}</p>
          </div>
        </div>

        {freeTools.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bebas text-lg tracking-wide text-brand-cream mb-3">Free tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {freeTools.map((tool) => (
                <CompactToolCard key={tool.id} tool={tool} amazon={amazon} />
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          {paidTools.length > 0 && <h2 className="font-bebas text-lg tracking-wide text-brand-cream mb-3">Tools</h2>}
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
          ← Back to all platforms
        </Link>
      </main>
    </div>
  );
}
