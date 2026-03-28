"use client";

type StatusLevel = "reject" | "needs-work" | "nearly" | "ready";

interface Props {
  score: number;
  statusLevel: StatusLevel;
  issuesCount: number | null;
  verifyUrl: string;
  verificationId: string;
}

export function SocialCard({ score, statusLevel, issuesCount, verifyUrl, verificationId }: Props) {
  const isBad = statusLevel === "reject" || statusLevel === "needs-work";

  // Orange for bad scores, forest green for good — both bold, neither dark/murky
  const bg       = isBad ? "#F05A28" : "#2D6A2D";
  const scoreBg  = isBad ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.18)";
  const proofBg  = isBad ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.15)";
  const ctaColor = isBad ? "#F05A28"           : "#2D6A2D";

  const hook = isBad
    ? "Would your PDF pass KDP?"
    : "My PDF is ready for KDP.";

  const subHook = isBad
    ? "Most authors find out the hard way."
    : "Checked before uploading. Zero surprises.";

  const statusText =
    statusLevel === "reject"     ? "WOULD BE REJECTED" :
    statusLevel === "needs-work" ? "NEEDS SIGNIFICANT FIXES" :
    statusLevel === "nearly"     ? "NEARLY READY" :
    "READY TO UPLOAD";

  const curiosity = isBad
    ? "Most files fail on margins, bleed, and trim size."
    : "Check yours before Amazon rejects it.";

  // Strip https://www. for the printed URL so it stays short
  const shortUrl = verifyUrl
    .replace("https://www.", "")
    .replace("https://", "");

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F0EBE0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px 16px 32px",
      fontFamily: "system-ui, sans-serif",
    }}>

      {/* Instruction */}
      <p style={{ fontSize: 12, color: "#9B8E7E", margin: "0 0 14px", textAlign: "center", maxWidth: 480 }}>
        📸 Screenshot this card to share on Instagram or Facebook
      </p>

      {/* ── Social card — 4:5 portrait ─────────────────────── */}
      <div style={{
        width: "min(480px, 100%)",
        aspectRatio: "4 / 5",
        background: bg,
        borderRadius: 24,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "32px 28px 28px",
        boxSizing: "border-box",
      }}>

        {/* Logo */}
        <div style={{ marginBottom: 4 }}>
          <span style={{ fontWeight: 900, fontSize: 14, color: "rgba(255,255,255,0.95)" }}>manu</span>
          <span style={{ fontWeight: 900, fontSize: 14, color: "rgba(255,255,255,0.55)" }}>2print</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: 6 }}>KDP tools</span>
        </div>

        {/* Hook — 30% */}
        <div style={{ margin: "18px 0 0" }}>
          <p style={{
            fontSize: "clamp(1.55rem, 6.5vw, 2rem)",
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1.15,
            margin: "0 0 6px",
          }}>
            {hook}
          </p>
          <p style={{
            fontSize: "clamp(0.8rem, 2.8vw, 0.95rem)",
            color: "rgba(255,255,255,0.72)",
            margin: 0,
            fontWeight: 500,
          }}>
            {subHook}
          </p>
        </div>

        {/* Score — 40%, flex-grows to fill */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: scoreBg,
          borderRadius: 18,
          padding: "20px 12px",
          margin: "18px 0 14px",
          textAlign: "center",
        }}>
          <div style={{ lineHeight: 1 }}>
            <span style={{
              fontSize: "clamp(5.5rem, 22vw, 8.5rem)",
              fontWeight: 900,
              color: "#fff",
              display: "inline-block",
            }}>
              {score}
            </span>
            <span style={{
              fontSize: "clamp(2rem, 8vw, 3rem)",
              fontWeight: 700,
              color: "rgba(255,255,255,0.45)",
            }}>
              /100
            </span>
          </div>
          <p style={{
            fontSize: "clamp(0.7rem, 2.8vw, 0.9rem)",
            fontWeight: 800,
            color: "rgba(255,255,255,0.88)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: "10px 0 0",
          }}>
            {statusText}
          </p>
        </div>

        {/* Proof / curiosity — 15% */}
        <div style={{
          background: proofBg,
          borderRadius: 12,
          padding: "11px 14px",
          marginBottom: 12,
          textAlign: "center",
        }}>
          {issuesCount !== null && issuesCount > 0 ? (
            <>
              <p style={{ fontSize: "clamp(0.8rem, 3vw, 0.95rem)", fontWeight: 700, color: "#fff", margin: "0 0 3px" }}>
                {issuesCount} issue{issuesCount !== 1 ? "s" : ""} found before upload
              </p>
              <p style={{ fontSize: "clamp(0.65rem, 2.4vw, 0.78rem)", color: "rgba(255,255,255,0.6)", margin: 0 }}>
                {curiosity}
              </p>
            </>
          ) : (
            <p style={{ fontSize: "clamp(0.7rem, 2.4vw, 0.82rem)", color: "rgba(255,255,255,0.75)", margin: 0 }}>
              {curiosity}
            </p>
          )}
        </div>

        {/* CTA — 15% */}
        <div style={{
          background: "#fff",
          borderRadius: 13,
          padding: "13px 16px",
          textAlign: "center",
        }}>
          <p style={{
            fontSize: "clamp(0.78rem, 3vw, 0.92rem)",
            fontWeight: 800,
            color: ctaColor,
            margin: "0 0 3px",
          }}>
            Check Before You Upload
          </p>
          <p style={{
            fontSize: "clamp(0.6rem, 2.2vw, 0.72rem)",
            color: "#9B8E7E",
            margin: 0,
            wordBreak: "break-all",
          }}>
            {shortUrl}
          </p>
        </div>
      </div>

      {/* Back link */}
      <a
        href={`/verify/${verificationId}`}
        style={{ marginTop: 18, fontSize: 13, color: "#9B8E7E", textDecoration: "none" }}
      >
        ← Back to full report
      </a>
    </div>
  );
}
