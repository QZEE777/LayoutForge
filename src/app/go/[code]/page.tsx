import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { GoLandingClient } from "./client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code: rawCode } = await params;
  const code = (rawCode ?? "").toLowerCase().trim();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: aff } = await supabase
    .from("affiliates")
    .select("name")
    .eq("code", code)
    .eq("status", "active")
    .maybeSingle();

  const partnerName = aff?.name ?? null;
  const title = partnerName
    ? `KDP PDF Checker — Recommended by ${partnerName} | manu2print`
    : "KDP PDF Checker — Check Your Book Before Amazon Rejects It | manu2print";
  const description =
    "Upload your KDP interior PDF and get a page-by-page compliance report in 90 seconds. Checks margins, trim size, bleed, fonts, and 26 more rules. $9 one-time.";
  const OG_IMAGE = "https://www.manu2print.com/api/og";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}

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
