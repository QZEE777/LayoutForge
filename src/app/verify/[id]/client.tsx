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
  verificationId: string;
  shToken: string | null;
}

export function VerifyClient({ score, statusLevel, issuesCount, verifyUrl, verificationId, shToken }: Props) {
  const [copied, setCopied] = useState(false);

  // sh= is the share-to-earn token — carry it forward so conversions are attributed
  const shParam = shToken ? `?sh=${shToken}` : "";
  const cardUrl = `/verify/${verificationId}/card${shToken ? `?sh=${shToken}` : ""}`;
  const ctaHref = `/kdp-pdf-checker${shParam}`;

  const isBad  = statusLevel === "reject" || statusLevel === "needs-work";
  const bg     = isBad ? "#F05A28" : "#2D6A2D";

  const resultLine =
    statusLevel === "reject"     ? "Would be rejected by KDP." :
    statusLevel === "needs-work" ? "Needs significant fixes." :
    statusLevel === "nearly"     ? "Nearly ready for KDP." :
    "Ready for KDP. ✓";

  const hook = isBad
    ? "Would YOUR PDF pass? Most don't."
    : "Would your PDF pass too?";

  const copyLink = () => {
    navigator.clipboard.writeText(verifyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: bg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 20px 40px",
      fontFamily: "system-ui, sans-serif",
    }}>

      {/* ── Single card ─────────────────────────────────── */}
      <div style={{
        width: "100%",
        maxWidth: 480,
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}>

        {/* Logo */}
        <div style={{ marginBottom: 28, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/manny-avatar.png" alt="" style={{ width: 48, height: 48, borderRadius: "50%" }} />
            <span style={{ fontWeight: 900, fontSize: 26, letterSpacing: "-0.5px" }}>
              <span style={{ color: isBad ? "#FFFFFF" : "#F05A28" }}>manu</span>
              <span style={{ color: isBad ? "#6EE7A0" : "#27AE60" }}>2print</span>
            </span>
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: isBad ? "#6EE7A0" : "#F05A28" }}>
            KDP Readiness Verified
          </span>
        </div>

        {/* Hook */}
        <p style={{
          fontSize: "clamp(1.5rem, 6vw, 2rem)",
          fontWeight: 900,
          color: "#fff",
          lineHeight: 1.15,
          margin: "0 0 28px",
          textAlign: "center",
        }}>
          {hook}
        </p>

        {/* Score block */}
        <div style={{
          background: "rgba(0,0,0,0.15)",
          borderRadius: 20,
          padding: "32px 20px",
          textAlign: "center",
          marginBottom: 16,
        }}>
          <div style={{ lineHeight: 1 }}>
            <span style={{ fontSize: "clamp(5.5rem, 22vw, 7.5rem)", fontWeight: 900, color: "#fff" }}>
              {score}
            </span>
            <span style={{ fontSize: "clamp(2rem, 8vw, 2.8rem)", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>
              /100
            </span>
          </div>
          <p style={{
            fontSize: "clamp(0.8rem, 3.5vw, 1rem)",
            fontWeight: 800,
            color: "rgba(255,255,255,0.9)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            margin: "12px 0 0",
          }}>
            {resultLine}
          </p>
        </div>

        {/* Issues + curiosity */}
        <div style={{
          background: "rgba(0,0,0,0.12)",
          borderRadius: 12,
          padding: "12px 16px",
          textAlign: "center",
          marginBottom: 24,
        }}>
          {issuesCount !== null && issuesCount > 0 ? (
            <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
              {issuesCount} issue{issuesCount !== 1 ? "s" : ""} found before upload
            </p>
          ) : null}
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: 0 }}>
            Most files fail on margins, bleed, and trim size.
          </p>
        </div>

        {/* Primary CTA */}
        <Link
          href={ctaHref}
          style={{
            display: "block",
            background: "#fff",
            color: bg,
            fontWeight: 800,
            fontSize: "1rem",
            padding: "16px",
            borderRadius: 13,
            textDecoration: "none",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Check My PDF — $9
        </Link>

        {/* Secondary actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href={cardUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              display: "block",
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              padding: "11px 12px",
              borderRadius: 10,
              textDecoration: "none",
              textAlign: "center",
              border: "1.5px solid rgba(255,255,255,0.3)",
            }}
          >
            📸 Share Card
          </Link>
          <button
            onClick={copyLink}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              padding: "11px 12px",
              borderRadius: 10,
              border: "1.5px solid rgba(255,255,255,0.3)",
              cursor: "pointer",
            }}
          >
            {copied ? "✓ Copied!" : "Copy Link"}
          </button>
        </div>

        {/* Earn note */}
        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 16 }}>
          Share your link — earn a free scan when someone checks theirs
        </p>

      </div>
    </div>
  );
}
