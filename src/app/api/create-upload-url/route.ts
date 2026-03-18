import { NextRequest, NextResponse } from 'next/server';
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
        { status: 503 }
      );
    }

    const { fileSize } = await request.json();

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

    return NextResponse.json({ uploadUrl: cleanUploadUrl, fileKey, jobId });
  } catch (error) {
    console.error('create-upload-url error:', error);
    return NextResponse.json({ error: 'Failed to create upload URL', detail: String(error) }, { status: 500 });
  }
}
