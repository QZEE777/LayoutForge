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

  // ── Colours ────────────────────────────────────────────────────────────────
  const bgGrad = isPass
    ? "linear-gradient(160deg, #1a5c1a 0%, #2d8a2d 55%, #1a5c1a 100%)"
    : "linear-gradient(160deg, #b83800 0%, #e84e00 55%, #b83800 100%)";
  const accentOk   = isPass ? "#7fffb0" : "#ffdd88";
  const accentFail = "#ff6b6b";
  const stepColor  = isPass ? "#2D8A2D" : "#F05A28";

  // ── Check rows ─────────────────────────────────────────────────────────────
  const checks: { label: string; ok: boolean | null }[] = [
    { label: "Trim Size", ok: trimOk },
    { label: "Margins",   ok: marginsOk },
    { label: "Bleed",     ok: bleedOk },
    { label: "Fonts",     ok: fontsOk },
  ];

  function checkIcon(ok: boolean | null) {
    if (ok === null) return <span style={{ color: "rgba(255,255,255,0.35)" }}>—</span>;
    return ok
      ? <span style={{ color: accentOk, fontWeight: 900 }}>✓</span>
      : <span style={{ color: accentFail, fontWeight: 900 }}>✗</span>;
  }

  function checkLabel(ok: boolean | null) {
    if (ok === null) return <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Unknown</span>;
    return ok
      ? <span style={{ color: accentOk, fontWeight: 700, fontSize: 13 }}>OK</span>
      : <span style={{ color: accentFail, fontWeight: 700, fontSize: 13 }}>
          {isPass ? "Minor issue" : "Incorrect"}
        </span>;
  }

  const summaryLine = isPass
    ? "No critical errors"
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

      {/* ══════════════════════════════════════════════
          THE CARD — 4:5 portrait (matches 1080×1350)
      ══════════════════════════════════════════════ */}
      <div style={{
        width: "100%",
        maxWidth: 400,
        aspectRatio: "4/5",
        background: bgGrad,
        borderRadius: 24,
        padding: "26px 26px 0 26px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}>

        {/* TOP LABEL */}
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.6)",
          margin: "0 0 16px",
        }}>
          KDP Pre-Check Result
        </p>

        {/* PASS / FAIL HEADLINE */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 54, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-0.02em" }}>
            {isPass ? "PASS" : "FAIL"}
          </span>
          <span style={{ fontSize: 36 }}>{isPass ? "✅" : "⚠️"}</span>
        </div>

        {/* SCORE */}
        <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.88)", margin: "0 0 18px" }}>
          Readiness Score:&nbsp;
          <span style={{ color: "#fff", fontWeight: 900 }}>{score} / 100</span>
        </p>

        {/* DETAILS BOX */}
        <div style={{
          background: "rgba(0,0,0,0.2)",
          borderRadius: 14,
          padding: "14px 16px 10px",
          backdropFilter: "blur(4px)",
        }}>
          {checks.map(({ label, ok }, i) => (
            <div key={label} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: i < checks.length - 1 ? 9 : 4,
              marginBottom: i < checks.length - 1 ? 9 : 0,
              borderBottom: i < checks.length - 1 ? "1px solid rgba(255,255,255,0.09)" : "none",
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.82)" }}>
                {label}:
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 15 }}>
                {checkIcon(ok)}&nbsp;{checkLabel(ok)}
              </span>
            </div>
          ))}

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", marginTop: 10, paddingTop: 9, textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>
              {summaryLine}
            </p>
          </div>
        </div>

        {/* BOTTOM — Manny + tagline */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginTop: 6,
        }}>
          <div style={{ paddingBottom: 22, maxWidth: "54%" }}>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.45, marginBottom: 5 }}>
              Checked before uploading to KDP.
            </p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff", lineHeight: 1.25 }}>
              Would your PDF pass?
            </p>
          </div>

          <div style={{ width: 130, flexShrink: 0, alignSelf: "flex-end" }}>
            <Image
              src={mannySrc}
              alt={isPass ? "Manny thumbs up" : "Manny shrugging"}
              width={130}
              height={200}
              style={{ objectFit: "contain", objectPosition: "bottom", display: "block" }}
              priority
            />
          </div>
        </div>

        {/* FOOTER STRIP */}
        <div style={{
          margin: "0 -26px",
          padding: "9px 20px",
          background: "rgba(0,0,0,0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 13, fontWeight: 900 }}>
            <span style={{ color: "#F05A28" }}>manu</span>
            <span style={{ color: "#fff" }}>2</span>
            <span style={{ color: "#5cb85c" }}>print</span>
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>manu2print.com</span>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(255,255,255,0.22)",
            borderRadius: 6,
            padding: "2px 7px",
          }}>
            ✓ Verified
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          HOW TO SHARE
      ══════════════════════════════════════════════ */}
      <div style={{
        marginTop: 20,
        width: "100%",
        maxWidth: 400,
        background: "rgba(255,255,255,0.05)",
        borderRadius: 16,
        padding: "18px 20px",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <p style={{
          margin: "0 0 14px",
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          📱 Share to social media
        </p>

        {/* Mobile steps */}
        <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
          On your phone
        </p>
        {[
          "Press & hold the card above",
          "Tap \"Save Image\" → post it to Instagram or Facebook",
          "Paste your link in the caption",
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 7 }}>
            <span style={{
              minWidth: 20, height: 20,
              background: stepColor, color: "#fff",
              fontWeight: 800, fontSize: 10,
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, marginTop: 1,
            }}>{i + 1}</span>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5 }}>{step}</p>
          </div>
        ))}

        {/* Desktop steps */}
        <p style={{ margin: "12px 0 6px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
          On desktop
        </p>
        {[
          "Right-click the card above → Save image as",
          "Upload the image when posting on Facebook or Instagram",
          "Paste your link in the caption",
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 7 }}>
            <span style={{
              minWidth: 20, height: 20,
              background: stepColor, color: "#fff",
              fontWeight: 800, fontSize: 10,
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, marginTop: 1,
            }}>{i + 1}</span>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5 }}>{step}</p>
          </div>
        ))}

        {/* Copy link button */}
        <button
          onClick={copyLink}
          style={{
            width: "100%",
            marginTop: 14,
            padding: "13px 0",
            background: stepColor,
            color: "#fff",
            fontWeight: 800,
            fontSize: 14,
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          {copied ? "✓ Copied! Paste into your caption" : "📋 Copy your share link"}
        </button>

        <p style={{
          margin: "10px 0 0",
          fontSize: 11,
          color: "rgba(255,255,255,0.28)",
          textAlign: "center",
          lineHeight: 1.5,
        }}>
          Your link is unique. When someone clicks it and buys a scan, you earn a free credit.
        </p>
      </div>

      {/* BACK LINK */}
      <a
        href={backHref}
        style={{ marginTop: 18, fontSize: 12, color: "rgba(255,255,255,0.28)", textDecoration: "none" }}
      >
        ← Back to your result
      </a>
    </div>
  );
}
