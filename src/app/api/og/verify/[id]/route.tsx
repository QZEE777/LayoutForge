import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/verification_results` +
    `?verification_id=eq.${id}` +
    `&select=readiness_score,issues_count,kdp_ready,trim_ok,margins_ok,bleed_ok,fonts_ok`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  );

  const rows = await res.json();
  const data = rows?.[0];

  const score       = data?.readiness_score ?? 0;
  const issuesCount = data?.issues_count    ?? 0;
  const isPass      = data?.kdp_ready === true || score >= 90;

  // Colours — mirror the card shell design
  const frameColor  = isPass ? "#22C55E" : "#F05A28";
  const accentColor = isPass ? "#16A34A" : "#EA580C";

  const subline = isPass
    ? "Your PDF is KDP-ready ✅"
    : "Your PDF would be rejected ❌";

  const checks = [
    { label: "Trim Size", ok: data?.trim_ok    ?? null },
    { label: "Margins",   ok: data?.margins_ok ?? null },
    { label: "Bleed",     ok: data?.bleed_ok   ?? null },
    { label: "Fonts",     ok: data?.fonts_ok   ?? null },
  ];

  const summaryText = isPass
    ? "No critical errors found"
    : `${issuesCount} issues detected`;

  const mannyUrl = isPass
    ? "https://www.manu2print.com/manny/manny_pass.png"
    : "https://www.manu2print.com/manny/manny_fail.png";

  // Portrait 1080×1350 — matches IG / FB / LinkedIn shell dimensions
  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1350,
          background: frameColor,
          padding: "48px 48px 32px 48px",
          display: "flex",
          flexDirection: "column",
          gap: 26,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* ── WHITE CONTENT ZONE ── */}
        <div
          style={{
            flex: 1,
            background: "#FFFFFF",
            borderRadius: 32,
            padding: "58px 56px 56px 60px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Small label */}
          <span
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              color: "#999",
              marginBottom: 26,
            }}
          >
            KDP Pre-Check Result
          </span>

          {/* PASS / FAIL */}
          <span
            style={{
              fontSize: 144,
              fontWeight: 900,
              color: accentColor,
              lineHeight: 1,
              letterSpacing: "-4px",
              marginBottom: 10,
            }}
          >
            {isPass ? "PASS" : "FAIL"}
          </span>

          {/* Subline */}
          <span
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#333",
              marginBottom: 46,
            }}
          >
            {subline}
          </span>

          {/* Score row + bar */}
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 46 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 30, fontWeight: 600, color: "#555" }}>Readiness Score</span>
              <span style={{ fontSize: 38, fontWeight: 900, color: accentColor }}>{score} / 100</span>
            </div>
            <div
              style={{
                height: 18,
                background: "#E5E7EB",
                borderRadius: 9,
                overflow: "hidden",
                display: "flex",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${score}%`,
                  background: accentColor,
                  borderRadius: 9,
                  display: "flex",
                }}
              />
            </div>
          </div>

          {/* Checks grid */}
          <div
            style={{
              background: "#F9FAFB",
              borderRadius: 24,
              padding: "30px 38px",
              border: "2px solid #E5E7EB",
              display: "flex",
              flexDirection: "column",
              marginBottom: 44,
            }}
          >
            {checks.map((c, i) => (
              <div
                key={c.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: i < checks.length - 1 ? 22 : 0,
                  marginBottom: i < checks.length - 1 ? 22 : 0,
                  borderBottom: i < checks.length - 1 ? "1px solid #EFEFEF" : "none",
                }}
              >
                <span style={{ fontSize: 32, fontWeight: 600, color: "#374151" }}>{c.label}</span>
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: c.ok === null ? "#9CA3AF" : c.ok ? "#16A34A" : "#DC2626",
                  }}
                >
                  {c.ok === null ? "—" : c.ok ? "✓  OK" : "✗  Issue"}
                </span>
              </div>
            ))}
            <div
              style={{
                borderTop: "1px solid #E5E7EB",
                marginTop: 22,
                paddingTop: 22,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 32, fontWeight: 900, color: accentColor }}>{summaryText}</span>
            </div>
          </div>

          {/* Hook */}
          <span style={{ fontSize: 40, fontWeight: 900, color: "#111" }}>Would YOUR PDF pass?</span>
          <span style={{ fontSize: 28, fontWeight: 500, color: "#9CA3AF", marginTop: 10 }}>
            Free KDP pre-check at manu2print.com
          </span>

          {/* MANNY — absolute bottom-right of white zone */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 380,
              height: 520,
              overflow: "hidden",
              display: "flex",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mannyUrl}
              alt="Manny"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center top",
              }}
            />
          </div>
        </div>

        {/* ── BOTTOM BAR — logo + verified ── */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 24,
            padding: "24px 44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 42, fontWeight: 900 }}>
            <span style={{ color: "#F05A28" }}>manu</span>
            <span style={{ color: "#111" }}>2</span>
            <span style={{ color: "#16A34A" }}>print</span>
          </span>
          <span style={{ fontSize: 28, fontWeight: 600, color: "#6B7280" }}>
            ✓ Verified by manu2print.com
          </span>
        </div>
      </div>
    ),
    { width: 1080, height: 1350 }
  );
}
