import { NextResponse } from "next/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabaseServer";
import { getStored } from "@/lib/storage";
import { loadScanCreditBalanceForEmail } from "@/lib/scanCredits";

export async function GET() {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Scan credits — same ledger + expiry rules as /api/credits/balance (sidebar vs Earn stay in sync)
  const { total: totalCredits, used: usedCredits, remaining } =
    await loadScanCreditBalanceForEmail(supabase, user.email);

  // Get scan history from scan_nudges (email → download_id)
  const { data: nudges } = await supabase
    .from("scan_nudges")
    .select("download_id, created_at")
    .eq("email", user.email.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(20);

  if (!nudges || nudges.length === 0) {
    return NextResponse.json({
      recentScans: [],
      credits: { total: totalCredits, used: usedCredits, remaining },
    });
  }

  // Load metadata for each download_id (parallel, graceful failures)
  const scans = (
    await Promise.all(
      nudges.map(async (n) => {
        if (!n.download_id) return null;
        try {
          const meta = await getStored(n.download_id);
          if (!meta) return null;
          const report = meta.processingReport;
          return {
            id:           n.download_id,
            fileName:     meta.originalName ?? "manuscript.pdf",
            scanDate:     report?.scanDate ?? new Date(meta.createdAt).toISOString(),
            grade:        report?.scoreGrade?.grade ?? null,
            gradeLabel:   report?.scoreGrade?.label ?? null,
            score:        report?.readinessScore100 ?? null,
            issueCount:   report?.issues?.length ?? 0,
            kdpReady:     report?.kdpReady ?? false,
            riskLevel:    report?.riskLevel ?? null,
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
