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
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null);

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

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
    } catch {
      /* ignore */
    }
    setShareState("copied");
    setTimeout(() => setShareState("idle"), 3000);
  };

  const openPopup = (url: string, name: string) => {
    window.open(
      url,
      name,
      "width=600,height=460,resizable=yes,scrollbars=yes"
    );
  };

  const handleOpenSharePanel = async () => {
    await copyCaption();
    setShowSharePanel((v) => !v);
  };

  const openFacebook = () => {
    openPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLinkWithRef)}`, "fb-share");
  };

  const openX = () => {
    openPopup(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`,
      "x-share"
    );
  };

  const openLinkedIn = () => {
    openPopup(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLinkWithRef)}`,
      "linkedin-share"
    );
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, "_blank", "noopener,noreferrer");
  };

  const openTelegram = () => {
    openPopup(
      `https://t.me/share/url?url=${encodeURIComponent(shareLinkWithRef)}&text=${encodeURIComponent(caption)}`,
      "telegram-share"
    );
  };

  const openInstagram = async () => {
    await copyCaption();
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };

  const socialButtons: Array<{
    label: string;
    onClick: () => void | Promise<void>;
    bg: string;
    border: string;
    icon: JSX.Element;
  }> = [
    {
      label: "Facebook",
      onClick: openFacebook,
      bg: "linear-gradient(180deg, #1877F2 0%, #115BCB 100%)",
      border: "rgba(255,255,255,0.24)",
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M14 8h3V4h-3c-3.3 0-5 1.8-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.8.2-1 1-1z" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "X",
      onClick: openX,
      bg: "linear-gradient(180deg, #111111 0%, #000000 100%)",
      border: "rgba(255,255,255,0.24)",
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 4h4.7l4 5.5L17.4 4H20l-6.1 6.9L20.5 20h-4.7l-4.4-6-5.3 6H3.5l6.3-7.2L4 4z" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "LinkedIn",
      onClick: openLinkedIn,
      bg: "linear-gradient(180deg, #0A66C2 0%, #084A8C 100%)",
      border: "rgba(255,255,255,0.24)",
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="9" width="4" height="11" fill="currentColor" />
          <circle cx="6" cy="6" r="2" fill="currentColor" />
          <path d="M11 9h4v1.5c.8-1.1 1.9-1.8 3.7-1.8 3 0 4.3 1.9 4.3 5.2V20h-4v-5.2c0-1.4-.4-2.3-1.8-2.3-1.5 0-2.2 1-2.2 2.8V20h-4V9z" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "WhatsApp",
      onClick: openWhatsApp,
      bg: "linear-gradient(180deg, #25D366 0%, #1EAE52 100%)",
      border: "rgba(255,255,255,0.24)",
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 4a8 8 0 0 0-6.9 12.1L4 20l3.9-1A8 8 0 1 0 12 4zm4.5 11.2c-.2.5-1.2 1-1.6 1.1-.4.1-.9.2-1.5 0s-1.4-.5-2.4-1.2c-1.2-.9-2-2-2.3-2.5-.3-.5 0-.8.2-1.1l.5-.6c.2-.2.2-.4.4-.6.1-.2.1-.4 0-.6L9 7.8c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7s1.2 3.1 1.3 3.3c.2.2 2.3 3.5 5.6 4.8.8.3 1.4.5 1.9.6.8.1 1.5.1 2-.1.6-.2 1.8-.8 2.1-1.5.2-.7.2-1.3.1-1.5-.1-.2-.3-.3-.6-.4l-1.4-.7c-.3-.2-.5-.2-.8.2l-.6.8c-.2.3-.4.3-.7.1-.3-.1-1.4-.5-2.7-1.7-1-1-1.7-2.2-1.9-2.5-.2-.3 0-.5.1-.7l.5-.5c.2-.2.3-.3.4-.5.1-.2.1-.4 0-.6l-.6-1.4z" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "Telegram",
      onClick: openTelegram,
      bg: "linear-gradient(180deg, #2AABEE 0%, #1E88C6 100%)",
      border: "rgba(255,255,255,0.24)",
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M21 4 3 11l6.5 2.2L11.8 20 21 4zM10 13l8-6.5-6.1 8.6-.4 3.1L10 13z" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "Instagram",
      onClick: openInstagram,
      bg: "linear-gradient(135deg, #F58529 0%, #DD2A7B 45%, #8134AF 75%, #515BD4 100%)",
      border: "rgba(255,255,255,0.24)",
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
        </svg>
      ),
    },
  ];

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
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/manny-avatar.png" alt="" style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
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
          onClick={handleOpenSharePanel}
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
            ? "✓ Caption copied — choose platform below"
            : "🚀 Share to Social"}
        </button>

        {showSharePanel && (
          <div
            style={{
              background: "linear-gradient(180deg, rgba(9,20,14,0.68) 0%, rgba(9,20,14,0.82) 100%)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 14,
              padding: "14px",
              marginBottom: 12,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          >
            <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.86)", fontSize: 12, textAlign: "center", fontWeight: 700, letterSpacing: "0.02em" }}>
              Share link opens platform post page (or login if needed)
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {socialButtons.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  onMouseEnter={() => setHoveredSocial(item.label)}
                  onMouseLeave={() => setHoveredSocial((prev) => (prev === item.label ? null : prev))}
                  style={{
                    background: item.bg,
                    border: `1px solid ${item.border}`,
                    color: "#fff",
                    borderRadius: 11,
                    padding: "10px 10px",
                    fontWeight: 800,
                    fontSize: 13.5,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transform: hoveredSocial === item.label ? "translateY(-2px) scale(1.01)" : "translateY(0) scale(1)",
                    boxShadow:
                      hoveredSocial === item.label
                        ? "0 12px 24px -8px rgba(0,0,0,0.48), 0 0 0 2px rgba(255,255,255,0.16), inset 0 1px 0 rgba(255,255,255,0.24)"
                        : "0 8px 20px -8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                    transition: "transform 150ms ease, box-shadow 150ms ease, filter 150ms ease",
                    filter: hoveredSocial === item.label ? "saturate(1.07)" : "saturate(1)",
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(255,255,255,0.18)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

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
