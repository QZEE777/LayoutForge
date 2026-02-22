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
  pageCount?: number;
  wordCount?: number;
  title?: string;
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
    const meta = JSON.parse(raw) as StoredManuscript;
    try {
      await fs.access(meta.storedPath);
    } catch {
      return null;
    }
    return meta;
  } catch {
    return null;
  }
}

export async function saveMeta(meta: StoredManuscript): Promise<void> {
  await ensureUploadDir();
  const metaPath = path.join(UPLOAD_DIR, `${meta.id}.meta.json`);
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 0), "utf-8");
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
    try {
      await fs.unlink(meta.storedPath);
    } catch {
      /* ignore */
    }
    const metaPath = path.join(UPLOAD_DIR, `${id}.meta.json`);
    try {
      await fs.unlink(metaPath);
    } catch {
      /* ignore */
    }
  }
  const outDir = path.join(UPLOAD_DIR, "out", id);
  try {
    await fs.rm(outDir, { recursive: true });
  } catch {
    /* ignore */
  }
}

export async function cleanupExpired(): Promise<number> {
  await ensureUploadDir();
  const entries = await fs.readdir(UPLOAD_DIR, { withFileTypes: true });
  const metaFiles = entries.filter(
    (e) => e.isFile() && e.name.endsWith(".meta.json")
  );
  const now = Date.now();
  let removed = 0;
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
      try {
        await fs.unlink(metaPath);
        removed++;
      } catch {
        /* ignore */
      }
    }
  }
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

export async function writeOutput(
  id: string,
  filename: string,
  data: Buffer
): Promise<string> {
  const dir = await ensureOutputDir(id);
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, data);
  return filePath;
}

export async function readOutput(
  id: string,
  filename: string
): Promise<Buffer | null> {
  const filePath = getOutputPath(id, filename);
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}
