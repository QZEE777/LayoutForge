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

  // format: "portrait" = 1080×1350 (only social card size), default = 1200×630 (link preview)
  const format     = searchParams.get("format") ?? "landscape";
  const isPortrait = format === "portrait";

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

  // ── Canvas sizes ───────────────────────────────────────────────────────────
  const W = isPortrait ? 1080 : 1200;
  const H = isPortrait ? 1350 : 630;

  // ── PORTRAIT 1080×1350 — only social card size ────────────────────────────
  if (isPortrait) {

    // ── Load Anton display font ────────────────────────────────────────────
    let antonFont: ArrayBuffer | null = null;
    try {
      const fontRes = await fetch(
        "https://fonts.gstatic.com/s/anton/v25/1Ptgg87LROyAm0K08i4gS7lu.woff"
      );
      if (fontRes.ok) antonFont = await fontRes.arrayBuffer();
    } catch { /* fall back to system-ui */ }

    const fontFamily = antonFont ? '"Anton", sans-serif' : "system-ui, sans-serif";

    // ── Dynamic values ────────────────────────────────────────────────────
    const gradTop    = isPass ? "#1A6B2A" : "#C95A31";
    const gradBottom = isPass ? "#0D3D18" : "#8E3A1F";
    const glossTop   = isPass ? "rgba(255,255,255,0.12)" : "rgba(255,220,195,0.20)";
    const glossBottom= isPass ? "rgba(255,255,255,0.00)" : "rgba(255,255,255,0.03)";
    const stateWord  = isPass ? "PASS"    : "FAIL";
    const stateColor = isPass ? "#C5E83A" : "#FF6A2B";  // yellow-green for PASS, orange for FAIL
    const statusText = isPass ? "Ready for KDP upload" : "Fix before you upload";
    const statusColor= isPass ? "#C5E83A"              : "#5BEE8D";
    const msgBg      = isPass ? "rgba(8,30,12,0.42)"   : "rgba(63,24,13,0.44)";
    const msgLines   = isPass
      ? [
          "Checked this before uploading.",
          "Cleared for KDP.",
          "Would yours pass?",
        ]
      : [
          "Caught this before uploading,",
          "Saved a rejection.",
          "Check yours before you submit.",
        ];

    // ── Curved swoosh underline (SVG) ─────────────────────────────────────
    const swooshSrc = `data:image/svg+xml;base64,${Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="24" viewBox="0 0 400 24">` +
      `<path d="M 20 16 Q 200 4 380 14" stroke="${stateColor}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
      `</svg>`
    ).toString("base64")}`;

    try {
    const imgResponse = new ImageResponse(
      (
        <div
          style={{
            width: 1080, height: 1350,
            display: "flex", flexDirection: "column",
            background: `linear-gradient(180deg, ${gradTop} 0%, ${gradBottom} 100%)`,
            fontFamily,
            overflow: "hidden",
          }}
        >
          {/* Metallic/gloss overlays for premium depth */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(120deg, ${glossTop} 0%, ${glossBottom} 42%, rgba(0,0,0,0.00) 75%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 120,
              left: -120,
              width: 1320,
              height: 220,
              transform: "rotate(-8deg)",
              background: "linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.12) 36%, rgba(255,255,255,0.04) 66%, rgba(255,255,255,0.00) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -160,
              right: -220,
              width: 760,
              height: 760,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.00) 68%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 26,
              right: 26,
              top: 26,
              bottom: 26,
              borderRadius: 34,
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          />

          {/* ── Top brandmark ─────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              position: "absolute",
              left: 50,
              right: 50,
              top: 42,
            }}
          >
            <div style={{ height: 2, width: 86, background: "rgba(255,255,255,0.34)", borderRadius: 1 }} />
            <span style={{ fontSize: 40, fontWeight: 900, color: "#FFFFFF", display: "flex", alignItems: "center", gap: 0 }}>
              <span style={{ color: "#F8E9DA" }}>manu</span>
              <span style={{ color: "#FF7A45" }}>2</span>
              <span style={{ color: "#C5E83A" }}>print</span>
              <span style={{ color: "rgba(255,255,255,0.9)" }}>.com</span>
            </span>
            <div style={{ height: 2, width: 86, background: "rgba(255,255,255,0.34)", borderRadius: 1 }} />
          </div>

          {/* ── 1. HEADLINE ───────────────────────────────────────── */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            margin: "118px 50px 0",
          }}>
            <span style={{ fontSize: 90, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.0 }}>
              THIS WOULD
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <span style={{ fontSize: 90, fontWeight: 900, color: stateColor, lineHeight: 1.0 }}>
                {stateWord}
              </span>
              <span style={{ fontSize: 90, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.0 }}>
                KDP
              </span>
            </div>
            {/* Curved swoosh underline */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={swooshSrc} alt="" style={{ width: 320, height: 20, marginTop: 6 }} />
          </div>

          {/* ── 2. SCORE — no background box, sits on gradient ────── */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            margin: "12px 50px 0",
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 240, fontWeight: 900, color: "#FFFFFF", lineHeight: 0.9 }}>
                {score}
              </span>
              <span style={{ fontSize: 90, color: "rgba(255,255,255,0.60)", lineHeight: 1 }}>
                /100
              </span>
            </div>
            <span style={{ fontSize: 36, fontWeight: 700, color: statusColor, marginTop: 8 }}>
              {statusText}
            </span>
          </div>

          {/* ── Divider ───────────────────────────────────────────── */}
          <div style={{
            height: 1, background: "rgba(255,255,255,0.25)",
            margin: "20px 70px 0",
          }} />

          {/* ── 3. CHECKLIST — centered as a group ────────────────── */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            margin: "20px 50px 0",
            gap: 14,
          }}>
            {checks.map((c) => (
              <div key={c.label} style={{
                display: "flex", alignItems: "center", gap: 22,
                width: 440,
                background: "rgba(0,0,0,0.16)",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.18)",
                padding: "10px 16px",
              }}>
                <div style={{
                  width: 54, height: 54, borderRadius: "50%",
                  background: c.ok === null ? "rgba(255,255,255,0.30)" : c.ok ? "#2ECC71" : "#D88A2C",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  border: "1.5px solid rgba(255,255,255,0.35)",
                }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>
                    {c.ok === null ? "?" : c.ok ? "✓" : "✕"}
                  </span>
                </div>
                <span style={{ fontSize: 36, fontWeight: 700, color: "#FFFFFF" }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>

          {/* ── 4. MESSAGE BLOCK ──────────────────────────────────── */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: msgBg,
            borderRadius: 24,
            margin: "24px 50px 0",
            padding: "22px 36px",
            flexShrink: 0,
            gap: 0,
            border: "1.5px solid rgba(255,255,255,0.2)",
          }}>
            {msgLines.map((line, i) => (
              <span key={i} style={{
                fontSize: 34, fontWeight: 700, color: "#FFFFFF",
                textAlign: "center", lineHeight: 1.3,
              }}>
                {line}
              </span>
            ))}
          </div>

          {/* ── 5. FOOTER ─────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              position: "absolute",
              left: 50,
              right: 50,
              bottom: 30,
            }}
          >
            <span style={{ fontSize: 24, color: "rgba(255,255,255,0.64)" }}>
              KDP • Indie Author • Self Publishing
            </span>
          </div>

        </div>
      ),
      {
        width: 1080,
        height: 1350,
        ...(antonFont
          ? { fonts: [{ name: "Anton", data: antonFont, weight: 400 as const, style: "normal" as const }] }
          : {}),
      }
    );
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
        background: `linear-gradient(135deg, ${bgTop} 0%, ${bgBottom} 58%, #6f2d18 100%)`,
        fontFamily: "system-ui, sans-serif",
        overflow: "hidden",
      }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(120deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 45%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            top: 20,
            bottom: 20,
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.16)",
          }}
        />

        {/* Top bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "30px 52px 22px",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
