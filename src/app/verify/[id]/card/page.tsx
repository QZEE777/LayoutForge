import { supabase } from "@/lib/supabase";
import { getStored } from "@/lib/storage";
import { computeCheckerScore } from "@/lib/scoreUtils";
import { redirect } from "next/navigation";
import { SocialCard } from "./client";

export default async function CardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sh?: string }>;
}) {
  const { id: verificationId } = await params;
  const { sh: shToken } = await searchParams;

  // Fetch DB summary + S3 source-of-truth report in parallel (same as verify page)
  const [{ data, error }, stored] = await Promise.all([
    supabase
      .from("verification_results")
      .select("verification_id, readiness_score, kdp_ready")
      .eq("verification_id", verificationId)
      .maybeSingle(),
    getStored(verificationId).catch(() => null),
  ]);

  if (error || !data) redirect(`/verify/${verificationId}`);

  // Use the SAME scoring algorithm as the download page so the card
  // always reflects what the user actually saw in their report.
  const report = stored?.processingReport;
  const computedScore =
    report?.outputType === "checker" && report.issuesEnriched
      ? computeCheckerScore(report.issuesEnriched)
      : null;

  const score  = computedScore ?? report?.readinessScore100 ?? data.readiness_score ?? 0;
  const isPass = report?.kdpReady === true || data.kdp_ready === true || score >= 90;

  const verifyUrl = shToken
    ? `https://www.manu2print.com/verify/${verificationId}?sh=${shToken}`
    : `https://www.manu2print.com/verify/${verificationId}`;

  return (
    <SocialCard
      verifyUrl={verifyUrl}
      verificationId={verificationId}
      shToken={shToken ?? null}
      isPass={isPass}
    />
  );
}
