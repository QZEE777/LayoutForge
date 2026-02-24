import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.VERCEL
  ? path.join("/tmp", "uploads")
  : path.join(process.cwd(), "data", "uploads");

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface StoredManuscript {
  id: string;
  originalName: string;
  mimeType: string;
  storedPath: string;
  createdAt: number;
  // Conversion tracking
  convertJobId?: string;
  convertStatus?: "processing" | "done" | "error";
  outputFilename?: string;
  // KDP settings used for this conversion
  trimSize?: string;
  withBleed?: boolean;
  fontSize?: number;
  // Parsed metadata
  pageCount?: number;
  wordCount?: number;
  title?: string;
  // Lead magnet (e.g. PDF compressor)
  leadEmail?: string;
}

export async function ensureUploadDir(): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  return UPLOAD_DIR;
}

export function getUploadPath(id: string, ext: string): string {
  return path.join(UPLOAD_DIR, `${id}${ext}`);
}

export async function saveUpload(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<StoredManuscript> {
  await ensureUploadDir();
  const id = crypto.randomUUID();
  const ext = path.extname(originalName) || getExtFromMime(mimeType);
  const storedPath = getUploadPath(id, ext);
  await fs.writeFile(storedPath, buffer);
  const createdAt = Date.now();
  const meta: StoredManuscript = {
    id,
    originalName: sanitizeFileName(originalName),
    mimeType,
    storedPath,
    createdAt,
  };
  await saveMeta(meta);
  return meta;
}

export async function getStored(id: string): Promise<StoredManuscript | null> {
  const metaPath = path.join(UPLOAD_DIR, `${id}.meta.json`);
  try {
    const raw = await fs.readFile(metaPath, "utf-8");
    return JSON.parse(raw) as StoredManuscript;
  } catch {
    return null;
  }
}

export async function saveMeta(meta: StoredManuscript): Promise<void> {
  await ensureUploadDir();
  const metaPath = path.join(UPLOAD_DIR, `${meta.id}.meta.json`);
  await fs.writeFile(metaPath, JSON.stringify(meta), "utf-8");
}

/** Save compression job meta (no file stored; client uploads directly to CloudConvert). */
export async function saveCompressionMeta(
  id: string,
  jobId: string,
  leadEmail: string
): Promise<void> {
  await ensureUploadDir();
  const metaPath = path.join(UPLOAD_DIR, `${id}.compression.json`);
  await fs.writeFile(
    metaPath,
    JSON.stringify({ id, jobId, leadEmail, createdAt: Date.now() }),
    "utf-8"
  );
}

/** Merge partial fields into an existing meta file. */
export async function updateMeta(
  id: string,
  updates: Partial<StoredManuscript>
): Promise<void> {
  const metaPath = path.join(UPLOAD_DIR, `${id}.meta.json`);
  try {
    const existing = JSON.parse(await fs.readFile(metaPath, "utf-8")) as StoredManuscript;
    const merged = { ...existing, ...updates };
    await fs.writeFile(metaPath, JSON.stringify(merged), "utf-8");
  } catch {
    // If meta doesn't exist yet, create it
    await saveMeta({ id, originalName: "", mimeType: "", storedPath: "", createdAt: Date.now(), ...updates });
  }
}

export async function readStoredFile(id: string): Promise<Buffer | null> {
  const meta = await getStored(id);
  if (!meta) return null;
  try {
    return await fs.readFile(meta.storedPath);
  } catch {
    return null;
  }
}

export async function deleteStored(id: string): Promise<void> {
  const meta = await getStored(id);
  if (meta) {
    try { await fs.unlink(meta.storedPath); } catch { /* ignore */ }
    const metaPath = path.join(UPLOAD_DIR, `${id}.meta.json`);
    try { await fs.unlink(metaPath); } catch { /* ignore */ }
  }
  const outDir = path.join(UPLOAD_DIR, "out", id);
  try { await fs.rm(outDir, { recursive: true }); } catch { /* ignore */ }
}

export async function cleanupExpired(): Promise<number> {
  await ensureUploadDir();
  let removed = 0;
  try {
    const entries = await fs.readdir(UPLOAD_DIR, { withFileTypes: true });
    const metaFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".meta.json"));
    const now = Date.now();
    for (const f of metaFiles) {
      const metaPath = path.join(UPLOAD_DIR, f.name);
      try {
        const raw = await fs.readFile(metaPath, "utf-8");
        const meta = JSON.parse(raw) as StoredManuscript;
        if (now - meta.createdAt > MAX_AGE_MS) {
          await deleteStored(meta.id);
          removed++;
        }
      } catch {
        try { await fs.unlink(metaPath); removed++; } catch { /* ignore */ }
      }
    }
  } catch { /* ignore readdir errors */ }
  return removed;
}

function getExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/epub+zip": ".epub",
  };
  return map[mime] || ".bin";
}

function sanitizeFileName(name: string): string {
  return path.basename(name).replace(/[^\w\s.-]/gi, "_").slice(0, 200);
}

export function getOutputPath(id: string, filename: string): string {
  return path.join(UPLOAD_DIR, "out", id, filename);
}

export async function ensureOutputDir(id: string): Promise<string> {
  const dir = path.join(UPLOAD_DIR, "out", id);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function writeOutput(id: string, filename: string, data: Buffer): Promise<string> {
  const dir = await ensureOutputDir(id);
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, data);
  return filePath;
}

export async function readOutput(id: string, filename: string): Promise<Buffer | null> {
  const filePath = getOutputPath(id, filename);
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}
