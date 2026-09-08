import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSignedUrlForKey } from "@/lib/r2Storage";
import { requireCheckerAccess, checkerDenied } from "@/lib/checkerAccess";
import { isCheckerId, CHECKER_PRIVATE_HEADERS } from "@/lib/checkerCapability";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!isCheckerId(id)) return checkerDenied();
  const { data: row, error } = await supabase.from("print_ready_checks").select("our_job_id,result_download_id")
    .or(`id.eq.${id},result_download_id.eq.${id}`).maybeSingle();
  if (error || !row?.result_download_id || !isCheckerId(row.our_job_id)) return checkerDenied();
  const denied = await requireCheckerAccess(req, row.result_download_id, { paid: true });
  if (denied) return denied;
  const url = await getSignedUrlForKey(`uploads/${row.our_job_id}.pdf`, 300);
  return NextResponse.json({ url }, { headers: CHECKER_PRIVATE_HEADERS });
}
