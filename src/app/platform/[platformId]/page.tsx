"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PLATFORMS, getToolsForPlatform, type Tool } from "@/data/platformTools";

/** Small tool card for platform page — fits more above the fold. */
function CompactToolCard({ tool }: { tool: Tool }) {
  return (
    <div className="rounded-lg border-l-2 border-brand-gold border border-brand-cardHover p-3 bg-brand-card hover:shadow-gold-glow hover:border-brand-cardHover transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-bebas text-base tracking-wide text-brand-cream truncate">{tool.title}</h4>
          <p className="font-sans text-xs text-brand-muted mt-0.5 line-clamp-2">{tool.description}</p>
        </div>
        <div className="flex-shrink-0">
          {tool.available ? (
            <Link
              href={tool.href}
              className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold bg-brand-gold text-brand-bg hover:opacity-90"
            >
              Open
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          ) : (
            <span className="rounded-md px-3 py-1.5 text-xs font-medium text-brand-muted bg-brand-locked border border-brand-cardHover">
              Soon
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Placeholder for coming-soon tools on platform page. */
function ComingSoonCard({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-brand-cardHover border-dashed p-3 bg-brand-card/50 opacity-80">
      <h4 className="font-bebas text-base tracking-wide text-brand-muted">{title}</h4>
      <p className="font-sans text-xs text-brand-muted mt-1">Coming soon</p>
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
  const tools = platform ? getToolsForPlatform(platform.toolIds) : [];
  const comingSoonTitles = getComingSoonTitles(platformId);
  const initial = platform?.name.charAt(0) ?? "?";

  if (!platform) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-6">
        <p className="font-sans text-brand-muted mb-4">Platform not found.</p>
        <Link href="/" className="text-brand-gold hover:underline">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <nav className="sticky top-0 z-20 border-b border-white/5 bg-brand-bg/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-brand-gold">
              <svg className="w-4 h-4" fill="none" stroke="#0F0D0B" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-brand-cream">
              <span className="font-serif">manu</span>
              <span className="font-sans">2print</span>
            </span>
          </Link>
          <Link href="/#tools" className="text-sm font-medium text-brand-cream hover:text-brand-gold transition-colors">
            All platforms
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Platform header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-lg bg-brand-cardHover flex items-center justify-center flex-shrink-0 text-2xl font-bebas tracking-wide text-brand-gold">
            {initial}
          </div>
          <div>
            <h1 className="font-bebas text-2xl sm:text-3xl tracking-wide text-brand-cream">{platform.name}</h1>
            <p className="font-sans text-sm text-brand-muted mt-0.5">{platform.tagline}</p>
          </div>
        </div>

        {/* Compact tool grid — 4 cols desktop so more above the fold */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8">
          {tools.map((tool) => (
            <CompactToolCard key={tool.id} tool={tool} />
          ))}
          {comingSoonTitles.map((title) => (
            <ComingSoonCard key={title} title={title} />
          ))}
        </div>

        <Link href="/#tools" className="font-sans text-sm text-brand-gold hover:underline">
          ← Back to all platforms
        </Link>
      </main>
    </div>
  );
}
