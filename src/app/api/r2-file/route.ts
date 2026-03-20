import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";

export const maxDuration = 60;

export const dynamic = "force-dynamic";

function isAllowedR2Key(key: string) {
  // Checker uploads use: uploads/<uuid>.pdf (from /api/create-upload-url)
  return /^uploads\/[0-9a-fA-F-]+\.pdf$/.test(key);
}

/**
 * GET /api/r2-file?key=uploads/<uuid>.pdf
 * Returns a presigned GET URL for the uploaded PDF.
 */
export async function GET(request: NextRequest) {
  try {
    // Prevent indefinite hangs when upstream/r2 is slow/unresponsive.
    const requestAbort = new AbortController();
    const requestTimeoutMs = 25_000;
    const requestTimeout = setTimeout(() => requestAbort.abort(), requestTimeoutMs);

    const key = request.nextUrl.searchParams.get("key") ?? "";
    if (!key || !isAllowedR2Key(key)) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
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
        { expiresIn: 3600 }
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

