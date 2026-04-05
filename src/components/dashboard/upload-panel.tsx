"use client";

import { Card } from "@/components/ui/card";
import { Upload, FileText, CheckCircle2, Zap, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

interface UploadPanelProps {
  scansRemaining: number;
}

export function UploadPanel({ scansRemaining }: UploadPanelProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="d-card-elevated overflow-hidden border-[var(--d-border-strong)]">
        <div className="p-6 lg:p-8">
          <Link href="/kdp-pdf-checker" className="group block">
            <div
              className="rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 hover:scale-[1.01] hover:border-[#f05a28]/50 hover:shadow-[0_16px_48px_-20px_rgba(240,90,40,0.2)] lg:p-10"
              style={{ borderColor: "rgba(240,90,40,0.28)", background: "linear-gradient(180deg, rgba(255,248,244,0.9) 0%, rgba(255,255,255,0.5) 100%)" }}
            >
              <div
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-transform duration-200 group-hover:scale-105"
                style={{ background: "linear-gradient(145deg, #ff7a4a 0%, #f05a28 100%)" }}
              >
                <Upload className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-bold" style={{ color: "var(--d-fg)" }}>Check a new PDF</h3>
              <p className="mb-5 text-sm leading-relaxed lg:text-base" style={{ color: "var(--d-fg-muted)" }}>
                Full KDP compliance report in under 90 seconds.
              </p>
              <span className="d-cta d-cta-lg inline-flex">
                {scansRemaining > 0 ? "Upload & use 1 credit" : "Check my PDF — $9"}
                <ArrowRight className="h-4 w-4" />
              </span>
              {scansRemaining > 0 && (
                <p className="mt-3 text-xs font-medium" style={{ color: "var(--d-fg-muted)" }}>
                  {scansRemaining} credit{scansRemaining !== 1 ? "s" : ""} remaining — no payment needed
                </p>
              )}
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-3 divide-x border-t" style={{ borderColor: "var(--d-border)", background: "var(--d-muted)" }}>
          {[
            { icon: Zap,          label: "Scan Time",         value: "<90s", color: "#10b981" },
            { icon: Shield,       label: "KDP Rules Checked", value: "26",   color: "#F05A28" },
            { icon: CheckCircle2, label: "Credits Left",      value: String(scansRemaining), color: "var(--d-fg)" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="p-5 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="text-2xl font-bold" style={{ color }}>{value}</span>
              </div>
              <p className="text-sm" style={{ color: "var(--d-fg-muted)" }}>{label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* What we check */}
      <div>
        <h2 className="mb-3 text-base font-bold" style={{ color: "var(--d-fg)" }}>What we check</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Bleed & margins",
            "Image resolution (300 DPI)",
            "Color profile (CMYK/RGB)",
            "Font embedding",
            "Page size & trim",
            "Spine width calculation",
          ].map((item) => (
            <Card key={item} className="d-card-elevated flex items-center gap-3 border-[var(--d-border-strong)] p-4 transition-shadow hover:shadow-md">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(76,217,100,0.12)" }}>
                <CheckCircle2 className="h-4 w-4" style={{ color: "#16a34a" }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: "var(--d-fg)" }}>{item}</span>
            </Card>
          ))}
        </div>
      </div>

      <Card className="d-card-elevated border-[var(--d-border-strong)] p-6">
        <h2 className="mb-6 text-base font-bold" style={{ color: "var(--d-fg)" }}>Your publishing flow</h2>
        <div className="flex items-start justify-between relative">
          <div className="absolute top-5 left-12 right-12 h-px" style={{ background: "var(--d-border)" }} />
          {[
            { label: "Upload PDF",    icon: Upload,       active: true },
            { label: "Scan",          icon: Zap,          active: false },
            { label: "Review Report", icon: FileText,     active: false },
            { label: "Publish to KDP",icon: CheckCircle2, active: false },
          ].map(({ label, icon: Icon, active }) => (
            <div key={label} className="relative flex flex-col items-center gap-2 z-10">
              <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{ background: active ? "#F05A28" : "var(--d-muted)", color: active ? "#fff" : "var(--d-fg-muted)", boxShadow: active ? "0 4px 12px rgba(240,90,40,0.3)" : "none" }}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-center max-w-[70px]" style={{ color: active ? "var(--d-fg)" : "var(--d-fg-muted)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
