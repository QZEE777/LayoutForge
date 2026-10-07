import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { Resend } from "resend";
import { alertCronFailure } from "@/lib/cronAdminAlert";

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = `Bearer ${secret}`;
  try {
    return auth.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
  } catch {
    return false;
  }
}

// Runs every 10 minutes. Each window is 10 minutes wide so every scan is reported once.
const WINDOW_MS = 10 * 60 * 1000;
const STUCK_AFTER_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    await alertCronFailure("scan-health", "Supabase env missing");
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  const supabase = createClient(url, key);
  const now = Date.now();
  const stuckMax = new Date(now - STUCK_AFTER_MS).toISOString();
  const stuckMin = new Date(now - STUCK_AFTER_MS - WINDOW_MS).toISOString();
  const failedMin = new Date(now - WINDOW_MS).toISOString();

  const [stuckRes, failedRes] = await Promise.all([
    supabase
      .from("print_ready_checks")
      .select("id, status, file_size_mb, created_at, retry_count, last_error")
      .not("status", "in", "(done,failed)")
      .lte("created_at", stuckMax)
      .gt("created_at", stuckMin),
    supabase
      .from("print_ready_checks")
      .select("id, file_size_mb, created_at, error_message")
      .eq("status", "failed")
      .gt("updated_at", failedMin),
  ]);

  if (stuckRes.error || failedRes.error) {
    const msg = stuckRes.error?.message ?? failedRes.error?.message ?? "unknown";
    await alertCronFailure("scan-health", msg);
    return NextResponse.json({ error: "DB fetch failed" }, { status: 500 });
  }

  const stuck = stuckRes.data ?? [];
  const failed = failedRes.data ?? [];
  if (stuck.length === 0 && failed.length === 0) {
    return NextResponse.json({ ok: true, stuck: 0, failed: 0 });
  }

  const lines: string[] = [];
  if (stuck.length > 0) {
    lines.push(`STUCK for 10+ minutes (${stuck.length}) — the Railway worker may be down:`);
    for (const r of stuck) {
      lines.push(`- ${r.id} | status ${r.status} | ${r.file_size_mb ?? "?"} MB | created ${r.created_at} | retries ${r.retry_count ?? 0}${r.last_error ? ` | ${r.last_error}` : ""}`);
    }
    lines.push("");
  }
  if (failed.length > 0) {
    lines.push(`FAILED (${failed.length}):`);
    for (const r of failed) {
      lines.push(`- ${r.id} | ${r.file_size_mb ?? "?"} MB | created ${r.created_at} | ${r.error_message ?? "no error message"}`);
    }
    lines.push("");
  }
  lines.push("Check Railway (clever-magic) logs and the admin dashboard.");
  lines.push("");
  lines.push("— manu2print scan monitor");

  try {
    const resend = new Resend(process.env.RESEND_API_KEY ?? "");
    await resend.emails.send({
      from: "noreply@manu2print.com",
      to: "hello@manu2print.com",
      subject: `[manu2print] Scan alert: ${stuck.length} stuck, ${failed.length} failed`,
      text: lines.join("\n"),
    });
  } catch (e) {
    console.error("[cron/scan-health] email:", e);
  }

  return NextResponse.json({ ok: true, stuck: stuck.length, failed: failed.length });
}
