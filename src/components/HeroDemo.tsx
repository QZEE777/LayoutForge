"use client";

import { useState, useEffect, useRef } from "react";

// ── Data ─────────────────────────────────────────────────────────────────────

const CHECKS = [
  { label: "Trim size validation", status: "pass" },
  { label: "Margin compliance",    status: "fail" },
  { label: "Bleed zone analysis",  status: "pass" },
  { label: "Font embedding",       status: "fail" },
  { label: "Image resolution",     status: "fail" },
  { label: "Page count accuracy",  status: "pass" },
];

const ISSUES = [
  { page: "p.3",    label: "Gutter margin too narrow", detail: "0.31\" found — 0.50\" required" },
  { page: "p.7,12", label: "Font not embedded",        detail: "Times New Roman — embed before export" },
  { page: "p.1",    label: "Trim size mismatch",       detail: "8.5×11 detected — 6×9 expected" },
  { page: "p.5",    label: "Image below 300 DPI",      detail: "187 DPI — will print blurry" },
];

const ANNOTATIONS = [
  {
    label: "CRITICAL", color: "#ef4444",
    bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.7)",
    top: "8%", left: "1%", width: "9%", height: "84%",
    rotate: true,
  },
  {
    label: "WARNING", color: "#f05a28",
    bg: "rgba(240,90,40,0.12)", border: "rgba(240,90,40,0.7)",
    top: "28%", left: "11%", width: "72%", height: "12%",
    rotate: false,
  },
  {
    label: "NOTICE", color: "#eab308",
    bg: "rgba(234,179,8,0.12)", border: "rgba(234,179,8,0.7)",
    top: "52%", left: "11%", width: "42%", height: "22%",
    rotate: false,
  },
];

// Per-phase microcopy shown above the persistent CTA
const MICROCOPY: Record<string, string> = {
  idle:      "",
  upload:    "Works with Canva, Word, and PDF exports.",
  scanning:  "Checking the same categories KDP reviews before approval.",
  results:   "These are the issues that trigger rejection.",
  annotated: "Fix exactly what KDP flags — before you upload.",
  end:       "No waiting. No re-uploads. No guesswork.",
};

// ── Tick schedule at 800ms per tick ──────────────────────────────────────────
// 0–4   upload    (~4s)
// 5–15  scanning  (~8.8s)
// 16–22 results   (~5.6s)
// 23–30 annotated (~6.4s)
// 31    → done
const TOTAL_TICKS = 31;

type Phase = "idle" | "upload" | "scanning" | "results" | "annotated" | "end";

function derivePhase(tick: number, playing: boolean, done: boolean): Phase {
  if (!playing && !done) return "idle";
  if (done)       return "end";
  if (tick <= 4)  return "upload";
  if (tick <= 15) return "scanning";
  if (tick <= 22) return "results";
  return "annotated";
}

// ── Component ─────────────────────────────────────────────────────────────────

const liveDemoStyles = `
@keyframes liveDemoGlow {
  0%, 100% { box-shadow: 0 0 6px 1px rgba(76,217,100,0.45), 0 0 12px 2px rgba(76,217,100,0.2); }
  50%       { box-shadow: 0 0 10px 3px rgba(76,217,100,0.75), 0 0 22px 5px rgba(76,217,100,0.35); }
}
@keyframes liveDot {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
.live-demo-pill {
  animation: liveDemoGlow 2s ease-in-out infinite;
}
.live-demo-dot {
  animation: liveDot 1.2s ease-in-out infinite;
}
`;

