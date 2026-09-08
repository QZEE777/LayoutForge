import { NextResponse } from "next/server";
import { getStored, type StoredManuscript } from "./storage";
import { supabase } from "./supabase";
import { createClient } from "./supabaseServer";
import { CHECKER_PRIVATE_HEADERS, hasCheckerCookie, isCheckerId, verifyCheckerCapability } from "./checkerCapability";

export function checkerDenied(status = 403) {
  return NextResponse.json({ error: status === 402 ? "Purchase this report to unlock it." : "Open your private delivery link or sign in with your purchase email." }, { status, headers: CHECKER_PRIVATE_HEADERS });
}

export async function requireCheckerAccess(req: Request, id: string, options: { paid?: boolean; internal?: boolean; meta?: StoredManuscript | null } = {}): Promise<NextResponse | null> {
  if (!isCheckerId(id)) return checkerDenied();
  if (options.internal && verifyCheckerCapability(req.headers.get("authorization")?.replace(/^Bearer /, ""), id, "annotation")) return null;
  const meta = options.meta === undefined ? await getStored(id) : options.meta;
  if (!meta) return checkerDenied();
  const uploadId = /^uploads\/([0-9a-f-]+)\.pdf$/i.exec(meta.sourcePdfKey ?? "")?.[1];
  let owns = hasCheckerCookie(req, meta.id) || (!!uploadId && hasCheckerCookie(req, uploadId));
  if (!owns && meta.payment_confirmed) {
    // A verified auth session must match a completed purchase, not editable lead metadata.
    try {
      const auth = await createClient();
      const { data: { user }, error } = await auth.auth.getUser();
      if (!error && user?.email) {
        const { data, error: paymentError } = await supabase.from("payments").select("id")
          .eq("email", user.email.trim().toLowerCase()).eq("status", "complete")
          .or(`download_id.eq.${meta.id},and(gateway.eq.credits,gateway_order_id.eq.${meta.id})`).limit(1);
        owns = !paymentError && !!data?.length;
      }
    } catch { /* no authenticated owner */ }
  }
  if (!owns) return checkerDenied();
  if (options.paid && !meta.payment_confirmed) return checkerDenied(402);
  return null;
}
