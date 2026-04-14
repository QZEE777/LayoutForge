/**
 * Cloudflare R2 storage (S3-compatible).
 * Key pattern: uploads/{id}/{filename} for files, uploads/{id}/meta.json for metadata.
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/** Presigned GET for report PDF, annotated PDF, etc. — keep in sync with emails / FAQ copy. */
export const DOWNLOAD_SIGNED_URL_EXPIRES_SECONDS = 24 * 60 * 60; // 24 hours

const DEFAULT_SIGNED_URL_EXPIRES = DOWNLOAD_SIGNED_URL_EXPIRES_SECONDS;

/**
 * R2 is S3-compatible; use the same client shape for server uploads and presigning.
 * Default SDK checksum behavior adds params to presigned URLs; omitting flexible checksums
 * when not required keeps URLs smaller and avoids R2 edge cases — and we must never strip
 * query params after signing (that invalidates SigV4).
 */
export function createR2S3Client(opts: {
  endpoint: string;
  credentials: { accessKeyId: string; secretAccessKey: string };
}): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: opts.endpoint,
    credentials: opts.credentials,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

function getClient(): S3Client {
  const endpoint =
    process.env.R2_ENDPOINT ||
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : "");
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 storage requires R2_ENDPOINT (or R2_ACCOUNT_ID), R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables."
    );
  }
  return createR2S3Client({
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function getBucket(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2 storage requires R2_BUCKET_NAME environment variable.");
  }
  return bucket;
}

function key(id: string, filename: string): string {
  return `uploads/${id}/${filename}`;
}

/**
 * Upload a file to R2.
 * @param id - Job/document id
 * @param filename - Filename (e.g. "abc123.pdf" or "meta.json")
 * @param buffer - File contents
 */
export async function uploadFile(
  id: string,
  filename: string,
  buffer: Buffer
): Promise<void> {
  const k = key(id, filename);
  try {
    const client = getClient();
    await client.send(
      new PutObjectCommand({
        Bucket: getBucket(),
        Key: k,
        Body: buffer,
        ContentType:
          filename === "meta.json"
            ? "application/json"
            : undefined,
      })
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`R2 upload failed for ${k}: ${msg}`);
  }
}

/**
 * Download a file from R2 by full key (e.g. "uploads/abc-123.pdf").
 */
export async function getFileByKey(fullKey: string): Promise<Buffer> {
  const key = typeof fullKey === "string" ? fullKey.trim() : "";
  if (!key) {
    throw new Error("R2 getFileByKey: empty or invalid key");
  }
  try {
    const client = getClient();
    const res = await client.send(
      new GetObjectCommand({
        Bucket: getBucket(),
        Key: key,
      })
    );
    if (!res.Body) {
      throw new Error(`R2 get returned no body for ${key}`);
    }
    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`R2 getFileByKey failed for ${key}: ${msg}`);
  }
}

/**
 * Poll until HEAD sees a positive-sized object at this key (browser PUT → R2).
 * Cheap vs downloading the full PDF on every attempt; pairs with getFileByKey retries on the worker.
 */
export async function waitForCheckerPdfHead(
  fullKey: string,
  opts?: { attempts?: number; delayMs?: number },
): Promise<boolean> {
  const key = typeof fullKey === "string" ? fullKey.trim() : "";
  if (!key) return false;
  const attempts = Math.max(1, opts?.attempts ?? 40);
  const delayMs = Math.max(250, opts?.delayMs ?? 900);
  const client = getClient();
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const head = await client.send(new HeadObjectCommand({ Bucket: getBucket(), Key: key }));
      const len = Number(head.ContentLength ?? 0);
      if (len > 0) return true;
    } catch {
      /* not visible yet */
    }
    if (attempt < attempts) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return false;
}

/**
 * Download a file from R2.
 * @param id - Job/document id
 * @param filename - Filename (e.g. "abc123.pdf")
 * @returns File contents
 */
export async function downloadFile(
  id: string,
  filename: string
): Promise<Buffer> {
  const k = key(id, filename);
  return getFileByKey(k);
}

/**
 * Save metadata JSON for a job.
 * @param id - Job/document id
 * @param meta - Object to store (will be JSON.stringify'd)
 */
