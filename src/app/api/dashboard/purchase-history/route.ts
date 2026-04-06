import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { loadAccountPortalData } from "@/lib/accountPortalData";

/**
 * Signed-in dashboard: orders + credits for the authenticated user's email.
 * Avoids redirecting to /account (email OTP) when already logged in.
 */
export async function GET() {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  const email = user?.email?.trim().toLowerCase() ?? "";
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await loadAccountPortalData(email);
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    console.error("[dashboard/purchase-history]", e);
    return NextResponse.json({ error: "Failed to load purchase history." }, { status: 500 });
  }
}
