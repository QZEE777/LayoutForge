"use client";

import { useState, useEffect } from "react";

/**
 * HeroDemo — animated product walkthrough for the KDP PDF Checker hero section.
 * Simulates: Upload → Scanning → Results → loop
 * No video file needed. Pure React + CSS.
 */

const CHECKS = [
  { label: "Trim size validation",   status: "pass" },
  { label: "Margin compliance",      status: "fail" },
  { label: "Bleed zone analysis",    status: "pass" },
  { label: "Font embedding check",   status: "fail" },
  { label: "Image resolution",       status: "fail" },
  { label: "Page count accuracy",    status: "pass" },
];

const ISSUES = [
  { page: "p.3",     label: "Gutter margin too narrow",  detail: "0.31\" found — 0.50\" required for 300 pages" },
  { page: "p.7,12",  label: "Font not embedded",         detail: "Times New Roman — must embed before export"   },
  { page: "p.1",     label: "Trim size mismatch",        detail: "8.5×11 detected — 6×9 expected"               },
  { page: "p.5",     label: "Image below 300 DPI",       detail: "187 DPI found — will print blurry"            },
];

// Tick map (500ms each):
// 0-3   → upload phase
// 4-11  → scanning phase
// 12-20 → results phase
// 21    → reset
const TOTAL_TICKS = 22;

