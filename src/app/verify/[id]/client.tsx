"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Props {
  score: number;
  statusLabel: string;
  statusLevel: "reject" | "needs-work" | "nearly" | "ready";
  issuesCount: number | null;
  filename: string;
  verifyUrl: string;
  verificationId: string;
}

export function VerifyClient({ score, statusLabel, statusLevel, issuesCount, filename, verifyUrl, verificationId }: Props) {
  const [copied, setCopied] = useState<"link" | "caption" | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("m2p_ref");
      if (stored) setRefCode(stored);
    } catch { /* private browsing */ }
  }, []);

  const cardUrl = `/verify/${verificationId}/card${refCode ? `?ref=${refCode}` : ""}`;

  // Result-first copy — state the fact, THEN pivot to "would yours?"
  const resultFact =
    statusLevel === "reject"     ? "This file would be rejected by KDP." :
    statusLevel === "needs-work" ? "This file needs significant fixes." :
    statusLevel === "nearly"     ? "This file is nearly ready for KDP." :
    "This file is ready for KDP.";

  const pivot =
    statusLevel === "ready"
      ? "Would your PDF pass too? Most don't."
      : "Would YOUR PDF pass? Most don't.";

  const caption = [
    `I just checked my manuscript with manu2print — it scored ${score}/100 😳`,
    issuesCount ? `Found ${issuesCount} issues I couldn't see. Before I uploaded to KDP.` : "",
    "If you're self-publishing, check your file first.",
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

  // Orange for all bad/neutral scores. Green only for "ready" — still bold, never dark brown.
  const heroBg    = statusLevel === "ready" ? "#2D6A2D" : "#F05A28";
  const ctaBtnBg  = statusLevel === "ready" ? "#2D6A2D" : "#F05A28";

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", background: "#FAF7EE", minHeight: "100vh", color: "#1A1208" }}>

      {/* ── Nav ─────────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid #E0D8C4", padding: "0 24px", background: "#FAF7EE" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>
            <span style={{ fontWeight: 900, color: "#F05A28" }}>manu</span>
            <span style={{ fontWeight: 900, color: "#2D6A2D" }}>2print</span>
          </span>
          <span style={{ fontSize: 12, color: "#9B8E7E" }}>KDP tools for indie authors</span>
        </div>
      </header>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* ── Score hero — RESULT FIRST ───────────────────── */}
        <div style={{
          background: heroBg,
          borderRadius: 20,
          padding: "36px 32px",
          marginBottom: 24,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Subtle label + filename */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", margin: "0 0 16px" }}>
            KDP Readiness Verified{filename ? ` · ${filename}` : ""}
          </p>

          {/* THE RESULT — massive, white, undeniable */}
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: "6rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: "2.2rem", fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>/100</span>
          </div>

          {/* What it means */}
          <p style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
            {resultFact}
          </p>

          {issuesCount !== null && issuesCount > 0 && (
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", margin: "0 0 24px", fontWeight: 600 }}>
              {issuesCount} issue{issuesCount !== 1 ? "s" : ""} found before upload
            </p>
          )}

          {/* Divider */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", margin: "20px 0" }} />

          {/* Pivot — hook for the viewer, secondary to the result */}
          <p style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>
            {pivot}
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0 }}>
            Check yours in 90 seconds — before Amazon does.
          </p>
        </div>

        {/* ── Pattern interrupt ──────────────────────────── */}
        {statusLevel !== "ready" && (
          <div style={{ background: "#fff", border: "1px solid #E0D8C4", borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#F05A28", margin: "0 0 12px" }}>
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
              Real KDP rejection causes — found before upload, not after.
            </p>
          </div>
        )}

        {/* ── Comparison ─────────────────────────────────── */}
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

        {/* ── Primary CTA — orange, never dark ───────────── */}
        <div style={{ background: "#FFF3EE", border: `2px solid ${ctaBtnBg}`, borderRadius: 16, padding: "28px", marginBottom: 20, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9B8E7E", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>
            Every rejection resets your timeline.
          </p>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#1A1208", margin: "0 0 6px" }}>
            Check Before You Upload
          </h2>
          <p style={{ fontSize: 13, color: "#6B6151", margin: "0 0 20px" }}>
            Find out in minutes — before Amazon rejects it.
          </p>
          <Link href="/kdp-pdf-checker"
            style={{ display: "inline-block", background: ctaBtnBg, color: "#fff", fontWeight: 700, fontSize: "0.95rem", padding: "14px 36px", borderRadius: 10, textDecoration: "none" }}>
            Check My PDF — $9 →
          </Link>
          <p style={{ fontSize: 11, color: "#9B8E7E", margin: "10px 0 0" }}>
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
            <Link
              href={cardUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", background: "#F05A28", color: "#fff", fontWeight: 700, fontSize: 13, padding: "11px 20px", borderRadius: 8, textDecoration: "none", textAlign: "center" }}>
              📸 Create Share Card (Instagram / Facebook)
            </Link>
            <button
              onClick={() => copy("link")}
              style={{ background: "transparent", color: "#F05A28", fontWeight: 700, fontSize: 13, padding: "11px 20px", borderRadius: 8, border: "1.5px solid #F05A28", cursor: "pointer" }}>
              {copied === "link" ? "✓ Link copied!" : "Copy result link"}
            </button>
            <button
              onClick={() => copy("caption")}
              style={{ background: "transparent", color: "#6B6151", fontWeight: 600, fontSize: 13, padding: "11px 20px", borderRadius: 8, border: "1.5px solid #E0D8C4", cursor: "pointer" }}>
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
