import { createHmac, timingSafeEqual } from "crypto";

export const CHECKER_ACCESS_SECONDS = 7 * 24 * 60 * 60;
export const CHECKER_PRIVATE_HEADERS = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
export const isCheckerId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
type Purpose = "browser" | "email" | "annotation" | "checkout";

function secret(): string {
  const key = process.env.CHECKER_ACCESS_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key.length < 32) throw new Error("Checker access signing is not configured");
  return key;
}

function mac(id: string, purpose: Purpose, expires: number): string {
  return createHmac("sha256", secret()).update(`m2p-checker-v1|${purpose}|${id.toLowerCase()}|${expires}`).digest("hex");
}

export function signCheckerCapability(id: string, purpose: Purpose, seconds = CHECKER_ACCESS_SECONDS, now = Date.now()): string {
  if (!isCheckerId(id)) throw new Error("Invalid checker id");
  const expires = Math.floor(now / 1000) + seconds;
  return `${expires}.${mac(id, purpose, expires)}`;
}

export function verifyCheckerCapability(token: string | undefined, id: string, purpose: Purpose, now = Date.now()): boolean {
  if (!token || !isCheckerId(id)) return false;
  const match = /^(\d{10})\.([a-f0-9]{64})$/.exec(token);
  if (!match || Number(match[1]) <= Math.floor(now / 1000)) return false;
  try {
    return timingSafeEqual(Buffer.from(match[2], "hex"), Buffer.from(mac(id, purpose, Number(match[1])), "hex"));
  } catch { return false; }
}

export function checkerCookieName(id: string): string {
  return `${process.env.NODE_ENV === "production" ? "__Host-" : ""}m2p_checker_${id.toLowerCase()}`;
}

export function hasCheckerCookie(req: Request, id: string): boolean {
  const name = checkerCookieName(id);
  const token = (req.headers.get("cookie") ?? "").split(";").map(p => p.trim()).find(p => p.startsWith(`${name}=`))?.slice(name.length + 1);
  return verifyCheckerCapability(token, id, "browser");
}

export function checkerCookie(id: string): string {
  return `${checkerCookieName(id)}=${signCheckerCapability(id, "browser")}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${CHECKER_ACCESS_SECONDS}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

/** Only call after identifying a delivery recipient through a verified purchase or owner request. */
export function checkerDeliveryLink(id: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://www.manu2print.com";
  const url = new URL("/api/checker-access", base);
  url.searchParams.set("id", id);
  url.searchParams.set("token", signCheckerCapability(id, "email"));
  return url.toString();
}
