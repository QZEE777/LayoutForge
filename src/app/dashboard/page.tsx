"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { PLATFORMS, getToolsForPlatform, type Tool } from "@/data/platformTools";

const kdp = PLATFORMS.find((p) => p.id === "kdp");
const ALL_TOOLS: Tool[] = kdp ? getToolsForPlatform(kdp.toolIds) : [];
const FREE_TOOLS = ALL_TOOLS.filter((t) => t.free);
const PAID_TOOLS = ALL_TOOLS.filter((t) => !t.free);

type Scan = {
  id: string;
  fileName: string;
  scanDate: string;
  grade: string | null;
  gradeLabel: string | null;
  score: number | null;
  issueCount: number;
  kdpReady: boolean;
  riskLevel: string | null;
  creationTool: string | null;
};

type Summary = {
  recentScans: Scan[];
  credits: { total: number; used: number; remaining: number };
};

// ── Helpers ────────────────────────────────────────────────────────────────

function gradeColor(grade: string | null): string {
  if (!grade) return "#9B8E7E";
  if (grade === "A+" || grade === "A") return "#4cd964";
  if (grade === "B") return "#a3d977";
  if (grade === "C") return "#f05a28";
  return "#ef4444";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

function ScoreGradeBadge({ grade, score }: { grade: string | null; score: number | null }) {
  const color = gradeColor(grade);
  return (
    <div className="flex items-center gap-2 shrink-0">
      {grade && (
        <span className="font-bebas text-3xl leading-none" style={{ color }}>{grade}</span>
      )}
      {score !== null && (
        <span className="text-xs font-semibold" style={{ color: "rgba(0,0,0,0.35)" }}>{score}/100</span>
      )}
    </div>
  );
}

function StatusPill({ kdpReady, issueCount }: { kdpReady: boolean; issueCount: number }) {
  if (kdpReady) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
        style={{ background: "rgba(76,217,100,0.12)", color: "#2d8a3e" }}>
        ✓ Ready
      </span>
    );
  }
  if (issueCount > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
        style={{ background: "rgba(240,90,40,0.1)", color: "#c04010" }}>
        {issueCount} {issueCount === 1 ? "issue" : "issues"}
      </span>
    );
  }
  return null;
}

