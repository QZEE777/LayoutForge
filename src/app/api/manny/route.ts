import { NextResponse } from "next/server";

/**
 * Manny/Crisp trial integration is intentionally disabled to avoid unwanted AI spend.
 * Keep this endpoint as a harmless no-op so stale webhook calls do not trigger retries.
 */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ ok: true, disabled: true });
}
