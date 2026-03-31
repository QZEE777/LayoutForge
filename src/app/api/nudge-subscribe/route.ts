import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { updateMeta } from "@/lib/storage";

export async function POST(req: NextRequest) {
  let email: string, downloadId: string;
  try {
    const body = await req.json();
    email      = typeof body?.email      === "string" ? body.email.trim().toLowerCase()      : "";
    downloadId = typeof body?.downloadId === "string" ? body.downloadId.trim() : "";
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!email || !email.includes("@") || !downloadId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Capture email as lead on the manuscript metadata
  updateMeta(downloadId, { leadEmail: email }).catch(() => { /* best effort */ });

  // Upsert — harmless if called multiple times for same email+scan
  await supabase.from("scan_nudges").upsert(
    { email, download_id: downloadId },
    { onConflict: "email,download_id", ignoreDuplicates: true }
  );

  return NextResponse.json({ ok: true });
}
