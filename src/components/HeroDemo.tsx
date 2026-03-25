"use client";

import { useState, useEffect, useRef } from "react";

/**
 * HeroDemo — triggered animated product walkthrough for the KDP PDF Checker hero.
 * Idle state by default. "See How It Works" starts the sequence.
 *
 * Phases:
 *   1. Upload   — drop zone, file drop, ready state
 *   2. Scanning — spinner, 6 checks tick in (PASS/FLAG)
 *   3. Results  — grade card, 4 issues with page numbers, CTA
 *   4. Annotated PDF — mock interior page with severity-colored annotations
 *   → "Watch Again" button
 */

const CHECKS = [
  { label: "Trim size validation",  status: "pass" },
  { label: "Margin compliance",     status: "fail" },
  { label: "Bleed zone analysis",   status: "pass" },
  { label: "Font embedding check",  status: "fail" },
  { label: "Image resolution",      status: "fail" },
  { label: "Page count accuracy",   status: "pass" },
];

const ISSUES = [
  { page: "p.3",    label: "Gutter margin too narrow",  detail: "0.31\" found — 0.50\" required" },
  { page: "p.7,12", label: "Font not embedded",         detail: "Times New Roman — embed before export" },
  { page: "p.1",    label: "Trim size mismatch",        detail: "8.5×11 detected — 6×9 expected" },
  { page: "p.5",    label: "Image below 300 DPI",       detail: "187 DPI — will print blurry" },
];

// Annotations on the mock PDF page
const ANNOTATIONS = [
  {
    label: "CRITICAL",
    sublabel: "Gutter 0.31\" — min 0.50\"",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.15)",
    border: "rgba(239,68,68,0.7)",
    // position as % of page
    top: "8%", left: "1%", width: "9%", height: "84%",
  },
  {
    label: "WARNING",
    sublabel: "Font not embedded",
    color: "#f05a28",
    bg: "rgba(240,90,40,0.12)",
    border: "rgba(240,90,40,0.7)",
    top: "28%", left: "11%", width: "72%", height: "12%",
  },
  {
    label: "NOTICE",
    sublabel: "Image 187 DPI — low res",
    color: "#eab308",
    bg: "rgba(234,179,8,0.12)",
    border: "rgba(234,179,8,0.7)",
    top: "52%", left: "11%", width: "42%", height: "22%",
  },
];

// Tick map at 800ms per tick:
// 0-4   → upload   (4s)
// 5-15  → scanning (8.8s — one check per tick after tick 5)
// 16-22 → results  (5.6s)
// 23-30 → annotated PDF (6.4s — annotations appear one by one)
// 31    → done
const TOTAL_TICKS = 31;

