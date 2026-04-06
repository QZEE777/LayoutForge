"use client";

import { Card } from "@/components/ui/card";
import { FileText, CheckCircle2, AlertTriangle, XCircle, Clock, Eye, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type ScanStatus = "passed" | "warnings" | "failed" | "unknown";

interface Scan {
  id: string;
  fileName: string;
  scanDate: string;
  grade: string | null;
  issueCount: number;
  kdpReady: boolean;
  riskLevel: string | null;
}

interface Props {
  scans: Scan[];
}

function derivedStatus(scan: Scan): ScanStatus {
  if (scan.kdpReady) return "passed";
  if (scan.riskLevel === "high" || scan.issueCount > 2) return "failed";
  if (scan.issueCount > 0) return "warnings";
  return "unknown";
}

const statusConfig: Record<ScanStatus, { icon: React.ElementType; label: string; bg: string; text: string }> = {
  passed:   { icon: CheckCircle2,  label: "Passed",   bg: "rgba(16,185,129,0.1)", text: "#10b981" },
  warnings: { icon: AlertTriangle, label: "Warnings", bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
  failed:   { icon: XCircle,       label: "Failed",   bg: "rgba(239,68,68,0.1)",  text: "#ef4444" },
  unknown:  { icon: FileText,      label: "Scanned",  bg: "rgba(100,116,139,0.1)", text: "#64748b" },
};

export function ScanHistoryPanel({ scans }: Props) {
  if (scans.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="d-card-elevated border-[var(--d-border-strong)] p-10 text-center sm:p-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-inner" style={{ background: "var(--d-muted)" }}>
            <FileText className="h-8 w-8" style={{ color: "var(--d-fg-muted)" }} />
          </div>
          <h3 className="mb-2 text-xl font-bold" style={{ color: "var(--d-fg)" }}>No scans on this account yet</h3>
          <p className="mx-auto mb-2 max-w-md text-sm leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
            This list fills in when you complete a PDF check using the <strong className="font-semibold text-[var(--d-fg)]">same email</strong> as your
            dashboard login. If you paid with another address, use the account portal under Settings → Purchase history.
          </p>
          <p className="mx-auto mb-6 max-w-md text-xs leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
            Tip: use <strong className="font-semibold">Overview</strong> in the sidebar to start a scan and see a live preview of recent reports.
          </p>
          <Link href="/kdp-pdf-checker" className="d-cta d-cta-md inline-flex">
            <Upload className="h-4 w-4" />
            Go to PDF checker
          </Link>
        </Card>
      </div>
    );
  }

  const passed = scans.filter((s) => derivedStatus(s) === "passed").length;
  const needsAttention = scans.filter((s) => derivedStatus(s) !== "passed").length;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Total scans",     value: scans.length, icon: FileText,     bg: "var(--d-muted)",        color: "var(--d-fg)" },
          { label: "Passed",          value: passed,       icon: CheckCircle2, bg: "rgba(16,185,129,0.12)", color: "#10b981" },
          { label: "Need attention",  value: needsAttention, icon: AlertTriangle, bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <Card key={label} className="d-card-elevated border-[var(--d-border-strong)] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: "var(--d-fg)" }}>{value}</p>
                <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="d-card-elevated overflow-hidden border-[var(--d-border-strong)]">
        <div className="border-b px-4 py-3" style={{ borderColor: "var(--d-border)" }}>
          <h2 className="font-bold" style={{ color: "var(--d-fg)" }}>Recent scans</h2>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--d-border)" }}>
          {scans.map((scan) => {
            const st = derivedStatus(scan);
            const { icon: StatusIcon, label, bg, text } = statusConfig[st];
            return (
              <div
                key={scan.id}
                className="flex items-center gap-3 p-3 transition-colors hover:bg-[var(--d-muted)]/60 sm:gap-4 sm:p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm" style={{ background: "var(--d-muted)" }}>
                  <FileText className="h-5 w-5" style={{ color: "var(--d-fg-muted)" }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--d-fg)" }}>{scan.fileName}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs" style={{ color: "var(--d-fg-muted)" }}>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 shrink-0" />
                      {new Date(scan.scanDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {scan.grade && <span className="font-semibold">Grade {scan.grade}</span>}
                    {scan.issueCount > 0 && <span className="font-medium text-amber-600">{scan.issueCount} issue{scan.issueCount > 1 ? "s" : ""}</span>}
                  </div>
                </div>
                <div
                  className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold sm:px-3 sm:py-1.5"
                  style={{ background: bg, color: text }}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                  {label}
                </div>
                <Link
                  href={`/download/${scan.id}`}
                  title="View report"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[var(--d-border)] bg-white p-2.5 shadow-sm transition-all hover:border-[#f05a28]/40 hover:text-[var(--d-primary)] hover:shadow-md"
                  style={{ color: "var(--d-fg-muted)" }}
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
