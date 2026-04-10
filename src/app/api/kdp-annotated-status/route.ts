import { NextRequest, NextResponse } from "next/server";
import { normalizeAnnotatedPdfStatus } from "@/lib/storage";

/** Same default as `printReadyCheckProcess` / `preflight-file` when env is unset. */
const DEFAULT_PREFLIGHT_BASE_URL = "https://kdp-preflight-engine-production.up.railway.app";
/** Large manuscripts: Railway annotate status can be slow; stay under `maxDuration`. */
const UPSTREAM_FETCH_MS = 55_000;

export const maxDuration = 60;

function normalizeEngineAnnotatedStatus(raw: unknown): ReturnType<typeof normalizeAnnotatedPdfStatus> {
  const s = String(raw ?? "").toLowerCase().trim();
  if (s === "ready" || s === "completed" || s === "done") return "ready";
  if (s === "processing" || s === "running" || s === "pending") return "processing";
  if (s === "queued") return "queued";
  if (s === "error" || s === "failed") return "error";
  return normalizeAnnotatedPdfStatus(s);
}

export async function GET(request: NextRequest) {
  const baseUrl = (process.env.KDP_PREFLIGHT_API_URL?.trim() || DEFAULT_PREFLIGHT_BASE_URL).replace(/\/$/, "");
  const job_id = request.nextUrl.searchParams.get("job_id");
  if (!job_id) {
    return NextResponse.json({ error: "Missing job_id", message: "Provide ?job_id=..." }, { status: 400 });
  }
  const upstream = `${baseUrl}/annotate/${encodeURIComponent(job_id)}/status`;
  try {
    const res = await fetch(upstream, {
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_FETCH_MS),
    });
    const text = await res.text();
    let parsed: { status?: string } | null = null;
    try {
      parsed = text ? (JSON.parse(text) as { status?: string }) : null;
    } catch {
      parsed = null;
    }

    // Annotation pipeline often returns 404/202 until the annotate job exists or finishes.
    if (res.status === 404 || res.status === 202) {
      return NextResponse.json({ status: "processing" });
    }

    // Transient overload / cold start — keep polling instead of surfacing red 503s.
    if (res.status >= 500 || res.status === 429) {
      console.warn("[kdp-annotated-status] upstream transient", { status: res.status, job_id });
      return NextResponse.json({ status: "processing" });
    }

    if (!res.ok) {
      if (parsed?.status) {
        return NextResponse.json({ status: normalizeEngineAnnotatedStatus(parsed.status) });
      }
      return NextResponse.json({ error: "Engine unreachable" }, { status: 503 });
    }

    if (!parsed?.status) {
      return NextResponse.json({ status: "processing" });
    }
    // Read-only endpoint by design: do not mutate metadata or trigger emails here.
    return NextResponse.json({ status: normalizeEngineAnnotatedStatus(parsed.status) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isTimeout =
      msg.includes("AbortError") ||
      msg.includes("aborted") ||
      msg.includes("timeout") ||
      msg.includes("The operation was aborted");
    if (isTimeout) {
      console.warn("[kdp-annotated-status] upstream slow or timed out; client will retry", { job_id });
      return NextResponse.json({ status: "processing" });
    }
    console.warn("[kdp-annotated-status] fetch failed", { job_id, msg });
    return NextResponse.json({ status: "processing" });
  }
}
