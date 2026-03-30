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
    .select("verification_id, readiness_score, kdp_ready")
    .eq("verification_id", verificationId)
    .maybeSingle();

  if (error || !data) redirect(`/verify/${verificationId}`);

  const score  = data.readiness_score ?? 0;
  const isPass = data.kdp_ready === true || score >= 90;

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
