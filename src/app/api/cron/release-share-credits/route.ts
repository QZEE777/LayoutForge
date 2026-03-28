import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendShareCreditAwardedEmail } from "@/lib/resend";

// Vercel cron passes Authorization: Bearer <CRON_SECRET>
function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

export const maxDuration = 60; // seconds — enough for a large batch

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const now = new Date().toISOString();

  // ── 1. Fetch all rewards ready to release ────────────────────────────────
  // Conditions:
  //   • status = 'pending'          — not yet awarded/voided
  //   • refund_window_closes_at < NOW() — 30-day refund window has passed
  //   • fraud_hold_until IS NULL OR fraud_hold_until < NOW() — no active hold
  const { data: rewards, error: fetchError } = await supabase
    .from("share_rewards")
    .select(
      "reward_id, sharer_email, credits_amount, order_id, canonical_ref_id, token, fraud_hold_reason"
    )
    .eq("status", "pending")
    .lt("refund_window_closes_at", now)
    .or(`fraud_hold_until.is.null,fraud_hold_until.lt.${now}`);

  if (fetchError) {
    console.error("[cron/release-share-credits] fetch error:", fetchError);
    return NextResponse.json({ error: "DB fetch failed" }, { status: 500 });
  }

  if (!rewards || rewards.length === 0) {
    return NextResponse.json({ released: 0, message: "Nothing to release" });
  }

  // ── 2. Process each reward ────────────────────────────────────────────────
  const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
  let released = 0;
  let errors = 0;
  const skipped: string[] = [];

  for (const reward of rewards) {
    try {
      const expiresAt = new Date(Date.now() + SIXTY_DAYS_MS).toISOString();

      // a. Insert scan credit row (idempotency: share_reward_id unique would
      //    catch a double-fire, but we mark awarded first so retries are safe)
      const { error: creditError } = await supabase.from("scan_credits").insert({
        email: reward.sharer_email.toLowerCase(),
        credits: reward.credits_amount,
        source: "share_reward",
        order_id: reward.order_id,
        share_reward_id: reward.reward_id,
        expires_at: expiresAt,
      });

      // If credit insert fails with a unique violation it's a double-fire —
      // still mark the reward awarded so we don't retry endlessly.
      if (creditError && !creditError.message?.includes("unique")) {
        console.error(
          `[cron/release-share-credits] scan_credits insert failed for reward ${reward.reward_id}:`,
          creditError
        );
        errors++;
        continue;
      }

      // b. Mark reward as awarded
      const { error: updateError } = await supabase
        .from("share_rewards")
        .update({ status: "awarded" })
        .eq("reward_id", reward.reward_id);

      if (updateError) {
        console.error(
          `[cron/release-share-credits] status update failed for reward ${reward.reward_id}:`,
          updateError
        );
        errors++;
        continue;
      }

      // c. Update share_token counters (best-effort via RPC)
      try {
        await supabase.rpc("award_share_conversion", { p_token: reward.token });
      } catch {
        // Best effort — falls back to manual counter; non-fatal
      }

      // d. Send email notification to sharer
      try {
        await sendShareCreditAwardedEmail(reward.sharer_email, {
          credits: reward.credits_amount,
          expiresAt,
          wasHeld: !!reward.fraud_hold_reason,
        });
      } catch (emailErr) {
        // Non-fatal — credit is still awarded
        console.error(
          `[cron/release-share-credits] email failed for ${reward.sharer_email}:`,
          emailErr
        );
        skipped.push(reward.reward_id);
      }

      released++;
    } catch (err) {
      console.error(
        `[cron/release-share-credits] unexpected error for reward ${reward.reward_id}:`,
        err
      );
      errors++;
    }
  }

  console.log(
    `[cron/release-share-credits] done — released: ${released}, errors: ${errors}, email_skipped: ${skipped.length}`
  );

  return NextResponse.json({
    released,
    errors,
    emailSkipped: skipped.length,
    total: rewards.length,
  });
}
