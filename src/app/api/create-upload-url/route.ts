import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
};
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

function getR2Client() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }
  return {
    client: new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    }),
    bucket,
  };
}

export async function POST(request: NextRequest) {
  try {
    const r2 = getR2Client();
    if (!r2) {
      return NextResponse.json(
        { error: 'Storage not configured', message: 'R2 env vars (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME) are required.' },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    const body = (await request.json().catch(() => null)) as { fileSize?: unknown } | null;
    const fileSize = typeof body?.fileSize === "number" ? body.fileSize : NaN;
    const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // Allow larger checker manuscripts while still bounded.
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json(
        { error: "Invalid file size", message: "Provide a positive fileSize in bytes." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
    if (fileSize > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File too large", message: "Checker uploads are limited to 50MB." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const jobId = uuidv4();
    const fileKey = `uploads/${jobId}.pdf`;

    const command = new PutObjectCommand({
      Bucket: r2.bucket,
      Key: fileKey,
      ContentType: 'application/pdf',
    });

    const uploadUrl = await getSignedUrl(r2.client, command, { expiresIn: 3600 });
    const cleanUploadUrl = uploadUrl
      .split('&')
      .filter(param => !param.startsWith('x-amz-checksum') && !param.startsWith('x-amz-sdk-checksum'))
      .join('&');

    return NextResponse.json(
      { uploadUrl: cleanUploadUrl, fileKey, jobId },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error('create-upload-url error:', error);
    return NextResponse.json(
      { error: 'Failed to create upload URL', detail: String(error) },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
