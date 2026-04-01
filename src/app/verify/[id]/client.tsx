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

// ── Inline SVG icons — no emoji, no render glitches ──────────────────────────
function IconPass({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="11" fill="#4CE87A" />
      <path d="M6 11.5 L9.5 15 L16 8" stroke="#0D3B1E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconFail({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="11" fill="#FF8C69" />
      <path d="M7 7 L15 15 M15 7 L7 15" stroke="#4A1500" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IconUnknown({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="11" fill="rgba(255,255,255,0.15)" />
      <text x="11" y="15.5" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="12" fontWeight="700">—</text>
    </svg>
  );
}

function BigPassBadge() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="36" fill="#4CE87A" fillOpacity="0.15" />
      <circle cx="36" cy="36" r="28" fill="#4CE87A" fillOpacity="0.22" />
      <circle cx="36" cy="36" r="20" fill="#4CE87A" />
      <path d="M24 37 L32 45 L48 28" stroke="#0D3B1E" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BigFailBadge() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="36" fill="#FF8C69" fillOpacity="0.15" />
      <circle cx="36" cy="36" r="28" fill="#FF8C69" fillOpacity="0.22" />
      <circle cx="36" cy="36" r="20" fill="#FF8C69" />
      <path d="M27 27 L45 45 M45 27 L27 45" stroke="#4A1500" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export function VerifyClient({
  score, statusLevel, issuesCount, verifyUrl, verificationId, shToken,
  trimOk, marginsOk, bleedOk, fontsOk,
}: Props) {
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  // ── Single Source of Truth ────────────────────────────────────────────────
  const isPass  = statusLevel === "ready" || statusLevel === "nearly";
  const shParam = shToken ? `?sh=${shToken}` : "";
  const shareUrl = `${verifyUrl}${shParam}`;
  const ctaHref  = `/kdp-pdf-checker${shParam}`;

  // OG image URL stamps the computed state so the card can NEVER diverge from the page
  const ogParams = `?p=${isPass ? 1 : 0}&s=${score}`;
  const ogPortraitUrl  = `/api/og/verify/${verificationId}${ogParams}`;

  const bg        = isPass ? "#1a5f3f" : "#8B2F00";
  const cardColor = isPass ? "#2D6A2D" : "#8B2F00";
  const accent    = isPass ? "#4CE87A" : "#FFD480";

  const resultLine =
    statusLevel === "ready"      ? "Ready for KDP"    :
    statusLevel === "nearly"     ? "Nearly Ready"     :
    statusLevel === "needs-work" ? "Needs Work"       :
    "Would Be Rejected";

  // ── High-conversion captions ──────────────────────────────────────────────
  const caption = isPass
    ? `Ran my KDP PDF through a pro check. Scored ${score}/100. ✅\nMost authors upload blind. I didn't.\nCheck yours → ${shareUrl}`
    : `Almost uploaded this to KDP.\nFound ${issuesCount ?? "multiple"} issues before it cost me.\nRun yours → ${shareUrl}`;

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ text: caption }); return; } catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(caption);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    } catch { /* ignore */ }
  };

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

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/manny-avatar.png" alt="" style={{ width: 42, height: 42, borderRadius: "50%" }} />
            <span style={{ fontWeight: 900, fontSize: 23, letterSpacing: "-0.5px" }}>
              <span style={{ color: isPass ? "#FFA040" : "#FFD480" }}>manu</span>
              <span style={{ color: isPass ? "#A8E6A3" : "#FFFFFF" }}>2print</span>
            </span>
          </div>
        </div>

        {/* ── Section 1: Score + Badge + Checks ─────────────────────────── */}
        <div style={{
          background: "rgba(0,0,0,0.22)",
          borderRadius: 20,
          padding: "28px 24px 22px",
          marginBottom: 12,
          textAlign: "center",
        }}>
          {/* Big badge */}
          <div style={{ marginBottom: 14 }}>
            {isPass ? <BigPassBadge /> : <BigFailBadge />}
          </div>

          {/* Score */}
          <div style={{ lineHeight: 1, marginBottom: 8 }}>
            <span style={{ fontSize: "clamp(5rem, 20vw, 7rem)", fontWeight: 900, color: "#fff" }}>
              {score}
            </span>
            <span style={{ fontSize: "clamp(2rem, 8vw, 2.4rem)", fontWeight: 700, color: "rgba(255,255,255,0.30)" }}>
              /100
            </span>
          </div>

          {/* Verdict pill */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: isPass ? "rgba(76,232,122,0.15)" : "rgba(255,140,105,0.15)",
            border: `1.5px solid ${isPass ? "rgba(76,232,122,0.4)" : "rgba(255,140,105,0.4)"}`,
            borderRadius: 999,
            padding: "5px 16px",
            marginBottom: 22,
          }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: isPass ? "#4CE87A" : "#FF8C69", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {isPass ? "PASS" : "FAIL"}
            </span>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>·</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {resultLine}
            </span>
          </div>

          {/* Check rows */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 18 }}>
            {checks.map(({ label, ok }, i) => (
              <div key={label} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: i < checks.length - 1 ? 13 : 0,
                marginBottom:  i < checks.length - 1 ? 13 : 0,
                borderBottom:  i < checks.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.80)" }}>
                  {label}
                </span>
                {ok === null ? <IconUnknown /> : ok ? <IconPass /> : <IconFail />}
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 2: Share Card Preview ─────────────────────────────── */}
        <div style={{
          background: "rgba(0,0,0,0.18)",
          borderRadius: 20,
          padding: "16px 16px 14px",
          marginBottom: 12,
        }}>
          <p style={{
            fontSize: 10,
            fontWeight: 700,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 10,
            textAlign: "center",
          }}>
            Your Share Card
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ogPortraitUrl}
            alt={`KDP check result card — ${isPass ? "PASS" : "FAIL"} ${score}/100`}
            style={{
              width: "100%",
              borderRadius: 10,
              display: "block",
              marginBottom: 10,
              border: `1.5px solid ${isPass ? "rgba(76,232,122,0.2)" : "rgba(255,140,105,0.2)"}`,
            }}
          />
          <a
            href={ogPortraitUrl}
            download={`kdp-result-${isPass ? "pass" : "fail"}-${score}.jpg`}
            style={{
              display: "block",
              textAlign: "center",
              background: "rgba(255,255,255,0.10)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              padding: "12px 16px",
              borderRadius: 10,
              textDecoration: "none",
              border: "1.5px solid rgba(255,255,255,0.16)",
            }}
          >
            ⬇ Download Card
          </a>
        </div>

        {/* ── Section 3: Caption + Share button ─────────────────────────── */}
        <div style={{
          background: "rgba(0,0,0,0.18)",
          borderRadius: 20,
          padding: "16px 16px 14px",
          marginBottom: 12,
        }}>
          <p style={{
            fontSize: 10,
            fontWeight: 700,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 10,
            textAlign: "center",
          }}>
            Ready-to-paste caption
          </p>
          <div style={{
            background: "rgba(0,0,0,0.25)",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 12,
            fontSize: 13.5,
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.75)",
            whiteSpace: "pre-line",
            border: "1px solid rgba(255,255,255,0.08)",
            wordBreak: "break-word",
          }}>
            {caption}
          </div>
          <button
            onClick={handleShare}
            style={{
              width: "100%",
              background: accent,
              color: isPass ? "#0D3B1E" : "#2A1600",
              fontWeight: 800,
              fontSize: "1rem",
              padding: "15px 16px",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.01em",
            }}
          >
            {copyState === "copied" ? "✓ Copied!" : "📋 Copy Share Package"}
          </button>
        </div>

        {/* ── Section 4: Earn — full-width brand green ───────────────────── */}
        <div style={{
          background: "#2D6A2D",
          borderRadius: 16,
          padding: "20px 22px",
          marginBottom: 18,
          textAlign: "center",
        }}>
          <p style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: "0 0 6px", lineHeight: 1.3 }}>
            🎁 Share &amp; Get Free Scans
          </p>
          <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.82)", margin: "0 0 14px", lineHeight: 1.55 }}>
            When someone checks their PDF through your link,<br />
            you earn a 100% Free Scan Credit.
          </p>
          <Link
            href="/partners"
            style={{
              display: "inline-block",
              fontSize: 13,
              fontWeight: 700,
              color: "#4CE87A",
              textDecoration: "none",
              borderBottom: "1.5px solid rgba(76,232,122,0.5)",
              paddingBottom: 1,
            }}
          >
            Want to earn cash instead? Become a partner →
          </Link>
        </div>

        {/* ── Primary CTA ───────────────────────────────────────────────── */}
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
