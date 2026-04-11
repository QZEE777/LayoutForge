import { NextRequest, NextResponse } from "next/server";
import { getStored, normalizeAnnotatedPdfStatus, updateAnnotatedState } from "@/lib/storage";
import { sendAnnotatedEmailIfReady } from "@/lib/annotatedEmail";
import { createClient } from "@/lib/supabaseServer";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser/internal clients
  return origin === req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }
    const body = (await req.json().catch(() => null)) as { id?: string; email?: string } | null;
    const id = body?.id?.trim();
    const bodyEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    const sessionEmail = user?.email?.trim().toLowerCase() ?? "";

    let email = bodyEmail;
    if (sessionEmail) {
      if (email && email !== sessionEmail) {
        return NextResponse.json(
          { error: "Email mismatch", message: "Use the email on your signed-in account, or sign out to use a different address." },
          { status: 403 },
        );
      }
      email = sessionEmail;
    }

    if (!id || !email) {
      return NextResponse.json(
        { error: "Missing fields", message: sessionEmail ? "Missing report id." : "Send your email address, or sign in to use your account email." },
        { status: 400 },
      );
    }
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const meta = await getStored(id);
    if (!meta) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const normalized = normalizeAnnotatedPdfStatus(meta.annotatedPdfStatus, meta.annotatedEmailSentAt);
    if (normalized === "delivered") {
      return NextResponse.json({ success: true, sentNow: true, status: "delivered" });
    }
    if (meta.annotatedEmail && meta.annotatedEmail !== email) {
      return NextResponse.json({ error: "Annotated email already set for this report." }, { status: 409 });
    }

    await updateAnnotatedState(id, {
      status: normalized === "ready" ? "ready" : "queued",
      annotatedEmail: meta.annotatedEmail ?? email,
      markRequested: true,
    });
    const sentNow = await sendAnnotatedEmailIfReady(id);
    if (sentNow) {
      await updateAnnotatedState(id, { status: "delivered", markSent: true });
      return NextResponse.json({ success: true, sentNow: true, status: "delivered" });
    }
    return NextResponse.json({ success: true, sentNow: false, status: normalized === "ready" ? "ready" : "queued" });
  } catch (e) {
    console.error("[checker-annotated-email]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

