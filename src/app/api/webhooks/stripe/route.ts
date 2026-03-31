import { NextResponse } from 'next/server';
export async function POST() {
  // Stripe not in use — acknowledge immediately so Stripe stops retrying
  return NextResponse.json({ received: true });
}
