import { NextResponse } from "next/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabaseClient";
import { getStored } from "@/lib/storage";

export async function GET() {
  const supabaseAuth = createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get recent payments for this user (last 10)
  const { data: payments } = await supabase
    .from("payments")
    .select("download_id, created_at, amount")
    .eq("email", user.email.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(10);

  // Get scan credits
  const { data: creditsRows } = await supabase
    .from("scan_credits")
    .select("credits, used")
    .eq("email", user.email.toLowerCase());

  const totalCredits = (creditsRows ?? []).reduce((s, r) => s + (r.credits ?? 0), 0);
  const usedCredits  = (creditsRows ?? []).reduce((s, r) => s + (r.used  ?? 0), 0);
  const remaining    = Math.max(0, totalCredits - usedCredits);

  if (!payments || payments.length === 0) {
    return NextResponse.json({
      recentScans: [],
      credits: { total: totalCredits, used: usedCredits, remaining },
    });
  }

  // Load metadata for each download_id (parallel, graceful failures)
  const scans = (
    await Promise.all(
      payments.map(async (p) => {
        if (!p.download_id) return null;
        try {
          const meta = await getStored(p.download_id);
          if (!meta) return null;
          const report = meta.processingReport;
          return {
            id:          p.download_id,
            fileName:    meta.originalName ?? "manuscript.pdf",
            scanDate:    report?.scanDate ?? new Date(meta.createdAt).toISOString(),
            grade:       report?.scoreGrade?.grade ?? null,
            gradeLabel:  report?.scoreGrade?.label ?? null,
            score:       report?.readinessScore100 ?? null,
            issueCount:  report?.issues?.length ?? 0,
            kdpReady:    report?.kdpReady ?? false,
            riskLevel:   report?.riskLevel ?? null,
            creationTool: report?.creationTool ?? null,
          };
        } catch {
          return null;
        }
      })
    )
  ).filter(Boolean);

  return NextResponse.json({
    recentScans: scans,
    credits: { total: totalCredits, used: usedCredits, remaining },
  });
}
