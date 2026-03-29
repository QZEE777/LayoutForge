import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch directly via Supabase REST — safe on edge runtime
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/verification_results` +
    `?verification_id=eq.${id}` +
    `&select=readiness_score,issues_count,trim_ok,margins_ok,bleed_ok,fonts_ok`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  );

  const rows = await res.json();
  const data = rows?.[0];

  const score       = data?.readiness_score ?? 0;
  const issuesCount = data?.issues_count    ?? 0;
  const isPass      = score >= 70;

  const bgTop    = isPass ? "#1B6B3A" : "#C04A00";
  const bgBottom = isPass ? "#0D4424" : "#7A2D00";
  const accentOk    = isPass ? "#7FFFA0" : "#FFD580";
  const accentFail  = "#FF7070";

  const checks = [
    { label: "Trim Size", ok: data?.trim_ok    ?? null },
    { label: "Margins",   ok: data?.margins_ok ?? null },
    { label: "Bleed",     ok: data?.bleed_ok   ?? null },
    { label: "Fonts",     ok: data?.fonts_ok   ?? null },
  ];

  const summaryText = isPass
    ? "No critical errors"
    : `${issuesCount} issues detected`;

  const mannyUrl = isPass
    ? "https://www.manu2print.com/manny/manny_pass.png"
    : "https://www.manu2print.com/manny/manny_fail.png";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          background: `linear-gradient(150deg, ${bgTop} 0%, ${bgBottom} 100%)`,
          padding: "52px 72px 52px 72px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circle bg */}
        <div style={{
          position: "absolute",
          right: -80,
          top: -80,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
          display: "flex",
        }} />

        {/* ─── LEFT COLUMN ─── */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>

          {/* Label */}
          <span style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.6)",
          }}>
            KDP Pre-Check Result
          </span>

          {/* PASS / FAIL + Score */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <span style={{ fontSize: 104, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-2px" }}>
                {isPass ? "PASS" : "FAIL"}
              </span>
              <span style={{ fontSize: 72 }}>{isPass ? "✅" : "⚠️"}</span>
            </div>
            <span style={{ fontSize: 28, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
              Readiness Score: <span style={{ color: "#fff", fontWeight: 900 }}>{score} / 100</span>
            </span>
          </div>

          {/* Checks box */}
          <div style={{
            background: "rgba(0,0,0,0.22)",
            borderRadius: 18,
            padding: "20px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}>
            {checks.map((c) => (
              <div key={c.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 22, fontWeight: 500 }}>{c.label}</span>
                <span style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: c.ok === null ? "rgba(255,255,255,0.35)" : c.ok ? accentOk : accentFail,
                }}>
                  {c.ok === null ? "—" : c.ok ? "OK" : "Issue"}
                </span>
              </div>
            ))}
            <div style={{
              borderTop: "1px solid rgba(255,255,255,0.14)",
              marginTop: 4,
              paddingTop: 10,
              display: "flex",
            }}>
              <span style={{ color: "#fff", fontSize: 24, fontWeight: 900 }}>{summaryText}</span>
            </div>
          </div>

          {/* Hook + Footer */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 18 }}>
              Checked before uploading to KDP.
            </span>
            <span style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>
              Would YOUR PDF pass?
            </span>
          </div>

          {/* Brand strip */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 26, fontWeight: 900 }}>
              <span style={{ color: "#F05A28" }}>manu</span>
              <span style={{ color: "#fff" }}>2</span>
              <span style={{ color: isPass ? "#7FFFA0" : "#FFD580" }}>print</span>
            </span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }}>manu2print.com</span>
            <span style={{
              fontSize: 14,
              fontWeight: 700,
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 8,
              padding: "4px 12px",
            }}>
              ✓ Verified
            </span>
          </div>
        </div>

        {/* ─── MANNY ─── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mannyUrl}
          width={300}
          height={450}
          alt="Manny"
          style={{ alignSelf: "flex-end", marginLeft: 40 }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
