"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  score: number;
  statusLabel: string;
  statusLevel: "reject" | "needs-work" | "nearly" | "ready";
  issuesCount: number | null;
  filename: string;
  verifyUrl: string;
}

function ScoreGlow({ level }: { level: Props["statusLevel"] }) {
  const color =
    level === "ready"   ? "#4cd964" :
    level === "nearly"  ? "#f59e0b" :
    "#F05A28";
  return (
    <div style={{
      position: "absolute", inset: -24, borderRadius: "50%",
      background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
      pointerEvents: "none",
    }} />
  );
}

export function VerifyClient({ score, statusLabel, statusLevel, issuesCount, filename, verifyUrl }: Props) {
  const [copied, setCopied] = useState<"link" | "caption" | null>(null);

  const hook =
    statusLevel === "ready"
      ? "Your file passed — would yours?"
      : "Would your PDF pass this check? Most don't.";

  const subLabel =
    statusLevel === "reject"  ? "This file would likely be rejected" :
    statusLevel === "needs-work" ? "This file needs significant fixes" :
    statusLevel === "nearly"  ? "This file is nearly ready" :
    "This file is ready for KDP";

  const scoreColor =
    statusLevel === "ready"  ? "#4cd964" :
    statusLevel === "nearly" ? "#f59e0b" :
    "#F05A28";

  const caption = [
    `I thought my PDF was ready… It scored ${score}/100 😳`,
    issuesCount ? `Turns out there were ${issuesCount} issues I couldn't see.` : "",
    "If you're publishing on KDP, check your file before you upload.",
    `👉 ${verifyUrl}`,
    "#KDP #selfpublishing #indieauthor #kindlepublishing",
  ].filter(Boolean).join("\n");

  const copy = (type: "link" | "caption") => {
    const text = type === "link" ? verifyUrl : caption;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2500);
    });
  };

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", background: "#FAF7EE", minHeight: "100vh", color: "#1A1208" }}>

      {/* ── Nav ─────────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid #E0D8C4", padding: "0 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>
            <span style={{ fontWeight: 900, color: "#F05A28" }}>manu</span>
            <span style={{ fontWeight: 900, color: "#2D6A2D" }}>2print</span>
          </span>
          <span style={{ fontSize: 12, color: "#9B8E7E" }}>KDP tools for indie authors</span>
        </div>
      </header>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* ── Score hero ─────────────────────────────────── */}
        <div style={{ background: "#1A1208", borderRadius: 20, padding: "36px 32px", marginBottom: 24, textAlign: "center", position: "relative", overflow: "hidden" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(250,247,238,0.5)", textTransform: "uppercase", margin: "0 0 20px" }}>
            KDP Readiness Verified
          </p>

          {/* Score with glow */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
            <ScoreGlow level={statusLevel} />
            <span style={{ fontSize: "5rem", fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: "2rem", fontWeight: 700, color: "rgba(250,247,238,0.4)" }}>/100</span>
          </div>

          <p style={{ fontSize: "1rem", fontWeight: 700, color: "#FAF7EE", margin: "0 0 6px" }}>
            {subLabel}
          </p>

          {issuesCount !== null && issuesCount > 0 && (
            <p style={{ fontSize: 13, color: "#F05A28", margin: "0 0 20px", fontWeight: 600 }}>
              {issuesCount} issue{issuesCount !== 1 ? "s" : ""} found before upload
            </p>
          )}

          {/* Hook */}
          <div style={{ background: "rgba(240,90,40,0.12)", border: "1px solid rgba(240,90,40,0.25)", borderRadius: 12, padding: "14px 20px" }}>
            <p style={{ fontSize: "1.05rem", fontWeight: 800, color: "#FAF7EE", margin: "0 0 4px" }}>
              {hook}
            </p>
            <p style={{ fontSize: 13, color: "rgba(250,247,238,0.55)", margin: 0 }}>
              {statusLevel !== "ready" ? "Most don't." : "Check yours in 90 seconds."}
            </p>
          </div>

          {filename && (
            <p style={{ fontSize: 11, color: "rgba(250,247,238,0.3)", marginTop: 16, fontStyle: "italic" }}>
              {filename}
            </p>
          )}
        </div>

        {/* ── Pattern interrupt ──────────────────────────── */}
        {statusLevel !== "ready" && (
          <div style={{ background: "#fff", border: "1px solid #E0D8C4", borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#F05A28", margin: "0 0 12px", display: "flex", gap: 8, alignItems: "center" }}>
              ⚠️ Most files fail on:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {["Margins", "Trim size", "Bleed zone", "Font embedding"].map((item) => (
                <div key={item} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, fontWeight: 600, color: "#1A1208" }}>
                  <span style={{ color: "#F05A28" }}>→</span> {item}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "#9B8E7E", margin: "12px 0 0", fontStyle: "italic" }}>
              These are real KDP rejection causes — found before upload, not after.
            </p>
          </div>
        )}

        {/* ── Comparison trigger ─────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "16px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", letterSpacing: "0.08em", margin: "0 0 8px" }}>WITHOUT CHECKING</p>
            <p style={{ fontSize: 12, color: "#7f1d1d", lineHeight: 1.6, margin: 0 }}>
              Upload → wait → rejection → guess → re-upload → repeat
            </p>
          </div>
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "16px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", letterSpacing: "0.08em", margin: "0 0 8px" }}>WITH MANU2PRINT</p>
            <p style={{ fontSize: 12, color: "#14532d", lineHeight: 1.6, margin: 0 }}>
              Upload → scan → fix → publish ✓
            </p>
          </div>
        </div>

        {/* ── Primary CTA ────────────────────────────────── */}
        <div style={{ background: "#1A1208", borderRadius: 16, padding: "28px 28px", marginBottom: 20, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(250,247,238,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>
            Every rejection resets your timeline.
          </p>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#FAF7EE", margin: "0 0 6px" }}>
            Check Before You Upload
          </h2>
          <p style={{ fontSize: 13, color: "rgba(250,247,238,0.55)", margin: "0 0 20px" }}>
            Find out in minutes — before Amazon rejects it.
          </p>
          <Link href="/kdp-pdf-checker"
            style={{ display: "inline-block", background: "#F05A28", color: "#fff", fontWeight: 700, fontSize: "0.95rem", padding: "14px 36px", borderRadius: 10, textDecoration: "none" }}>
            Check My PDF — $9 →
          </Link>
          <p style={{ fontSize: 11, color: "rgba(250,247,238,0.3)", margin: "10px 0 0" }}>
            For authors who want to publish once — not fix files for days.
          </p>
        </div>

        {/* ── Share block ────────────────────────────────── */}
        <div style={{ background: "#fff", border: "1px solid #E0D8C4", borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#1A1208", margin: "0 0 4px" }}>
            💰 Share this result
          </p>
          <p style={{ fontSize: 12, color: "#6B6151", margin: "0 0 16px" }}>
            If someone checks their file from your link, you earn a free scan.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => copy("link")}
              style={{ background: copied === "link" ? "#4cd964" : "#F05A28", color: "#fff", fontWeight: 700, fontSize: 13, padding: "11px 20px", borderRadius: 8, border: "none", cursor: "pointer", transition: "background 0.2s" }}>
              {copied === "link" ? "✓ Link copied!" : "Copy this result link"}
            </button>
            <button
              onClick={() => copy("caption")}
              style={{ background: "transparent", color: "#F05A28", fontWeight: 700, fontSize: 13, padding: "11px 20px", borderRadius: 8, border: "1.5px solid #F05A28", cursor: "pointer" }}>
              {copied === "caption" ? "✓ Caption copied!" : "Copy caption for social media"}
            </button>
          </div>
          {copied === "caption" && (
            <div style={{ marginTop: 12, background: "#FAF7EE", border: "1px solid #E0D8C4", borderRadius: 8, padding: "12px", fontSize: 12, color: "#6B6151", whiteSpace: "pre-line", lineHeight: 1.6 }}>
              {caption}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <p style={{ textAlign: "center", fontSize: 11, color: "#C4B8A8", marginTop: 32 }}>
          © manu2print — Built for indie authors
        </p>
      </div>
    </div>
  );
}
