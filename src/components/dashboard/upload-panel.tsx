"use client";

import { Card } from "@/components/ui/card";
import { Upload, FileText, CheckCircle2, Zap, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

interface UploadPanelProps {
  scansRemaining: number;
}

export function UploadPanel({ scansRemaining }: UploadPanelProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="overflow-hidden">
        <div className="p-6 lg:p-8">
          {/* CTA zone */}
          <Link href="/kdp-pdf-checker" className="block group">
            <div className="border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 hover:scale-[1.01]"
              style={{ borderColor: "rgba(240,90,40,0.3)", background: "rgba(240,90,40,0.02)" }}>
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-5 transition-all duration-200 group-hover:scale-110"
                style={{ background: "#F05A28" }}>
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--d-fg)" }}>Check a New PDF</h3>
              <p className="mb-5" style={{ color: "var(--d-fg-muted)" }}>
                Upload your PDF and get a full KDP compliance report in under 90 seconds.
              </p>
              <span className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition-opacity group-hover:opacity-90"
                style={{ background: "#F05A28" }}>
                Go to KDP Checker
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 border-t divide-x" style={{ borderColor: "var(--d-border)", background: "var(--d-muted)" }}>
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
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--d-fg)" }}>What We Check</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            "Bleed & Margins",
            "Image Resolution (300 DPI)",
            "Color Profile (CMYK/RGB)",
            "Font Embedding",
            "Page Size & Trim",
            "Spine Width Calculation",
          ].map((item) => (
            <Card key={item} className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(16,185,129,0.1)" }}>
                <CheckCircle2 className="w-4 h-4" style={{ color: "#10b981" }} />
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--d-fg)" }}>{item}</span>
            </Card>
          ))}
        </div>
      </div>

      {/* Publishing flow */}
      <Card className="p-6">
        <h2 className="text-base font-semibold mb-6" style={{ color: "var(--d-fg)" }}>Your Publishing Flow</h2>
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