export default function HeroDemo() {
  const [playing,    setPlaying]    = useState(false);
  const [done,       setDone]       = useState(false);
  const [tick,       setTick]       = useState(0);
  const [ctaScale,   setCtaScale]   = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);

  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulsedRef     = useRef(false);

  // Detect reduced motion after mount
  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const start = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTick(0);
    setDone(false);
    setCtaScale(1);
    pulsedRef.current = false;
    setPlaying(true);
  };

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      setTick((prev) => {
        const next = prev + 1;
        // One-time CTA emphasis when results phase begins
        if (next === 16 && !pulsedRef.current && !reducedMotion) {
          pulsedRef.current = true;
          setCtaScale(1.04);
          setTimeout(() => setCtaScale(1), 220);
        }
        if (next >= TOTAL_TICKS) {
          clearInterval(intervalRef.current!);
          setPlaying(false);
          setDone(true);
          return prev;
        }
        return next;
      });
    }, 800);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, reducedMotion]);

  const phase        = derivePhase(tick, playing, done);
  const uploadStep   = tick;
  const scanVisible  = phase === "scanning"  ? Math.max(0, tick - 5) : (phase === "results" || phase === "annotated") ? 6 : 0;
  const issueVisible = phase === "results"   ? Math.max(0, tick - 17) : phase === "annotated" ? 4 : 0;
  const showInnerCta = tick >= 21;
  const annotVisible = phase === "annotated" ? Math.max(0, tick - 24) : 0;
  const microcopy    = MICROCOPY[phase] ?? "";

  // CTA is active (orange) once file is ready or in later phases
  const ctaActive =
    (phase === "upload" && uploadStep >= 4) ||
    phase === "results" || phase === "annotated" || phase === "end";

  // ── Shared: browser chrome bar ──────────────────────────────────────────
  const chrome = (
    <div className="flex items-center gap-1.5 px-4 py-3 border-b"
      style={{ background: "#1a221a", borderColor: "rgba(255,255,255,0.07)" }}>
      <span className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
      <span className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
      <span className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
      <div className="flex-1 mx-4 rounded-md px-3 py-1 text-xs text-center select-none"
        style={{ background: "#0f150f", color: "rgba(255,255,255,0.28)" }}>
        manu2print.com/kdp-pdf-checker
      </div>
    </div>
  );

  // ── Shared: persistent CTA footer ──────────────────────────────────────
  const ctaFooter = (
    <div className="px-5 pb-5 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      {microcopy ? (
        <p className="text-center text-xs mb-3"
          style={{ color: "rgba(255,255,255,0.32)", lineHeight: 1.5 }}>
          {microcopy}
        </p>
      ) : (
        <div className="mb-3 h-4" /> // spacer keeps layout stable
      )}
      <a
        href="/kdp-pdf-checker"
        className="flex items-center justify-center w-full rounded-xl py-3 font-bold text-sm"
        style={{
          background:  ctaActive ? "#f05a28" : "rgba(240,90,40,0.18)",
          color:       ctaActive ? "#fff"    : "rgba(255,255,255,0.25)",
          transform:   `scale(${ctaScale})`,
          transition:  "background 300ms ease-out, color 300ms ease-out, transform 200ms ease-out, box-shadow 200ms ease-out",
          boxShadow:   ctaActive ? "0 4px 20px rgba(240,90,40,0.3)" : "none",
          pointerEvents: ctaActive ? "auto" : "none",
        }}
      >
        Check My PDF Now
      </a>
    </div>
  );

  // ── IDLE STATE ────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <>
        <style>{liveDemoStyles}</style>
        <div className="w-full rounded-2xl overflow-hidden border"
          style={{ background: "#141a14", borderColor: "rgba(255,255,255,0.09)", boxShadow: "0 8px 40px rgba(0,0,0,0.45)" }}>
          {chrome}
          <div className="flex flex-col items-center justify-center gap-5 px-5 pt-6 pb-0" style={{ minHeight: 288 }}>

            {/* Title + LIVE DEMO pill */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <p className="font-bebas tracking-wide text-center" style={{ color: "rgba(255,255,255,0.85)", fontSize: 20 }}>
                KDP PDF <span style={{ color: "#4cd964" }}>Checker</span>
              </p>
              <span
                className="live-demo-pill flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider"
                style={{
                  background: "rgba(76,217,100,0.12)",
                  border: "1px solid rgba(76,217,100,0.5)",
                  color: "#4cd964",
                  letterSpacing: "0.08em",
                }}
              >
                <span className="live-demo-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#4cd964" }} />
                Live Demo
              </span>
            </div>

            {/* Drop zone with DEMO badge */}
            <div className="relative w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3"
              style={{ minHeight: 148, borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>

              {/* DEMO badge top-center */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{ background: "#f05a28", color: "#fff", letterSpacing: "0.12em", fontSize: 10 }}>
                DEMO
              </div>

              <div className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.05)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17,8 12,3 7,8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Watch the demo — see how it works</p>
            </div>

            {/* Play Demo button */}
            <button
              onClick={start}
              className="flex items-center gap-3 rounded-xl px-6 py-3 font-semibold text-sm transition-all duration-200 hover:scale-105"
              style={{ background: "rgba(240,90,40,0.1)", border: "1px solid rgba(240,90,40,0.32)", color: "#f05a28" }}
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-full"
                style={{ background: "rgba(240,90,40,0.16)" }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="#f05a28">
                  <polygon points="3,1 11,6 3,11" />
                </svg>
              </span>
              Play Demo
            </button>
          </div>
          {ctaFooter}
        </div>
      </>
    );
  }

  // ── END STATE ─────────────────────────────────────────────────────────────
  if (phase === "end") {
    return (
      <div className="w-full rounded-2xl overflow-hidden border"
        style={{ background: "#141a14", borderColor: "rgba(255,255,255,0.09)", boxShadow: "0 8px 40px rgba(0,0,0,0.45)" }}>
        {chrome}
        <div className="flex flex-col items-center gap-4 px-5 pt-6 pb-3">
          <div className="text-center">
            <p className="font-bebas text-3xl tracking-wide mb-1" style={{ color: "#4cd964" }}>
              Know before you upload.
            </p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>
              Avoid rejection. Upload with confidence.
            </p>
          </div>
          {/* What happens next */}
          <div className="w-full rounded-xl px-4 py-4 space-y-2.5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>
              What happens next?
            </p>
            {[
              "Upload your PDF",
              "Get your compliance report",
              "Fix the flagged issues",
              "Upload to KDP with confidence",
            ].map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: "rgba(240,90,40,0.18)", color: "#f05a28" }}>
                  {i + 1}
                </span>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.62)" }}>{step}</span>
              </div>
            ))}
          </div>
          {/* Big CTA */}
          <a
            href="/kdp-pdf-checker"
            className="flex items-center justify-center w-full rounded-xl py-3.5 font-bold text-sm transition-all duration-200 hover:scale-[1.02]"
            style={{ background: "#f05a28", color: "#fff", boxShadow: "0 4px 24px rgba(240,90,40,0.4)" }}
          >
            Check My PDF Now
          </a>
          <button
            onClick={start}
            className="text-xs hover:opacity-60 transition-opacity"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            ↩ watch again
          </button>
        </div>
      </div>
    );
  }

  // ── PLAYING STATES ────────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-2xl overflow-hidden border"
      style={{ background: "#141a14", borderColor: "rgba(255,255,255,0.09)", boxShadow: "0 8px 40px rgba(0,0,0,0.45)" }}>
      {chrome}

      {/* Phase content */}
      <div className="px-5 pt-5 pb-2" style={{ minHeight: 288 }}>

        {/* ── UPLOAD ── */}
        {phase === "upload" && (
          <div className="flex flex-col items-center gap-4" style={{ minHeight: 276 }}>
            <p className="font-bebas tracking-wide text-center"
              style={{ color: "rgba(255,255,255,0.9)", fontSize: 20 }}>
              KDP PDF <span style={{ color: "#4cd964" }}>Checker</span>
            </p>
            <div className="w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3"
              style={{
                minHeight: 172,
                borderColor:  uploadStep >= 1 ? "#f05a28" : "rgba(255,255,255,0.12)",
                background:   uploadStep >= 1 ? "rgba(240,90,40,0.05)" : "rgba(255,255,255,0.02)",
                boxShadow:    uploadStep >= 1 ? "0 0 18px rgba(240,90,40,0.1)" : "none",
                transition:   "border-color 400ms ease-out, background 400ms ease-out, box-shadow 400ms ease-out",
              }}>
              {uploadStep < 3 ? (
                <>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: uploadStep >= 1 ? "rgba(240,90,40,0.16)" : "rgba(255,255,255,0.05)",
                      transition: "background 400ms ease-out",
                    }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                      stroke={uploadStep >= 1 ? "#f05a28" : "rgba(255,255,255,0.32)"} strokeWidth="2"
                      style={{ transition: "stroke 400ms ease-out" }}>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17,8 12,3 7,8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>
                    {uploadStep >= 1 ? "Drop your PDF here…" : "Drop your PDF here"}
                  </p>
                </>
              ) : (
                <div className="text-center">
                  <div className="text-3xl mb-2">📄</div>
                  <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                    manuscript-final.pdf
                  </p>
                  <p className="text-xs mt-1"
                    style={{
                      color: uploadStep >= 4 ? "#4cd964" : "rgba(255,255,255,0.4)",
                      transition: "color 300ms ease-out",
                    }}>
                    {uploadStep >= 4 ? "4.2 MB · ready to scan ✓" : "4.2 MB · processing…"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SCANNING ── */}
        {phase === "scanning" && (
          <div className="flex flex-col gap-3" style={{ minHeight: 276 }}>
            <div className="flex flex-col items-center gap-2 pb-1">
              <div className="w-10 h-10 rounded-full border-4 animate-spin"
                style={{ borderColor: "rgba(240,90,40,0.14)", borderTopColor: "#f05a28" }} />
              <p className="font-bebas tracking-wide text-xl" style={{ color: "rgba(255,255,255,0.9)" }}>
                Scanning Your Manuscript
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.32)" }}>
                Checking 26 KDP compliance rules…
              </p>
            </div>
            <div className="space-y-1.5">
              {CHECKS.map((check, i) => (
                <div key={check.label}
                  className="flex items-center gap-3 rounded-lg px-3 py-2"
                  style={{
                    background: i < scanVisible ? "rgba(255,255,255,0.04)" : "transparent",
                    opacity:    i < scanVisible ? 1 : 0,
                    transform:  i < scanVisible ? "translateX(0)" : "translateX(-6px)",
                    transition: "opacity 300ms ease-out, transform 300ms ease-out",
                  }}>
                  <span className="text-sm shrink-0">{check.status === "pass" ? "✅" : "⚠️"}</span>
                  <span className="text-sm flex-1" style={{ color: "rgba(255,255,255,0.7)" }}>
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

        {/* ── RESULTS ── */}
        {phase === "results" && (
          <div className="flex flex-col gap-2.5" style={{ minHeight: 276 }}>
            <div className="flex items-center gap-4 rounded-xl px-4 py-3 border"
              style={{ background: "rgba(240,90,40,0.07)", borderColor: "rgba(240,90,40,0.22)" }}>
              <span className="font-bebas leading-none" style={{ fontSize: 50, color: "#f05a28" }}>C</span>
              <div>
                <p className="font-bold text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>Issues Found</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.42)" }}>
                  4 problems — fix before uploading
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="font-bebas text-2xl" style={{ color: "#f05a28" }}>58</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>/ 100</p>
              </div>
            </div>
            <div className="space-y-1.5 flex-1">
              {ISSUES.map((issue, i) => (
                <div key={issue.label}
                  className="flex items-start gap-3 rounded-lg px-3 py-2"
                  style={{
                    background:  i < issueVisible ? "rgba(255,255,255,0.04)" : "transparent",
                    opacity:     i < issueVisible ? 1 : 0,
                    transform:   i < issueVisible ? "translateY(0)" : "translateY(5px)",
                    borderLeft:  `2px solid ${i < issueVisible ? "rgba(240,90,40,0.55)" : "transparent"}`,
                    transition:  "opacity 350ms ease-out, transform 350ms ease-out, border-color 350ms ease-out",
                  }}>
                  <span className="text-xs font-mono font-bold shrink-0 mt-0.5 px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(240,90,40,0.14)", color: "#f05a28" }}>
                    {issue.page}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                      {issue.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.36)" }}>
                      {issue.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ANNOTATED PDF ── */}
        {phase === "annotated" && (
          <div className="flex flex-col gap-2.5" style={{ minHeight: 276 }}>
            <p className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "rgba(255,255,255,0.32)" }}>
              Your annotated PDF — page 3 of 212
            </p>
            {/* Mock interior page */}
            <div className="relative w-full rounded-lg overflow-hidden flex-1"
              style={{ background: "#f8f6f0", minHeight: 208, border: "1px solid rgba(0,0,0,0.07)" }}>
              {/* Text lines */}
              <div className="absolute inset-0 p-3 pl-10 pr-5 pt-4 flex flex-col gap-2">
                {[88, 82, 94, 78, 86, 70, 90, 83, 77, 85, 68, 80].map((w, i) => (
                  <div key={i} className="rounded-sm" style={{
                    width: `${w}%`, height: 5,
                    background: i === 4 || i === 5
                      ? "rgba(240,90,40,0.28)"
                      : "rgba(50,35,20,0.11)",
                  }} />
                ))}
                {/* Image placeholder */}
                <div className="rounded-sm mt-1" style={{
                  width: "44%", height: 30,
                  background: "rgba(234,179,8,0.16)",
                  border: "1px dashed rgba(234,179,8,0.4)",
                }} />
              </div>
              {/* Annotations */}
              {ANNOTATIONS.map((ann, i) => (
                <div key={ann.label}
                  className="absolute"
                  style={{
                    top: ann.top, left: ann.left, width: ann.width, height: ann.height,
                    background: ann.bg,
                    border: `1.5px solid ${ann.border}`,
                    borderRadius: 3,
                    opacity:    i < annotVisible ? 1 : 0,
                    transition: "opacity 500ms ease-out",
                  }}>
                  {i < annotVisible && (
                    <div
                      className="absolute px-1.5 py-0.5 rounded text-white font-bold"
                      style={{
                        background:  ann.color,
                        fontSize:    7,
                        whiteSpace:  "nowrap",
                        top:         ann.rotate ? "50%" : -10,
                        left:        ann.rotate ? "50%" : 0,
                        transform:   ann.rotate ? "translate(-50%,-50%) rotate(-90deg)" : "none",
                      }}>
                      {ann.label}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="flex gap-4 flex-wrap">
              {[
                { color: "#ef4444", label: "Critical" },
                { color: "#f05a28", label: "Warning"  },
                { color: "#eab308", label: "Notice"   },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center gap-1.5"
                  style={{ opacity: i < annotVisible ? 1 : 0, transition: "opacity 400ms ease-out" }}>
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: item.color }} />
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.42)" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Persistent CTA footer — always visible ── */}
      <div className="px-5 pb-5 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {microcopy ? (
          <p className="text-center text-xs mb-3"
            style={{ color: "rgba(255,255,255,0.32)", lineHeight: 1.5 }}>
            {microcopy}
          </p>
        ) : (
          <div className="mb-3" style={{ height: 16 }} />
        )}
        <a
          href="/kdp-pdf-checker"
          className="flex items-center justify-center w-full rounded-xl py-3 font-bold text-sm"
          style={{
            background:    ctaActive ? "#f05a28" : "rgba(240,90,40,0.16)",
            color:         ctaActive ? "#fff"    : "rgba(255,255,255,0.24)",
            transform:     `scale(${ctaScale})`,
            transition:    "background 300ms ease-out, color 300ms ease-out, transform 200ms ease-out, box-shadow 200ms ease-out",
            boxShadow:     ctaActive ? "0 4px 20px rgba(240,90,40,0.28)" : "none",
            pointerEvents: ctaActive ? "auto" : "none",
          }}
        >
          Check My PDF Now
        </a>
      </div>
    </div>
  );
}
