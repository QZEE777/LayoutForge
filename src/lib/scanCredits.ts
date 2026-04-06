import type { SupabaseClient } from "@supabase/supabase-js";

export type ScanCreditBalance = {
  total: number;
  used: number;
  remaining: number;
};

/** Ledger semantics: positive rows = grants, negative rows = usage. */
export function computeScanCreditBalanceFromRows(
  rows: { credits: number | null }[]
): ScanCreditBalance {
  const total = rows.reduce(
    (sum, row) => sum + ((row.credits ?? 0) > 0 ? (row.credits ?? 0) : 0),
    0
  );
  const used = rows.reduce(
    (sum, row) => sum + ((row.credits ?? 0) < 0 ? -(row.credits ?? 0) : 0),
    0
  );
  const remaining = Math.max(0, total - used);
  return { total, used, remaining };
}

/**
 * Balance for an email, respecting expires_at (same rules as /api/credits/balance).
 */
export async function loadScanCreditBalanceForEmail(
  supabase: SupabaseClient,
  email: string
): Promise<ScanCreditBalance> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return { total: 0, used: 0, remaining: 0 };
  }
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("scan_credits")
    .select("credits")
    .eq("email", normalized)
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (error || !data) return { total: 0, used: 0, remaining: 0 };
  return computeScanCreditBalanceFromRows(data);
}
