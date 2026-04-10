import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getStored } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export const maxDuration = 60;

export const dynamic = "force-dynamic";

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function isAllowedR2Key(key: string) {
  return /^uploads\/[0-9a-fA-F-]+\.pdf$/.test(key);
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

  // TODO(security): remove this compatibility path once all metadata uses id-based preview.
  const meta = await getStored(id);
  const source = meta?.processingReport?.pdfSourceUrl;
  const match = typeof source === "string" ? source.match(/[?&]key=([^&]+)/) : null;
  if (match?.[1]) {
    const key = decodeURIComponent(match[1]);
    if (isAllowedR2Key(key)) return key;
  }
  return null;
}

/**
 * GET /api/r2-file?id=<download-or-check-id>
 * Returns a short-lived presigned GET URL for the checker preview PDF.
 */
export async function GET(request: NextRequest) {
  try {
    // Prevent indefinite hangs when upstream/r2 is slow/unresponsive.
    const requestAbort = new AbortController();
    const requestTimeoutMs = 25_000;
    const requestTimeout = setTimeout(() => requestAbort.abort(), requestTimeoutMs);

    const id = request.nextUrl.searchParams.get("id")?.trim() ?? "";
    const keyLegacy = request.nextUrl.searchParams.get("key")?.trim() ?? "";
    let key = "";
    if (id) {
      if (!isUuid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
      const resolved = await resolvePreviewKeyById(id);
      if (!resolved) return NextResponse.json({ error: "Preview not found" }, { status: 404 });
      key = resolved;
    } else if (keyLegacy && isAllowedR2Key(keyLegacy)) {
      // Compatibility only; caller must migrate to id-based route.
      key = keyLegacy;
    } else {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

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

    try {
      const signedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
        { expiresIn: 300 }
      );

      return NextResponse.json({ url: signedUrl });
    } finally {
      clearTimeout(requestTimeout);
    }
  } catch (e) {
    console.error("[r2-file]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

