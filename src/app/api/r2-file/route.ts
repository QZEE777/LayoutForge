import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { stripR2IncompatiblePresignedQueryParams } from "@/lib/r2Storage";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export const maxDuration = 60;

export const dynamic = "force-dynamic";

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

async function resolvePreviewKeyById(id: string): Promise<string | null> {
  const { data: row } = await supabase
    .from("print_ready_checks")
    .select("our_job_id")
    .or(`id.eq.${id},result_download_id.eq.${id}`)
    .maybeSingle();
  const jobId = row?.our_job_id;
  if (typeof jobId === "string" && isUuid(jobId)) {
    return `uploads/${jobId}.pdf`;
  }

  return null;
}

/**
 * GET /api/r2-file?id=<download-or-check-id>
 * Returns a short-lived presigned GET URL for the checker preview PDF.
 */
export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id")?.trim() ?? "";
    if (!id || !isUuid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const key = await resolvePreviewKeyById(id);
    if (!key) return NextResponse.json({ error: "Preview not found" }, { status: 404 });

    const endpoint =
      process.env.R2_ENDPOINT ||
      (process.env.R2_ACCOUNT_ID
        ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : "");
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET_NAME;

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      return NextResponse.json(
        {
          error: "Storage not configured",
          message:
            "Missing R2_ENDPOINT (or R2_ACCOUNT_ID), R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, or R2_BUCKET_NAME.",
        },
        { status: 503 }
      );
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });

    const raw = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
      { expiresIn: 300 }
    );

    return NextResponse.json({ url: stripR2IncompatiblePresignedQueryParams(raw) });
  } catch (e) {
    console.error("[r2-file]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

