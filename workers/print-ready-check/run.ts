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

const NO_JOB_BACKOFF_MS = 2_500;
const ERROR_BACKOFF_MS = 12_000;
const WORKER_CONCURRENCY = 3;

interface PrintReadyCheckRow {
  id: string;
  /** DB column; some clients may expose camelCase — see resolveCheckerPdfR2Key */
  file_key?: string | null;
  fileKey?: string | null;
  our_job_id: string;
  file_size_mb: number | null;
  intended_trim_id?: string | null;
}

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Checker uploads always land at uploads/{our_job_id}.pdf (see /api/create-upload-url).
 * Use that as the single source of truth so we never GET a stale/wrong key from a mismatched row.
 */
function resolveCheckerPdfR2Key(row: PrintReadyCheckRow): string {
  const jobId = String(row.our_job_id ?? "").trim();
  if (!UUID_RE.test(jobId)) {
    throw new Error(`Invalid our_job_id for checker R2 key: ${jobId}`);
  }
  const canonical = `uploads/${jobId}.pdf`;
  const fromDb =
    (typeof row.file_key === "string" && row.file_key.trim()) ||
    (typeof row.fileKey === "string" && row.fileKey.trim()) ||
    "";
  const norm = (s: string) => s.replace(/\\/g, "/").toLowerCase();
  if (fromDb && norm(fromDb) !== norm(canonical)) {
    console.warn("[worker] file_key does not match uploads/{our_job_id}.pdf; using canonical R2 key", {
      checkId: row.id,
      file_key: fromDb,
      canonical,
    });
  }
  return canonical;
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

async function processOne(supabase: ReturnType<typeof createClient>, workerId: number): Promise<boolean> {
  console.info("[worker] claim_attempt", { workerId });
  const { data, error } = await supabase.rpc("claim_print_ready_check");

  if (error) {
    console.error("[worker] claim_failed", { workerId, error: error.message });
    throw error;
  }

  // Supabase RPC RETURNS TABLE: single row comes back as object, not array. Normalize to array.
  const raw = data as PrintReadyCheckRow | PrintReadyCheckRow[] | null | undefined;
  const rows = Array.isArray(raw) ? raw : raw != null && typeof raw === "object" && "id" in raw ? [raw] : [];
  if (!rows.length) {
    console.info("[worker] claim_empty", { workerId });
    return false;
  }

  const row = rows[0];
  const checkId = row.id;
  const fileKey = resolveCheckerPdfR2Key(row);
  const ourJobId = row.our_job_id;
  const fileSizeMB = row.file_size_mb != null ? Number(row.file_size_mb) : undefined;
  const intendedTrimId =
    typeof row.intended_trim_id === "string" && row.intended_trim_id.trim() ? row.intended_trim_id.trim() : null;
  console.info("[worker] claim_success", { workerId, checkId, ourJobId });
  const startedAt = Date.now();
  console.info("[worker] processing_start", { workerId, checkId, ourJobId, fileKey, fileSizeMB, intendedTrimId });

  try {
    const baseUrl = getPreflightUrl();

    const { downloadId } = await runPrintReadyCheck({
      fileKey,
      ourJobId,
      fileSizeMB,
      intendedTrimId,
      baseUrl,
    });

    if (!downloadId) {
      throw new Error("runPrintReadyCheck returned an empty downloadId.");
    }

    await supabase
      .from("print_ready_checks")
      .update({
        status: "done",
        result_download_id: downloadId,
        error_message: null,
        last_error: null,
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", checkId);
    console.info("[worker] processing_success", { workerId, checkId, ourJobId, duration_ms: Date.now() - startedAt, downloadId });

  } catch (e) {
    const err = e;
    const msg = err instanceof Error ? err.message : String(err);

    console.error("[worker] check_failed", { workerId, checkId, error: err instanceof Error ? err.stack : err });

    // Transient R2 read failures: requeue so another attempt can succeed after propagation.
    const storageTransient =
      msg.includes("File not found in storage") ||
      msg.includes("getFileByKey") ||
      msg.includes("NoSuchKey") ||
      msg.includes("empty or invalid key") ||
      /R2 getFileByKey failed/i.test(msg);
    if (storageTransient) {
      await supabase
        .from("print_ready_checks")
        .update({
          status: "pending",
          error_message: null,
          last_error: msg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", checkId);
      console.warn("[worker] processing_requeued", { workerId, checkId, ourJobId, reason: "storage_not_ready" });
      return true;
    }

    await supabase
      .from("print_ready_checks")
      .update({
        status: "failed",
        error_message: msg,
        last_error: msg,
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", checkId);
    console.error("[worker] processing_failed", { workerId, checkId, ourJobId, duration_ms: Date.now() - startedAt, error: msg });
  }

  return true;
}

async function workerLoop(supabase: ReturnType<typeof createClient>, workerId: number) {
  while (true) {
    try {
      const had = await processOne(supabase, workerId);
      if (!had) {
        await new Promise((r) => setTimeout(r, NO_JOB_BACKOFF_MS));
      }
    } catch (e) {
      console.error("[worker] worker_error", { workerId, error: e instanceof Error ? e.stack : e });
      await new Promise((r) => setTimeout(r, ERROR_BACKOFF_MS));
    }
  }
}

async function main() {
  const supabase = getSupabase();
  getPreflightUrl();
  await Promise.all(
    Array.from({ length: WORKER_CONCURRENCY }, (_, i) => workerLoop(supabase, i))
  );
}

main();
