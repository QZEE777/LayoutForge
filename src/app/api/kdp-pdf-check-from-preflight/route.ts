/**
 * POST { jobId, fileKey, fileSizeMB? }.
 * Enqueue async checker job and return checkId immediately.
 */
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
import { supabase } from "@/lib/supabase";
import { waitForR2ObjectKey } from "@/lib/r2Storage";
import { isValidIntendedTrimId } from "@/lib/kdpIntendedTrim";

/** After client PUT, R2 can lag; wait before enqueue so workers do not read a missing object. */
const R2_VISIBLE_ATTEMPTS = 55;
const R2_VISIBLE_DELAY_MS = 800;

export async function POST(request: NextRequest) {
  try {
    console.log("[kdp-pdf-check-from-preflight] start");
    let body: { jobId?: string; fileKey?: string; fileSizeMB?: number; intendedTrimId?: string | null };
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

    const rawIntended = body.intendedTrimId;
    let intended_trim_id: string | null = null;
    if (rawIntended != null && String(rawIntended).trim() !== "") {
      const tid = String(rawIntended).trim();
      if (!isValidIntendedTrimId(tid)) {
        return NextResponse.json(
          { error: "Invalid intendedTrimId", message: "intendedTrimId must be a known KDP trim id or omitted." },
          { status: 400 }
        );
      }
      intended_trim_id = tid;
    }

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
    const visible = await waitForR2ObjectKey(fileKey, {
      attempts: R2_VISIBLE_ATTEMPTS,
      delayMs: R2_VISIBLE_DELAY_MS,
    });
    if (!visible) {
      return NextResponse.json(
        {
          error: "Upload not ready",
          message:
            "File is not visible in storage yet. Wait a few seconds and tap Check My PDF again (no need to re-select the file).",
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
        intended_trim_id,
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
