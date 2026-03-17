/**
 * Print Ready Check worker: polls Supabase for pending jobs, runs preflight and save, updates row.
 * Run from repo root: npx tsx workers/print-ready-check/run.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, KDP_PREFLIGHT_API_URL,
 *   R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, USE_R2 (optional).
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
// Relative import so worker runs with tsx from repo root without path mapping
import { runPrintReadyCheck } from "../../src/lib/printReadyCheckProcess";

const POLL_INTERVAL_MS = 12_000;

interface PrintReadyCheckRow {
  id: string;
  file_key: string;
  our_job_id: string;
  file_size_mb: number | null;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required.");
  return createClient(url, key);
}

function getPreflightUrl(): string {
  const url = process.env.KDP_PREFLIGHT_API_URL?.trim();
  if (!url) throw new Error("KDP_PREFLIGHT_API_URL required.");
  return url;
}

async function processOne(supabase: ReturnType<typeof createClient>): Promise<boolean> {
  const { data, error } = await supabase.rpc("claim_print_ready_check");

  if (error) {
    console.error("[worker] claim_print_ready_check RPC failed:", error.message);
    throw error;
  }

  // Supabase RPC RETURNS TABLE: single row comes back as object, not array. Normalize to array.
  const raw = data as PrintReadyCheckRow | PrintReadyCheckRow[] | null | undefined;
  const rows = Array.isArray(raw) ? raw : raw != null && typeof raw === "object" && "id" in raw ? [raw] : [];
  if (!rows.length) return false;

  const row = rows[0];
  const checkId = row.id;
  const fileKey = row.file_key;
  const ourJobId = row.our_job_id;
  const fileSizeMB = row.file_size_mb != null ? Number(row.file_size_mb) : undefined;

  try {
    const baseUrl = getPreflightUrl();

    const { downloadId } = await runPrintReadyCheck({
      fileKey,
      ourJobId,
      fileSizeMB,
      baseUrl,
    });

    await supabase
      .from("print_ready_checks")
      .update({
        status: "done",
        result_download_id: downloadId,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", checkId);

    console.log(`[worker] check ${checkId} done → downloadId ${downloadId}`);

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);

    console.error(`[worker] check ${checkId} failed:`, msg);

    await supabase
      .from("print_ready_checks")
      .update({
        status: "failed",
        error_message: msg,
        updated_at: new Date().toISOString(),
      })
      .eq("id", checkId);
  }

  return true;
}

async function main() {
  const supabase = getSupabase();
  getPreflightUrl();
  console.log("[worker] Print Ready Check worker started. Polling every", POLL_INTERVAL_MS / 1000, "s.");
  while (true) {
    try {
      const had = await processOne(supabase);
      if (!had) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
    } catch (e) {
      console.error("[worker] poll error:", e);
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }
}

main();