export default function HeroDemo() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => (t + 1) % TOTAL_TICKS);
    }, 500);
    return () => clearInterval(id);
  }, []);

  const phase: "upload" | "scanning" | "results" =
    tick <= 3 ? "upload" : tick <= 11 ? "scanning" : "results";

  const uploadStep  = tick;                          // 0=empty,1=hover,2=drop,3=ready
  const scanVisible = phase === "scanning" ? Math.max(0, tick - 4) : phase === "results" ? 6 : 0;
  const issueVisible = phase === "results"  ? Math.max(0, tick - 13) : 0;
  const showCta      = tick >= 18;

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.45)] border border-white/10"
      style={{ background: "#141a14", minHeight: 400 }}>

      {/* ── Browser chrome ── */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/8" style={{ background: "#1a221a" }}>
        <span className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
        <div className="flex-1 mx-4 rounded-md px-3 py-1 text-xs text-center" style={{ background: "#0f150f", color: "rgba(255,255,255,0.35)" }}>
          manu2print.com/kdp-pdf-checker
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="p-5" style={{ minHeight: 360 }}>

        {/* ════════════════════════════════════
            PHASE: UPLOAD
        ════════════════════════════════════ */}
        {phase === "upload" && (
          <div className="flex flex-col items-center justify-center h-full gap-4" style={{ minHeight: 330 }}>
            <p className="font-bebas tracking-wide text-center" style={{ color: "rgba(255,255,255,0.9)", fontSize: 22 }}>
              KDP PDF <span style={{ color: "#4cd964" }}>Checker</span>
            </p>

            {/* Drop zone */}
            <div
              className="w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all duration-500"
              style={{
                minHeight: 200,
                borderColor: uploadStep >= 1 ? "#f05a28" : "rgba(255,255,255,0.15)",
                background:  uploadStep >= 1 ? "rgba(240,90,40,0.06)" : "rgba(255,255,255,0.03)",
              }}
            >
              {uploadStep < 2 ? (
                <>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{ background: uploadStep >= 1 ? "rgba(240,90,40,0.2)" : "rgba(255,255,255,0.06)" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={uploadStep >= 1 ? "#f05a28" : "rgba(255,255,255,0.4)"} strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17,8 12,3 7,8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {uploadStep >= 1 ? "Drop your PDF here…" : "Drop your PDF here"}
                  </p>
                </>
              ) : (
                /* File dropped */
                <div className="text-center transition-all duration-300">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                    manuscript-final.pdf
                  </p>
                  <p className="text-xs mt-1" style={{ color: uploadStep >= 3 ? "#4cd964" : "rgba(255,255,255,0.4)" }}>
                    {uploadStep >= 3 ? "4.2 MB · ready to scan ✓" : "4.2 MB · uploading…"}
                  </p>
                </div>
              )}
            </div>

            {/* CTA */}
            <div
              className="w-full rounded-xl py-3 text-center text-sm font-bold transition-all duration-500"
              style={{
                background: uploadStep >= 3 ? "#f05a28" : "rgba(240,90,40,0.25)",
                color: uploadStep >= 3 ? "#fff" : "rgba(255,255,255,0.35)",
              }}
            >
              {uploadStep >= 3 ? "Check My PDF →" : "Check My PDF →"}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            PHASE: SCANNING
        ════════════════════════════════════ */}
        {phase === "scanning" && (
          <div className="flex flex-col items-center gap-4" style={{ minHeight: 330 }}>
            {/* Spinner + title */}
            <div className="flex flex-col items-center gap-3 pt-4 pb-2">
              <div className="w-12 h-12 rounded-full border-4 border-t-m2p-orange animate-spin"
                style={{ borderColor: "rgba(240,90,40,0.2)", borderTopColor: "#f05a28" }} />
              <p className="font-bebas tracking-wide text-xl" style={{ color: "rgba(255,255,255,0.9)" }}>
                Scanning Your Manuscript
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Checking 26 KDP compliance rules…
              </p>
            </div>

            {/* Check items */}
            <div className="w-full space-y-2">
              {CHECKS.map((check, i) => (
                <div
                  key={check.label}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300"
                  style={{
                    background: i < scanVisible ? "rgba(255,255,255,0.05)" : "transparent",
                    opacity: i < scanVisible ? 1 : 0,
                    transform: i < scanVisible ? "translateX(0)" : "translateX(-8px)",
                  }}
                >
                  <span className="text-base shrink-0">
                    {check.status === "pass" ? "✅" : "⚠️"}
                  </span>
                  <span className="text-sm flex-1" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {check.label}
                  </span>
                  <span className="text-xs font-semibold"
                    style={{ color: check.status === "pass" ? "#4cd964" : "#f05a28" }}>
                    {check.status === "pass" ? "PASS" : "FLAG"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            PHASE: RESULTS
        ════════════════════════════════════ */}
        {phase === "results" && (
          <div className="flex flex-col gap-3" style={{ minHeight: 330 }}>
            {/* Grade card */}
            <div className="flex items-center gap-4 rounded-xl px-4 py-3 border"
              style={{ background: "rgba(240,90,40,0.08)", borderColor: "rgba(240,90,40,0.3)" }}>
              <span className="font-bebas leading-none" style={{ fontSize: 52, color: "#f05a28" }}>C</span>
              <div>
                <p className="font-bold text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>Issues Found</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  4 problems — fix before uploading to KDP
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="font-bebas text-2xl" style={{ color: "#f05a28" }}>58</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>/ 100</p>
              </div>
            </div>

            {/* Issues list */}
            <div className="space-y-2">
              {ISSUES.map((issue, i) => (
                <div
                  key={issue.label}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all duration-400"
                  style={{
                    background: i < issueVisible ? "rgba(255,255,255,0.05)" : "transparent",
                    opacity: i < issueVisible ? 1 : 0,
                    transform: i < issueVisible ? "translateY(0)" : "translateY(6px)",
                    borderLeft: i < issueVisible ? "2px solid #f05a28" : "2px solid transparent",
                  }}
                >
                  <span className="text-xs font-mono font-bold shrink-0 mt-0.5 px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(240,90,40,0.15)", color: "#f05a28" }}>
                    {issue.page}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                      {issue.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {issue.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div
              className="w-full rounded-xl py-3 text-center text-sm font-bold mt-auto transition-all duration-500"
              style={{
                background: showCta ? "#f05a28" : "rgba(240,90,40,0.2)",
                color: showCta ? "#fff" : "rgba(255,255,255,0.3)",
                transform: showCta ? "scale(1)" : "scale(0.98)",
              }}
            >
              Download Annotated PDF Report — $9
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
