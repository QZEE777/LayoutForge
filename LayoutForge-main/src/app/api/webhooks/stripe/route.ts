import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ message: 'Payment gateway not configured yet.' }, { status: 503 });
}
