import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { GoLandingClient } from "./client";

export const dynamic = "force-dynamic";

export default async function GoPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const code = (rawCode ?? "").toLowerCase().trim();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("name, code, ls_affiliate_code, status")
    .eq("code", code)
    .eq("status", "active")
    .maybeSingle();

  // Unknown or inactive partner — send to main site
  if (!affiliate) redirect("https://www.manu2print.com/kdp-pdf-checker");

  const variantId = process.env.LEMONSQUEEZY_SINGLE_USE_VARIANT_ID ?? "1346943";

  // Primary CTA: direct LS checkout with affiliate attribution
  // Fallback: main checker with custom ref cookie
  const checkoutUrl = affiliate.ls_affiliate_code
    ? `https://manu2print.lemonsqueezy.com/checkout/buy/${variantId}?aff=${affiliate.ls_affiliate_code}`
    : `https://www.manu2print.com/kdp-pdf-checker?ref=${code}`;

  return (
    <GoLandingClient
      checkoutUrl={checkoutUrl}
      refCode={code}
      partnerName={affiliate.name ?? ""}
    />
  );
}
