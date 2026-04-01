import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getStored } from "@/lib/storage";
import { computeCheckerScore } from "@/lib/scoreUtils";
import { VerifyClient } from "./client";

interface VerifyPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sh?: string }>;
}

export async function generateMetadata({ params }: VerifyPageProps): Promise<Metadata> {
  const { id } = await params;
  // Landscape 1200×630 for FB/LinkedIn/Twitter link previews (portrait gets badly cropped)
  const ogImage         = `https://www.manu2print.com/api/og/verify/${id}?format=og`;
  const ogImagePortrait = `https://www.manu2print.com/api/og/verify/${id}`;
  return {
    title: "KDP PDF Check Result — manu2print",
    description: "See how this manuscript scored on KDP readiness. Would your PDF pass?",
    openGraph: {
      title: "KDP PDF Check Result — manu2print",
      description: "See how this manuscript scored on KDP readiness. Would your PDF pass?",
      images: [{ url: ogImage, width: 1200, height: 630, alt: "KDP readiness score card" }],
      url: `https://www.manu2print.com/verify/${id}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "KDP PDF Check Result — manu2print",
      description: "Would your PDF pass? Most don't.",
      images: [ogImagePortrait],
    },
  };
}

export default async function VerifyPage({ params, searchParams }: VerifyPageProps) {
  const { id: verificationId } = await params;
  const { sh: shToken } = await searchParams;

  // Fetch DB summary + S3 source-of-truth report in parallel
  const [{ data, error }, stored] = await Promise.all([
    supabase
      .from("verification_results")
      .select("verification_id, filename_clean, readiness_score, kdp_ready, scan_date, issues_count, trim_ok, margins_ok, bleed_ok, fonts_ok")
      .eq("verification_id", verificationId)
      .maybeSingle(),
    getStored(verificationId).catch(() => null),
  ]);

  if (error || !data) {
    return (
      <div style={{ fontFamily: "system-ui,sans-serif", background: "#FAF7EE", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
          <p style={{ marginBottom: 12 }}>
            <span style={{ color: "#F05A28", fontWeight: 900, fontSize: "1.4rem" }}>manu</span>
            <span style={{ color: "#2D6A2D", fontWeight: 900, fontSize: "1.4rem" }}>2print</span>
          </p>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1A1208", marginBottom: 8 }}>Verification not found</h1>
          <p style={{ fontSize: 14, color: "#6B6151", marginBottom: 28 }}>This verification link is invalid or has expired.</p>
          <Link
            href="/kdp-pdf-checker"
            style={{ display: "inline-block", background: "#F05A28", color: "#fff", fontWeight: 700, fontSize: 14, padding: "13px 28px", borderRadius: 10, textDecoration: "none" }}
          >
            Check your own manuscript →
          </Link>
        </div>
      </div>
    );
  }

  // S3 processingReport is the authoritative source (same data download page uses)
  const report        = stored?.processingReport;

  // Use the SAME scoring algorithm as the download page (recalculate from issuesEnriched)
  // so that verify page always shows the same number the user saw on their report.
  const computedScore =
    report?.outputType === "checker" && report.issuesEnriched
      ? computeCheckerScore(report.issuesEnriched)
      : null;

  const score  = computedScore ?? report?.readinessScore100 ?? data.readiness_score ?? 0;
  const isPass = report?.kdpReady === true || data.kdp_ready === true || score >= 90;

  const statusLevel =
    isPass      ? "ready" :
    score >= 70 ? "nearly" :
    score >= 50 ? "needs-work" :
    "reject";

  const statusLabel =
    statusLevel === "ready"      ? "READY FOR KDP" :
    statusLevel === "nearly"     ? "NEARLY READY" :
    statusLevel === "needs-work" ? "NEEDS WORK" :
    "LIKELY REJECTED";

  // Issues count: prefer DB (more reliable integer), fall back to S3 report
  const issuesCount =
    typeof data.issues_count === "number"
      ? data.issues_count
      : (stored?.processingReport?.issues?.length ?? null);

  // Check fields: DB is primary; fall back to S3 issuesEnriched for older records
  const s3Issues = stored?.processingReport?.issuesEnriched ?? [];
  const hasKw = (kws: string[]) =>
    s3Issues.some((i: { humanMessage?: string; originalMessage?: string }) => {
      const txt = ((i.humanMessage ?? "") + " " + (i.originalMessage ?? "")).toLowerCase();
      return kws.some((k) => txt.includes(k));
    });
  const hasS3Issues = s3Issues.length > 0;

  const trimOk    = data.trim_ok    ?? (hasS3Issues ? !hasKw(["trim", "page size", "dimensions", "paper size"]) : null);
  const marginsOk = data.margins_ok ?? (hasS3Issues ? !hasKw(["margin", "safe zone", "gutter"])                 : null);
  const bleedOk   = data.bleed_ok   ?? (hasS3Issues ? !hasKw(["bleed"])                                         : null);
  const fontsOk   = data.fonts_ok   ?? (hasS3Issues ? !hasKw(["font", "embed", "subsett"])                      : null);

  const verifyUrl = `https://www.manu2print.com/verify/${verificationId}`;

  return (
    <VerifyClient
      score={score}
      statusLabel={statusLabel}
      statusLevel={statusLevel}
      issuesCount={issuesCount}
      filename={data.filename_clean ?? ""}
      verifyUrl={verifyUrl}
      verificationId={verificationId}
      shToken={shToken ?? null}
      trimOk={trimOk}
      marginsOk={marginsOk}
      bleedOk={bleedOk}
      fontsOk={fontsOk}
    />
  );
}
