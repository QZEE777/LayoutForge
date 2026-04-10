import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/print-ready-check-status?checkId=xxx
 * Returns { status: 'pending' | 'processing' | 'done' | 'failed', downloadId?, error? }.
 */
export async function GET(request: NextRequest) {
  try {
    const checkId = request.nextUrl.searchParams.get("checkId");
    if (!checkId) {
      return NextResponse.json(
        { error: "Missing checkId", message: "Provide ?checkId=..." },
        { status: 400 }
      );
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(checkId)) {
      return NextResponse.json(
        { error: "Invalid checkId", message: "checkId must be a valid UUID." },
        { status: 400 }
      );
    }
    console.log("[print-ready-check-status] lookup:", { checkId });

    const { data: row, error } = await supabase
      .from("print_ready_checks")
      .select("status, result_download_id, error_message")
      .eq("id", checkId)
      .single();

    if (error || !row) {
      console.log("[print-ready-check-status] not found:", { checkId, error: error?.message });
      return NextResponse.json(
        { error: "Not found", message: "Check job not found or invalid checkId." },
        { status: 404 }
      );
    }
    console.log("[print-ready-check-status] row:", row);

    const payload: {
      success: true;
      status: string;
      downloadId?: string;
      error?: string;
    } = {
      success: true,
      status: row.status ?? "pending",
    };
    if (row.status === "done" && row.result_download_id) {
      payload.downloadId = row.result_download_id;
    }
    if (row.status === "failed" && row.error_message) {
      payload.error = row.error_message;
    }

    return NextResponse.json(payload);
  } catch (e) {
    console.error("[print-ready-check-status]", e instanceof Error ? e.stack : e);
    return NextResponse.json(
      { error: "Internal error", message: e instanceof Error ? e.message : "Status check failed." },
      { status: 500 }
    );
  }
}
