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
  trimOk: boolean | null;
  marginsOk: boolean | null;
  bleedOk: boolean | null;
  fontsOk: boolean | null;
}

export function VerifyClient({
  score, statusLevel, issuesCount, verifyUrl, verificationId, shToken,
  trimOk, marginsOk, bleedOk, fontsOk,
}: Props) {
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const isPass  = statusLevel === "ready" || statusLevel === "nearly";
  const shParam = shToken ? `?sh=${shToken}` : "";
  const shareUrl = `${verifyUrl}${shParam}`;
  const ctaHref  = `/kdp-pdf-checker${shParam}`;
  const ogImageUrl = `/api/og/verify/${verificationId}`;

  const bg     = isPass ? "#1a5f3f" : "#8B2F00";
  const accent = isPass ? "#FFA040" : "#FFD480";

  // Pre-written caption — ready to paste
  const caption = isPass
    ? `My KDP PDF just scored ${score}/100. ✅\nCleared before upload.\nWould yours pass? → ${shareUrl}`
    : `My KDP PDF would've been rejected.\nFound ${issuesCount ?? "multiple"} issues before uploading.\nCheck yours here: ${shareUrl}`;

  const handleShare = async () => {
    // Web Share API on mobile — native sheet
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: caption });
        return;
      } catch { /* user cancelled — fall through */ }
    }
    // Desktop fallback: clipboard
    try {
      await navigator.clipboard.writeText(caption);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    } catch { /* ignore */ }
  };

  const resultLine =
    statusLevel === "ready"      ? "Ready for KDP" :
    statusLevel === "nearly"     ? "Nearly Ready"  :
    statusLevel === "needs-work" ? "Needs Work"    :
    "Would Be Rejected";

  const checks = [
    { label: "Trim Size", ok: trimOk },
    { label: "Margins",   ok: marginsOk },
    { label: "Bleed",     ok: bleedOk },
    { label: "Fonts",     ok: fontsOk },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: bg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "28px 20px 60px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 520 }}>

        {/* ── Logo ─────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/manny-avatar.png" alt="" style={{ width: 44, height: 44, borderRadius: "50%" }} />
            <span style={{ fontWeight: 900, fontSize: 24, letterSpacing: "-0.5px" }}>
              <span style={{ color: accent }}>manu</span>
              <span style={{ color: isPass ? "#A8E6A3" : "#FFFFFF" }}>2print</span>
            </span>
          </div>
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: "rgba(255,255,255,0.5)",
            marginTop: 5,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
          }}>
            KDP Readiness Verified
          </div>
        </div>

        {/* ── Section 1: Score + Check Rows ────────────────── */}
        <div style={{
          background: "rgba(0,0,0,0.22)",
          borderRadius: 20,
          padding: "28px 24px",
          marginBottom: 14,
        }}>
          {/* Score */}
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <div style={{ lineHeight: 1 }}>
              <span style={{ fontSize: "clamp(5rem, 20vw, 7rem)", fontWeight: 900, color: "#fff" }}>
                {score}
              </span>
              <span style={{ fontSize: "clamp(2rem, 8vw, 2.6rem)", fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>
                /100
              </span>
            </div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
            }}>
              <span style={{
                fontSize: "clamp(1rem, 4vw, 1.2rem)",
                fontWeight: 900,
                color: isPass ? "#4CE87A" : "#FF8C69",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}>
                {isPass ? "✓ PASS" : "✗ FAIL"}
              </span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>—</span>
              <span style={{
                fontSize: "clamp(0.85rem, 3vw, 1rem)",
                fontWeight: 700,
                color: "rgba(255,255,255,0.7)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}>
                {resultLine}
              </span>
            </div>
          </div>

          {/* Check rows */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.14)", paddingTop: 20 }}>
            {checks.map(({ label, ok }, i) => (
              <div key={label} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: i < checks.length - 1 ? 13 : 0,
                marginBottom:  i < checks.length - 1 ? 13 : 0,
                borderBottom:  i < checks.length - 1 ? "1px solid rgba(255,255,255,0.09)" : "none",
              }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.82)" }}>
                  {label}
                </span>
                <span style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: ok === null ? "rgba(255,255,255,0.3)" : ok ? "#4CE87A" : "#FF8C69",
                }}>
                  {ok === null ? "—" : ok ? "✓" : "✗"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 2: Share Card Preview ────────────────── */}
        <div style={{
          background: "rgba(0,0,0,0.18)",
          borderRadius: 20,
          padding: "18px 18px 14px",
          marginBottom: 14,
        }}>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255,255,255,0.45)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 12,
            textAlign: "center",
          }}>
            Your Share Card
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ogImageUrl}
            alt="Share card preview"
            style={{
              width: "100%",
              borderRadius: 12,
              display: "block",
              marginBottom: 12,
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          />
          <a
            href={ogImageUrl}
            download="kdp-result-card.jpg"
            style={{
              display: "block",
              textAlign: "center",
              background: "rgba(255,255,255,0.11)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              padding: "11px 16px",
              borderRadius: 10,
              textDecoration: "none",
              border: "1.5px solid rgba(255,255,255,0.18)",
            }}
          >
            ⬇ Download Card
          </a>
        </div>

        {/* ── Section 3: Ready-to-paste Caption ────────────── */}
        <div style={{
          background: "rgba(0,0,0,0.18)",
          borderRadius: 20,
          padding: "18px 18px 16px",
          marginBottom: 14,
        }}>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255,255,255,0.45)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
            textAlign: "center",
          }}>
            Ready-to-paste caption
          </p>
          {/* Caption preview */}
          <div style={{
            background: "rgba(0,0,0,0.22)",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 12,
            fontSize: 13,
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.72)",
            whiteSpace: "pre-line",
            border: "1px solid rgba(255,255,255,0.09)",
            wordBreak: "break-word",
          }}>
            {caption}
          </div>
          <button
            onClick={handleShare}
            style={{
              width: "100%",
              background: accent,
              color: "#1a1208",
              fontWeight: 800,
              fontSize: "0.95rem",
              padding: "14px 16px",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
            }}
          >
            {copyState === "copied" ? "✓ Copied to clipboard!" : "📋 Copy Caption + Link"}
          </button>
        </div>

        {/* ── Section 4: Earn ───────────────────────────────── */}
        <div style={{
          background: isPass ? "rgba(255,160,64,0.13)" : "rgba(255,212,128,0.10)",
          border: `1.5px solid ${isPass ? "rgba(255,160,64,0.30)" : "rgba(255,212,128,0.25)"}`,
          borderRadius: 16,
          padding: "18px 20px",
          marginBottom: 20,
          textAlign: "center",
        }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: accent, margin: "0 0 5px" }}>
            Earn free scan credits.
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "0 0 12px", lineHeight: 1.5 }}>
            Every check through your link rewards you.
          </p>
          <Link
            href="/partners"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: accent,
              textDecoration: "none",
              borderBottom: `1px solid ${accent}`,
              paddingBottom: 1,
            }}
          >
            Want to earn cash instead? Become a partner →
          </Link>
        </div>

        {/* ── Primary CTA ───────────────────────────────────── */}
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
          }}
        >
          Check My PDF — $9
        </Link>

      </div>
    </div>
  );
}
