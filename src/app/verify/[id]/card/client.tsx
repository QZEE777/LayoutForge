"use client";

import { useState } from "react";

type StatusLevel = "reject" | "needs-work" | "nearly" | "ready";

interface Props {
  score: number;
  statusLevel: StatusLevel;
  issuesCount: number | null;
  verifyUrl: string;
  verificationId: string;
}

export function SocialCard({ score, statusLevel, issuesCount, verifyUrl, verificationId }: Props) {
  const [copied, setCopied] = useState(false);

  const isBad     = statusLevel === "reject" || statusLevel === "needs-work";
  const bg        = isBad ? "#F05A28" : "#2D6A2D";
  const scoreBg   = "rgba(0,0,0,0.18)";
  const proofBg   = "rgba(0,0,0,0.14)";
  const ctaColor  = isBad ? "#F05A28" : "#2D6A2D";

  const hook = isBad ? "Would your PDF pass KDP?" : "My PDF is ready for KDP.";
  const subHook = isBad
    ? "Most authors find out the hard way."
    : "Checked before uploading. Zero surprises.";

  const statusText =
    statusLevel === "reject"     ? "WOULD BE REJECTED" :
    statusLevel === "needs-work" ? "NEEDS SIGNIFICANT FIXES" :
    statusLevel === "nearly"     ? "NEARLY READY" :
    "READY TO UPLOAD";

  const curiosity = isBad
    ? "Most files fail on margins, bleed, and trim size."
    : "Check yours before Amazon rejects it.";

  const copyLink = () => {
    navigator.clipboard.writeText(verifyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#1A1208",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: "32px 20px 48px",
      fontFamily: "system-ui, sans-serif",
    }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ width: "100%", maxWidth: 480, marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>
          Your KDP Score Card
        </p>
        <p style={{ fontSize: "clamp(1.2rem, 5vw, 1.5rem)", fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.2 }}>
          Share this to earn a free scan
        </p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "6px 0 0" }}>
          When a friend checks their PDF using your link, you both win.
        </p>
      </div>

      {/* ── Social card — 4:5 portrait ─────────────────────── */}
      <div id="social-card" style={{
        width: "min(480px, 100%)",
        aspectRatio: "4 / 5",
        background: bg,
        borderRadius: 24,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "32px 28px 28px",
        boxSizing: "border-box",
      }}>

        {/* Logo */}
        <div style={{ marginBottom: 4 }}>
          <span style={{ fontWeight: 900, fontSize: 14, color: "rgba(255,255,255,0.95)" }}>manu</span>
          <span style={{ fontWeight: 900, fontSize: 14, color: "rgba(255,255,255,0.55)" }}>2print</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: 6 }}>KDP tools</span>
        </div>

        {/* Hook — 30% */}
        <div style={{ margin: "18px 0 0" }}>
          <p style={{
            fontSize: "clamp(1.55rem, 6.5vw, 2rem)",
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1.15,
            margin: "0 0 6px",
          }}>
            {hook}
          </p>
          <p style={{
            fontSize: "clamp(0.8rem, 2.8vw, 0.95rem)",
            color: "rgba(255,255,255,0.72)",
            margin: 0,
            fontWeight: 500,
          }}>
            {subHook}
          </p>
        </div>

        {/* Score — 40% */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: scoreBg,
          borderRadius: 18,
          padding: "20px 12px",
          margin: "18px 0 14px",
          textAlign: "center",
        }}>
          <div style={{ lineHeight: 1 }}>
            <span style={{
              fontSize: "clamp(5.5rem, 22vw, 8.5rem)",
              fontWeight: 900,
              color: "#fff",
              display: "inline-block",
            }}>
              {score}
            </span>
            <span style={{
              fontSize: "clamp(2rem, 8vw, 3rem)",
              fontWeight: 700,
              color: "rgba(255,255,255,0.45)",
            }}>
              /100
            </span>
          </div>
          <p style={{
            fontSize: "clamp(0.7rem, 2.8vw, 0.9rem)",
            fontWeight: 800,
            color: "rgba(255,255,255,0.88)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: "10px 0 0",
          }}>
            {statusText}
          </p>
        </div>

        {/* Proof / curiosity — 15% */}
        <div style={{
          background: proofBg,
          borderRadius: 12,
          padding: "11px 14px",
          marginBottom: 12,
          textAlign: "center",
        }}>
          {issuesCount !== null && issuesCount > 0 ? (
            <>
              <p style={{ fontSize: "clamp(0.8rem, 3vw, 0.95rem)", fontWeight: 700, color: "#fff", margin: "0 0 3px" }}>
                {issuesCount} issue{issuesCount !== 1 ? "s" : ""} found before upload
              </p>
              <p style={{ fontSize: "clamp(0.65rem, 2.4vw, 0.78rem)", color: "rgba(255,255,255,0.6)", margin: 0 }}>
                {curiosity}
              </p>
            </>
          ) : (
            <p style={{ fontSize: "clamp(0.7rem, 2.4vw, 0.82rem)", color: "rgba(255,255,255,0.75)", margin: 0 }}>
              {curiosity}
            </p>
          )}
        </div>

        {/* CTA block — 15% */}
        <div style={{
          background: "#fff",
          borderRadius: 13,
          padding: "13px 16px",
          textAlign: "center",
        }}>
          <p style={{
            fontSize: "clamp(0.78rem, 3vw, 0.92rem)",
            fontWeight: 800,
            color: ctaColor,
            margin: "0 0 2px",
          }}>
            Check Before You Upload
          </p>
          <p style={{
            fontSize: "clamp(0.6rem, 2.2vw, 0.72rem)",
            color: "#9B8E7E",
            margin: 0,
          }}>
            manu2print.com
          </p>
        </div>
      </div>

      {/* ── How to share — step by step ────────────────────── */}
      <div style={{
        width: "100%",
        maxWidth: 480,
        marginTop: 28,
        background: "rgba(255,255,255,0.05)",
        borderRadius: 16,
        padding: "22px 20px",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px" }}>
          How to share
        </p>

        {/* Mobile */}
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: "0 0 8px" }}>
            📱 On your phone
          </p>
          {[
            "Press and hold the card above",
            "Tap \"Save Image\" or \"Save to Photos\"",
            "Open Instagram or Facebook → New Post → upload the saved image",
            "Paste your link in the caption or bio",
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 7 }}>
              <span style={{
                minWidth: 22, height: 22,
                background: bg,
                color: "#fff",
                fontWeight: 800,
                fontSize: 11,
                borderRadius: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1,
              }}>
                {i + 1}
              </span>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.45 }}>
                {step}
              </p>
            </div>
          ))}
        </div>

        {/* Desktop */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: "0 0 8px" }}>
            💻 On your computer
          </p>
          {[
            "Right-click the card above",
            "Select \"Save Image As\" and save it",
            "Upload the image when posting on Facebook or Instagram",
            "Paste your link in the caption",
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 7 }}>
              <span style={{
                minWidth: 22, height: 22,
                background: bg,
                color: "#fff",
                fontWeight: 800,
                fontSize: 11,
                borderRadius: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1,
              }}>
                {i + 1}
              </span>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.45 }}>
                {step}
              </p>
            </div>
          ))}
        </div>

        {/* Copy link button */}
        <button
          onClick={copyLink}
          style={{
            width: "100%",
            background: copied ? "rgba(45,106,45,0.6)" : bg,
            color: "#fff",
            fontWeight: 800,
            fontSize: 14,
            padding: "14px 16px",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            transition: "background 0.2s",
            marginBottom: 10,
          }}
        >
          {copied ? "✓ Link copied — paste it in your caption!" : "Copy your share link"}
        </button>

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, textAlign: "center", lineHeight: 1.5 }}>
          This link is unique to you. When someone clicks it and checks their PDF,<br />
          you earn a free scan credit.
        </p>
      </div>

      {/* Back link */}
      <a
        href={`/verify/${verificationId}`}
        style={{ marginTop: 24, fontSize: 13, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}
      >
        ← Back to your result
      </a>

    </div>
  );
}
