import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(
  req: Request,
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

  const rows  = await res.json();
  const data  = rows?.[0];
  const score       = data?.readiness_score ?? 0;
  const issuesCount = data?.issues_count    ?? 0;
  const isPass      = data?.kdp_ready === true || score >= 90;

  const checks = [
    { label: "Trim Size", ok: data?.trim_ok    ?? null },
    { label: "Margins",   ok: data?.margins_ok ?? null },
    { label: "Bleed",     ok: data?.bleed_ok   ?? null },
    { label: "Fonts",     ok: data?.fonts_ok   ?? null },
  ];

  // Colours
  const border  = isPass ? "#16A34A" : "#EA580C";
  const accent  = isPass ? "#16A34A" : "#EA580C";
  const okColor = "#16A34A";
  const badColor= "#DC2626";

  const statusLine = isPass ? "READY FOR KDP UPLOAD" : "WOULD BE REJECTED BY KDP";
  const issueLine  = isPass
    ? "No critical issues found"
    : `${issuesCount} issue${issuesCount !== 1 ? "s" : ""} found before upload`;

  const W = 1080;
  const H = 1350;

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          background: border,
          display: "flex",
          padding: 36,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Inner white card */}
        <div
          style={{
            flex: 1,
            background: "#FFFFFF",
            borderRadius: 28,
            display: "flex",
            flexDirection: "column",
            padding: "52px 60px 40px 60px",
          }}
        >
          {/* Top label */}
          <span style={{
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#AAAAAA",
            marginBottom: 28,
          }}>
            KDP Pre-Check Result
          </span>

          {/* PASS / FAIL */}
          <span style={{
            fontSize: 170,
            fontWeight: 900,
            color: accent,
            lineHeight: 1,
            letterSpacing: "-6px",
            marginBottom: 10,
          }}>
            {isPass ? "PASS" : "FAIL"}
          </span>

          {/* Score */}
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 0,
            marginBottom: 10,
          }}>
            <span style={{ fontSize: 96, fontWeight: 900, color: "#111", lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: 48, fontWeight: 700, color: "#BBBBBB", lineHeight: 1.4 }}>
              /100
            </span>
          </div>

          {/* Status line */}
          <span style={{
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "0.06em",
            color: accent,
            textTransform: "uppercase",
            marginBottom: 36,
          }}>
            {statusLine}
          </span>

          {/* Checks box */}
          <div style={{
            background: "#F8F8F8",
            borderRadius: 20,
            border: "2px solid #EEEEEE",
            padding: "28px 36px",
            display: "flex",
            flexDirection: "column",
            marginBottom: 30,
          }}>
            {checks.map((c, i) => (
              <div
                key={c.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: i < checks.length - 1 ? 20 : 0,
                  marginBottom: i < checks.length - 1 ? 20 : 0,
                  borderBottom: i < checks.length - 1 ? "1px solid #EEEEEE" : "none",
                }}
              >
                <span style={{ fontSize: 32, fontWeight: 600, color: "#333" }}>
                  {c.label}
                </span>
                <span style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: c.ok === null ? "#BBBBBB" : c.ok ? okColor : badColor,
                }}>
                  {c.ok === null ? "—" : c.ok ? "OK" : "Issue"}
                </span>
              </div>
            ))}

            {/* Summary row */}
            <div style={{
              borderTop: "1px solid #EEEEEE",
              marginTop: 20,
              paddingTop: 20,
              display: "flex",
              justifyContent: "center",
            }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: accent }}>
                {issueLine}
              </span>
            </div>
          </div>

          {/* CTA pill */}
          <div style={{
            background: accent,
            borderRadius: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "26px 0",
            marginBottom: 28,
          }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: "#FFFFFF" }}>
              Check My PDF — manu2print.com
            </span>
          </div>

          {/* Bottom branding */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "auto",
          }}>
            <span style={{ fontSize: 34, fontWeight: 900 }}>
              <span style={{ color: "#F05A28" }}>manu</span>
              <span style={{ color: "#111" }}>2</span>
              <span style={{ color: "#16A34A" }}>print</span>
            </span>
            <span style={{ fontSize: 24, color: "#AAAAAA", fontWeight: 600 }}>
              Verified by manu2print.com
            </span>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H }
  );
}
