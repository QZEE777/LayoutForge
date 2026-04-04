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

// ── SVG icons — inline, no glyph rendering risk ──────────────────────────────
function SvgPass({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="rgba(76,232,122,0.2)" />
      <circle cx="12" cy="12" r="9" fill="#4CE87A" />
      <path d="M7 12.5 L10.5 16 L17 9" stroke="#0D3B1E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SvgFail({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="rgba(255,140,105,0.2)" />
      <circle cx="12" cy="12" r="9" fill="#FF8C69" />
      <path d="M8.5 8.5 L15.5 15.5 M15.5 8.5 L8.5 15.5" stroke="#4A1500" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function SvgUnknown({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <rect x="10.5" y="11" width="3" height="2" rx="1" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}

function SvgHeroBadge({ isPass }: { isPass: boolean }) {
  return isPass ? (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="40" fill="rgba(76,232,122,0.10)" />
      <circle cx="40" cy="40" r="32" fill="rgba(76,232,122,0.18)" />
      <circle cx="40" cy="40" r="24" fill="#4CE87A" />
      <path d="M27 41 L36 50 L54 31" stroke="#0D3B1E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="40" fill="rgba(255,140,105,0.10)" />
      <circle cx="40" cy="40" r="32" fill="rgba(255,140,105,0.18)" />
      <circle cx="40" cy="40" r="24" fill="#FF8C69" />
      <path d="M28 28 L52 52 M52 28 L28 52" stroke="#4A1500" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function VerifyClient({
  score, statusLevel, issuesCount, verifyUrl, verificationId, shToken,
  trimOk, marginsOk, bleedOk, fontsOk,
}: Props) {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  // ── Single Source of Truth ────────────────────────────────────────────────
  const isPass  = statusLevel === "ready" || statusLevel === "nearly";
  const shParam = shToken ? `?sh=${shToken}` : "";
  const shareUrl = `${verifyUrl}${shParam}`;
  const ctaHref  = `/kdp-pdf-checker${shParam}`;

  // OG image — page stamps all state params so the card is always in sync
  const checkParams = [
    `trim=${trimOk === null ? "" : trimOk ? 1 : 0}`,
    `margins=${marginsOk === null ? "" : marginsOk ? 1 : 0}`,
    `bleed=${bleedOk === null ? "" : bleedOk ? 1 : 0}`,
    `fonts=${fontsOk === null ? "" : fontsOk ? 1 : 0}`,
  ].join("&");
  const ogUrl = `/api/og/verify/${verificationId}?p=${isPass ? 1 : 0}&s=${score}&${checkParams}`;

  const bg     = isPass ? "#1a5f3f" : "#8B2F00";
  const accent = isPass ? "#4CE87A" : "#FFD480";

  const resultLine =
    statusLevel === "ready"      ? "Ready for KDP"    :
    statusLevel === "nearly"     ? "Nearly Ready"     :
    statusLevel === "needs-work" ? "Needs Work"       :
    "Would Be Rejected";

  // ── Guru captions ─────────────────────────────────────────────────────────
  const caption = isPass
    ? `Just checked my KDP manuscript on manu2print.com — scored ${score}/100. ✅ Ready for Amazon. Would yours pass? Check free: ${shareUrl}`
    : `Caught ${issuesCount ?? "multiple"} issues in my KDP PDF before uploading to Amazon. 🛑 Saved myself a rejection. Check yours before you submit: ${shareUrl}`;

  // ── Share handler: native sheet on mobile, FB dialog on desktop ───────────
  const handleShare = async () => {
    // Mobile: native Web Share API
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: caption, url: shareUrl });
        return;
      } catch { /* user cancelled */ }
    }
    // Desktop: copy caption then open FB share dialog
    try { await navigator.clipboard.writeText(caption); } catch { /* ignore */ }
    setShareState("copied");
    setTimeout(() => setShareState("idle"), 3000);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      "fb-share",
      "width=600,height=460,resizable=yes,scrollbars=yes"
    );
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
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/manny-avatar.png" alt="" style={{ width: 42, height: 42, borderRadius: "50%" }} />
            <span style={{ fontWeight: 900, fontSize: 23, letterSpacing: "-0.5px" }}>
              <span style={{ color: isPass ? "#FFA040" : "#FFD480" }}>manu</span>
              <span style={{ color: isPass ? "#A8E6A3" : "#FFFFFF" }}>2print</span>
            </span>
          </div>
        </div>

        {/* ── What this is ─────────────────────────────────────────────── */}
        <div style={{
          background: "rgba(0,0,0,0.18)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 20,
          textAlign: "center",
        }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.55 }}>
            This is a <strong style={{ color: "#fff" }}>public KDP scan result</strong> — no login needed to view it.
            Share it with author groups, beta readers, or your publisher to show your manuscript is print-ready.
          </p>
        </div>

        {/* ── Hero block: badge + score + checks ────────────────────────── */}
        <div style={{
          background: "rgba(0,0,0,0.22)",
          borderRadius: 20,
          padding: "30px 24px 24px",
          marginBottom: 14,
          textAlign: "center",
        }}>
          {/* Badge */}
          <div style={{ marginBottom: 16 }}>
            <SvgHeroBadge isPass={isPass} />
          </div>

          {/* Score */}
          <div style={{ lineHeight: 1, marginBottom: 10 }}>
            <span style={{ fontSize: "clamp(5rem, 20vw, 7rem)", fontWeight: 900, color: "#fff" }}>
              {score}
            </span>
            <span style={{ fontSize: "clamp(2rem, 8vw, 2.4rem)", fontWeight: 700, color: "rgba(255,255,255,0.28)" }}>
              /100
            </span>
          </div>

          {/* Verdict pill */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: isPass ? "rgba(76,232,122,0.15)" : "rgba(255,140,105,0.15)",
            border: `1.5px solid ${isPass ? "rgba(76,232,122,0.35)" : "rgba(255,140,105,0.35)"}`,
            borderRadius: 999,
            padding: "5px 18px",
            marginBottom: 24,
          }}>
            <span style={{
              fontSize: 13,
              fontWeight: 900,
              color: isPass ? "#4CE87A" : "#FF8C69",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>
              {isPass ? "PASS" : "FAIL"}
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>·</span>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: "rgba(255,255,255,0.6)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}>
              {resultLine}
            </span>
          </div>

          {/* Check rows */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.11)", paddingTop: 18 }}>
            {checks.map(({ label, ok }, i) => (
              <div key={label} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: i < checks.length - 1 ? 13 : 0,
                marginBottom:  i < checks.length - 1 ? 13 : 0,
                borderBottom:  i < checks.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.82)" }}>
                  {label}
                </span>
                {ok === null ? <SvgUnknown /> : ok ? <SvgPass /> : <SvgFail />}
              </div>
            ))}
          </div>
        </div>

        {/* ── Primary: Share to Social ───────────────────────────────────── */}
        <button
          onClick={handleShare}
          style={{
            width: "100%",
            background: accent,
            color: isPass ? "#0D3B1E" : "#2A1600",
            fontWeight: 900,
            fontSize: "1.05rem",
            padding: "17px 16px",
            borderRadius: 13,
            border: "none",
            cursor: "pointer",
            marginBottom: 10,
            letterSpacing: "0.01em",
          }}
        >
          {shareState === "copied"
            ? "✓ Caption copied — FB dialog is open"
            : "🚀 Share to Social"}
        </button>

        {/* ── Secondary: Download Image ──────────────────────────────────── */}
        <a
          href={ogUrl}
          download={`kdp-result-${isPass ? "pass" : "fail"}-${score}.jpg`}
          style={{
            display: "block",
            textAlign: "center",
            background: "rgba(255,255,255,0.10)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            padding: "13px 16px",
            borderRadius: 12,
            textDecoration: "none",
            border: "1.5px solid rgba(255,255,255,0.18)",
            marginBottom: 20,
          }}
        >
          ⬇ Download Image
        </a>

        {/* ── Earn — full-width brand green ──────────────────────────────── */}
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
