import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "linear-gradient(140deg, #C04000 0%, #F05A28 50%, #C04000 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "0 80px",
          position: "relative",
        }}
      >
        {/* Subtle bg circles */}
        <div style={{
          position: "absolute", top: -120, right: -80,
          width: 500, height: 500, borderRadius: "50%",
          background: "rgba(255,255,255,0.04)", display: "flex",
        }} />
        <div style={{
          position: "absolute", bottom: -100, left: -60,
          width: 380, height: 380, borderRadius: "50%",
          background: "rgba(0,0,0,0.08)", display: "flex",
        }} />

        {/* Brand */}
        <div style={{ display: "flex", marginBottom: 28 }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: "rgba(255,255,255,0.7)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            manu2print
          </span>
        </div>

        {/* Headline */}
        <div style={{
          fontSize: 68,
          fontWeight: 900,
          color: "#fff",
          textAlign: "center",
          lineHeight: 1.08,
          letterSpacing: "-1px",
          marginBottom: 22,
          maxWidth: 900,
        }}>
          Would your PDF pass KDP?
        </div>

        {/* Subline */}
        <div style={{
          fontSize: 24,
          color: "rgba(255,255,255,0.82)",
          textAlign: "center",
          maxWidth: 720,
          lineHeight: 1.45,
          marginBottom: 48,
        }}>
          Check margins, trim size, bleed, and fonts before Amazon rejects your manuscript.
        </div>

        {/* CTA pill */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          background: "rgba(0,0,0,0.22)",
          borderRadius: 999,
          padding: "16px 36px",
          border: "1px solid rgba(255,255,255,0.18)",
        }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>manu2print.com</span>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 20 }}>·</span>
          <span style={{ fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>$9 · Results in 90 seconds</span>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 20 }}>·</span>
          <span style={{ fontSize: 20, color: "rgba(255,255,255,0.7)" }}>No subscription</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
