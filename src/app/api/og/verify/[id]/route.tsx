import { ImageResponse } from "next/og";
import { getStored } from "@/lib/storage";

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
  // format = fb → 1200×1500, default → 1080×1350
  const isFb = searchParams.get("format") === "fb";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Fetch DB + S3 in parallel — S3 is authoritative (same source as download page)
  const [dbRes, stored] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/verification_results` +
      `?verification_id=eq.${id}` +
      `&select=readiness_score,issues_count,kdp_ready,trim_ok,margins_ok,bleed_ok,fonts_ok`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    ).then(r => r.json()).then(rows => rows?.[0] ?? null).catch(() => null),
    getStored(id).catch(() => null),
  ]);

  const data = dbRes;
  const report = stored?.processingReport;

  // S3 is authoritative — same source the download page uses
  const score  = report?.readinessScore100 ?? data?.readiness_score ?? 0;
  const isPass = report?.kdpReady === true || data?.kdp_ready === true || score >= 90;

  // Hook text — changes per variant
  const hookText =
    variant === "ego"
      ? (isPass ? "This would pass KDP." : "Would your PDF pass?")
      : variant === "fear"
      ? (isPass ? "Would your PDF pass?" : "This would fail KDP review.")
      : "Would yours pass?"; // curiosity — universal

  // Check columns — icons only, no verbose labels
  const allChecks = [
    { label: "Trim Size", ok: data?.trim_ok    ?? null },
    { label: "Margins",   ok: data?.margins_ok ?? null },
    { label: "Bleed",     ok: data?.bleed_ok   ?? null },
    { label: "Fonts",     ok: data?.fonts_ok   ?? null },
  ];

  const visibleChecks = allChecks.filter(c =>
    c.ok === null ? true : isPass ? c.ok === true : c.ok === false
  );

  // Colours — orange for FAIL, deep green for PASS
  const bgTop    = isPass ? "#1a5f3f" : "#C35B00";
  const bgBottom = isPass ? "#2d8659" : "#E65100";

  const base      = "https://www.manu2print.com";
  const avatarUrl = `${base}/manny-avatar.png`;

  // Canvas size
  const W = isFb ? 1200 : 1080;
  const H = isFb ? 1500 : 1350;
  const S = isFb ? 1200 / 1080 : 1; // scale all sizes proportionally
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
          padding: `${fs(60)}px ${fs(64)}px ${fs(48)}px ${fs(64)}px`,
          background: `linear-gradient(180deg, ${bgTop} 0%, ${bgBottom} 100%)`,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Hook — variant-driven, top of card */}
        <span style={{
          fontSize: fs(32),
          fontWeight: 600,
          color: "rgba(255,255,255,0.80)",
          letterSpacing: "0.02em",
          marginBottom: fs(28),
          textAlign: "center",
        }}>
          {hookText}
        </span>

        {/* PASS / FAIL + emoji */}
        <div style={{ display: "flex", alignItems: "center", gap: fs(24), marginBottom: fs(16) }}>
          <span style={{
            fontSize: fs(148),
            fontWeight: 900,
            color: "#FFFFFF",
            lineHeight: 1,
            letterSpacing: "-4px",
          }}>
            {isPass ? "PASS" : "FAIL"}
          </span>
          <span style={{ fontSize: fs(96) }}>
            {isPass ? "✅" : "⚠️"}
          </span>
        </div>

        {/* Score — prominent but not competing with PASS/FAIL */}
        <div style={{
          display: "flex",
          alignItems: "baseline",
          gap: fs(8),
          marginBottom: fs(44),
        }}>
          <span style={{
            fontSize: fs(90),
            fontWeight: 900,
            color: "#FFFFFF",
            lineHeight: 1,
          }}>
            {score}
          </span>
          <span style={{
            fontSize: fs(44),
            fontWeight: 700,
            color: "rgba(255,255,255,0.55)",
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
          padding: `${fs(36)}px ${fs(44)}px`,
          display: "flex",
          flexDirection: "column",
          marginBottom: fs(40),
        }}>
          {visibleChecks.map((c, i) => (
            <div
              key={c.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingBottom: i < visibleChecks.length - 1 ? fs(22) : 0,
                marginBottom: i < visibleChecks.length - 1 ? fs(22) : 0,
                borderBottom: i < visibleChecks.length - 1 ? "1px solid rgba(255,255,255,0.15)" : "none",
              }}
            >
              <span style={{ fontSize: fs(36), fontWeight: 700, color: "#FFFFFF" }}>
                {c.label}:
              </span>
              <span style={{ fontSize: fs(36), fontWeight: 700, color: "rgba(255,255,255,0.90)" }}>
                {c.ok === null ? "—" : c.ok ? "✔" : "✗"}
              </span>
            </div>
          ))}
        </div>

        {/* CTA block */}
        <div style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          marginBottom: fs(40),
          paddingLeft: fs(8),
        }}>
          <span style={{ fontSize: fs(30), color: "rgba(255,255,255,0.75)", marginBottom: fs(8) }}>
            Check before you upload.
          </span>
          <span style={{ fontSize: fs(40), fontWeight: 900, color: "#FFFFFF" }}>
            Run your file. See your score.
          </span>
        </div>

        {/* Bottom bar */}
        <div style={{
          width: "100%",
          borderTop: "1px solid rgba(255,255,255,0.20)",
          paddingTop: fs(28),
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
        }}>
          <span style={{ fontSize: fs(42), fontWeight: 900, letterSpacing: "-1px" }}>
            <span style={{ color: "#FFA040" }}>manu</span>
            <span style={{ color: "#FFFFFF" }}>2</span>
            <span style={{ color: "#A8E6A3" }}>print</span>
          </span>

          <span style={{ fontSize: fs(28), color: "rgba(255,255,255,0.70)", fontWeight: 600 }}>
            manu2print.com
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: fs(14) }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt=""
              style={{ width: fs(52), height: fs(52), borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)" }}
            />
            <span style={{ fontSize: fs(24), color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
              Verified by manu2print
            </span>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H }
  );
}