export async function saveMetadata(id: string, meta: object): Promise<void> {
  const buffer = Buffer.from(JSON.stringify(meta), "utf-8");
  await uploadFile(id, "meta.json", buffer);
}

/**
 * Get metadata for a job.
 * @param id - Job/document id
 * @returns Parsed metadata object
 */
export async function getMetadata(id: string): Promise<object> {
  try {
    const buffer = await downloadFile(id, "meta.json");
    return JSON.parse(buffer.toString("utf-8")) as object;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`R2 getMetadata failed for ${id}: ${msg}`);
  }
}

/**
 * Get a pre-signed URL for downloading a file.
 * @param id - Job/document id
 * @param filename - Filename (e.g. "abc123.pdf")
 * @param expiresInSeconds - URL validity (default 86400 = 24 hours)
 * @returns Pre-signed GET URL
 */
export async function getSignedDownloadUrl(
  id: string,
  filename: string,
  expiresInSeconds: number = DEFAULT_SIGNED_URL_EXPIRES
): Promise<string> {
  const k = key(id, filename);
  try {
    const client = getClient();
    const cmd = new GetObjectCommand({
      Bucket: getBucket(),
      Key: k,
    });
    return getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`R2 getSignedDownloadUrl failed for ${k}: ${msg}`);
  }
}

/**
 * List all document ids that have metadata (uploads/{id}/meta.json).
 * Used for listLeads and cleanupExpired.
 */
export async function listMetaIds(): Promise<string[]> {
  const bucket = getBucket();
  try {
    const client = getClient();
    const ids: string[] = [];
    let continuationToken: string | undefined;
    do {
      const res = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: "uploads/",
          Delimiter: "/",
          ContinuationToken: continuationToken,
        })
      );
      if (res.CommonPrefixes) {
        for (const p of res.CommonPrefixes) {
          const prefix = p.Prefix ?? "";
          const match = prefix.match(/^uploads\/([^/]+)\/$/);
          if (match) ids.push(match[1]);
        }
      }
      continuationToken = res.NextContinuationToken;
    } while (continuationToken);
    return ids;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`R2 listMetaIds failed: ${msg}`);
  }
}

/**
 * Delete a single file from R2.
 */
export async function deleteFile(id: string, filename: string): Promise<void> {
  const k = key(id, filename);
  try {
    const client = getClient();
    await client.send(
      new DeleteObjectCommand({
        Bucket: getBucket(),
        Key: k,
      })
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`R2 deleteFile failed for ${k}: ${msg}`);
  }
}

/**
 * Delete metadata file for a job (meta.json).
 */
export async function deleteMetadata(id: string): Promise<void> {
  await deleteFile(id, "meta.json");
}

/**
 * List all object keys under uploads/{id}/ (for deleteStored).
 */
async function listKeysUnderPrefix(prefix: string): Promise<string[]> {
  const bucket = getBucket();
  const client = getClient();
  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    if (res.Contents) {
      for (const o of res.Contents) {
        if (o.Key) keys.push(o.Key);
      }
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);
  return keys;
}

/**
 * Get a pre-signed URL for any R2 object by its full key (e.g. "annotated/abc_annotated.pdf").
 * Use this when the key does not follow the uploads/{id}/{filename} pattern.
 */
export async function getSignedUrlForKey(
  fullKey: string,
  expiresInSeconds: number = DEFAULT_SIGNED_URL_EXPIRES
): Promise<string> {
  try {
    const client = getClient();
    const cmd = new GetObjectCommand({
      Bucket: getBucket(),
      Key: fullKey,
    });
    return getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`R2 getSignedUrlForKey failed for ${fullKey}: ${msg}`);
  }
}

/**
 * Delete all files under uploads/{id}/ (main file, meta.json, out/*).
 * Used by deleteStored.
 */
export async function deleteAllForId(id: string): Promise<void> {
  const prefix = `uploads/${id}/`;
  const keys = await listKeysUnderPrefix(prefix);
  const client = getClient();
  const bucket = getBucket();
  for (const k of keys) {
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: k }));
    } catch {
      // continue
    }
  }
}
