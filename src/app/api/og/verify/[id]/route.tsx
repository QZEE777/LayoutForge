import { ImageResponse } from "next/og";

export const runtime = "edge";

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

  // DB fetch only — getStored removed (edge runtime: no fs access)
  // OG card always receives ?p= and ?s= stamped by the verify/download page
  const dbRes = await fetch(
    `${supabaseUrl}/rest/v1/verification_results` +
    `?verification_id=eq.${id}` +
    `&select=readiness_score,issues_count,kdp_ready,trim_ok,margins_ok,bleed_ok,fonts_ok`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  ).then((r) => r.json()).then((rows) => rows?.[0] ?? null).catch(() => null);

  const data = dbRes;

  // Page stamps ?p= and ?s= — card is always locked to page's computed state
  const scoreOverride = searchParams.get("s") ? Number(searchParams.get("s")) : null;
  const passOverride  = searchParams.get("p") !== null ? searchParams.get("p") === "1" : null;

  const score  = scoreOverride ?? data?.readiness_score ?? 0;
  const isPass = passOverride  ?? (data?.kdp_ready === true || score >= 90);

  // Check fields: DB first, then URL params (?trim=1 etc), then null
  const sp = (k: string) => searchParams.has(k) ? searchParams.get(k) === "1" : null;
  const checks = [
    { label: "Trim Size", ok: data?.trim_ok    ?? sp("trim") },
    { label: "Margins",   ok: data?.margins_ok ?? sp("margins") },
    { label: "Bleed",     ok: data?.bleed_ok   ?? sp("bleed") },
    { label: "Fonts",     ok: data?.fonts_ok   ?? sp("fonts") },
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

  // Derive base from the incoming request so images resolve in dev + production
  const reqUrl    = new URL(req.url);
  const base      = process.env.NEXT_PUBLIC_SITE_URL ?? `${reqUrl.protocol}//${reqUrl.host}`;
  const avatarUrl = `${base}/manny-avatar.png`;

  // ── Canvas sizes ───────────────────────────────────────────────────────────
  const W = isPortrait ? 1080 : isSquare ? 1080 : 1200;
  const H = isPortrait ? 1350 : isSquare ? 1080 : 630;

  // ── PORTRAIT / SQUARE layout (for actual social posts) ────────────────────
  if (isPortrait || isSquare) {
    const S  = isSquare ? 0.85 : 1;
    const fs = (n: number) => Math.round(n * S);

    // ── Load Anton display font ────────────────────────────────────────────
    let antonFont: ArrayBuffer | null = null;
    try {
      const fontRes = await fetch(
        "https://fonts.gstatic.com/s/anton/v25/1Ptgg87LROyAm0K08i4gS7lu.woff"
      );
      if (fontRes.ok) antonFont = await fontRes.arrayBuffer();
    } catch { /* fall back to system-ui */ }

    // ── Mascot images — HTTP URL (edge runtime fetches via Satori) ────────
    const mannyFile = isPass ? "manny_pass_card.png" : "manny_fail_card.png";
    const mannySrc  = `${base}/manny/${mannyFile}`;

    // ── Approve / Reject icons as base64 SVG ─────────────────────────────
    const checkSvgB64 = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
      `<circle cx="50" cy="50" r="44" fill="none" stroke="#2ECC71" stroke-width="8"/>` +
      `<polyline points="22,52 40,70 78,28" fill="none" stroke="#2ECC71" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>` +
      `</svg>`
    ).toString("base64");

    const xSvgB64 = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
      `<circle cx="50" cy="50" r="44" fill="none" stroke="#D32F2F" stroke-width="8"/>` +
      `<line x1="28" y1="28" x2="72" y2="72" stroke="#D32F2F" stroke-width="9" stroke-linecap="round"/>` +
      `<line x1="72" y1="28" x2="28" y2="72" stroke="#D32F2F" stroke-width="9" stroke-linecap="round"/>` +
      `</svg>`
    ).toString("base64");

    const iconSrc = `data:image/svg+xml;base64,${isPass ? checkSvgB64 : xSvgB64}`;

    const fontFamily = antonFont ? '"Anton", sans-serif' : "system-ui, sans-serif";

    // ── Palette ───────────────────────────────────────────────────────────
    const gradTop      = isPass ? "#1FAF5C"                        : "#D65A2F";
    const gradBottom   = isPass ? "#178A49"                        : "#C14A27";
    const bannerBg     = isPass ? "#2ECC71"                        : "#D28A3F";
    const bannerText   = isPass ? "THIS PDF IS READY FOR KDP"      : "THIS PDF WOULD BE REJECTED BY KDP";
    const scoreBlockBg = isPass ? "#2ECC71"                        : "#FF6A2B";
    const statusColor  = isPass ? "#FFFFFF"                        : "#00FF66";
    const statusText   = isPass ? "Cleared for upload"             : "Fix required before upload";
    const verdictLabel = isPass ? "VERIFIED"                       : "REJECTED";
    const verdictColor = isPass ? "#2ECC71"                        : "#D32F2F";
    const msgBlockBg   = isPass ? "#2ECC71"                        : "#FF6A2B";
    const msgLines     = isPass
      ? [
          "I just checked my KDP PDF on manu2print.",
          `Scored ${score}/100 and cleared for upload.`,
          "Would yours pass?",
        ]
      : [
          "I just caught issues in my KDP PDF before uploading.",
          "That likely saved me a rejection.",
          "Check yours before you submit",
        ];

    try {
    const imgResponse = new ImageResponse(
      (
        <div
          style={{
            width: W, height: H,
            display: "flex", flexDirection: "column",
            background: `linear-gradient(180deg, ${gradTop} 0%, ${gradBottom} 100%)`,
            fontFamily,
            overflow: "hidden",
          }}
        >

          {/* ── HEADER — #F2F2F2, rounded, 130px, left/center/right ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#F2F2F2",
            borderRadius: fs(16),
            height: fs(130),
            margin: `${fs(40)}px ${fs(40)}px 0`,
            padding: `0 ${fs(24)}px`,
            flexShrink: 0,
          }}>

            {/* LEFT: Manny mascot, 100px, vertically centered */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mannySrc} alt=""
              style={{ height: fs(100), objectFit: "contain" }}
            />

            {/* CENTER: reject/approve icon 60px + verdict label */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: fs(6) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={iconSrc} alt="" style={{ width: fs(60), height: fs(60) }} />
              <span style={{ fontSize: fs(22), fontWeight: 700, color: verdictColor }}>
                {verdictLabel}
              </span>
            </div>

            {/* RIGHT: manu2print wordmark */}
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: fs(30), fontWeight: 900, color: "#FF6A2B" }}>manu</span>
              <span style={{ fontSize: fs(30), fontWeight: 900, color: "#2ECC71" }}>2print</span>
            </div>
          </div>

          {/* ── BANNER — 64px, rounded ─────────────────────────────── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: fs(64),
            background: bannerBg,
            borderRadius: fs(12),
            margin: `${fs(16)}px ${fs(40)}px 0`,
            flexShrink: 0,
          }}>
            <span style={{ fontSize: fs(28), fontWeight: 700, color: "#FFFFFF", textAlign: "center" }}>
              {bannerText}
            </span>
          </div>

          {/* ── SCORE BLOCK — 300px, score dominant ───────────────── */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            height: fs(300),
            background: scoreBlockBg,
            borderRadius: fs(20),
            margin: `${fs(20)}px ${fs(40)}px 0`,
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span style={{ fontSize: fs(150), fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>
                {score}
              </span>
              <span style={{ fontSize: fs(60), color: "rgba(255,255,255,0.70)", lineHeight: 1 }}>
                /100
              </span>
            </div>
            <span style={{ fontSize: fs(30), color: statusColor, marginTop: fs(8) }}>
              {statusText}
            </span>
          </div>

          {/* ── CHECKLIST — dots only, no row boxes ───────────────── */}
          <div style={{
            display: "flex", flexDirection: "column",
            margin: `${fs(28)}px ${fs(40)}px 0`,
            gap: fs(20),
          }}>
            {checks.map((c) => (
              <div key={c.label} style={{ display: "flex", alignItems: "center", gap: fs(20) }}>
                <div style={{
                  width: fs(34), height: fs(34),
                  borderRadius: "50%",
                  background: c.ok === null
                    ? "rgba(255,255,255,0.35)"
                    : c.ok ? "#2ECC71" : "#B0B0B0",
                  flexShrink: 0,
                  display: "flex",
                }} />
                <span style={{ fontSize: fs(30), fontWeight: 700, color: "#FFFFFF" }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>

          {/* ── MESSAGE BLOCK — 200px ─────────────────────────────── */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            height: fs(200),
            background: msgBlockBg,
            borderRadius: fs(20),
            margin: `${fs(28)}px ${fs(40)}px 0`,
            padding: `0 ${fs(32)}px`,
            flexShrink: 0,
            gap: fs(4),
          }}>
            {msgLines.map((line, i) => (
              <span key={i} style={{
                fontSize: fs(38), fontWeight: 700,
                color: "#FFFFFF",
                textAlign: "center",
                lineHeight: 1.25,
              }}>
                {line}
              </span>
            ))}
          </div>

          {/* ── CTA ───────────────────────────────────────────────── */}
          <div style={{ display: "flex", justifyContent: "center", margin: `${fs(36)}px ${fs(40)}px 0` }}>
            <span style={{ fontSize: fs(34), fontWeight: 700, color: "#FFFFFF" }}>
              manu2print.com
            </span>
          </div>

          {/* ── FOOTER ────────────────────────────────────────────── */}
          <div style={{ display: "flex", justifyContent: "center", margin: `${fs(16)}px ${fs(40)}px 0` }}>
            <span style={{ fontSize: fs(22), color: "rgba(255,255,255,0.70)" }}>
              #KDP #IndieAuthor #SelfPublishing
            </span>
          </div>

        </div>
      ),
      {
        width: W,
        height: H,
        ...(antonFont
          ? { fonts: [{ name: "Anton", data: antonFont, weight: 400 as const, style: "normal" as const }] }
          : {}),
      }
    );
    // Force Satori to render now so any error is catchable here
    const imgBuf = await imgResponse.arrayBuffer();
    return new Response(imgBuf, { headers: { "Content-Type": "image/png" } });
    } catch (err) {
      console.error("[OG portrait error]", err);
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }
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
