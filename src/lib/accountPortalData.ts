import { createClient } from "@supabase/supabase-js";
import { computeScanCreditBalanceFromRows } from "@/lib/scanCredits";

export type AccountPortalCreditRow = {
  credits: number;
  source: string;
  order_id: string | null;
  created_at: string;
  expires_at: string | null;
};

export type AccountPortalPayment = {
  id: string;
  tool: string;
  payment_type: string;
  amount: number;
  status: string;
  created_at: string;
  gateway_order_id: string | null;
};

export type AccountPortalData = {
  email: string;
  payments: AccountPortalPayment[];
  subscriptions: Array<{
    id: string;
    plan: string;
    status: string;
    current_period_end: string | null;
    created_at: string;
  }>;
  betaAccess: Array<{ tool: string; created_at: string }>;
  credits: {
    remaining: number;
    total: number;
    used: number;
    ledger: AccountPortalCreditRow[];
  };
};

/** Loads payments, subscriptions, beta access, and credit ledger for the account portal (email must be normalized). */
export async function loadAccountPortalData(emailRaw: string): Promise<AccountPortalData> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const email = emailRaw.trim().toLowerCase();

  const { data: payments } = await supabase
    .from("payments")
    .select("id, tool, payment_type, amount, status, created_at, gateway_order_id")
    .eq("email", email)
    .eq("status", "complete")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id, plan, status, current_period_end, created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: betaAccess } = await supabase
    .from("beta_access")
    .select("tool, created_at")
    .eq("email", email)
    .limit(5);

  const now = new Date().toISOString();
  const { data: creditRows } = await supabase
    .from("scan_credits")
    .select("credits, source, order_id, created_at, expires_at")
    .eq("email", email)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false })
    .limit(50);

  const ledger = (creditRows ?? []) as AccountPortalCreditRow[];
  const { total, used, remaining } = computeScanCreditBalanceFromRows(ledger);

  return {
    email,
    payments: (payments ?? []) as AccountPortalPayment[],
    subscriptions: subscriptions ?? [],
    betaAccess: betaAccess ?? [],
    credits: { remaining, total, used, ledger },
  };
}
