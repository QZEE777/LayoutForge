/**
 * After browser PUT to R2, confirms the object is readable (GET byte range) before enqueue.
 * Reduces worker "file not found" races without relying on HEAD-only checks.
 */
import { NextRequest, NextResponse } from "next/server";
import { waitForR2ObjectKey } from "@/lib/r2Storage";

export const maxDuration = 90;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { jobId?: string; fileKey?: string } | null;
    const jobId = typeof body?.jobId === "string" ? body.jobId.trim() : "";
    const rawKey = typeof body?.fileKey === "string" ? body.fileKey.trim() : "";
    if (!jobId || !rawKey || !UUID_RE.test(jobId)) {
      return NextResponse.json({ error: "Invalid body", message: "Send jobId (UUID) and fileKey." }, { status: 400 });
    }
    if (!/^uploads\/[0-9a-fA-F-]+\.pdf$/.test(rawKey)) {
      return NextResponse.json({ error: "Invalid fileKey" }, { status: 400 });
    }
    const expected = `uploads/${jobId}.pdf`;
    if (rawKey !== expected) {
      return NextResponse.json({ error: "fileKey mismatch", message: "fileKey must be uploads/{jobId}.pdf for this jobId." }, { status: 400 });
    }

    const ready = await waitForR2ObjectKey(rawKey, { attempts: 60, delayMs: 750 });
    if (!ready) {
      return NextResponse.json(
        {
          error: "Upload not ready",
          message: "File is not readable in storage yet. Tap Check My PDF again in a few seconds.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ success: true, ready: true });
  } catch (e) {
    console.error("[confirm-checker-r2-upload]", e);
    return NextResponse.json(
      { error: "Storage check failed", message: "Could not confirm the upload. Try again." },
      { status: 503 },
    );
  }
}
