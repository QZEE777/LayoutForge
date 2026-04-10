import { NextRequest, NextResponse } from "next/server";
import { getStored, updateMeta } from "@/lib/storage";
import { sendAnnotatedEmailIfReady } from "@/lib/annotatedEmail";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { id?: string; email?: string } | null;
    const id = body?.id?.trim();
    const email = body?.email?.trim().toLowerCase();
    if (!id || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const meta = await getStored(id);
    if (!meta) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await updateMeta(id, {
      leadEmail: meta.leadEmail || email,
      annotatedEmail: email,
      annotatedEmailRequestedAt: Date.now(),
    });
    const sentNow = await sendAnnotatedEmailIfReady(id);
    return NextResponse.json({ success: true, sentNow });
  } catch (e) {
    console.error("[checker-annotated-email]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

