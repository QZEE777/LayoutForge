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
      <div className="max-w-2xl mx-auto">
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-5" style={{ background: "var(--d-muted)" }}>
            <FileText className="w-8 h-8" style={{ color: "var(--d-fg-muted)" }} />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--d-fg)" }}>No scans yet</h3>
          <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: "var(--d-fg-muted)" }}>
            Upload your first PDF to check it against all 26 KDP rules.
          </p>
          <Link href="/kdp-pdf-checker"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "#F05A28" }}>
            <Upload className="w-4 h-4" />
            Upload Your First PDF
          </Link>
        </Card>
      </div>
    );
  }

  const passed = scans.filter((s) => derivedStatus(s) === "passed").length;
  const needsAttention = scans.filter((s) => derivedStatus(s) !== "passed").length;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Scans",     value: scans.length, icon: FileText,     bg: "var(--d-muted)",        color: "var(--d-fg)" },
          { label: "Passed",          value: passed,       icon: CheckCircle2, bg: "rgba(16,185,129,0.1)", color: "#10b981" },
          { label: "Need Attention",  value: needsAttention, icon: AlertTriangle, bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <Card key={label} className="p-4">
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

      <Card>
        <div className="p-4 border-b" style={{ borderColor: "var(--d-border)" }}>
          <h2 className="font-semibold" style={{ color: "var(--d-fg)" }}>Recent Scans</h2>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--d-border)" }}>
          {scans.map((scan) => {
            const st = derivedStatus(scan);
            const { icon: StatusIcon, label, bg, text } = statusConfig[st];
            return (
              <div key={scan.id} className="p-4 flex items-center gap-4 hover:bg-[var(--d-muted)]/50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--d-muted)" }}>
                  <FileText className="w-5 h-5" style={{ color: "var(--d-fg-muted)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: "var(--d-fg)" }}>{scan.fileName}</p>
                  <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: "var(--d-fg-muted)" }}>
                    <Clock className="w-3 h-3" />
                    {new Date(scan.scanDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {scan.grade && <span className="font-semibold ml-1">Grade: {scan.grade}</span>}
                    {scan.issueCount > 0 && <span style={{ color: "#f59e0b" }}>{scan.issueCount} issue{scan.issueCount > 1 ? "s" : ""}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0"
                  style={{ background: bg, color: text }}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {label}
                </div>
                <Link href={`/download/${scan.id}`} title="View Report">
                  <button className="p-2 rounded-lg hover:bg-[var(--d-muted)] transition-colors" style={{ color: "var(--d-fg-muted)" }}>
                    <Eye className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
