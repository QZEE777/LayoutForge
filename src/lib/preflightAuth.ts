export function preflightHeaders(): Record<string, string> {
  const key = process.env.KDP_PREFLIGHT_API_KEY;
  if (!key || key.length < 32) throw new Error("Private preflight transport is not configured");
  return { "X-Preflight-Key": key };
}
