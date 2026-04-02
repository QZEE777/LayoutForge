import { ImageResponse } from "next/og";
import { getStored } from "@/lib/storage";
import { computeCheckerScore } from "@/lib/scoreUtils";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // format: "portrait" = 1080×1350 (FB/IG post), "square" = 1080×1080 (LI/IG), default = 1200×630 (link preview)
  const format    = searchParams.get("format") ?? "landscape";
  const isPortrait = format === "portrait";
  const isSquare   = format === "square";

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

  // Page stamps ?p= and ?s= — card is always locked to page's computed state
  const scoreOverride = searchParams.get("s") ? Number(searchParams.get("s")) : null;
  const passOverride  = searchParams.get("p") !== null ? searchParams.get("p") === "1" : null;

  const score  = scoreOverride ?? computedScore ?? report?.readinessScore100 ?? data?.readiness_score ?? 0;
  const isPass = passOverride  ?? (report?.kdpReady === true || data?.kdp_ready === true || score >= 90);

  // Check fields — DB primary, S3 keyword fallback
  const issues = report?.issuesEnriched ?? [];
  const hasKw  = (kws: string[]) =>
    issues.some((i: { humanMessage?: string; originalMessage?: string }) => {
      const txt = ((i.humanMessage ?? "") + " " + (i.originalMessage ?? "")).toLowerCase();
      return kws.some((k) => txt.includes(k));
    });
  const hasS3 = issues.length > 0;

  const checks = [
    { label: "Trim Size", ok: data?.trim_ok    ?? (searchParams.get("trim")    ? searchParams.get("trim")    === "1" : null) ?? (hasS3 ? !hasKw(["trim", "page size", "dimensions", "paper size"]) : null) },
    { label: "Margins",   ok: data?.margins_ok ?? (searchParams.get("margins") ? searchParams.get("margins") === "1" : null) ?? (hasS3 ? !hasKw(["margin", "safe zone", "gutter"]) : null) },
    { label: "Bleed",     ok: data?.bleed_ok   ?? (searchParams.get("bleed")   ? searchParams.get("bleed")   === "1" : null) ?? (hasS3 ? !hasKw(["bleed"]) : null) },
    { label: "Fonts",     ok: data?.fonts_ok   ?? (searchParams.get("fonts")   ? searchParams.get("fonts")   === "1" : null) ?? (hasS3 ? !hasKw(["font", "embed", "subsett"]) : null) },
  ];

  // ── Brand palette ──────────────────────────────────────────────────────────
  // PASS: green dominant, orange accent
  // FAIL: orange dominant, green accent
  const bgTop    = isPass ? "#2D6A2D" : "#F05A28";
  const bgBottom = isPass ? "#1a4a1a" : "#C84A20";
  const verdictBg     = isPass ? "#F05A28" : "#2D6A2D";   // contrasting slab behind PASS/FAIL
  const verdictText   = "#FFFFFF";
  const scoreColor    = "#FFFFFF";
  const checkPassBg   = isPass ? "rgba(240,90,40,0.18)"  : "rgba(45,106,45,0.25)";
  const checkPassBorder = isPass ? "rgba(240,90,40,0.55)" : "rgba(76,232,122,0.55)";
  const checkPassText = isPass ? "#FF7A45" : "#4CE87A";
  const checkFailBg   = isPass ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.08)";
  const checkFailBorder = "rgba(255,255,255,0.22)";
  const checkFailText = "rgba(255,255,255,0.55)";
  const hookColor     = isPass ? "#FAF7EE" : "#FAF7EE";
  const brandManu     = isPass ? "#FF7A45" : "#FAF7EE";
  const brand2print   = isPass ? "#FAF7EE" : "#4CE87A";

  const base      = "https://www.manu2print.com";
  const avatarUrl = `${base}/manny-avatar.png`;

  // ── Canvas sizes ───────────────────────────────────────────────────────────
  const W = isPortrait ? 1080 : isSquare ? 1080 : 1200;
  const H = isPortrait ? 1350 : isSquare ? 1080 : 630;

  // ── PORTRAIT / SQUARE layout (for actual social posts) ────────────────────
  if (isPortrait || isSquare) {
    // Scale factor so square has slightly tighter layout
    const S  = isSquare ? 0.88 : 1;
    const fs = (n: number) => Math.round(n * S);

    return new ImageResponse(
      (
        <div style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(170deg, ${bgTop} 0%, ${bgBottom} 100%)`,
          fontFamily: "system-ui, sans-serif",
          overflow: "hidden",
          position: "relative",
        }}>

          {/* Subtle texture circles — depth without noise */}
          <div style={{
            position: "absolute", top: -120, right: -120,
            width: 480, height: 480, borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            display: "flex",
          }} />
          <div style={{
            position: "absolute", bottom: -80, left: -80,
            width: 360, height: 360, borderRadius: "50%",
            background: "rgba(0,0,0,0.10)",
            display: "flex",
          }} />

          {/* ── Top: brand ──────────────────────────────────────────── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `${fs(44)}px ${fs(56)}px ${fs(28)}px`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: fs(14) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt=""
                style={{
                  width: fs(60), height: fs(60),
                  borderRadius: "50%",
                  border: `2.5px solid rgba(255,255,255,0.35)`,
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: fs(32), fontWeight: 900, lineHeight: 1 }}>
                  <span style={{ color: brandManu }}>manu</span>
                  <span style={{ color: brand2print }}>2print</span>
                </span>
                <span style={{ fontSize: fs(14), fontWeight: 600, color: "rgba(255,255,255,0.55)", letterSpacing: "0.06em" }}>
                  KDP READINESS VERIFIED
                </span>
              </div>
            </div>
            <span style={{ fontSize: fs(15), color: "rgba(255,255,255,0.40)", fontWeight: 600 }}>
              manu2print.com
            </span>
          </div>

          {/* ── Hook line ────────────────────────────────────────────── */}
          <div style={{
            padding: `0 ${fs(56)}px ${fs(22)}px`,
            display: "flex",
          }}>
            <span style={{
              fontSize: fs(30),
              fontWeight: 800,
              color: "#FAF7EE",
              lineHeight: 1.2,
            }}>
              {isPass
                ? "This passed KDP review."
                : "This would be rejected by KDP."}
            </span>
          </div>

          {/* ── Hero slab: Score (dominant) + Verdict (label) ────────── */}
          <div style={{
            margin: `0 ${fs(56)}px ${fs(24)}px`,
            background: "rgba(0,0,0,0.28)",
            borderRadius: fs(20),
            padding: `${fs(26)}px ${fs(40)}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 8px 40px rgba(0,0,0,0.30)",
          }}>
            {/* LEFT: Score — the hook */}
            <div style={{ display: "flex", flexDirection: "column", gap: fs(4) }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: fs(8) }}>
                <span style={{ fontSize: fs(110), fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>
                  {score}
                </span>
                <span style={{ fontSize: fs(36), fontWeight: 700, color: "rgba(255,255,255,0.38)" }}>
                  /100
                </span>
              </div>
              <span style={{
                fontSize: fs(16),
                fontWeight: 700,
                color: "rgba(255,255,255,0.58)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}>
                {isPass ? "Ready for KDP upload" : "Fix required before upload"}
              </span>
            </div>

            {/* RIGHT: Verdict — confirmation */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: verdictBg,
              borderRadius: fs(14),
              padding: `${fs(14)}px ${fs(28)}px`,
            }}>
              <span style={{
                fontSize: fs(48),
                fontWeight: 900,
                color: "#FFFFFF",
                lineHeight: 1,
                letterSpacing: "2px",
              }}>
                {isPass ? "PASS" : "FAIL"}
              </span>
              <span style={{ fontSize: fs(20), color: "rgba(255,255,255,0.75)", marginTop: fs(2) }}>
                {isPass ? "✓" : "⚠"}
              </span>
            </div>
          </div>

          {/* ── Check rows — left-aligned icon + label, no pills ─────── */}
          <div style={{
            margin: `0 ${fs(56)}px`,
            display: "flex",
            flexDirection: "column",
            gap: fs(10),
            flex: 1,
          }}>
            {checks.map((c) => {
              const dotColor = c.ok === null
                ? "rgba(255,255,255,0.20)"
                : c.ok
                  ? "#4CE87A"
                  : "rgba(255,255,255,0.30)";
              const labelColor = c.ok === null
                ? "rgba(255,255,255,0.40)"
                : c.ok
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(255,255,255,0.65)";

              return (
                <div
                  key={c.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: fs(20),
                    padding: `${fs(12)}px ${fs(22)}px`,
                    background: "rgba(0,0,0,0.12)",
                    borderRadius: fs(12),
                    border: `1px solid ${c.ok ? "rgba(76,232,122,0.18)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  {/* Icon — solid circle, green=pass, dim=fail */}
                  <div style={{
                    width: fs(32), height: fs(32),
                    borderRadius: "50%",
                    background: dotColor,
                    flexShrink: 0,
                    display: "flex",
                  }} />
                  <span style={{ fontSize: fs(28), fontWeight: 700, color: labelColor }}>
                    {c.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ── Tension line — replaces dead space ───────────────────── */}
          <div style={{
            padding: `${fs(22)}px ${fs(56)}px ${fs(10)}px`,
            display: "flex",
            justifyContent: "center",
          }}>
            <span style={{
              fontSize: fs(26),
              fontWeight: 900,
              color: isPass ? "#4CE87A" : "#FAF7EE",
              textAlign: "center",
              letterSpacing: "-0.01em",
            }}>
              {isPass ? "You're clear. Upload with confidence." : "Don't upload this yet."}
            </span>
          </div>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <div style={{
            padding: `${fs(14)}px ${fs(56)}px ${fs(40)}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderTop: "1px solid rgba(255,255,255,0.10)",
          }}>
            <span style={{
              fontSize: fs(20),
              fontWeight: 700,
              color: "rgba(255,255,255,0.55)",
              textAlign: "center",
            }}>
              {isPass ? "Check yours → manu2print.com" : "Check yours → manu2print.com"}
            </span>
          </div>

        </div>
      ),
      { width: W, height: H }
    );
  }

  // ── LANDSCAPE 1200×630 — link preview only (URL paste in FB/LI/Twitter) ───
  return new ImageResponse(
    (
      <div style={{
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(135deg, ${bgTop} 0%, ${bgBottom} 100%)`,
        fontFamily: "system-ui, sans-serif",
        overflow: "hidden",
      }}>

        {/* Top bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "30px 52px 22px",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}>
                <span style={{ color: brandManu }}>manu</span>
                <span style={{ color: brand2print }}>2print</span>
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em" }}>
                KDP READINESS VERIFIED
              </span>
            </div>
          </div>
          <span style={{ fontSize: 30, fontWeight: 900, color: hookColor, opacity: 0.9 }}>
            Would yours pass?
          </span>
          <span style={{ fontSize: 16, color: "rgba(255,255,255,0.40)", fontWeight: 600 }}>
            manu2print.com
          </span>
        </div>

        {/* Main row */}
        <div style={{ display: "flex", flex: 1, padding: "0 52px" }}>

          {/* Left: verdict slab */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingRight: 44,
            borderRight: "1px solid rgba(255,255,255,0.12)",
            minWidth: 300,
          }}>
            <div style={{
              background: verdictBg,
              borderRadius: 16,
              padding: "16px 32px",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ fontSize: 100, fontWeight: 900, color: verdictText, lineHeight: 1, letterSpacing: "3px" }}>
                {isPass ? "PASS" : "FAIL"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, justifyContent: "center" }}>
              <span style={{ fontSize: 64, fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: 32, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>/100</span>
            </div>
          </div>

          {/* Right: checks */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, paddingLeft: 44, gap: 0 }}>
            {checks.map((c, i) => (
              <div key={c.label} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop:    i === 0 ? 0 : 14,
                paddingBottom: i === checks.length - 1 ? 0 : 14,
                borderBottom:  i < checks.length - 1 ? "1px solid rgba(255,255,255,0.10)" : "none",
              }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: "#FFFFFF" }}>{c.label}</span>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: c.ok === null ? checkFailBg : c.ok ? checkPassBg : checkFailBg,
                  border: `1.5px solid ${c.ok === null ? checkFailBorder : c.ok ? checkPassBorder : checkFailBorder}`,
                  borderRadius: 8, padding: "5px 18px", minWidth: 80,
                }}>
                  <span style={{
                    fontSize: 15, fontWeight: 900,
                    color: c.ok === null ? checkFailText : c.ok ? checkPassText : checkFailText,
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
    { width: 1200, height: 630 }
  );
}
