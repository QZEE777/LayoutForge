import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { fileSize } = await request.json();

    const jobId = uuidv4();
    const fileKey = `uploads/${jobId}.pdf`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fileKey,
      ContentType: 'application/pdf',
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
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
