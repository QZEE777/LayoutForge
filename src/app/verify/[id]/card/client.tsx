"use client";

import { useState } from "react";
import Image from "next/image";

type StatusLevel = "reject" | "needs-work" | "nearly" | "ready";

interface Props {
  score: number;
  statusLevel: StatusLevel;
  issuesCount: number | null;
  verifyUrl: string;
  verificationId: string;
  shToken: string | null;
  trimOk: boolean | null;
  marginsOk: boolean | null;
  bleedOk: boolean | null;
  fontsOk: boolean | null;
}

export function SocialCard({
  score,
  statusLevel,
  issuesCount,
  verifyUrl,
  verificationId,
  shToken,
  trimOk,
  marginsOk,
  bleedOk,
  fontsOk,
}: Props) {
  const [copied, setCopied] = useState(false);

  const isPass = statusLevel === "ready" || statusLevel === "nearly";

  // Brand colours — match shell design
  const frameColor  = isPass ? "#22C55E" : "#F05A28";
  const accentColor = isPass ? "#16A34A" : "#EA580C";

  const subline = isPass
    ? "Your PDF is KDP-ready ✅"
    : "Your PDF would be rejected ❌";

  const checks: { label: string; ok: boolean | null }[] = [
    { label: "Trim Size", ok: trimOk },
    { label: "Margins",   ok: marginsOk },
    { label: "Bleed",     ok: bleedOk },
    { label: "Fonts",     ok: fontsOk },
  ];

  const summaryLine = isPass
    ? "No critical errors found"
    : `${issuesCount ?? "Multiple"} issues detected`;

  const mannySrc = isPass ? "/manny/manny_pass.png" : "/manny/manny_fail.png";

  function copyLink() {
    navigator.clipboard.writeText(verifyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const backHref = `/verify/${verificationId}${shToken ? `?sh=${shToken}` : ""}`;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#111",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px 40px",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>

      {/* ═══════════════════════════════════════════
          CARD  —  4:5 portrait (matches IG / FB / LinkedIn shells)
      ═══════════════════════════════════════════ */}
      <div style={{
        width: "100%",
        maxWidth: 400,
        aspectRatio: "4/5",
        background: frameColor,
        borderRadius: 22,
        padding: "18px 18px 12px 18px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxSizing: "border-box",
      }}>

        {/* ── WHITE CONTENT ZONE (top ~80%) ── */}
        <div style={{
          flex: 1,
          background: "#FFFFFF",
          borderRadius: 12,
          padding: "22px 20px 20px 22px",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>

          {/* Small label */}
          <p style={{
            margin: "0 0 10px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.13em",
            textTransform: "uppercase",
            color: "#999",
          }}>
            KDP Pre-Check Result
          </p>

          {/* PASS / FAIL */}
          <span style={{
            fontSize: 54,
            fontWeight: 900,
            color: accentColor,
            lineHeight: 1,
            letterSpacing: "-2px",
            marginBottom: 4,
          }}>
            {isPass ? "PASS" : "FAIL"}
          </span>

          {/* Subline */}
          <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 600, color: "#333" }}>
            {subline}
          </p>

          {/* Score row + bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Readiness Score</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: accentColor }}>{score} / 100</span>
            </div>
            <div style={{ height: 7, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${score}%`, background: accentColor, borderRadius: 4 }} />
            </div>
          </div>

          {/* Checks grid */}
          <div style={{
            background: "#F9FAFB",
            borderRadius: 10,
            padding: "12px 14px",
            border: "1px solid #E5E7EB",
            marginBottom: 14,
          }}>
            {checks.map(({ label, ok }, i) => (
              <div key={label} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: i < checks.length - 1 ? 8 : 0,
                marginBottom: i < checks.length - 1 ? 8 : 0,
                borderBottom: i < checks.length - 1 ? "1px solid #EFEFEF" : "none",
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{label}</span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: ok === null ? "#9CA3AF" : ok ? "#16A34A" : "#DC2626",
                }}>
                  {ok === null ? "—" : ok ? "✓  OK" : "✗  Issue"}
                </span>
              </div>
            ))}
            <div style={{
              borderTop: "1px solid #E5E7EB",
              marginTop: 8,
              paddingTop: 8,
              display: "flex",
              justifyContent: "center",
            }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: accentColor }}>{summaryLine}</span>
            </div>
          </div>

          {/* Hook */}
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#111" }}>
            Would YOUR PDF pass?
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#9CA3AF" }}>
            Free KDP pre-check at manu2print.com
          </p>

          {/* MANNY — anchored bottom-right of white zone */}
          <div style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 155,
            height: 215,
            overflow: "hidden",
          }}>
            <Image
              src={mannySrc}
              alt={isPass ? "Manny — pass" : "Manny — fail"}
              width={155}
              height={215}
              style={{
                objectFit: "cover",
                objectPosition: "50% 0%",
                width: "100%",
                height: "100%",
                display: "block",
              }}
              priority
            />
          </div>
        </div>

        {/* ── BOTTOM BAR — logo + verified ── */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: 10,
          padding: "10px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 900 }}>
            <span style={{ color: "#F05A28" }}>manu</span>
            <span style={{ color: "#111" }}>2</span>
            <span style={{ color: "#16A34A" }}>print</span>
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>
            ✓ Verified by manu2print.com
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          HOW TO SHARE — dead simple, no confusion
      ═══════════════════════════════════════════ */}

      {/* STEP 1 — Download (primary action) */}
      <div style={{
        marginTop: 20,
        width: "100%",
        maxWidth: 400,
      }}>
        <p style={{
          margin: "0 0 8px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)",
          textAlign: "center",
        }}>
          How to share this card
        </p>

        {/* Step 1 */}
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
          {/* IG / LinkedIn */}
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
          {/* Facebook */}
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

        {/* Step 2 */}
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
          <p style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 900, color: "#fff" }}>
            Post the image to LinkedIn / Instagram / Facebook
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            On LinkedIn → click <strong style={{ color: "rgba(255,255,255,0.8)" }}>"Photo"</strong> and upload the image.{"\n"}
            On Instagram → tap <strong style={{ color: "rgba(255,255,255,0.8)" }}>+ New Post</strong> and select the image.{"\n"}
            <strong style={{ color: "#ff6b6b" }}>Do NOT paste your link as a post</strong> — upload the image file.
          </p>
        </div>

        {/* Step 3 */}
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
            {copied ? "✓ Copied! Now paste into your caption" : "📋 Copy caption link"}
          </button>
          <p style={{
            margin: "8px 0 0",
            fontSize: 11,
            color: "rgba(255,255,255,0.28)",
            textAlign: "center",
            lineHeight: 1.5,
          }}>
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
