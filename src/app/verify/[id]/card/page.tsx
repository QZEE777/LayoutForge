import { supabase } from "@/lib/supabase";
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

  const { data, error } = await supabase
    .from("verification_results")
    .select("verification_id, readiness_score, issues_count, trim_ok, margins_ok, bleed_ok, fonts_ok")
    .eq("verification_id", verificationId)
    .maybeSingle();

  if (error || !data) redirect(`/verify/${verificationId}`);

  const score = data.readiness_score ?? 0;

  const statusLevel =
    score >= 90 ? "ready" :
    score >= 70 ? "nearly" :
    score >= 50 ? "needs-work" :
    "reject";

  // Embed sh token so clicks from the shared card are attributed to the original sharer
  const verifyUrl = shToken
    ? `https://www.manu2print.com/verify/${verificationId}?sh=${shToken}`
    : `https://www.manu2print.com/verify/${verificationId}`;

  return (
    <SocialCard
      score={score}
      statusLevel={statusLevel}
      issuesCount={typeof data.issues_count === "number" ? data.issues_count : null}
      verifyUrl={verifyUrl}
      verificationId={verificationId}
      shToken={shToken ?? null}
      trimOk={data.trim_ok ?? null}
      marginsOk={data.margins_ok ?? null}
      bleedOk={data.bleed_ok ?? null}
      fontsOk={data.fonts_ok ?? null}
    />
  );
}
