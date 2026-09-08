import { NextResponse } from "next/server";
/** Legacy bare-ID transport retired. Use the current checker upload and private report flow. */
export async function POST() {
  return NextResponse.json({ error: "This checker endpoint has been retired. Open your private report link or start a new scan." }, { status: 410, headers: { "Cache-Control": "private, no-store" } });
}
