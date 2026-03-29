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
    .select("name, code, status")
    .eq("code", code)
    .eq("status", "active")
    .maybeSingle();

  // Unknown or inactive partner — send to main site
  if (!affiliate) redirect("https://www.manu2print.com/kdp-pdf-checker");

  // Always send users through the scan flow (upload PDF first, pay after).
  // LS native affiliate tracking fires via ?aff= appended to the checkout URL
  // in create-checkout-session when the m2p_ref cookie is read.
  const checkoutUrl = `https://www.manu2print.com/kdp-pdf-checker?ref=${code}`;

  return (
    <GoLandingClient
      checkoutUrl={checkoutUrl}
      refCode={code}
      partnerName={affiliate.name ?? ""}
    />
  );
}
