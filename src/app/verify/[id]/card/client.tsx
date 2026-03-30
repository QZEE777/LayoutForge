"use client";

import { useState } from "react";

interface Props {
  verifyUrl: string;
  verificationId: string;
  shToken: string | null;
  isPass: boolean;
}

export function SocialCard({ verifyUrl, verificationId, shToken, isPass }: Props) {
  const [copied, setCopied] = useState(false);

  const accentColor = isPass ? "#16A34A" : "#EA580C";
  const backHref    = `/verify/${verificationId}${shToken ? `?sh=${shToken}` : ""}`;

  function copyLink() {
    navigator.clipboard.writeText(verifyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#111",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px 40px",
      fontFamily: "system-ui, sans-serif",
    }}>

      {/* ── LIVE PREVIEW — exactly what you download ── */}
      <div style={{
        width: "100%",
        maxWidth: 400,
        borderRadius: 22,
        overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        marginBottom: 24,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/og/verify/${verificationId}`}
          alt="Your KDP result card"
          style={{ width: "100%", display: "block" }}
        />
      </div>

      {/* ── STEPS ── */}
      <div style={{ width: "100%", maxWidth: 400 }}>

        <p style={{
          margin: "0 0 12px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)",
          textAlign: "center",
        }}>
          How to share this card
        </p>

        {/* Step 1 — Download */}
        <div style={{
          background: accentColor,
          borderRadius: 14,
          padding: "16px 20px",
          marginBottom: 10,
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Step 1
          </p>
          <p style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 900, color: "#fff" }}>
            Download your card
          </p>
          <a
            href={`/api/og/verify/${verificationId}`}
            download="manu2print-result-ig.png"
            style={{
              display: "block",
              width: "100%",
              padding: "13px 0",
              background: "#fff",
              color: accentColor,
              fontWeight: 900,
              fontSize: 14,
              borderRadius: 10,
              textAlign: "center",
              textDecoration: "none",
              boxSizing: "border-box",
              marginBottom: 8,
            }}
          >
            ⬇️ Instagram &amp; LinkedIn (1080×1350)
          </a>
          <a
            href={`/api/og/verify/${verificationId}?format=fb`}
            download="manu2print-result-fb.png"
            style={{
              display: "block",
              width: "100%",
              padding: "13px 0",
              background: "rgba(255,255,255,0.18)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              borderRadius: 10,
              textAlign: "center",
              textDecoration: "none",
              boxSizing: "border-box",
              border: "1px solid rgba(255,255,255,0.35)",
            }}
          >
            ⬇️ Facebook (1200×1500)
          </a>
        </div>

        {/* Step 2 — Post image */}
        <div style={{
          background: "rgba(255,255,255,0.07)",
          borderRadius: 14,
          padding: "16px 20px",
          marginBottom: 10,
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Step 2
          </p>
          <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 900, color: "#fff" }}>
            Post the image on LinkedIn / Instagram / Facebook
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            LinkedIn → click <strong style={{ color: "rgba(255,255,255,0.8)" }}>Photo</strong> and upload the file.{" "}
            Instagram → tap <strong style={{ color: "rgba(255,255,255,0.8)" }}>+ New Post</strong> and select the image.{" "}
            <strong style={{ color: "#ff6b6b" }}>Do NOT paste a link</strong> — upload the image file directly.
          </p>
        </div>

        {/* Step 3 — Caption link */}
        <div style={{
          background: "rgba(255,255,255,0.07)",
          borderRadius: 14,
          padding: "16px 20px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Step 3
          </p>
          <p style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 900, color: "#fff" }}>
            Paste your share link in the caption
          </p>
          <button
            onClick={copyLink}
            style={{
              width: "100%",
              padding: "13px 0",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            {copied ? "✓ Copied! Paste into your caption" : "📋 Copy caption link"}
          </button>
          <p style={{ margin: "8px 0 0", fontSize: 11, color: "rgba(255,255,255,0.28)", textAlign: "center" }}>
            When someone buys a scan through your link, you earn a free credit.
          </p>
        </div>
      </div>

      <a
        href={backHref}
        style={{ marginTop: 18, fontSize: 12, color: "rgba(255,255,255,0.28)", textDecoration: "none" }}
      >
        ← Back to your result
      </a>
    </div>
  );
}
