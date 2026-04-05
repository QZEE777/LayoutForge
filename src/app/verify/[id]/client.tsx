"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandWordmark } from "@/components/BrandWordmark";
import { buildVerifyShareCaption } from "@/lib/shareVerifyCaption";

interface Props {
  score: number;
  statusLevel: "reject" | "needs-work" | "nearly" | "ready";
  issuesCount: number | null;
  verifyUrl: string;
  shToken: string | null;
  /** Same boolean stamped on OG as `p=1` — kdp_ready or score ≥ 90 */
  ogIsPass: boolean;
  /** Absolute path to portrait OG API (includes p, s, checks, format=portrait) */
  portraitOgPath: string;
}

export function VerifyClient({
  score,
  statusLevel,
  issuesCount,
  verifyUrl,
  shToken,
  ogIsPass,
  portraitOgPath,
}: Props) {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  const isPass = statusLevel === "ready";
  const isNearly = statusLevel === "nearly";
  const shParam = shToken ? `?sh=${encodeURIComponent(shToken)}` : "";
  const shareLinkWithRef = shToken ? `${verifyUrl}?sh=${encodeURIComponent(shToken)}` : verifyUrl;
  const ctaHref = `/kdp-pdf-checker${shParam}`;

  const ogUrl = portraitOgPath;

  const bg = isPass ? "#1a5f3f" : isNearly ? "#6B3800" : "#8B2F00";
  const accent = isPass ? "#4CE87A" : isNearly ? "#FFA040" : "#FF8C69";

  const caption = buildVerifyShareCaption({
    isPass: ogIsPass,
    score,
    verifyUrl: shareLinkWithRef,
    issuesCount,
  });

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: caption });
        return;
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(caption);
    } catch {
      /* ignore */
    }
    setShareState("copied");
    setTimeout(() => setShareState("idle"), 3000);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLinkWithRef)}`,
      "fb-share",
      "width=600,height=460,resizable=yes,scrollbars=yes"
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "28px 20px 60px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/manny-avatar.png" alt="" style={{ width: 42, height: 42, borderRadius: "50%" }} />
            <BrandWordmark variant="onDark" className="text-xl sm:text-2xl tracking-tight" />
          </div>
        </div>

        <div
          style={{
            background: "rgba(0,0,0,0.18)",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.55 }}>
            This is a <strong style={{ color: "#fff" }}>public KDP scan result</strong> — no login needed to view it.
            Share it with author groups, beta readers, or your publisher to show your manuscript is print-ready.
          </p>
        </div>

        {/* Master card: same PNG as social OG (portrait) — single source of truth */}
        <div
          style={{
            borderRadius: 20,
            overflow: "hidden",
            marginBottom: 14,
            boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
            lineHeight: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ogUrl}
            alt={`KDP readiness score ${score} out of 100`}
            width={1080}
            height={1350}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>

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

        <a
          href={ogUrl}
          download={`kdp-result-${ogIsPass ? "pass" : "fail"}-${score}.png`}
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

        <div
          style={{
            background: "#2D6A2D",
            borderRadius: 16,
            padding: "20px 22px",
            marginBottom: 18,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: "0 0 6px", lineHeight: 1.3 }}>
            🎁 Share &amp; Get Free Scans
          </p>
          <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.82)", margin: "0 0 14px", lineHeight: 1.55 }}>
            When someone checks their PDF through your link,
            <br />
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
