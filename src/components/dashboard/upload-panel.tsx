"use client";

import { Card } from "@/components/ui/card";
import { Upload, FileText, CheckCircle2, Zap, Shield, ArrowRight, Clock, Eye } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type RecentScan = {
  id: string;
  fileName: string;
  scanDate: string;
  grade: string | null;
  issueCount: number;
  kdpReady: boolean;
  riskLevel: string | null;
};

interface UploadPanelProps {
  scansRemaining: number;
  recentScans: RecentScan[];
  onViewAllScans: () => void;
}

type ScanStatus = "passed" | "warnings" | "failed" | "unknown";

function derivedStatus(scan: RecentScan): ScanStatus {
  if (scan.kdpReady) return "passed";
  if (scan.riskLevel === "high" || scan.issueCount > 2) return "failed";
  if (scan.issueCount > 0) return "warnings";
  return "unknown";
}

const statusDot: Record<ScanStatus, string> = {
  passed: "bg-emerald-500",
  warnings: "bg-amber-500",
  failed: "bg-red-500",
  unknown: "bg-slate-400",
};

const MAX_INLINE = 6;

export function UploadPanel({ scansRemaining, recentScans, onViewAllScans }: UploadPanelProps) {
  const preview = recentScans.slice(0, MAX_INLINE);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 lg:items-start">
        {/* Left: primary checker CTA (only prominent “Check PDF” in main area) */}
        <div className="space-y-6">
          <Card className="d-card-elevated overflow-hidden border-[var(--d-border-strong)]">
            <div className="p-5 sm:p-6 lg:p-7">
              <Link href="/kdp-pdf-checker" className="group block">
                <div
                  className="rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 hover:border-[#f05a28]/50 hover:shadow-[0_16px_48px_-20px_rgba(240,90,40,0.2)] sm:p-8"
                  style={{
                    borderColor: "rgba(240,90,40,0.28)",
                    background: "linear-gradient(180deg, rgba(255,248,244,0.9) 0%, rgba(255,255,255,0.5) 100%)",
                  }}
                >
                  <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform duration-200 group-hover:scale-105 sm:h-16 sm:w-16"
                    style={{ background: "linear-gradient(145deg, #ff7a4a 0%, #f05a28 100%)" }}
                  >
                    <Upload className="h-7 w-7 text-white sm:h-8 sm:w-8" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold sm:text-xl" style={{ color: "var(--d-fg)" }}>
                    Check a new PDF
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
                    Full KDP compliance report in under 90 seconds.
                  </p>
                  <span className="d-cta d-cta-lg inline-flex">
                    {scansRemaining > 0 ? "Upload & use 1 credit" : "Check my PDF — $9"}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  {scansRemaining > 0 && (
                    <p className="mt-3 text-xs font-medium" style={{ color: "var(--d-fg-muted)" }}>
                      {scansRemaining} credit{scansRemaining !== 1 ? "s" : ""} remaining — use your signed-in email on
                      the checker for instant credit.
                    </p>
                  )}
                </div>
              </Link>
            </div>

            <div
              className="grid grid-cols-3 divide-x border-t"
              style={{ borderColor: "var(--d-border)", background: "var(--d-muted)" }}
            >
              {[
                { icon: Zap, label: "Scan time", value: "<90s", color: "#10b981" },
                { icon: Shield, label: "KDP rules", value: "26", color: "#F05A28" },
                { icon: CheckCircle2, label: "Credits left", value: String(scansRemaining), color: "var(--d-fg)" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="px-2 py-4 text-center sm:p-5">
                  <div className="mb-1 flex items-center justify-center gap-1">
                    <Icon className="h-4 w-4 shrink-0" style={{ color }} />
                    <span className="text-xl font-bold tabular-nums sm:text-2xl" style={{ color }}>
                      {value}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-sm" style={{ color: "var(--d-fg-muted)" }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: recent scans — same data as My Scans, so the overview never feels empty */}
        <Card className="d-card-elevated flex flex-col overflow-hidden border-[var(--d-border-strong)] min-h-[280px] lg:min-h-[320px]">
          <div
            className="flex items-center justify-between gap-2 border-b px-4 py-3"
            style={{ borderColor: "var(--d-border)" }}
          >
            <div>
              <h2 className="text-sm font-bold sm:text-base" style={{ color: "var(--d-fg)" }}>
                Recent scans
              </h2>
              <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>
                Same list as My Scans — quick access from here
              </p>
            </div>
            {recentScans.length > 0 && (
              <button
                type="button"
                onClick={onViewAllScans}
                className="d-link shrink-0 text-xs font-semibold sm:text-sm"
              >
                View all
              </button>
            )}
          </div>

          {preview.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: "var(--d-muted)" }}
              >
                <FileText className="h-6 w-6" style={{ color: "var(--d-fg-muted)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--d-fg)" }}>
                  No scans yet
                </p>
                <p className="mx-auto mt-1 max-w-[240px] text-xs leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
                  After you run the checker, reports show up here automatically when the email matches your account.
                </p>
              </div>
              <Link href="/kdp-pdf-checker" className="d-cta d-cta-md inline-flex text-sm">
                <Upload className="h-4 w-4" />
                Start first scan
              </Link>
            </div>
          ) : (
            <ul className="divide-y overflow-y-auto max-h-[min(420px,55vh)]" style={{ borderColor: "var(--d-border)" }}>
              {preview.map((scan) => {
                const st = derivedStatus(scan);
                return (
                  <li key={scan.id}>
                    <Link
                      href={`/download/${scan.id}`}
                      className="flex items-center gap-3 p-3 transition-colors hover:bg-[var(--d-muted)]/50 sm:gap-4 sm:p-3.5"
                    >
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", statusDot[st])} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold" style={{ color: "var(--d-fg)" }}>
                          {scan.fileName}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs" style={{ color: "var(--d-fg-muted)" }}>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" />
                            {new Date(scan.scanDate).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {scan.grade && <span>Grade {scan.grade}</span>}
                          {scan.issueCount > 0 && (
                            <span className="font-medium text-amber-700">
                              {scan.issueCount} issue{scan.issueCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </p>
                      </div>
                      <span
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--d-border)] bg-white px-2 py-1.5 text-xs font-semibold shadow-sm"
                        style={{ color: "var(--d-fg-muted)" }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Open
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {recentScans.length > MAX_INLINE && (
            <div className="border-t p-3 text-center" style={{ borderColor: "var(--d-border)" }}>
              <button type="button" onClick={onViewAllScans} className="d-link text-sm font-semibold">
                View all {recentScans.length} scans →
              </button>
            </div>
          )}
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-base font-bold" style={{ color: "var(--d-fg)" }}>
          What we check
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Bleed & margins",
            "Image resolution (300 DPI)",
            "Color profile (CMYK/RGB)",
            "Font embedding",
            "Page size & trim",
            "Spine width calculation",
          ].map((item) => (
            <Card
              key={item}
              className="d-card-elevated flex items-center gap-3 border-[var(--d-border-strong)] p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(76,217,100,0.12)" }}>
                <CheckCircle2 className="h-4 w-4" style={{ color: "#16a34a" }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: "var(--d-fg)" }}>
                {item}
              </span>
            </Card>
          ))}
        </div>
      </div>

      <Card className="d-card-elevated border-[var(--d-border-strong)] p-6">
        <h2 className="mb-6 text-base font-bold" style={{ color: "var(--d-fg)" }}>
          Your publishing flow
        </h2>
        <div className="relative flex items-start justify-between">
          <div className="absolute left-12 right-12 top-5 h-px" style={{ background: "var(--d-border)" }} />
          {[
            { label: "Upload PDF", icon: Upload, active: true },
            { label: "Scan", icon: Zap, active: false },
            { label: "Review report", icon: FileText, active: false },
            { label: "Publish to KDP", icon: CheckCircle2, active: false },
          ].map(({ label, icon: Icon, active }) => (
            <div key={label} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full transition-all"
                style={{
                  background: active ? "#F05A28" : "var(--d-muted)",
                  color: active ? "#fff" : "var(--d-fg-muted)",
                  boxShadow: active ? "0 4px 12px rgba(240,90,40,0.3)" : "none",
                }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="max-w-[72px] text-center text-xs font-medium" style={{ color: active ? "var(--d-fg)" : "var(--d-fg-muted)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
