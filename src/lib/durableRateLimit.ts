import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type DurableLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAtIso: string | null;
};

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function checkDurableRouteLimit(opts: {
  req: NextRequest;
  routeKey: string;
  maxRequests: number;
  windowSeconds: number;
}): Promise<DurableLimitResult> {
  const ip = getClientIp(opts.req);
  const bucket = `${opts.routeKey}:${ip}`;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    // Fail open to avoid blocking production traffic on config drift.
    return { allowed: true, remaining: opts.maxRequests, resetAtIso: null };
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data, error } = await supabase.rpc("check_durable_rate_limit", {
    p_bucket: bucket,
    p_max: opts.maxRequests,
    p_window_seconds: opts.windowSeconds,
  });
  if (error) {
    console.error("[durableRateLimit] rpc failed:", error);
    return { allowed: true, remaining: opts.maxRequests, resetAtIso: null };
  }
  const row = Array.isArray(data) ? data[0] : null;
  return {
    allowed: row?.allowed !== false,
    remaining: typeof row?.remaining === "number" ? row.remaining : opts.maxRequests,
    resetAtIso: typeof row?.reset_at === "string" ? row.reset_at : null,
  };
}

export async function enforceDurableRouteLimit(opts: {
  req: NextRequest;
  routeKey: string;
  maxRequests: number;
  windowSeconds: number;
}): Promise<NextResponse | null> {
  const result = await checkDurableRouteLimit(opts);
  if (result.allowed) return null;
  const body = {
    error: "Too many requests",
    message: "Please wait a moment and try again.",
  };
  const response = NextResponse.json(body, { status: 429 });
  if (result.resetAtIso) {
    const retrySeconds = Math.max(1, Math.ceil((new Date(result.resetAtIso).getTime() - Date.now()) / 1000));
    response.headers.set("Retry-After", String(retrySeconds));
  }
  response.headers.set("X-RateLimit-Remaining", String(Math.max(result.remaining, 0)));
  return response;
}

