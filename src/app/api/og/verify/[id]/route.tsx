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

  // v = ego | fear | curiosity (default: curiosity)
  const variant = (searchParams.get("v") ?? "curiosity") as "ego" | "fear" | "curiosity";
  // format: "fb" → 1200×1500 portrait  |  "og" → 1200×630 landscape (FB link preview)  |  default → 1080×1350 portrait
  const format = searchParams.get("format") ?? "default";
  const isFb  = format === "fb";
  const isOg  = format === "og"; // landscape, used in <meta og:image>

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Fetch DB + S3 in parallel — S3 is authoritative
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

  // Use the SAME scoring algorithm as the download page
  const computedScore =
    report?.outputType === "checker" && report.issuesEnriched
      ? computeCheckerScore(report.issuesEnriched)
      : null;

  // Accept override params from the verify page — page stamps ?p=1&s=83 so
  // the card can never diverge from what the user saw on the page
  const scoreOverride = searchParams.get("s") ? Number(searchParams.get("s")) : null;
  const passOverride  = searchParams.get("p") !== null ? searchParams.get("p") === "1" : null;

  const score  = scoreOverride ?? computedScore ?? report?.readinessScore100 ?? data?.readiness_score ?? 0;
  const isPass = passOverride  ?? (report?.kdpReady === true || data?.kdp_ready === true || score >= 90);

  // Check fields — DB is authoritative; fall back to S3 issues if null
  const issues = report?.issuesEnriched ?? [];
  const hasKeyword = (kws: string[]) =>
    issues.some((i: { humanMessage?: string; originalMessage?: string }) => {
      const txt = ((i.humanMessage ?? "") + " " + (i.originalMessage ?? "")).toLowerCase();
      return kws.some((k) => txt.includes(k));
    });

  const dbTrimOk    = data?.trim_ok    ?? null;
  const dbMarginsOk = data?.margins_ok ?? null;
  const dbBleedOk   = data?.bleed_ok   ?? null;
  const dbFontsOk   = data?.fonts_ok   ?? null;

  // If we have issues from S3, derive any null DB fields from them
  const hasIssues = issues.length > 0;
  const trimOk    = dbTrimOk    ?? (hasIssues ? !hasKeyword(["trim", "page size", "dimensions", "paper size"]) : null);
  const marginsOk = dbMarginsOk ?? (hasIssues ? !hasKeyword(["margin", "safe zone", "gutter"])                 : null);
  const bleedOk   = dbBleedOk   ?? (hasIssues ? !hasKeyword(["bleed"])                                         : null);
  const fontsOk   = dbFontsOk   ?? (hasIssues ? !hasKeyword(["font", "embed", "subsett"])                      : null);

  // Hook text — changes per variant
  const hookText =
    variant === "ego"
      ? (isPass ? "This would pass KDP." : "Would your PDF pass?")
      : variant === "fear"
      ? (isPass ? "Would your PDF pass?" : "This would fail KDP review.")
      : "Would yours pass?"; // curiosity — universal

  const allChecks = [
    { label: "Trim Size", ok: trimOk },
    { label: "Margins",   ok: marginsOk },
    { label: "Bleed",     ok: bleedOk },
    { label: "Fonts",     ok: fontsOk },
  ];

  // Portrait: show only relevant checks. Landscape OG: show all 4.
  const visibleChecks = isOg
    ? allChecks
    : allChecks.filter((c) =>
        c.ok === null ? true : isPass ? c.ok === true : c.ok === false
      );

  // Colors
  const bgTop        = isPass ? "#1a5f3f" : "#C35B00";
  const bgBottom     = isPass ? "#2d8659" : "#E65100";
  const accent       = isPass ? "#FFA040" : "#FFD480";
  const verdictColor = isPass ? "#FF8C00" : "#4CE87A";
  const taglineColor = isPass ? "#FFA040" : "#4CE87A";

  const base      = "https://www.manu2print.com";
  const avatarUrl = `${base}/manny-avatar.png`;

  const displayFont = "system-ui, sans-serif";

  // ── Landscape OG image (1200×630) — for <meta og:image> / FB link preview ──
  if (isOg) {
    const W = 1200;
    const H = 630;

    return new ImageResponse(
      (
        <div style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${bgTop} 0%, ${bgBottom} 100%)`,
          fontFamily: displayFont,
        }}>

          {/* Top bar: brand + hook + URL */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "28px 48px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.14)",
          }}>
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt="" style={{ width: 60, height: 60, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>
                  <span style={{ color: accent }}>manu</span>
                  <span style={{ color: isPass ? "#A8E6A3" : "#FFFFFF" }}>2print</span>
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: taglineColor, letterSpacing: "0.04em" }}>
                  KDP Readiness Verified
                </span>
              </div>
            </div>

            {/* Hook */}
            <span style={{ fontSize: 30, fontWeight: 900, color: accent, textAlign: "center", lineHeight: 1.1 }}>
              {hookText}
            </span>

            {/* URL */}
            <span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
              manu2print.com
            </span>
          </div>

          {/* Main content row */}
          <div style={{ display: "flex", flex: 1, padding: "0 48px" }}>

            {/* Left: Verdict + Score */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minWidth: 260,
              paddingRight: 40,
              borderRight: "1px solid rgba(255,255,255,0.14)",
            }}>
              <span style={{
                fontSize: 100,
                fontWeight: 900,
                color: verdictColor,
                lineHeight: 1,
                letterSpacing: "2px",
              }}>
                {isPass ? "PASS" : "FAIL"}
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 72, fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>
                  {score}
                </span>
                <span style={{ fontSize: 32, fontWeight: 700, color: "rgba(255,255,255,0.40)" }}>
                  /100
                </span>
              </div>
            </div>

            {/* Right: All 4 check rows */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
              paddingLeft: 40,
              gap: 0,
            }}>
              {visibleChecks.map((c, i) => (
                <div
                  key={c.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop:    i === 0 ? 0 : 14,
                    paddingBottom: i === visibleChecks.length - 1 ? 0 : 14,
                    borderBottom:  i < visibleChecks.length - 1 ? "1px solid rgba(255,255,255,0.12)" : "none",
                  }}
                >
                  <span style={{ fontSize: 28, fontWeight: 700, color: "#FFFFFF" }}>
                    {c.label}
                  </span>
                  <span style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: c.ok === null ? "rgba(255,255,255,0.35)" : c.ok ? "#4CE87A" : "#FF8C69",
                  }}>
                    {c.ok === null ? "\u2014" : c.ok ? "\u2713" : "\u00D7"}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      ),
      { width: W, height: H }
    );
  }

  // ── Portrait OG images (Instagram / download) ─────────────────────────────
  const W = isFb ? 1200 : 1080;
  const H = isFb ? 1500 : 1350;
  const S = isFb ? 1200 / 1080 : 1;
  const fs = (n: number) => Math.round(n * S);

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: `${fs(56)}px ${fs(64)}px ${fs(48)}px ${fs(64)}px`,
          background: `linear-gradient(180deg, ${bgTop} 0%, ${bgBottom} 100%)`,
          fontFamily: displayFont,
        }}
      >
        {/* Hook — variant-driven */}
        <span style={{
          fontSize: fs(52),
          fontWeight: 900,
          color: accent,
          letterSpacing: "-0.01em",
          marginBottom: fs(28),
          textAlign: "center",
          lineHeight: 1.1,
        }}>
          {hookText}
        </span>

        {/* PASS / FAIL */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: fs(8) }}>
          <span style={{
            fontSize: fs(180),
            fontWeight: 900,
            fontFamily: displayFont,
            color: verdictColor,
            lineHeight: 1,
            letterSpacing: "2px",
          }}>
            {isPass ? "PASS" : "FAIL"}
          </span>
        </div>

        {/* Score */}
        <div style={{
          display: "flex",
          alignItems: "baseline",
          gap: fs(6),
          marginBottom: fs(40),
        }}>
          <span style={{
            fontSize: fs(108),
            fontWeight: 900,
            fontFamily: displayFont,
            color: "#FFFFFF",
            lineHeight: 1,
          }}>
            {score}
          </span>
          <span style={{
            fontSize: fs(48),
            fontWeight: 700,
            color: "rgba(255,255,255,0.50)",
          }}>
            /100
          </span>
        </div>

        {/* Checks card */}
        <div style={{
          width: "100%",
          background: "rgba(255,255,255,0.10)",
          borderRadius: fs(24),
          border: "1.5px solid rgba(255,255,255,0.20)",
          padding: `${fs(32)}px ${fs(44)}px`,
          display: "flex",
          flexDirection: "column",
          marginBottom: fs(36),
        }}>
          {visibleChecks.map((c, i) => (
            <div
              key={c.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingBottom: i < visibleChecks.length - 1 ? fs(20) : 0,
                marginBottom: i < visibleChecks.length - 1 ? fs(20) : 0,
                borderBottom: i < visibleChecks.length - 1 ? "1px solid rgba(255,255,255,0.15)" : "none",
              }}
            >
              <span style={{ fontSize: fs(34), fontWeight: 700, color: "#FFFFFF" }}>
                {c.label}
              </span>
              <span style={{
                fontSize: fs(34),
                fontWeight: 900,
                color: c.ok === null ? "rgba(255,255,255,0.45)" : c.ok ? "#4CE87A" : "#FF8C69",
              }}>
                {c.ok === null ? "-" : c.ok ? "\u2713" : "\u00D7"}
              </span>
            </div>
          ))}
        </div>

        {/* CTA block */}
        <div style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: fs(36),
        }}>
          <span style={{ fontSize: fs(34), fontWeight: 800, color: accent, marginBottom: fs(8), textAlign: "center" }}>
            Check before you upload.
          </span>
          <span style={{ fontSize: fs(54), fontWeight: 900, color: accent, lineHeight: 1.15, textAlign: "center" }}>
            Run your file.
          </span>
          <span style={{ fontSize: fs(54), fontWeight: 900, color: accent, lineHeight: 1.15, textAlign: "center" }}>
            See your score.
          </span>
        </div>

        {/* Bottom bar */}
        <div style={{
          width: "100%",
          borderTop: "1px solid rgba(255,255,255,0.20)",
          paddingTop: fs(20),
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: fs(18) }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt=""
              style={{ width: fs(120), height: fs(120), borderRadius: "50%", border: "3px solid rgba(255,255,255,0.35)" }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: fs(4) }}>
              <span style={{ fontSize: fs(52), fontWeight: 900, fontFamily: displayFont, lineHeight: 1 }}>
                <span style={{ color: "#FFA040" }}>manu</span>
                <span style={{ color: "#A8E6A3" }}>2print</span>
              </span>
              <span style={{ fontSize: fs(26), fontWeight: 800, color: taglineColor, lineHeight: 1.2 }}>
                KDP Readiness Verified
              </span>
            </div>
          </div>
          <span style={{ fontSize: fs(28), color: "rgba(255,255,255,0.60)", fontWeight: 600 }}>
            manu2print.com
          </span>
        </div>
      </div>
    ),
    { width: W, height: H }
  );
}
