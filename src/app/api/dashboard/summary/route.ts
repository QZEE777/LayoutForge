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

  // Build scan history from both:
  // 1) scan_nudges (legacy + paid pre-checkout capture)
  // 2) completed payments (includes credit_used flow via gateway_order_id)
  const email = user.email.toLowerCase();
  const [{ data: nudges }, { data: paymentRows }] = await Promise.all([
    supabase
      .from("scan_nudges")
      .select("download_id, created_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("payments")
      .select("gateway_order_id, created_at, status, tool")
      .eq("email", email)
      .eq("status", "complete")
      .eq("tool", "kdp_pdf_checker")
      .not("gateway_order_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const scanRefs = [
    ...(nudges ?? []).map((n) => ({ download_id: n.download_id, created_at: n.created_at })),
    ...(paymentRows ?? []).map((p) => ({ download_id: p.gateway_order_id as string | null, created_at: p.created_at })),
  ];

  // De-duplicate by download_id and keep newest first
  const deduped = new Map<string, { download_id: string; created_at: string }>();
  for (const row of scanRefs
    .filter((r): r is { download_id: string; created_at: string } => Boolean(r.download_id && r.created_at))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())) {
    if (!deduped.has(row.download_id)) deduped.set(row.download_id, row);
  }
  const rows = Array.from(deduped.values()).slice(0, 20);

  if (rows.length === 0) {
    return NextResponse.json({
      recentScans: [],
      credits: { total: totalCredits, used: usedCredits, remaining },
    });
  }

  // Load metadata for each download_id (parallel, graceful failures)
  const scans = (
    await Promise.all(
      rows.map(async (n) => {
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
