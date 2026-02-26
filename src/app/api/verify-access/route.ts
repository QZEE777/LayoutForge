import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ message: 'Payment gateway not configured yet.' }, { status: 503 });
}
