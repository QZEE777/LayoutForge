import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  // ?format=fb → Facebook 1200×1500  |  default → IG/LinkedIn 1080×1350
  const isFb = searchParams.get("format") === "fb";

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

  const checks = [
    { label: "Trim Size", ok: data?.trim_ok    ?? null },
    { label: "Margins",   ok: data?.margins_ok ?? null },
    { label: "Bleed",     ok: data?.bleed_ok   ?? null },
    { label: "Fonts",     ok: data?.fonts_ok   ?? null },
  ];

  const summaryText = isPass
    ? "No critical errors found"
    : issuesCount > 0 ? `${issuesCount} issues detected` : "Scan flagged — re-check recommended";

  const subline = isPass
    ? "Your PDF is KDP-ready"
    : "Your PDF would be rejected";

  // Shell images served from /public/shells/
  const base = "https://www.manu2print.com";
  const shellUrl = isPass
    ? (isFb ? `${base}/shells/shell_pass_fb.png` : `${base}/shells/shell_pass_ig.png`)
    : (isFb ? `${base}/shells/shell_fail_fb.png` : `${base}/shells/shell_fail_ig.png`);

  // Canvas matches the shell dimensions
  const W = isFb ? 1200 : 1080;
  const H = isFb ? 1500 : 1350;

  // Scale factor (FB is 1.111× the IG shell)
  const S = isFb ? 1200 / 1080 : 1;
  const fs = (n: number) => Math.round(n * S);

  const accentColor = isPass ? "#16A34A" : "#EA580C";
  const passGreen   = "#16A34A";
  const failRed     = "#DC2626";

  // Text occupies the left 44% of the white zone — Manny's hand starts ~x=480
  const padX  = fs(70);
  const padY  = fs(65);
  const textW = fs(455);

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          position: "relative",
          display: "flex",
        }}
      >
        {/* Shell background — your designed PNG */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shellUrl}
          alt=""
          style={{ position: "absolute", top: 0, left: 0, width: W, height: H }}
        />

        {/* Dynamic text — overlaid on the white zone */}
        <div
          style={{
            position: "absolute",
            top: padY,
            left: padX,
            width: textW,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Label */}
          <span style={{
            fontSize: fs(22),
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#999",
            marginBottom: fs(18),
            fontFamily: "system-ui, sans-serif",
          }}>
            KDP Pre-Check Result
          </span>

          {/* PASS / FAIL */}
          <span style={{
            fontSize: fs(148),
            fontWeight: 900,
            color: accentColor,
            lineHeight: 1,
            letterSpacing: "-4px",
            marginBottom: fs(6),
            fontFamily: "system-ui, sans-serif",
          }}>
            {isPass ? "PASS" : "FAIL"}
          </span>

          {/* Subline */}
          <span style={{
            fontSize: fs(30),
            fontWeight: 700,
            color: "#333",
            marginBottom: fs(28),
            fontFamily: "system-ui, sans-serif",
          }}>
            {subline}
          </span>

          {/* Score */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: fs(10) }}>
            <span style={{ fontSize: fs(24), fontWeight: 600, color: "#555", fontFamily: "system-ui, sans-serif" }}>
              Readiness Score
            </span>
            <span style={{ fontSize: fs(28), fontWeight: 900, color: accentColor, fontFamily: "system-ui, sans-serif" }}>
              {score}/100
            </span>
          </div>

          {/* Score bar */}
          <div style={{
            height: fs(14),
            background: "#E5E7EB",
            borderRadius: fs(7),
            overflow: "hidden",
            display: "flex",
            marginBottom: fs(24),
          }}>
            <div style={{
              height: "100%",
              width: `${Math.max(score, 2)}%`,
              background: accentColor,
              borderRadius: fs(7),
              display: "flex",
            }} />
          </div>

          {/* Checks */}
          <div style={{
            background: "#F9FAFB",
            borderRadius: fs(16),
            padding: `${fs(18)}px ${fs(22)}px`,
            border: "2px solid #E5E7EB",
            display: "flex",
            flexDirection: "column",
            marginBottom: fs(24),
          }}>
            {checks.map((c, i) => (
              <div key={c.label} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: i < checks.length - 1 ? fs(15) : 0,
                marginBottom: i < checks.length - 1 ? fs(15) : 0,
                borderBottom: i < checks.length - 1 ? "1px solid #EFEFEF" : "none",
              }}>
                <span style={{ fontSize: fs(26), fontWeight: 600, color: "#374151", fontFamily: "system-ui, sans-serif" }}>
                  {c.label}
                </span>
                <span style={{
                  fontSize: fs(26),
                  fontWeight: 800,
                  color: c.ok === null ? "#9CA3AF" : c.ok ? passGreen : failRed,
                  fontFamily: "system-ui, sans-serif",
                }}>
                  {c.ok === null ? "—" : c.ok ? "OK" : "Issue"}
                </span>
              </div>
            ))}
            <div style={{
              borderTop: "1px solid #E5E7EB",
              marginTop: fs(15),
              paddingTop: fs(15),
              display: "flex",
              justifyContent: "center",
            }}>
              <span style={{ fontSize: fs(22), fontWeight: 900, color: accentColor, fontFamily: "system-ui, sans-serif" }}>
                {summaryText}
              </span>
            </div>
          </div>

          {/* Hook */}
          <span style={{ fontSize: fs(30), fontWeight: 900, color: "#111", fontFamily: "system-ui, sans-serif" }}>
            Would YOUR PDF pass?
          </span>
          <span style={{ fontSize: fs(22), color: "#9CA3AF", marginTop: fs(6), fontFamily: "system-ui, sans-serif" }}>
            Free KDP pre-check · manu2print.com
          </span>
        </div>

        {/* Bottom bar — styled wordmark + verified */}
        <div style={{
          position: "absolute",
          bottom: fs(32),
          left: fs(58),
          right: fs(58),
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontSize: fs(40), fontWeight: 900, fontFamily: "system-ui, sans-serif" }}>
            <span style={{ color: "#F05A28" }}>manu</span>
            <span style={{ color: "#111" }}>2</span>
            <span style={{ color: "#16A34A" }}>print</span>
          </span>
          <span style={{ fontSize: fs(26), fontWeight: 700, color: "#555", fontFamily: "system-ui, sans-serif" }}>
            Verified by manu2print.com
          </span>
        </div>
      </div>
    ),
    { width: W, height: H }
  );
}
