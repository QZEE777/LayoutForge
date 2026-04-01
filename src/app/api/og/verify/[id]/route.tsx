import { ImageResponse } from "next/og";
import { getStored } from "@/lib/storage";
import { computeCheckerScore } from "@/lib/scoreUtils";

// Node runtime required — getStored uses AWS SDK (not edge-compatible)
export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Fetch DB + S3 in parallel — DB has check fields, S3 has score + kdpReady
  const [dbRes, stored] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/verification_results` +
      `?verification_id=eq.${id}` +
      `&select=readiness_score,issues_count,kdp_ready,trim_ok,margins_ok,bleed_ok,fonts_ok`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    ).then((r) => r.json()).then((rows) => rows?.[0] ?? null).catch(() => null),
    getStored(id).catch(() => null),
  ]);

  const data   = dbRes;
  const report = stored?.processingReport;

  const computedScore =
    report?.outputType === "checker" && report.issuesEnriched
      ? computeCheckerScore(report.issuesEnriched)
      : null;

  // Accept override params stamped by the verify page — guarantees card matches page
  const scoreOverride = searchParams.get("s") ? Number(searchParams.get("s")) : null;
  const passOverride  = searchParams.get("p") !== null ? searchParams.get("p") === "1" : null;

  const score  = scoreOverride ?? computedScore ?? report?.readinessScore100 ?? data?.readiness_score ?? 0;
  const isPass = passOverride  ?? (report?.kdpReady === true || data?.kdp_ready === true || score >= 90);

  // Check fields — DB primary, S3 keyword fallback for older records
  const issues = report?.issuesEnriched ?? [];
  const hasKw  = (kws: string[]) =>
    issues.some((i: { humanMessage?: string; originalMessage?: string }) => {
      const txt = ((i.humanMessage ?? "") + " " + (i.originalMessage ?? "")).toLowerCase();
      return kws.some((k) => txt.includes(k));
    });
  const hasS3 = issues.length > 0;

  const checks = [
    {
      label: "Trim Size",
      ok: data?.trim_ok    ?? (searchParams.get("trim") !== null ? searchParams.get("trim") === "1" : null)
              ?? (hasS3 ? !hasKw(["trim", "page size", "dimensions", "paper size"]) : null),
    },
    {
      label: "Margins",
      ok: data?.margins_ok ?? (searchParams.get("margins") !== null ? searchParams.get("margins") === "1" : null)
              ?? (hasS3 ? !hasKw(["margin", "safe zone", "gutter"]) : null),
    },
    {
      label: "Bleed",
      ok: data?.bleed_ok   ?? (searchParams.get("bleed") !== null ? searchParams.get("bleed") === "1" : null)
              ?? (hasS3 ? !hasKw(["bleed"]) : null),
    },
    {
      label: "Fonts",
      ok: data?.fonts_ok   ?? (searchParams.get("fonts") !== null ? searchParams.get("fonts") === "1" : null)
              ?? (hasS3 ? !hasKw(["font", "embed", "subsett"]) : null),
    },
  ];

  // Colors
  const bgLeft       = isPass ? "#1a5f3f" : "#8B2F00";
  const bgRight      = isPass ? "#24824f" : "#A83800";
  const verdictColor = isPass ? "#4CE87A" : "#FFB347";
  const accent       = isPass ? "#FFA040" : "#FFD480";
  const taglineColor = isPass ? "#A8E6A3" : "rgba(255,255,255,0.6)";

  const base      = "https://www.manu2print.com";
  const avatarUrl = `${base}/manny-avatar.png`;

  // ── 1200×630 Landscape — fills FB/LinkedIn/Twitter previews perfectly ────
  const W = 1200;
  const H = 630;

  return new ImageResponse(
    (
      <div style={{
        width: W,
        height: H,
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(135deg, ${bgLeft} 0%, ${bgRight} 100%)`,
        fontFamily: "system-ui, sans-serif",
        overflow: "hidden",
      }}>

        {/* Top bar: brand + tagline + URL */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "30px 52px 22px",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt=""
              style={{ width: 58, height: 58, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)" }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}>
                <span style={{ color: accent }}>manu</span>
                <span style={{ color: isPass ? "#A8E6A3" : "#FFFFFF" }}>2print</span>
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: taglineColor, letterSpacing: "0.05em" }}>
                KDP Readiness Verified
              </span>
            </div>
          </div>

          <span style={{ fontSize: 32, fontWeight: 900, color: accent }}>
            Would yours pass?
          </span>

          <span style={{ fontSize: 17, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
            manu2print.com
          </span>
        </div>

        {/* Main content row */}
        <div style={{
          display: "flex",
          flex: 1,
          padding: "0 52px",
        }}>

          {/* Left: Verdict + Score */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minWidth: 280,
            paddingRight: 44,
            borderRight: "1px solid rgba(255,255,255,0.12)",
          }}>
            <span style={{
              fontSize: 110,
              fontWeight: 900,
              color: verdictColor,
              lineHeight: 1,
              letterSpacing: "3px",
            }}>
              {isPass ? "PASS" : "FAIL"}
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 76, fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>
                {score}
              </span>
              <span style={{ fontSize: 36, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>
                /100
              </span>
            </div>
          </div>

          {/* Right: 4 check rows — CSS-only indicators, no Unicode glyph risk */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            paddingLeft: 44,
            gap: 0,
          }}>
            {checks.map((c, i) => (
              <div
                key={c.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop:    i === 0 ? 0 : 15,
                  paddingBottom: i === checks.length - 1 ? 0 : 15,
                  borderBottom:  i < checks.length - 1 ? "1px solid rgba(255,255,255,0.10)" : "none",
                }}
              >
                <span style={{ fontSize: 27, fontWeight: 700, color: "#FFFFFF" }}>
                  {c.label}
                </span>

                {/* CSS pill — no Unicode, renders perfectly everywhere */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: c.ok === null
                    ? "rgba(255,255,255,0.12)"
                    : c.ok
                    ? "rgba(76,232,122,0.22)"
                    : "rgba(255,140,105,0.22)",
                  border: `1.5px solid ${c.ok === null ? "rgba(255,255,255,0.2)" : c.ok ? "rgba(76,232,122,0.5)" : "rgba(255,140,105,0.5)"}`,
                  borderRadius: 8,
                  padding: "5px 18px",
                  minWidth: 72,
                }}>
                  <span style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: c.ok === null ? "rgba(255,255,255,0.4)" : c.ok ? "#4CE87A" : "#FF8C69",
                    letterSpacing: "0.06em",
                  }}>
                    {c.ok === null ? "N/A" : c.ok ? "PASS" : "FAIL"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    ),
    { width: W, height: H }
  );
}
