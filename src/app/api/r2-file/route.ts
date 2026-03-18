import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

export const maxDuration = 60;

function isAllowedR2Key(key: string) {
  // Checker uploads use: uploads/<uuid>.pdf (from /api/create-upload-url)
  return /^uploads\/[0-9a-fA-F-]+\.pdf$/.test(key);
}

/**
 * GET /api/r2-file?key=uploads/<uuid>.pdf
 * Serves the raw uploaded PDF from R2 for same-origin preview.
 */
export async function GET(request: NextRequest) {
  try {
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

    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    const totalSize = head.ContentLength;
    if (totalSize == null || Number.isNaN(totalSize)) {
      return NextResponse.json({ error: "Failed to read file size" }, { status: 500 });
    }

    const rangeHeader = request.headers.get("range");
    const filename = key.split("/").pop() ?? "document.pdf";

    // Parse a single byte range like: Range: bytes=0-1023
    if (rangeHeader && rangeHeader.includes(",")) {
      return NextResponse.json({ error: "Multiple ranges not supported" }, { status: 416 });
    }

    if (rangeHeader) {
      const m = rangeHeader.match(/bytes=(\d*)-(\d*)/i);
      if (!m) {
        return NextResponse.json({ error: "Invalid Range header" }, { status: 416 });
      }

      const startStr = m[1];
      const endStr = m[2];

      let start: number;
      let end: number;

      if (startStr === "") {
        // suffix range: bytes=-N
        const suffixLen = Number.parseInt(endStr, 10);
        if (!Number.isFinite(suffixLen) || suffixLen <= 0) {
          return NextResponse.json({ error: "Invalid suffix range" }, { status: 416 });
        }
        start = Math.max(0, totalSize - suffixLen);
        end = totalSize - 1;
      } else {
        start = Number.parseInt(startStr, 10);
        end = endStr === "" ? totalSize - 1 : Number.parseInt(endStr, 10);
      }

      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= totalSize) {
        return NextResponse.json(
          { error: "Requested range not satisfiable" },
          { status: 416, headers: { "Content-Range": `bytes */${totalSize}` } }
        );
      }

      const chunkLen = end - start + 1;
      const rangeValue = `bytes=${start}-${end}`;

      const obj = await s3.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
          Range: rangeValue,
        })
      );

      if (!obj.Body) {
        return NextResponse.json({ error: "Empty upstream body" }, { status: 500 });
      }

      return new NextResponse(obj.Body as any, {
        status: 206,
        headers: {
          "Content-Type": "application/pdf",
          "Accept-Ranges": "bytes",
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Content-Length": chunkLen.toString(),
          "Content-Disposition": `inline; filename="${filename}"`,
          "Cache-Control": "no-store, must-revalidate",
        },
      });
    }

    // No Range header: return full file but advertise range support.
    const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!obj.Body) {
      return NextResponse.json({ error: "Empty upstream body" }, { status: 500 });
    }

    return new NextResponse(obj.Body as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Accept-Ranges": "bytes",
        "Content-Length": totalSize.toString(),
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (e) {
    console.error("[r2-file]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

