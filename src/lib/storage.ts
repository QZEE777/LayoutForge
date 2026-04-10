import fs from "fs/promises";
import path from "path";
import * as r2 from "./r2Storage";

const USE_R2 = process.env.USE_R2 === "true";

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
  /** Buyer's name captured from Lemon Squeezy order. */
  buyerName?: string;
  /** Set when payment is confirmed via webhook (Lemon Squeezy order_created). */
  payment_confirmed?: boolean;
  /** Pre-signed R2 download URL for the report file (when USE_R2). */
  reportDownloadUrl?: string;
  /** Annotated PDF from preflight engine (checker flow). */
  annotatedPdfUrl?: string;
  /** Pre-signed download URL for annotated PDF (when USE_R2). */
  annotatedPdfDownloadUrl?: string;
  annotatedPdfStatus?: string;
  /** Email delivery state for annotated checker PDF. */
  annotatedEmail?: string;
  annotatedEmailRequestedAt?: number;
  annotatedEmailSentAt?: number;
  // KDP format processing report (pages, chapters, issues, etc.)
  processingReport?: {
    pagesGenerated?: number;
    chaptersDetected: number;
    sectionsDetected?: number;
    lessonsDetected?: number;
    estimatedPages?: number;
    issues: string[];
    fontUsed: string;
    trimSize: string;
    gutterInches?: number;
    outputType?: "pdf" | "docx" | "epub" | "checker" | "format-review";
    status?: string;
    formatReviewText?: string;
    /** Checker report */
    pageCount?: number;
    trimDetected?: string;
    trimMatchKDP?: boolean;
    kdpTrimName?: string | null;
    recommendations?: string[];
    fileSizeMB?: number;
    recommendedGutterInches?: number;
    /** Preflight page-level issues with bbox for visual overlay [x, y, width, height] in PDF points */
    page_issues?: Array<{ page: number; rule_id: string; severity: string; message: string; bbox: number[] | null }>;
    /** Enhanced checker report (score, human text, difficulty, checklist, spec table, upsell, branding) */
    scanDate?: string;
    fileNameScanned?: string;
    kdpPassProbability?: number;
    riskLevel?: "Low" | "Medium" | "High";
    readinessScore100?: number;
    highRiskPageNumbers?: number[];
    kdpReady?: boolean;
    issuesEnriched?: Array<{ originalMessage: string; humanMessage: string; fixDifficulty: string; page?: number; rule_id?: string; severity?: string }>;
    uploadChecklist?: Array<{ check: string; status: "pass" | "warning" | "fail" }>;
    specTable?: Array<{ requirement: string; yourFile: string; kdpRequired: string; status: "pass" | "warning" | "fail" }>;
    estimatedFixHours?: number;
    upsellBridge?: string;
    scoreGrade?: { grade: string; label: string; description: string };
    creationTool?: string;
    /** True when the stored file is the user's PDF (server-side check); false when from preflight (placeholder PDF). */
    hasPdfPreview?: boolean;
    /** When set, viewer should load PDF from this URL (e.g. engine GET /file/{job_id}) instead of /api/view-pdf/{id}. */
    pdfSourceUrl?: string;
    /** Format review report */
    formatReviewSections?: Array<{ title: string; issues?: string[]; recommendations?: string[]; content?: string }>;
    summary?: string;
    topActions?: string[];
    kdpReadiness?: string;
    wordCount?: number;
  };
}

export async function ensureUploadDir(): Promise<string> {
  if (USE_R2) return `r2://${process.env.R2_BUCKET_NAME ?? "uploads"}`;
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
  const filename = `${id}${ext}`;
  const storedPath = getUploadPath(id, ext);
  if (USE_R2) {
    const metaKey = `uploads/${id}/meta.json`;
    await r2.uploadFile(id, filename, buffer);
    const meta: StoredManuscript = {
      id,
      originalName: sanitizeFileName(originalName),
      mimeType,
      storedPath: `uploads/${id}/${filename}`,
      createdAt: Date.now(),
    };
    try {
      await r2.saveMetadata(id, meta);
    } catch (e) {
      console.error("[storage.saveUpload] metadata write failed", {
        id,
        metaKey,
        error: e instanceof Error ? e.stack ?? e.message : String(e),
      });
      throw e;
    }
    return meta;
  }
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
  if (USE_R2) {
    const metaKey = `uploads/${id}/meta.json`;
    try {
      const meta = await r2.getMetadata(id);
      return meta as StoredManuscript;
    } catch (e) {
      console.error("[storage.getStored] R2 lookup failed", {
        id,
        metaKey,
        error: e instanceof Error ? e.stack ?? e.message : String(e),
      });
      return null;
    }
  }
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
  if (USE_R2) {
    await r2.saveMetadata(meta.id, meta);
    return;
  }
  const metaPath = path.join(UPLOAD_DIR, `${meta.id}.meta.json`);
  await fs.writeFile(metaPath, JSON.stringify(meta), "utf-8");
}

