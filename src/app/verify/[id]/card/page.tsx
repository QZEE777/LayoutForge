import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { SocialCard } from "./client";

export default async function CardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { id: verificationId } = await params;
  const { ref } = await searchParams;

  const { data, error } = await supabase
    .from("verification_results")
    .select("verification_id, readiness_score, issues_count")
    .eq("verification_id", verificationId)
    .maybeSingle();

  if (error || !data) redirect(`/verify/${verificationId}`);

  const score = data.readiness_score ?? 0;

  const statusLevel =
    score >= 90 ? "ready" :
    score >= 70 ? "nearly" :
    score >= 50 ? "needs-work" :
    "reject";

  // Embed ref in the verify URL so clicks from the shared card are attributed
  const verifyUrl = ref
    ? `https://www.manu2print.com/verify/${verificationId}?ref=${ref}`
    : `https://www.manu2print.com/verify/${verificationId}`;

  return (
    <SocialCard
      score={score}
      statusLevel={statusLevel}
      issuesCount={typeof data.issues_count === "number" ? data.issues_count : null}
      verifyUrl={verifyUrl}
      verificationId={verificationId}
    />
  );
}
