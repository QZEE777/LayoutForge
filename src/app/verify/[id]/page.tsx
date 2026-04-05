import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getStored } from "@/lib/storage";
import { computeCheckerScore } from "@/lib/scoreUtils";
import { VerifyClient } from "./client";

interface VerifyPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sh?: string }>;
}

// React cache dedupes this across generateMetadata + VerifyPage in the same render
const fetchVerifyData = cache(async (id: string) => {
  const [{ data }, stored] = await Promise.all([
    supabase
      .from("verification_results")
      .select("verification_id, filename_clean, readiness_score, kdp_ready, scan_date, issues_count, trim_ok, margins_ok, bleed_ok, fonts_ok")
      .eq("verification_id", id)
      .maybeSingle(),
    getStored(id).catch(() => null),
  ]);
  return { data: data ?? null, stored };
});

/** Portrait social card — same path the verify page hero and download link use. */
function portraitOgVerifyPath(
  verificationId: string,
  score: number,
  isPass: boolean,
  trimOk: boolean | null,
  marginsOk: boolean | null,
  bleedOk: boolean | null,
  fontsOk: boolean | null
): string {
  const checkParams = [
    `trim=${trimOk === null ? "" : trimOk ? 1 : 0}`,
    `margins=${marginsOk === null ? "" : marginsOk ? 1 : 0}`,
    `bleed=${bleedOk === null ? "" : bleedOk ? 1 : 0}`,
    `fonts=${fontsOk === null ? "" : fontsOk ? 1 : 0}`,
  ].join("&");
  return `/api/og/verify/${verificationId}?p=${isPass ? 1 : 0}&s=${score}&${checkParams}&format=portrait`;
}

export async function generateMetadata({ params }: VerifyPageProps): Promise<Metadata> {
  const { id } = await params;
  const base = "https://www.manu2print.com";

  // Compute state from DB so the og:image URL stamps the correct p/s params —
  // FB's crawler hits the og:image URL, not the page JS, so this is the only way
  // to guarantee the card FB shows matches the actual result
  try {
    const { data, stored } = await fetchVerifyData(id);
    if (!data) {
      return buildMeta(id, `${base}/api/og/verify/${id}`, base);
    }
    const report = stored?.processingReport;
    const computedScore =
      report?.outputType === "checker" && report.issuesEnriched
        ? computeCheckerScore(report.issuesEnriched)
        : null;
    const score = computedScore ?? report?.readinessScore100 ?? data.readiness_score ?? 0;
    const isPass = report?.kdpReady === true || data.kdp_ready === true || score >= 90;

    const s3Issues = stored?.processingReport?.issuesEnriched ?? [];
    const hasKw = (kws: string[]) =>
      s3Issues.some((i: { humanMessage?: string; originalMessage?: string }) => {
        const txt = ((i.humanMessage ?? "") + " " + (i.originalMessage ?? "")).toLowerCase();
        return kws.some((k) => txt.includes(k));
      });
    const hasS3Issues = s3Issues.length > 0;
    const trimOk = data.trim_ok ?? (hasS3Issues ? !hasKw(["trim", "page size", "dimensions", "paper size"]) : null);
    const marginsOk = data.margins_ok ?? (hasS3Issues ? !hasKw(["margin", "safe zone", "gutter"]) : null);
    const bleedOk = data.bleed_ok ?? (hasS3Issues ? !hasKw(["bleed"]) : null);
    const fontsOk = data.fonts_ok ?? (hasS3Issues ? !hasKw(["font", "embed", "subsett"]) : null);

    const ogImage = `${base}${portraitOgVerifyPath(id, score, isPass, trimOk, marginsOk, bleedOk, fontsOk)}`;
    return buildMeta(id, ogImage, base);
  } catch {
    // Fallback: let OG route do its own fetch
    return buildMeta(id, `${base}/api/og/verify/${id}`, base);
  }
}

function buildMeta(id: string, ogImage: string, base: string): Metadata {
  return {
    title: "KDP PDF Check Result — manu2print",
    description: "See how this manuscript scored on KDP readiness. Would your PDF pass?",
    openGraph: {
      title: "KDP PDF Check Result — manu2print",
      description: "See how this manuscript scored on KDP readiness. Would your PDF pass?",
      images: [{ url: ogImage, width: 1080, height: 1350, alt: "KDP readiness score card" }],
      url: `${base}/verify/${id}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "KDP PDF Check Result — manu2print",
      description: "Would your PDF pass? Most don't.",
      images: [ogImage],
    },
  };
}

export default async function VerifyPage({ params, searchParams }: VerifyPageProps) {
  const { id: verificationId } = await params;
  const { sh: shToken } = await searchParams;

  // Re-uses the cached fetch from generateMetadata — no double DB hit
  const { data, stored } = await fetchVerifyData(verificationId);
  const error = !data;

  if (error) {
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
      statusLevel={statusLevel}
      issuesCount={issuesCount}
      verifyUrl={verifyUrl}
      shToken={shToken ?? null}
      ogIsPass={isPass}
      portraitOgPath={portraitOgVerifyPath(
        verificationId,
        score,
        isPass,
        trimOk,
        marginsOk,
        bleedOk,
        fontsOk
      )}
    />
  );
}