/** Merge partial fields into an existing meta file. */
export async function updateMeta(
  id: string,
  updates: Partial<StoredManuscript>
): Promise<void> {
  if (USE_R2) {
    try {
      const existing = (await r2.getMetadata(id)) as StoredManuscript;
      const merged = { ...existing, ...updates };
      await r2.saveMetadata(id, merged);
    } catch {
      await r2.saveMetadata(id, { id, originalName: "", mimeType: "", storedPath: "", createdAt: Date.now(), ...updates });
    }
    return;
  }
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

/** Mark a download as paid/unlocked after successful payment (used by Lemon Squeezy webhook). */
export async function markDownloadPaid(downloadId: string): Promise<void> {
  await updateMeta(downloadId, { payment_confirmed: true });
}

export async function readStoredFile(id: string): Promise<Buffer | null> {
  const meta = await getStored(id);
  if (!meta) return null;
  if (USE_R2) {
    try {
      const filename = meta.storedPath.split("/").pop() ?? "";
      if (!filename) return null;
      return await r2.downloadFile(id, filename);
    } catch {
      return null;
    }
  }
  try {
    return await fs.readFile(meta.storedPath);
  } catch {
    return null;
  }
}

export async function deleteStored(id: string): Promise<void> {
  if (USE_R2) {
    try {
      await r2.deleteAllForId(id);
    } catch {
      /* ignore */
    }
    return;
  }
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
  if (USE_R2) {
    let removed = 0;
    try {
      const ids = await r2.listMetaIds();
      const now = Date.now();
      for (const id of ids) {
        try {
          const meta = (await r2.getMetadata(id)) as StoredManuscript;
          if (now - (meta.createdAt ?? 0) > MAX_AGE_MS) {
            await r2.deleteAllForId(id);
            removed++;
          }
        } catch {
          /* skip */
        }
      }
    } catch {
      /* ignore */
    }
    return removed;
  }
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
  if (USE_R2) {
    await r2.uploadFile(id, `out/${filename}`, data);
    return `r2://uploads/${id}/out/${filename}`;
  }
  const dir = await ensureOutputDir(id);
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, data);
  return filePath;
}

export async function readOutput(id: string, filename: string): Promise<Buffer | null> {
  if (USE_R2) {
    try {
      return await r2.downloadFile(id, `out/${filename}`);
    } catch {
      return null;
    }
  }
  const filePath = getOutputPath(id, filename);
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

/** Lead entry for back office (email capture from tools). */
export interface LeadEntry {
  id: string;
  email: string;
  source: "pdf-compress" | "manuscript";
  createdAt: number;
  jobId?: string;
}

/** List all captured leads from meta.json (manuscript with leadEmail). Newest first. Email captures from PDF Compressor are in Supabase. */
export async function listLeads(): Promise<LeadEntry[]> {
  await ensureUploadDir();
  if (USE_R2) {
    const leads: LeadEntry[] = [];
    try {
      const ids = await r2.listMetaIds();
      for (const id of ids) {
        try {
          const meta = (await r2.getMetadata(id)) as StoredManuscript;
          if (meta.leadEmail) {
            leads.push({
              id: meta.id,
              email: meta.leadEmail,
              source: "manuscript",
              createdAt: meta.createdAt ?? 0,
            });
          }
        } catch {
          /* skip */
        }
      }
    } catch {
      /* ignore */
    }
    leads.sort((a, b) => b.createdAt - a.createdAt);
    return leads;
  }
  const leads: LeadEntry[] = [];
  try {
    const entries = await fs.readdir(UPLOAD_DIR, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isFile() || !e.name.endsWith(".meta.json")) continue;
      try {
        const raw = await fs.readFile(path.join(UPLOAD_DIR, e.name), "utf-8");
        const meta = JSON.parse(raw) as StoredManuscript;
        if (meta.leadEmail) {
          leads.push({
            id: meta.id,
            email: meta.leadEmail,
            source: "manuscript",
            createdAt: meta.createdAt,
          });
        }
      } catch {
        /* skip */
      }
    }
  } catch {
    /* ignore */
  }
  leads.sort((a, b) => b.createdAt - a.createdAt);
  return leads;
}