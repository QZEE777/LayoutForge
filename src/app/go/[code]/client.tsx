"use client";

import { useEffect } from "react";
import Link from "next/link";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

const RULES = [
  "Trim size", "Margin compliance", "Bleed zone", "Font embedding",
  "Page count", "Image resolution", "File size limits", "Colour mode",
  "Safe zone", "Spine & cover", "Page-number tags", "26 rules total",
];

const STEPS = [
  { n: "01", title: "Upload your PDF", desc: "The exact file you plan to submit to KDP Interior manuscripts only, any page count." },
  { n: "02", title: "See every issue", desc: "Margins, trim size, bleed, fonts — flagged by page. Score and issue count shown immediately." },
  { n: "03", title: "Fix once. Upload once.", desc: "Pay $9 to unlock the full annotated report. Fix the issues, re-export, publish with confidence." },
];

const FOR_TAGS = ["Canva users", "Vellum users", "First-time authors", "Self-publishers", "Book formatters"];

interface Props {
  checkoutUrl: string;
  refCode: string;
  partnerName: string;
}

export function GoLandingClient({ checkoutUrl, refCode, partnerName }: Props) {
  // Set custom ref cookie so our analytics also captures the attribution
  useEffect(() => {
    if (!refCode) return;
    document.cookie = `m2p_ref=${refCode}; max-age=${THIRTY_DAYS}; path=/; SameSite=Lax`;
    try { localStorage.setItem("m2p_ref", refCode); } catch { }
  }, [refCode]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#FAF7EE", color: "#1A1208", minHeight: "100vh" }}>

      {/* ── Nav ─────────────────────────────────────────── */}
      <header style={{ background: "#FAF7EE", borderBottom: "1px solid rgba(0,0,0,0.08)", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontWeight: 900, fontSize: "1.15rem", color: "#F05A28" }}>manu</span>
            <span style={{ fontWeight: 900, fontSize: "1.15rem", color: "#2D6A2D" }}>2print</span>
          </Link>
          <a href={checkoutUrl}
            style={{ background: "#F05A28", color: "#fff", fontWeight: 700, fontSize: 13, padding: "8px 20px", borderRadius: 8, textDecoration: "none" }}>
            Check My PDF — $9
          </a>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px 56px", display: "grid", gridTemplateColumns: "1fr auto", gap: 48, alignItems: "center" }}>
        <div>
          {partnerName && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(45,106,45,0.08)", border: "1px solid rgba(45,106,45,0.18)", color: "#2D6A2D", fontWeight: 600, fontSize: 12, padding: "4px 12px", borderRadius: 999, marginBottom: 12 }}>
              <span style={{ fontSize: 14 }}>👤</span>
              Recommended by {partnerName}
            </div>
          )}
          <div style={{ display: "inline-block", background: "rgba(240,90,40,0.1)", color: "#F05A28", fontWeight: 700, fontSize: 12, padding: "4px 12px", borderRadius: 999, marginBottom: 20, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            $9 · One-time · Ready in 90 seconds
          </div>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, lineHeight: 1.1, margin: "0 0 20px" }}>
            Your PDF looks right.{" "}
            <span style={{ color: "#F05A28" }}>KDP will<br />still reject it.</span>
          </h1>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "#3a3020", maxWidth: 520, margin: "0 0 32px" }}>
            Check it before you upload — or fix it after rejection.
            Get a precise, page-by-page compliance report in minutes — so you
            can fix every issue before Amazon sees it.
          </p>

          {/* Checklist */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 32px", marginBottom: 36, maxWidth: 440 }}>
            {[
              "Annotated PDF with every issue highlighted by page",
              "Exact page numbers for every violation",
              "Plain-English fix instructions — no guesswork",
              "Works with Canva, InDesign, Word and PDF exports",
            ].map((item) => (
              <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "#3a3020" }}>
                <span style={{ color: "#2D6A2D", fontWeight: 700, marginTop: 1 }}>✓</span>
                {item}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <a href={checkoutUrl}
              style={{ display: "inline-block", background: "#F05A28", color: "#fff", fontWeight: 700, fontSize: "1rem", padding: "16px 36px", borderRadius: 12, textDecoration: "none" }}>
              Check My PDF — $9
            </a>
            <p style={{ fontSize: 13, color: "#6B6151", margin: 0 }}>
              Score is free. $9 unlocks the full annotated report.
            </p>
          </div>
        </div>

        {/* Checkout card */}
        <div style={{ background: "#fff", border: "1px solid #E0D8C4", borderRadius: 16, padding: "24px", minWidth: 280, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>KDP PDF Checker</span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 900, fontSize: 22, color: "#F05A28" }}>$9</div>
              <div style={{ fontSize: 11, color: "#6B6151" }}>one-time</div>
            </div>
          </div>
          <div style={{ background: "#FAF7EE", border: "2px dashed #E0D8C4", borderRadius: 12, padding: "32px 16px", textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <p style={{ fontSize: 13, color: "#6B6151", margin: 0 }}>Drop your PDF here<br /><span style={{ fontSize: 11 }}>or click to browse</span></p>
          </div>
          <a href={checkoutUrl}
            style={{ display: "block", background: "#F05A28", color: "#fff", fontWeight: 700, fontSize: 15, padding: "14px", borderRadius: 10, textDecoration: "none", textAlign: "center" }}>
            Check My PDF →
          </a>
          <p style={{ fontSize: 11, color: "#9B8E7E", textAlign: "center", margin: "10px 0 0" }}>
            Score is free. $9 unlocks the full annotated report.
          </p>
        </div>
      </section>

      {/* ── Problem ──────────────────────────────────────── */}
      <section style={{ background: "#1A1208", color: "#FAF7EE", padding: "72px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#F05A28", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>THE PROBLEM</p>
          <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, margin: "0 0 12px" }}>
            Amazon doesn&apos;t tell you<br />what&apos;s wrong.
          </h2>
          <p style={{ fontSize: "1rem", color: "rgba(250,247,238,0.65)", marginBottom: 40, maxWidth: 520 }}>
            It sends you back to guess. Upload → wait → rejection → guess → re-upload → repeat.
            Sometimes for days. Sometimes for weeks. <strong style={{ color: "#FAF7EE" }}>Every rejection resets your timeline.</strong>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 720 }}>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "20px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#F05A28", letterSpacing: "0.08em", margin: "0 0 12px" }}>WITHOUT MANU2PRINT</p>
              <p style={{ fontSize: 13, color: "rgba(250,247,238,0.6)", lineHeight: 1.6, margin: "0 0 16px" }}>
                Upload → wait → rejection → guess → re-upload → repeat
              </p>
              <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#fca5a5" }}>
                &ldquo;Your file has been rejected. Please review the KDP Formatting Guidelines and resubmit your manuscript.&rdquo;
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(45,106,45,0.3)", borderRadius: 12, padding: "20px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#4cd964", letterSpacing: "0.08em", margin: "0 0 12px" }}>WITH MANU2PRINT</p>
              <p style={{ fontSize: 13, color: "rgba(250,247,238,0.6)", lineHeight: 1.6, margin: "0 0 16px" }}>
                Upload → scan → fix → publish ✓
              </p>
              {[
                "Cover margin 0.5&quot; — needs 0.125&quot;",
                "Two KDP-incompatible fonts",
                "Image 62 DPI — will look blurry",
              ].map((item) => (
                <div key={item} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "#fbbf24", marginBottom: 6 }}>
                  <span>⚠</span>
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 26 Rules ─────────────────────────────────────── */}
      <section style={{ padding: "72px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 900, margin: "0 0 12px" }}>
            KDP checks 26 rules.{" "}
            <span style={{ color: "#F05A28" }}>Miss one —<br />you&apos;re rejected.</span>
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#6B6151", marginBottom: 40 }}>
            We check every one before you upload — so you don&apos;t find out the hard way.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12, maxWidth: 800, margin: "0 auto" }}>
            {RULES.map((rule) => (
              <div key={rule} style={{ background: "#fff", border: "1px solid #E0D8C4", borderRadius: 10, padding: "14px 12px", fontSize: 13, fontWeight: 600, color: "#1A1208" }}>
                {rule === "26 rules total"
                  ? <span style={{ color: "#F05A28" }}>{rule}</span>
                  : rule}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section style={{ background: "#F0EBE0", padding: "72px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#F05A28", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", marginBottom: 12 }}>HOW IT WORKS</p>
          <h2 style={{ fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 900, textAlign: "center", margin: "0 0 48px" }}>
            Three steps. No guesswork.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 32 }}>
            {STEPS.map((step) => (
              <div key={step.n}>
                <p style={{ fontSize: "3rem", fontWeight: 900, color: "#F05A28", margin: "0 0 12px", lineHeight: 1 }}>{step.n}</p>
                <h3 style={{ fontWeight: 800, fontSize: "1.1rem", margin: "0 0 8px" }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "#6B6151", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof + CTA ───────────────────────────── */}
      <section style={{ background: "#1A1208", color: "#FAF7EE", padding: "72px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, margin: "0 0 12px" }}>
            Stop guessing.{" "}
            <span style={{ color: "#F05A28" }}>Start knowing.</span>
          </h2>
          <p style={{ fontSize: "1rem", color: "rgba(250,247,238,0.65)", marginBottom: 24 }}>
            Check your file before Amazon does. No waiting. No re-uploads. No guesswork.
          </p>

          {/* Perfect for tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 36 }}>
            {FOR_TAGS.map((tag) => (
              <span key={tag} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "5px 14px", fontSize: 12, color: "rgba(250,247,238,0.8)" }}>
                {tag}
              </span>
            ))}
          </div>

          <a href={checkoutUrl}
            style={{ display: "inline-block", background: "#F05A28", color: "#fff", fontWeight: 700, fontSize: "1.05rem", padding: "18px 48px", borderRadius: 14, textDecoration: "none", marginBottom: 16 }}>
            Check My PDF — $9
          </a>
          <p style={{ fontSize: 13, color: "rgba(250,247,238,0.4)", margin: 0 }}>
            One-time payment · No subscription · Instant report
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={{ background: "#FAF7EE", borderTop: "1px solid #E0D8C4", padding: "24px", textAlign: "center" }}>
        <p style={{ margin: "0 0 8px" }}>
          <span style={{ fontWeight: 900, color: "#F05A28" }}>manu</span>
          <span style={{ fontWeight: 900, color: "#2D6A2D" }}>2print</span>
          <span style={{ fontSize: 13, color: "#9B8E7E", marginLeft: 8 }}>— KDP tools for indie authors.</span>
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", fontSize: 12, color: "#9B8E7E" }}>
          <Link href="/privacy" style={{ color: "inherit" }}>Privacy</Link>
          <Link href="/terms" style={{ color: "inherit" }}>Terms</Link>
          <Link href="/refunds" style={{ color: "inherit" }}>Refunds</Link>
          <Link href="/contact" style={{ color: "inherit" }}>Contact</Link>
        </div>
      </footer>

    </div>
  );
}
