/**
 * POST { jobId, fileKey, fileSizeMB? }.
 * Enqueue async checker job and return checkId immediately.
 */
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
import { supabase } from "@/lib/supabase";
import { r2ObjectExists } from "@/lib/r2Storage";

/** After client PUT, R2 can lag briefly; wait before enqueue so workers do not read a missing object. */
const R2_VISIBLE_ATTEMPTS = 25;
const R2_VISIBLE_DELAY_MS = 1200;

async function waitUntilR2ObjectVisible(fileKey: string): Promise<boolean> {
  try {
    for (let attempt = 1; attempt <= R2_VISIBLE_ATTEMPTS; attempt++) {
      if (await r2ObjectExists(fileKey)) return true;
      await new Promise((r) => setTimeout(r, R2_VISIBLE_DELAY_MS));
    }
    return false;
  } catch (e) {
    console.warn("[kdp-pdf-check-from-preflight] R2 head unavailable; enqueue without wait", e);
    return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[kdp-pdf-check-from-preflight] start");
    let body: { jobId?: string; fileKey?: string; fileSizeMB?: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid body", message: "Send JSON with jobId and fileKey." },
        { status: 400 }
      );
    }
    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    if (!jobId) {
      return NextResponse.json(
        { error: "Missing jobId", message: "Send JSON with jobId." },
        { status: 400 }
      );
    }
    console.log("[kdp-pdf-check-from-preflight] parsed body:", body);
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(jobId)) {
      return NextResponse.json(
        { error: "Invalid jobId", message: "jobId must be a valid UUID." },
        { status: 400 }
      );
    }
    const fileSizeMB = typeof body.fileSizeMB === "number" ? body.fileSizeMB : undefined;

    if (typeof body.fileKey !== "string" || !/^uploads\/[0-9a-fA-F-]+\.pdf$/.test(body.fileKey.trim())) {
      return NextResponse.json(
        { error: "Invalid fileKey", message: "fileKey must be a valid R2 PDF key." },
        { status: 400 }
      );
    }
    const fileKey = body.fileKey.trim();
    const expectedKey = `uploads/${jobId}.pdf`;
    if (fileKey !== expectedKey) {
      return NextResponse.json(
        {
          error: "fileKey mismatch",
          message:
            "fileKey must be uploads/{jobId}.pdf for the same jobId returned by create-upload-url (prevents wrong R2 object per job).",
        },
        { status: 400 }
      );
    }
    console.log("[kdp-pdf-check-from-preflight] enqueueing print_ready_checks:", { fileKey, jobId, fileSizeMB });
    const visible = await waitUntilR2ObjectVisible(fileKey);
    if (!visible) {
      return NextResponse.json(
        {
          error: "Upload not ready",
          message:
            "File is not visible in storage yet. Wait a few seconds and try again, or re-upload the PDF.",
        },
        { status: 409 }
      );
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Server not configured", message: "Supabase is not configured." },
        { status: 503 }
      );
    }
    const { data: row, error: insertError } = await supabase
      .from("print_ready_checks")
      .insert({
        file_key: fileKey,
        our_job_id: jobId,
        file_size_mb: fileSizeMB ?? null,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[kdp-pdf-check-from-preflight] insert print_ready_checks failed:", insertError.message, insertError.code);
      return NextResponse.json(
        { error: "Enqueue failed", message: "Could not start check. Try again." },
        { status: 500 }
      );
    }
    if (!row?.id) {
      console.error("[kdp-pdf-check-from-preflight] insert succeeded but no row id returned");
      return NextResponse.json(
        { error: "Enqueue failed", message: "Could not start check. Try again." },
        { status: 500 }
      );
    }
    console.log("[kdp-pdf-check-from-preflight] enqueue ok; checkId:", row.id);
    return NextResponse.json({ success: true, checkId: row.id });
  } catch (e) {
    console.error("[kdp-pdf-check-from-preflight]", e);
    return NextResponse.json(
      { error: "Internal error", message: e instanceof Error ? e.message : "Failed to save report." },
      { status: 500 }
    );
  }
}
