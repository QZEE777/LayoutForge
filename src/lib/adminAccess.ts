import { timingSafeEqualStrings } from "@/lib/security";

type ScopedRule = { permissions?: string[] };
type ScopedRules = Record<string, ScopedRule>;

function parseScopedRules(): ScopedRules {
  const raw = process.env.ADMIN_SCOPED_ADMINS_JSON?.trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as ScopedRules;
    return {};
  } catch {
    return {};
  }
}

export function requireAdminPermission(request: Request, permission: string) {
  const supplied = (request.headers.get("x-admin-password") ?? "").trim();
  const expected = process.env.ADMIN_PASSWORD_MANU2?.trim();
  if (!expected || !timingSafeEqualStrings(supplied, expected)) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  const rules = parseScopedRules();
  const adminId = (request.headers.get("x-admin-id") ?? "").trim();

  // Dormant-by-default: if no scoped rules are configured, primary password grants full access.
  if (Object.keys(rules).length === 0) {
    return { ok: true as const, adminId: adminId || "primary" };
  }

  // Primary admin flow (no explicit x-admin-id) retains full rights.
  if (!adminId) {
    return { ok: true as const, adminId: "primary" };
  }

  const rule = rules[adminId];
  if (!rule) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  const perms = rule.permissions ?? [];
  if (perms.includes("*") || perms.includes(permission)) {
    return { ok: true as const, adminId };
  }

  return { ok: false as const, status: 403, error: "Forbidden" };
}
