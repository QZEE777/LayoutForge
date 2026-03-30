"use client";

import { useState } from "react";

type Variant = "ego" | "fear" | "curiosity";

interface Props {
  verifyUrl: string;
  verificationId: string;
  shToken: string | null;
  isPass: boolean;
}

export function SocialCard({ verifyUrl, verificationId, shToken, isPass }: Props) {
  const defaultVariant: Variant = isPass ? "ego" : "fear";
  const [variant, setVariant]   = useState<Variant>(defaultVariant);
  const [copied, setCopied]     = useState(false);
  const [clipped, setClipped]   = useState<"idle" | "copying" | "done" | "error">("idle");

  const accentColor = isPass ? "#16A34A" : "#EA580C";
  const backHref    = `/verify/${verificationId}${shToken ? `?sh=${shToken}` : ""}`;

  const ogBase   = `/api/og/verify/${verificationId}`;
  const igUrl    = `${ogBase}?v=${variant}`;
  const fbUrl    = `${ogBase}?v=${variant}&format=fb`;

  // Available variants depend on result
  const variants: { id: Variant; label: string; sub: string }[] = [
    ...(isPass  ? [{ id: "ego"       as Variant, label: "EGO",       sub: "Brag about your pass"    }] : []),
    ...(!isPass ? [{ id: "fear"      as Variant, label: "FEAR",      sub: "Warn your audience"      }] : []),
    {             id: "curiosity",               label: "CURIOSITY", sub: "Most viral — works both" },
  ];

  function copyLink() {
    navigator.clipboard.writeText(verifyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  async function copyImageToClipboard() {
    setClipped("copying");
    try {
      const blob = await fetch(igUrl).then(r => r.blob());
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setClipped("done");
      setTimeout(() => setClipped("idle"), 3000);
    } catch {
      // Fallback: open image in new tab for manual copy
      window.open(igUrl, "_blank");
      setClipped("error");
      setTimeout(() => setClipped("idle"), 3000);
    }
  }

  const clipLabel =
    clipped === "copying" ? "Copying…" :
    clipped === "done"    ? "✓ Copied to clipboard!" :
    clipped === "error"   ? "Opened in new tab — save from there" :
    "Copy image to clipboard";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#111",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: "32px 16px 48px",
      fontFamily: "system-ui, sans-serif",
    }}>

      {/* ── VARIANT SELECTOR ── */}
      <div style={{
        width: "100%",
        maxWidth: 400,
        marginBottom: 20,
      }}>
        <p style={{
          margin: "0 0 12px",
          fontSize: 16,
          fontWeight: 900,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "#F05A28",
          textAlign: "center",
        }}>
          Choose your message
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          {variants.map(v => (
            <button
              key={v.id}
              onClick={() => setVariant(v.id)}
              style={{
                flex: 1,
                padding: "14px 8px",
                background: variant === v.id ? accentColor : "rgba(255,255,255,0.07)",
                color: variant === v.id ? "#fff" : "rgba(255,255,255,0.55)",
                border: variant === v.id
                  ? `2px solid ${accentColor}`
                  : "2px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 900,
                fontSize: 15,
                lineHeight: 1.3,
                textAlign: "center",
              }}
            >
              {v.label}
              <span style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                opacity: 0.75,
                marginTop: 4,
              }}>
                {v.sub}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── LIVE PREVIEW — exactly what you download ── */}
      <div style={{
        width: "100%",
        maxWidth: 400,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
        marginBottom: 24,
      }}>
        {/* Key on variant forces img reload when variant changes */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={variant}
          src={igUrl}
          alt="Your KDP result card"
          style={{ width: "100%", display: "block" }}
        />
      </div>

      {/* ── ACTIONS ── */}
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Download buttons */}
        <div style={{
          background: accentColor,
          borderRadius: 14,
          padding: "20px 24px",
          marginBottom: 10,
        }}>
          <p style={{
            margin: "0 0 6px",
            fontSize: 13,
            fontWeight: 800,
            color: "rgba(255,255,255,0.80)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            Step 1 — Download
          </p>
          <p style={{ margin: "0 0 18px", fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
            Save your card
          </p>
          <a
            href={igUrl}
            download={`manu2print-${variant}-ig.png`}
            style={{
              display: "block",
              width: "100%",
              padding: "15px 0",
              background: "#fff",
              color: accentColor,
              fontWeight: 900,
              fontSize: 16,
              borderRadius: 10,
              textAlign: "center",
              textDecoration: "none",
              boxSizing: "border-box",
              marginBottom: 10,
            }}
          >
            ⬇️ Instagram &amp; LinkedIn (1080×1350)
          </a>
          <a
            href={fbUrl}
            download={`manu2print-${variant}-fb.png`}
            style={{
              display: "block",
              width: "100%",
              padding: "15px 0",
              background: "rgba(255,255,255,0.18)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 16,
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

        {/* Copy image to clipboard */}
        <button
          onClick={copyImageToClipboard}
          disabled={clipped === "copying"}
          style={{
            width: "100%",
            padding: "14px 0",
            background: "rgba(255,255,255,0.09)",
            color: clipped === "done" ? "#4ade80" : clipped === "error" ? "#f87171" : "rgba(255,255,255,0.75)",
            fontWeight: 700,
            fontSize: 14,
            border: "1.5px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            cursor: clipped === "copying" ? "wait" : "pointer",
            marginBottom: 10,
          }}
        >
          {clipLabel}
        </button>

        {/* Post instructions */}
        <div style={{
          background: "rgba(255,255,255,0.07)",
          borderRadius: 14,
          padding: "16px 20px",
          marginBottom: 10,
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Step 2 — Post
          </p>
          <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: "#fff" }}>
            Upload the image on LinkedIn / Instagram / Facebook
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            LinkedIn → <strong style={{ color: "rgba(255,255,255,0.8)" }}>Photo</strong> → upload file.{" "}
            Instagram → <strong style={{ color: "rgba(255,255,255,0.8)" }}>+ New Post</strong> → select image.{" "}
            <strong style={{ color: "#f87171" }}>Do not paste a link</strong> — upload the image file.
          </p>
        </div>

        {/* Caption link */}
        <div style={{
          background: "rgba(255,255,255,0.07)",
          borderRadius: 14,
          padding: "16px 20px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Step 3 — Caption
          </p>
          <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "#fff" }}>
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
            Someone buys through your link → you earn a free scan credit.
          </p>
        </div>
      </div>

      <a
        href={backHref}
        style={{ marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.28)", textDecoration: "none" }}
      >
        ← Back to your result
      </a>
    </div>
  );
}
