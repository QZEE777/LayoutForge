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

  const rows = await res.json();
  const data = rows?.[0];

  const score       = data?.readiness_score ?? 0;
  const isPass      = data?.kdp_ready === true || score >= 90;

  // Only show relevant checks — OK items for PASS, failing items for FAIL
  const allChecks = [
    { label: "Trim Size", okLabel: "OK",           failLabel: "Incorrect",     ok: data?.trim_ok    ?? null },
    { label: "Margins",   okLabel: "OK",           failLabel: "Incorrect",     ok: data?.margins_ok ?? null },
    { label: "Bleed",     okLabel: "Present",      failLabel: "Missing",       ok: data?.bleed_ok   ?? null },
    { label: "Fonts",     okLabel: "Embedded",     failLabel: "Not embedded",  ok: data?.fonts_ok   ?? null },
  ];

  const visibleChecks = allChecks.filter(c =>
    c.ok === null ? true : isPass ? c.ok === true : c.ok === false
  );

  const summaryLine = isPass ? "No critical errors" : "Issues detected";

  // Colours
  const bgTop    = isPass ? "#1A5C28" : "#C35B00";
  const bgBottom = isPass ? "#2E7D32" : "#E65100";
  const cardBg   = isPass ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.10)";

  const base      = "https://www.manu2print.com";
  const avatarUrl = `${base}/manny-avatar.png`;

  const W = 1080;
  const H = 1350;

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "60px 64px 48px 64px",
          background: `linear-gradient(180deg, ${bgTop} 0%, ${bgBottom} 100%)`,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Label */}
        <span style={{
          fontSize: 30,
          fontWeight: 600,
          color: "rgba(255,255,255,0.75)",
          letterSpacing: "0.04em",
          marginBottom: 32,
        }}>
          KDP Pre-Check Result
        </span>

        {/* PASS / FAIL + emoji */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 20 }}>
          <span style={{
            fontSize: 148,
            fontWeight: 900,
            color: "#FFFFFF",
            lineHeight: 1,
            letterSpacing: "-4px",
          }}>
            {isPass ? "PASS" : "FAIL"}
          </span>
          <span style={{ fontSize: 100 }}>
            {isPass ? "✅" : "⚠️"}
          </span>
        </div>

        {/* Score */}
        <span style={{
          fontSize: 42,
          fontWeight: 700,
          color: "rgba(255,255,255,0.95)",
          marginBottom: 44,
        }}>
          Readiness Score: {score} / 100
        </span>

        {/* Checks card */}
        <div style={{
          width: "100%",
          background: cardBg,
          borderRadius: 24,
          border: "1.5px solid rgba(255,255,255,0.20)",
          padding: "36px 44px",
          display: "flex",
          flexDirection: "column",
          marginBottom: 44,
        }}>
          {visibleChecks.map((c, i) => (
            <div
              key={c.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingBottom: i < visibleChecks.length - 1 ? 22 : 0,
                marginBottom: i < visibleChecks.length - 1 ? 22 : 0,
                borderBottom: i < visibleChecks.length - 1 ? "1px solid rgba(255,255,255,0.15)" : "none",
              }}
            >
              <span style={{ fontSize: 36, fontWeight: 700, color: "#FFFFFF" }}>
                {c.label}:
              </span>
              <span style={{ fontSize: 36, fontWeight: 700, color: "rgba(255,255,255,0.90)" }}>
                {c.ok === null ? "—" : c.ok ? c.okLabel : c.failLabel}
              </span>
            </div>
          ))}

          {/* Summary */}
          <div style={{
            borderTop: "1.5px solid rgba(255,255,255,0.20)",
            marginTop: 26,
            paddingTop: 26,
            display: "flex",
            justifyContent: "center",
          }}>
            <span style={{ fontSize: 40, fontWeight: 900, color: "#FFFFFF" }}>
              {summaryLine}
            </span>
          </div>
        </div>

        {/* CTA section */}
        <div style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 44,
          paddingLeft: 8,
          paddingRight: 8,
        }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 32, color: "rgba(255,255,255,0.80)", marginBottom: 8 }}>
              Checked before uploading to KDP.
            </span>
            <span style={{ fontSize: 38, fontWeight: 900, color: "#FFFFFF" }}>
              Would your PDF pass?
            </span>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          width: "100%",
          borderTop: "1px solid rgba(255,255,255,0.20)",
          paddingTop: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
        }}>
          {/* Wordmark */}
          <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-1px" }}>
            <span style={{ color: "#FFA040" }}>manu</span>
            <span style={{ color: "#FFFFFF" }}>2</span>
            <span style={{ color: "#A8E6A3" }}>print</span>
          </span>

          {/* URL */}
          <span style={{ fontSize: 28, color: "rgba(255,255,255,0.70)", fontWeight: 600 }}>
            manu2print.com
          </span>

          {/* Avatar + Verified */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt=""
              style={{ width: 52, height: 52, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)" }}
            />
            <span style={{ fontSize: 24, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
              Verified by manu2print
            </span>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H }
  );
}