function EmptyState({ icon, title, body, action, actionHref }: {
  icon: string; title: string; body: string; action?: string; actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-10 px-6 text-center"
      style={{ borderColor: "rgba(0,0,0,0.1)" }}>
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="font-semibold text-sm" style={{ color: "#2C1810" }}>{title}</p>
        <p className="text-xs mt-1" style={{ color: "#9B8E7E" }}>{body}</p>
      </div>
      {action && actionHref && (
        <Link href={actionHref}
          className="mt-1 text-xs font-semibold rounded-lg px-4 py-2 transition-all hover:opacity-80"
          style={{ background: "#f05a28", color: "#fff" }}>
          {action}
        </Link>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user,    setUser]    = useState<User | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/auth"); return; }
      setUser(user);
      fetch("/api/dashboard/summary", { method: "GET", credentials: "include" })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data) setSummary(data); })
        .finally(() => setLoading(false));
    });
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F0E8" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 animate-spin"
            style={{ borderColor: "rgba(240,90,40,0.15)", borderTopColor: "#f05a28" }} />
          <p className="text-sm" style={{ color: "#9B8E7E" }}>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const credits      = summary?.credits;
  const recentScans  = summary?.recentScans ?? [];
  const lastScan     = recentScans[0] ?? null;
  const needsFixing  = recentScans.filter((s) => !s.kdpReady && s.issueCount > 0);
  const readyScans   = recentScans.filter((s) => s.kdpReady);

  // Status strip message
  const statusMsg = lastScan
    ? lastScan.kdpReady
      ? "Your latest scan passed — you're clear to upload to KDP."
      : `Your latest scan found ${lastScan.issueCount} issue${lastScan.issueCount === 1 ? "" : "s"} — review and fix before uploading.`
    : "Before you upload to KDP, check every issue with confidence.";

  const statusColor = lastScan
    ? lastScan.kdpReady ? "#2d8a3e" : "#c04010"
    : "#6B5E4E";

  const statusBg = lastScan
    ? lastScan.kdpReady ? "rgba(76,217,100,0.08)" : "rgba(240,90,40,0.07)"
    : "rgba(0,0,0,0.04)";

  // Next step
  const nextStep = lastScan
    ? lastScan.kdpReady
      ? "Your file passed checks. Upload it to KDP with confidence."
      : "Review your annotated PDF report, fix the flagged issues, then re-check."
    : "Upload your PDF to get a page-by-page compliance report before submitting to KDP.";

  return (
    <div className="min-h-screen" style={{ background: "#F5F0E8" }}>
      {/* ── Nav ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b" style={{ background: "#F5F0E8", borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/MANNY AVATAR.png" alt="manu2print" width={32} height={32} className="rounded-full" />
            <span>
              <span style={{ color: "#F05A28", fontWeight: "bold", fontSize: "1.15rem" }}>manu</span>
              <span style={{ color: "#4cd964", fontWeight: "bold", fontSize: "1.15rem" }}>2print</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/" className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:opacity-70" style={{ color: "#6B5E4E" }}>Home</Link>
            <Link href="/dashboard/profile" className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:opacity-70" style={{ color: "#6B5E4E" }}>Profile</Link>
            <button type="button"
              onClick={async () => { const c = createClient(); await c.auth.signOut(); router.replace("/auth"); }}
              className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: "#6B5E4E" }}>
              Log out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <Image src="/MANNY AVATAR.png" alt="Manny" width={56} height={56} style={{ borderRadius: "50%", flexShrink: 0 }} />
          <div>
            <h1 className="font-bebas text-3xl tracking-wide" style={{ color: "#2C1810" }}>
              Publishing Dashboard
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#9B8E7E" }}>{user.email}</p>
          </div>
        </div>

        {/* ── Status Strip ───────────────────────────────────────── */}
        <div className="rounded-xl px-5 py-3.5 flex items-center gap-3"
          style={{ background: statusBg, border: `1px solid ${statusColor}22` }}>
          <span className="text-lg shrink-0">
            {lastScan ? (lastScan.kdpReady ? "✅" : "⚠️") : "📋"}
          </span>
          <p className="text-sm font-medium" style={{ color: statusColor }}>{statusMsg}</p>
        </div>

        {/* ── Primary Action + Next Step ─────────────────────────── */}
        <div className={`grid gap-5 ${lastScan ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
          {/* Upload CTA */}
          <div className="rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: "#2C1810", boxShadow: "0 4px 24px rgba(44,24,16,0.18)" }}>
            <div>
              <p className="font-bebas text-2xl tracking-wide" style={{ color: "#fff" }}>
                Upload New PDF
              </p>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                Check your file before you upload it to KDP.
              </p>
            </div>
            <div className="flex-1" />
            <div>
              <Link href="/kdp-pdf-checker"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-sm transition-all hover:scale-[1.02]"
                style={{ background: "#f05a28", color: "#fff", boxShadow: "0 4px 16px rgba(240,90,40,0.35)" }}>
                Check My PDF →
              </Link>
              <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.28)" }}>
                Works with Canva, Word, and PDF exports.
              </p>
            </div>
          </div>

          {/* Next Step — only shown when a previous scan exists */}
          {lastScan && (
            <div className="rounded-2xl p-6 flex flex-col gap-3 border"
              style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "rgba(240,90,40,0.12)", color: "#f05a28" }}>→</span>
                <p className="font-semibold text-sm" style={{ color: "#2C1810" }}>Next Step</p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#6B5E4E" }}>{nextStep}</p>
              <div className="mt-auto pt-2 flex flex-wrap gap-2">
                {!lastScan.kdpReady && (
                  <Link href={`/download/${lastScan.id}?source=checker`}
                    className="text-xs font-semibold rounded-lg px-3 py-2 transition-all hover:opacity-80"
                    style={{ background: "rgba(240,90,40,0.1)", color: "#c04010" }}>
                    Review Report →
                  </Link>
                )}
                {lastScan.kdpReady && (
                  <Link href="/kdp-pdf-checker"
                    className="text-xs font-semibold rounded-lg px-3 py-2 transition-all hover:opacity-80"
                    style={{ background: "rgba(76,217,100,0.12)", color: "#2d8a3e" }}>
                    Scan Next Book →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Last Scan ──────────────────────────────────────────── */}
        <section>
          <h2 className="font-bebas text-xl tracking-wide mb-3" style={{ color: "#2C1810" }}>Your Last Scan</h2>
          {lastScan ? (
            <div className="rounded-2xl border p-5 hover:shadow-sm transition-shadow"
              style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
              <div className="flex items-start gap-4">
                <ScoreGradeBadge grade={lastScan.grade} score={lastScan.score} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-semibold text-sm truncate" style={{ color: "#2C1810" }}>
                      {lastScan.fileName}
                    </p>
                    <StatusPill kdpReady={lastScan.kdpReady} issueCount={lastScan.issueCount} />
                  </div>
                  <p className="text-xs" style={{ color: "#9B8E7E" }}>
                    Scanned {formatDate(lastScan.scanDate)}
                    {lastScan.creationTool ? ` · ${lastScan.creationTool}` : ""}
                  </p>
                  {lastScan.gradeLabel && (
                    <p className="text-xs mt-1" style={{ color: "#6B5E4E" }}>{lastScan.gradeLabel}</p>
                  )}
                </div>
                <Link href={`/download/${lastScan.id}?source=checker`}
                  className="shrink-0 text-xs font-semibold rounded-lg px-3 py-2 transition-all hover:opacity-80"
                  style={{ background: "rgba(240,90,40,0.08)", color: "#f05a28" }}>
                  View Report
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState icon="📄" title="Upload your first PDF"
              body="Check your file against all 26 KDP rules before you submit — results in under 90 seconds."
              action="Check Before You Upload — $9" actionHref="/kdp-pdf-checker" />
          )}
        </section>

        {/* ── Needs Fixing + Ready ───────────────────────────────── */}
        {recentScans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Needs Fixing */}
            <section>
              <h2 className="font-bebas text-xl tracking-wide mb-3" style={{ color: "#2C1810" }}>Needs Fixing</h2>
              {needsFixing.length > 0 ? (
                <div className="space-y-2">
                  {needsFixing.slice(0, 3).map((scan) => (
                    <div key={scan.id}
                      className="flex items-center gap-3 rounded-xl border px-4 py-3 hover:shadow-sm transition-shadow"
                      style={{ background: "#fff", borderColor: "rgba(240,90,40,0.18)", borderLeft: "3px solid #f05a28" }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#2C1810" }}>{scan.fileName}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#9B8E7E" }}>
                          {scan.issueCount} {scan.issueCount === 1 ? "issue" : "issues"} · {formatDate(scan.scanDate)}
                        </p>
                      </div>
                      <Link href={`/download/${scan.id}?source=checker`}
                        className="shrink-0 text-xs font-semibold rounded-lg px-3 py-2 transition-all hover:opacity-80"
                        style={{ background: "rgba(240,90,40,0.1)", color: "#c04010" }}>
                        Review Report →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border px-5 py-6 text-center"
                  style={{ borderColor: "rgba(76,217,100,0.2)", background: "rgba(76,217,100,0.04)" }}>
                  <p className="text-sm font-semibold" style={{ color: "#2d8a3e" }}>✓ No issues waiting</p>
                  <p className="text-xs mt-1" style={{ color: "#9B8E7E" }}>You&apos;re clear to keep moving.</p>
                </div>
              )}
            </section>

            {/* Ready to Upload */}
            <section>
              <h2 className="font-bebas text-xl tracking-wide mb-3" style={{ color: "#2C1810" }}>Ready to Upload</h2>
              {readyScans.length > 0 ? (
                <div className="space-y-2">
                  {readyScans.slice(0, 3).map((scan) => (
                    <div key={scan.id}
                      className="flex items-center gap-3 rounded-xl border px-4 py-3 hover:shadow-sm transition-shadow"
                      style={{ background: "#fff", borderColor: "rgba(76,217,100,0.25)", borderLeft: "3px solid #4cd964" }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#2C1810" }}>{scan.fileName}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#9B8E7E" }}>{formatDate(scan.scanDate)}</p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{ background: "rgba(76,217,100,0.12)", color: "#2d8a3e" }}>✓ Passed</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border px-5 py-6 text-center"
                  style={{ borderColor: "rgba(0,0,0,0.07)", background: "rgba(0,0,0,0.02)" }}>
                  <p className="text-sm font-semibold" style={{ color: "#6B5E4E" }}>Nothing ready yet</p>
                  <p className="text-xs mt-1" style={{ color: "#9B8E7E" }}>Review your report, fix the flagged issues, re-check — clean files appear here.</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ── Credits ────────────────────────────────────────────── */}
        <section>
          <h2 className="font-bebas text-xl tracking-wide mb-3" style={{ color: "#2C1810" }}>Scans Remaining</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl border p-5"
              style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
              {credits && credits.total > 0 ? (
                <div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="font-bebas text-5xl leading-none" style={{ color: "#2C1810" }}>
                      {credits.remaining}
                    </span>
                    <span className="text-sm mb-1.5" style={{ color: "#9B8E7E" }}>
                      of {credits.total} remaining
                    </span>
                  </div>
                  <div className="w-full rounded-full h-1.5 mb-3" style={{ background: "rgba(0,0,0,0.07)" }}>
                    <div className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.round((credits.remaining / credits.total) * 100)}%`,
                        background: credits.remaining > 3 ? "#4cd964" : "#f05a28",
                      }} />
                  </div>
                  <p className="text-xs" style={{ color: "#9B8E7E" }}>Credits never expire. Use them when you need.</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-sm mb-1" style={{ color: "#2C1810" }}>Pay per scan</p>
                  <p className="text-xs" style={{ color: "#9B8E7E" }}>
                    Each scan is $9. Or save more with a pack below.
                  </p>
                  <Link href="/kdp-pdf-checker"
                    className="inline-flex items-center gap-1 mt-3 text-xs font-semibold rounded-lg px-3 py-2 transition-all hover:opacity-80"
                    style={{ background: "#f05a28", color: "#fff" }}>
                    Check My PDF — $9
                  </Link>
                </div>
              )}
            </div>
            <div className="rounded-2xl border p-5"
              style={{ background: "rgba(240,90,40,0.04)", borderColor: "rgba(240,90,40,0.15)" }}>
              <p className="font-semibold text-sm mb-1" style={{ color: "#2C1810" }}>
                Working on more than one book?
              </p>
              <p className="text-xs mb-3" style={{ color: "#6B5E4E" }}>
                Save more with a scan pack. Credits never expire.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Author Pack", credits: 3,  price: "$19" },
                  { label: "Indie Pack",  credits: 10, price: "$39" },
                  { label: "Pro Pack",    credits: 25, price: "$79" },
                ].map((pack) => (
                  <Link key={pack.label} href="/#pricing"
                    className="flex flex-col rounded-lg px-3 py-2 text-center transition-all hover:opacity-80"
                    style={{ background: "#fff", border: "1px solid rgba(240,90,40,0.2)" }}>
                    <span className="text-xs font-bold" style={{ color: "#2C1810" }}>{pack.label}</span>
                    <span className="text-xs" style={{ color: "#f05a28" }}>{pack.credits} scans · {pack.price}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Publishing Flow ────────────────────────────────────── */}
        <section>
          <h2 className="font-bebas text-xl tracking-wide mb-3" style={{ color: "#2C1810" }}>Publishing Flow</h2>
          <div className="rounded-2xl border p-5"
            style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-1 flex-wrap">
              {["Upload PDF", "Scan", "Review Report", "Publish to KDP"].map((step, i, arr) => {
                const isActive = !lastScan && i === 0
                  ? true
                  : lastScan && !lastScan.kdpReady && i === 2
                  ? true
                  : lastScan && lastScan.kdpReady && i === 3
                  ? true
                  : false;
                const isPast = lastScan && !lastScan.kdpReady
                  ? i < 2
                  : lastScan && lastScan.kdpReady
                  ? i < 3
                  : false;
                return (
                  <div key={step} className="flex items-center gap-1">
                    <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                      style={{
                        background: isActive ? "#f05a28" : isPast ? "rgba(76,217,100,0.12)" : "rgba(0,0,0,0.04)",
                      }}>
                      <span className="text-xs font-semibold"
                        style={{ color: isActive ? "#fff" : isPast ? "#2d8a3e" : "#9B8E7E" }}>
                        {isPast ? "✓ " : ""}{step}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <span className="text-xs mx-0.5" style={{ color: "#D4C5B0" }}>→</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Free Tools ─────────────────────────────────────────── */}
        <section>
          <h2 className="font-bebas text-xl tracking-wide mb-1" style={{ color: "#2C1810" }}>Free Tools</h2>
          <p className="text-sm mb-3" style={{ color: "#9B8E7E" }}>No sign-in or payment required.</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {FREE_TOOLS.map((t) => (
              <li key={t.id}>
                <Link href={t.href}
                  className="flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:shadow-sm hover:border-opacity-60"
                  style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)", color: "#2C1810" }}>
                  <span>{t.title}</span>
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                    style={{ background: "rgba(76,217,100,0.12)", color: "#2d8a3e" }}>
                    FREE
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Paid Tools ─────────────────────────────────────────── */}
        {PAID_TOOLS.length > 0 && (
          <section>
            <h2 className="font-bebas text-xl tracking-wide mb-1" style={{ color: "#2C1810" }}>Paid Tools</h2>
            <p className="text-sm mb-3" style={{ color: "#9B8E7E" }}>Pay per scan or use your pack credits.</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PAID_TOOLS.map((t) => (
                <li key={t.id}>
                  <Link href={t.href}
                    className="flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:shadow-sm"
                    style={{ background: "#fff", borderColor: "rgba(240,90,40,0.2)", color: "#2C1810" }}>
                    <span>{t.title}</span>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{ background: "rgba(240,90,40,0.1)", color: "#f05a28" }}>
                      $9
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-center text-xs pb-4" style={{ color: "#C4B5A0" }}>
          © manu2print.com — Built for indie authors
        </p>
      </main>
    </div>
  );
}