export default function HeroDemo() {
  const [playing, setPlaying]   = useState(false);
  const [done, setDone]         = useState(false);
  const [tick, setTick]         = useState(0);
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSequence = () => {
    setTick(0);
    setDone(false);
    setPlaying(true);
  };

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      setTick((prev) => {
        if (prev + 1 >= TOTAL_TICKS) {
          clearInterval(intervalRef.current!);
          setPlaying(false);
          setDone(true);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing]);

  const phase: "upload" | "scanning" | "results" | "annotated" =
    tick <= 4  ? "upload"    :
    tick <= 15 ? "scanning"  :
    tick <= 22 ? "results"   : "annotated";

  const uploadStep    = tick;
  const scanVisible   = phase === "scanning"  ? Math.max(0, tick - 5)  : phase === "results" || phase === "annotated" ? 6 : 0;
  const issueVisible  = phase === "results"   ? Math.max(0, tick - 17) : phase === "annotated" ? 4 : 0;
  const showCta       = tick >= 21;
  const annotVisible  = phase === "annotated" ? Math.max(0, tick - 24) : 0;

  // ── IDLE state ────────────────────────────────────────────────
  if (!playing && !done) {
    return (
      <div className="w-full rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.45)] border border-white/10"
        style={{ background: "#141a14" }}>
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/8" style={{ background: "#1a221a" }}>
          <span className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
          <span className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
          <span className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
          <div className="flex-1 mx-4 rounded-md px-3 py-1 text-xs text-center"
            style={{ background: "#0f150f", color: "rgba(255,255,255,0.3)" }}>
            manu2print.com/kdp-pdf-checker
          </div>
        </div>
        {/* Idle content */}
        <div className="flex flex-col items-center justify-center gap-5 px-6"
          style={{ minHeight: 380 }}>
          <p className="font-bebas tracking-wide text-center" style={{ color: "rgba(255,255,255,0.85)", fontSize: 20 }}>
            KDP PDF <span style={{ color: "#4cd964" }}>Checker</span>
          </p>
          {/* Static drop zone */}
          <div className="w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3"
            style={{ minHeight: 180, borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)" }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17,8 12,3 7,8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Drop your PDF here</p>
          </div>
          {/* Play button */}
          <button
            onClick={startSequence}
            className="group flex items-center gap-3 rounded-xl px-6 py-3 font-semibold text-sm transition-all duration-200 hover:scale-105"
            style={{ background: "rgba(240,90,40,0.15)", border: "1px solid rgba(240,90,40,0.4)", color: "#f05a28" }}
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-200"
              style={{ background: "rgba(240,90,40,0.2)" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="#f05a28">
                <polygon points="3,1 11,6 3,11" />
              </svg>
            </span>
            See How It Works
          </button>
        </div>
      </div>
    );
  }

  // ── DONE state ────────────────────────────────────────────────
  if (done) {
    return (
      <div className="w-full rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.45)] border border-white/10"
        style={{ background: "#141a14" }}>
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/8" style={{ background: "#1a221a" }}>
          <span className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
          <span className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
          <span className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
          <div className="flex-1 mx-4 rounded-md px-3 py-1 text-xs text-center"
            style={{ background: "#0f150f", color: "rgba(255,255,255,0.3)" }}>
            manu2print.com/kdp-pdf-checker
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-5 px-6" style={{ minHeight: 380 }}>
          <div className="text-center">
            <p className="font-bebas text-3xl tracking-wide mb-1" style={{ color: "#4cd964" }}>
              That&apos;s the full flow.
            </p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              Upload → Scan → Report → Publish
            </p>
          </div>
          <a
            href="/kdp-pdf-checker"
            className="flex items-center justify-center w-20 h-20 rounded-full font-bebas tracking-wide text-center leading-tight transition-all duration-200 hover:scale-110 hover:shadow-[0_0_32px_rgba(240,90,40,0.5)]"
            style={{ background: "#f05a28", color: "#fff", fontSize: 13 }}
          >
            Check<br />My PDF
          </a>
          <button
            onClick={startSequence}
            className="text-xs transition-opacity hover:opacity-100"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            ↩ watch again
          </button>
        </div>
      </div>
    );
  }

  // ── PLAYING ───────────────────────────────────────────────────
  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.45)] border border-white/10"
      style={{ background: "#141a14" }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/8" style={{ background: "#1a221a" }}>
        <span className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
        <div className="flex-1 mx-4 rounded-md px-3 py-1 text-xs text-center"
          style={{ background: "#0f150f", color: "rgba(255,255,255,0.3)" }}>
          manu2print.com/kdp-pdf-checker
        </div>
      </div>

      <div className="p-5" style={{ minHeight: 380 }}>

        {/* ── UPLOAD ── */}
        {phase === "upload" && (
          <div className="flex flex-col items-center justify-center h-full gap-4" style={{ minHeight: 350 }}>
            <p className="font-bebas tracking-wide text-center" style={{ color: "rgba(255,255,255,0.9)", fontSize: 22 }}>
              KDP PDF <span style={{ color: "#4cd964" }}>Checker</span>
            </p>
            <div className="w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all duration-500"
              style={{
                minHeight: 200,
                borderColor: uploadStep >= 1 ? "#f05a28" : "rgba(255,255,255,0.15)",
                background:  uploadStep >= 1 ? "rgba(240,90,40,0.06)" : "rgba(255,255,255,0.03)",
              }}>
              {uploadStep < 3 ? (
                <>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{ background: uploadStep >= 1 ? "rgba(240,90,40,0.2)" : "rgba(255,255,255,0.06)" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                      stroke={uploadStep >= 1 ? "#f05a28" : "rgba(255,255,255,0.4)"} strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17,8 12,3 7,8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {uploadStep >= 1 ? "Drop your PDF here…" : "Drop your PDF here"}
                  </p>
                </>
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>manuscript-final.pdf</p>
                  <p className="text-xs mt-1" style={{ color: uploadStep >= 4 ? "#4cd964" : "rgba(255,255,255,0.4)" }}>
                    {uploadStep >= 4 ? "4.2 MB · ready to scan ✓" : "4.2 MB · uploading…"}
                  </p>
                </div>
              )}
            </div>
            <div className="w-full rounded-xl py-3 text-center text-sm font-bold transition-all duration-500"
              style={{
                background: uploadStep >= 4 ? "#f05a28" : "rgba(240,90,40,0.25)",
                color: uploadStep >= 4 ? "#fff" : "rgba(255,255,255,0.35)",
              }}>
              Check My PDF →
            </div>
          </div>
        )}

        {/* ── SCANNING ── */}
        {phase === "scanning" && (
          <div className="flex flex-col items-center gap-4" style={{ minHeight: 350 }}>
            <div className="flex flex-col items-center gap-3 pt-4 pb-2">
              <div className="w-12 h-12 rounded-full border-4 animate-spin"
                style={{ borderColor: "rgba(240,90,40,0.2)", borderTopColor: "#f05a28" }} />
              <p className="font-bebas tracking-wide text-xl" style={{ color: "rgba(255,255,255,0.9)" }}>
                Scanning Your Manuscript
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Checking 26 KDP compliance rules…</p>
            </div>
            <div className="w-full space-y-2">
              {CHECKS.map((check, i) => (
                <div key={check.label}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300"
                  style={{
                    background:  i < scanVisible ? "rgba(255,255,255,0.05)" : "transparent",
                    opacity:     i < scanVisible ? 1 : 0,
                    transform:   i < scanVisible ? "translateX(0)" : "translateX(-8px)",
                  }}>
                  <span className="text-base shrink-0">{check.status === "pass" ? "✅" : "⚠️"}</span>
                  <span className="text-sm flex-1" style={{ color: "rgba(255,255,255,0.75)" }}>{check.label}</span>
                  <span className="text-xs font-semibold"
                    style={{ color: check.status === "pass" ? "#4cd964" : "#f05a28" }}>
                    {check.status === "pass" ? "PASS" : "FLAG"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {phase === "results" && (
          <div className="flex flex-col gap-3" style={{ minHeight: 350 }}>
            <div className="flex items-center gap-4 rounded-xl px-4 py-3 border"
              style={{ background: "rgba(240,90,40,0.08)", borderColor: "rgba(240,90,40,0.3)" }}>
              <span className="font-bebas leading-none" style={{ fontSize: 52, color: "#f05a28" }}>C</span>
              <div>
                <p className="font-bold text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>Issues Found</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>4 problems — fix before uploading</p>
              </div>
              <div className="ml-auto text-right">
                <p className="font-bebas text-2xl" style={{ color: "#f05a28" }}>58</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>/ 100</p>
              </div>
            </div>
            <div className="space-y-2">
              {ISSUES.map((issue, i) => (
                <div key={issue.label}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all duration-300"
                  style={{
                    background:   i < issueVisible ? "rgba(255,255,255,0.05)" : "transparent",
                    opacity:      i < issueVisible ? 1 : 0,
                    transform:    i < issueVisible ? "translateY(0)" : "translateY(6px)",
                    borderLeft:   i < issueVisible ? "2px solid #f05a28" : "2px solid transparent",
                  }}>
                  <span className="text-xs font-mono font-bold shrink-0 mt-0.5 px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(240,90,40,0.15)", color: "#f05a28" }}>
                    {issue.page}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{issue.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{issue.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="w-full rounded-xl py-3 text-center text-sm font-bold mt-auto transition-all duration-500"
              style={{
                background: showCta ? "#f05a28" : "rgba(240,90,40,0.2)",
                color: showCta ? "#fff" : "rgba(255,255,255,0.3)",
                transform: showCta ? "scale(1)" : "scale(0.98)",
              }}>
              Download Annotated PDF Report — $9
            </div>
          </div>
        )}

        {/* ── ANNOTATED PDF ── */}
        {phase === "annotated" && (
          <div className="flex flex-col gap-3" style={{ minHeight: 350 }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
              Your annotated PDF — page 3 of 212
            </p>

            {/* Mock book page */}
            <div className="relative w-full rounded-lg overflow-hidden flex-1"
              style={{ background: "#f8f6f0", minHeight: 260, border: "1px solid rgba(255,255,255,0.1)" }}>

              {/* Fake text lines */}
              <div className="absolute inset-0 p-4 pl-10 pr-5 pt-5 flex flex-col gap-2">
                {[90, 85, 95, 80, 88, 72, 91, 84, 78, 86, 70, 82].map((w, i) => (
                  <div key={i} className="rounded-sm" style={{
                    width: `${w}%`, height: 6,
                    background: i === 4 || i === 5 ? "rgba(240,90,40,0.35)" : "rgba(60,40,20,0.15)"
                  }} />
                ))}
                {/* Fake image block */}
                <div className="rounded-sm mt-1" style={{
                  width: "45%", height: 36,
                  background: "rgba(234,179,8,0.2)",
                  border: "1px dashed rgba(234,179,8,0.5)"
                }} />
              </div>

              {/* Annotation overlays — appear one by one */}
              {ANNOTATIONS.map((ann, i) => (
                <div key={ann.label}
                  className="absolute transition-all duration-500"
                  style={{
                    top: ann.top, left: ann.left, width: ann.width, height: ann.height,
                    background: ann.bg,
                    border: `1.5px solid ${ann.border}`,
                    borderRadius: 3,
                    opacity: i < annotVisible ? 1 : 0,
                  }}>
                  {/* Label badge */}
                  {i < annotVisible && (
                    <div className="absolute flex items-center gap-1 px-1.5 py-0.5 rounded text-white font-bold"
                      style={{
                        background: ann.color,
                        fontSize: 7,
                        top: i === 0 ? "50%" : -10,
                        left: i === 0 ? "50%" : 0,
                        transform: i === 0 ? "translate(-50%,-50%) rotate(-90deg)" : "none",
                        whiteSpace: "nowrap",
                      }}>
                      {ann.label}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex gap-3 flex-wrap">
              {[
                { color: "#ef4444", label: "Critical" },
                { color: "#f05a28", label: "Warning" },
                { color: "#eab308", label: "Notice" },
              ].map((item, i) => (
                <div key={item.label}
                  className="flex items-center gap-1.5 transition-all duration-300"
                  style={{ opacity: i < annotVisible ? 1 : 0 }}>
                  <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
