"use client";

import { Card } from "@/components/ui/card";
import { ArrowRight, Wrench } from "lucide-react";
import Link from "next/link";

interface Tool {
  id: string;
  title: string;
  description: string;
  href: string;
  comingSoon?: boolean;
  iconPath: string;
}

// Free tools from platformTools.ts — linked to real routes
const FREE_TOOLS: Tool[] = [
  { id: "pdf-compress",           title: "PDF Compressor",            description: "Shrink PDFs up to 50 MB. No account needed.",              href: "/pdf-compress",            iconPath: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0l-4-4m4 4V4" },
  { id: "royalty-calculator",     title: "KDP Royalty Calculator",     description: "Estimate earnings by page count, trim, and list price.",   href: "/royalty-calculator",      iconPath: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { id: "page-count-estimator",   title: "Page Count Estimator",       description: "Estimate interior pages from word count and trim size.",   href: "/page-count-estimator",    iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { id: "trim-size-comparison",   title: "Trim Size Comparison",       description: "Compare print cost and royalty across trim sizes.",        href: "/trim-size-comparison",    iconPath: "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" },
  { id: "spine-calculator",       title: "Spine Width Calculator",     description: "Exact spine width for KDP paperbacks.",                    href: "/spine-calculator",        iconPath: "M4 6h16M4 10h16M4 14h16M4 18h16" },
  { id: "cover-calculator",       title: "Full-Wrap Cover Calculator", description: "Cover canvas size in inches and pixels (300 DPI).",        href: "/cover-calculator",        iconPath: "M3 6h18v12H3V6z" },
  { id: "interior-template",      title: "KDP Interior Template",      description: "Download a print-ready template for Canva.",               href: "/interior-template",       iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "banned-keyword-checker", title: "Banned Keyword Checker",     description: "Spot risky words before publishing.",                      href: "/banned-keyword-checker",  iconPath: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  { id: "kids-trim-guide",        title: "Kids Book Trim Guide",       description: "Trim sizes for picture books and children's titles.",       href: "/kids-trim-guide",         iconPath: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", comingSoon: true },
  { id: "journals-guide",         title: "Journals & Coloring Guide",  description: "Tips for journals, workbooks, coloring and puzzle books.", href: "/journals-coloring-puzzle-guide", iconPath: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", comingSoon: true },
  { id: "pdf-optimizer",          title: "PDF Print Optimizer",        description: "Optimize your PDF for print-on-demand.",                   href: "/kdp-formatter-pdf",       iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
];

export function ToolsPanel() {
  return (
    <div className="d-animate-in mx-auto max-w-5xl space-y-5">
      <div className="d-hero-intro">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="font-bebas text-2xl tracking-wide text-[var(--d-fg)]">Tools</p>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
              Every tool below is free — no payment or account required.
            </p>
          </div>
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center self-center rounded-2xl shadow-md sm:self-start"
            style={{
              background: "linear-gradient(145deg, rgba(240,90,40,0.15), rgba(76,217,100,0.12))",
            }}
          >
            <Wrench className="h-8 w-8" style={{ color: "var(--d-primary)" }} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FREE_TOOLS.map((tool) => {
          const cardContent = (
            <Card className={`d-card-quiet relative h-full border-[var(--d-border-strong)] p-5 transition-all duration-200 ${tool.comingSoon ? "opacity-95" : "hover:-translate-y-0.5 hover:border-[#f05a28]/25 hover:shadow-lg"}`}>
              {tool.comingSoon && (
                <span
                  className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                  style={{ background: "rgba(240,90,40,0.12)", color: "#c2410c" }}
                >
                  Soon
                </span>
              )}
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner transition-colors group-hover:bg-[#f05a28]/12"
                  style={{ background: "rgba(240,90,40,0.08)", color: "#F05A28" }}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    className="mb-1 text-sm font-bold transition-colors group-hover:text-[var(--d-primary)]"
                    style={{ color: "var(--d-fg)" }}
                  >
                    {tool.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>{tool.description}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs font-bold transition-colors" style={{ color: "#F05A28" }}>
                {tool.comingSoon ? "Coming soon" : "Open tool"}
                {!tool.comingSoon && <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />}
              </div>
            </Card>
          );

          if (tool.comingSoon) {
            return (
              <div key={tool.id} className="group block cursor-not-allowed" aria-disabled="true">
                {cardContent}
              </div>
            );
          }

          return (
            <Link key={tool.id} href={tool.href} className="group block">
              {cardContent}
            </Link>
          );
        })}
      </div>

      <Card
        className="d-card-hero flex flex-col gap-4 border-[#f05a28]/25 p-5 sm:flex-row sm:items-center sm:justify-between"
        style={{ background: "linear-gradient(135deg, rgba(255,248,244,0.98) 0%, rgba(232,245,233,0.4) 100%)" }}
      >
        <div>
          <h3 className="mb-0.5 font-bold" style={{ color: "var(--d-fg)" }}>KDP PDF Checker</h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
            All 26 rules, annotated PDF, page-level fixes — $9 per scan (or use a credit).
          </p>
        </div>
        <Link href="/kdp-pdf-checker" className="d-cta d-cta-md shrink-0">
          Check PDF — $9
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
    </div>
  );
}
