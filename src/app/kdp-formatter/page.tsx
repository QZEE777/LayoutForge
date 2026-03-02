"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { truncateFilenameMiddle, formatFileSize } from "@/lib/formatFileName";
import {
  TRIM_SIZES,
  BOOK_TYPES,
  BODY_FONTS,
  HEADING_FONTS,
  FONT_SIZES,
  PARAGRAPH_STYLES,
  LINE_SPACING_OPTIONS,
  DEFAULT_CONFIG,
  type KdpFormatConfig,
} from "@/lib/kdpConfig";

const ALLOWED_TYPES = [".docx"];
const MAX_MB = 50;

const PROGRESS_STEPS = [
  "Parsing document...",
  "Cleaning formatting...",
  "Detecting chapters...",
  "Generating front matter...",
  "Laying out pages...",
  "Embedding fonts...",
  "Finalizing PDF...",
];

export default function KdpFormatterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "configure" | "processing">("upload");
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [config, setConfig] = useState<KdpFormatConfig>({
    ...DEFAULT_CONFIG,
    copyrightYear: new Date().getFullYear(),
  });
  const [processingStep, setProcessingStep] = useState(0);
  const [processingError, setProcessingError] = useState<string | null>(null);

  useEffect(() => {
    const presetId = searchParams.get("id");
    if (presetId && !uploadId) {
      setUploadId(presetId);
      setStep("configure");
    }
  }, [searchParams, uploadId]);

  // Pre-fill title/author from DOCX when on configure step (upload or preset ?id=)
  useEffect(() => {
    if (step !== "configure" || !uploadId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/docx-meta?id=${encodeURIComponent(uploadId)}`);
        if (!res.ok || cancelled) return;
        const meta = await res.json();
        if (cancelled) return;
        setConfig((c) => {
          let frontMatter = c.frontMatter;
          if (meta.hasTitlePage === true) frontMatter = { ...frontMatter, titlePage: false };
          if (meta.dedicationText != null && meta.dedicationText !== "") {
            frontMatter = { ...frontMatter, dedication: true, dedicationText: meta.dedicationText };
          }
          return {
            ...c,
            ...(meta.bookTitle != null && meta.bookTitle !== "" && { bookTitle: meta.bookTitle }),
            ...(meta.authorName != null && meta.authorName !== "" && { authorName: meta.authorName }),
            ...(meta.hasTitlePage === true || (meta.dedicationText != null && meta.dedicationText !== "") ? { frontMatter } : {}),
          };
        });
      } catch {
        // Non-fatal: user can enter manually
      }
    })();
    return () => { cancelled = true; };
  }, [step, uploadId]);

  const validateFile = useCallback((f: File): string | null => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    if (!ALLOWED_TYPES.includes(ext)) return "Only .docx files are accepted.";
    if (f.size > MAX_MB * 1024 * 1024) return `File must be smaller than ${MAX_MB}MB.`;
    return null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (!droppedFile) return;
      const err = validateFile(droppedFile);
      if (err) {
        setError(err);
        setFile(null);
        return;
      }
      setError(null);
      setFile(droppedFile);
    },
    [validateFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;
      const err = validateFile(selectedFile);
      if (err) {
        setError(err);
        setFile(null);
        return;
      }
      setError(null);
      setFile(selectedFile);
    },
    [validateFile]
  );

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const progressInterval = setInterval(() => setProgress((p) => Math.min(p + 15, 90)), 100);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      clearInterval(progressInterval);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Upload failed");
      }
      const data = await response.json();
      setProgress(100);
      setUploadId(data.id);
      setUploading(false);
      setStep("configure");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      setProgress(0);
    }
  }, [file]);

  const runGeneration = useCallback(
    async (apiPath: string) => {
      if (!uploadId) return;
      if (!config.bookTitle.trim() || !config.authorName.trim()) {
        setProcessingError("Book title and author name are required.");
        return;
      }
      setStep("processing");
      setProcessingError(null);
      setProcessingStep(0);

      console.log("[kdp-formatter] Full config before API call:", { ...config, bookTitle: config.bookTitle, authorName: config.authorName });
      if (typeof config.bookTitle !== "string" || typeof config.authorName !== "string") {
        setProcessingError("Book title and author name must be strings.");
        return;
      }

      const stepInterval = setInterval(() => {
        setProcessingStep((s) => Math.min(s + 1, PROGRESS_STEPS.length - 1));
      }, 1500);

      try {
        const res = await fetch(apiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: uploadId, config }),
        });
        clearInterval(stepInterval);
        setProcessingStep(PROGRESS_STEPS.length - 1);

        const data = await res.json();
        if (!res.ok) {
          setProcessingError(data.message || data.error || "Generation failed");
          return;
        }
        router.push(`/download/${uploadId}`);
      } catch (err) {
        clearInterval(stepInterval);
        setProcessingError(err instanceof Error ? err.message : "Request failed");
      }
    },
    [uploadId, config, router]
  );

  const handleGenerateReviewDocx = useCallback(() => {
    runGeneration("/api/kdp-format-docx-preview");
  }, [runGeneration]);

  const handleGeneratePdf = useCallback(() => {
    runGeneration("/api/kdp-format-docx");
  }, [runGeneration]);

  const isConfigure = step === "configure";
  const isProcessing = step === "processing";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-green-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">Manu2Print KDP</span>
          </Link>
          <Link href="/formatter" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            All Tools
          </Link>
        </div>
      </header>

      <div className="border-b border-slate-800 bg-green-900/20">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-600/30 border border-green-500/30 flex items-center justify-center text-green-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-white">KDP</span>
            <span className="mx-2 text-slate-600">|</span>
            <span className="text-sm text-slate-400">One template. Upload DOCX → KDP-ready DOCX + PDF.</span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Upload your manuscript</h1>
          <p className="mt-2 text-slate-400">Supports DOCX only. Maximum {MAX_MB}MB.</p>
        </div>

        <div className="mb-8 flex items-center gap-2 text-sm">
          <span className={`flex items-center gap-1.5 ${step === "upload" ? "text-green-400 font-medium" : "text-slate-500"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "upload" ? "bg-green-600 text-white" : "bg-slate-700 text-slate-400"}`}>1</span>
            Upload
          </span>
          <span className="text-slate-700 mx-1">——</span>
          <span className={`flex items-center gap-1.5 ${step === "configure" || step === "processing" ? "text-green-400 font-medium" : "text-slate-500"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === "configure" || step === "processing" ? "bg-green-600 text-white font-bold" : "bg-slate-700 text-slate-400"}`}>2</span>
            Configure
          </span>
          <span className="text-slate-700 mx-1">——</span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-xs">3</span>
            Download
          </span>
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-14 text-center transition-all ${
                isDragging ? "border-green-400 bg-green-500/10" : "border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/60"
              }`}
            >
              <input
                type="file"
                id="file-input"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
              <label htmlFor="file-input" className={`block cursor-pointer ${uploading ? "opacity-50" : ""}`}>
                {file ? (
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-green-600/20 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13h4 4L19 7" /></svg>
                    </div>
                    <p className="text-lg font-semibold text-white overflow-hidden text-ellipsis max-w-full" title={file.name}>{truncateFilenameMiddle(file.name)}</p>
                    <p className="mt-1 text-sm text-slate-400">{formatFileSize(file.size)} — ready to upload</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-slate-300 font-medium">Drag and drop here, or <span className="text-green-400 hover:text-green-300">browse files</span></p>
                    <p className="mt-2 text-xs text-slate-500">.docx only • up to {MAX_MB}MB</p>
                  </div>
                )}
              </label>
            </div>
            {error && (
              <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">{error}</div>
            )}
            {uploading && progress > 0 && (
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-sm"><span className="text-slate-300">Uploading...</span><span className="text-slate-500">{progress}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                  <div className="h-full bg-green-500 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            <div className="mt-8 flex gap-3">
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1 rounded-xl bg-green-600 px-6 py-3.5 font-semibold text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? "Uploading..." : "Upload & Continue"}
              </button>
              {file && !uploading && (
                <button onClick={() => { setFile(null); setError(null); }} className="rounded-xl border border-slate-700 px-5 py-3.5 font-medium text-slate-400 hover:bg-slate-800 transition-colors">Clear</button>
              )}
            </div>
          </>
        )}

        {/* Step 2: Configure */}
        {isConfigure && (
          <div className="rounded-2xl bg-slate-800/50 border border-slate-700/60 p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">KDP format settings</h2>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-start gap-3">
              <input
                type="checkbox"
                id="already-formatted"
                checked={!!config.alreadyFormatted}
                onChange={(e) => setConfig((c) => ({ ...c, alreadyFormatted: e.target.checked }))}
                className="mt-1 accent-amber-500"
              />
              <label htmlFor="already-formatted" className="text-sm text-slate-200 cursor-pointer">
                <span className="font-medium">My manuscript is already KDP-ready</span>
                <span className="block mt-1 text-slate-400">Only Word Heading 1/2/3 styles define chapters. No “smart” detection — use this if the formatter previously broke a finished book.</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Book title *</label>
              <input
                type="text"
                value={config.bookTitle}
                onChange={(e) => setConfig((c) => ({ ...c, bookTitle: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Your book title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Author name *</label>
              <input
                type="text"
                value={config.authorName}
                onChange={(e) => setConfig((c) => ({ ...c, authorName: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Author name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Copyright year</label>
                <input
                  type="number"
                  value={config.copyrightYear}
                  onChange={(e) => setConfig((c) => ({ ...c, copyrightYear: parseInt(e.target.value, 10) || new Date().getFullYear() }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">ISBN (optional)</label>
                <input
                  type="text"
                  value={config.isbn}
                  onChange={(e) => setConfig((c) => ({ ...c, isbn: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="ISBN"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Trim size</label>
              <select
                value={config.trimSize}
                onChange={(e) => setConfig((c) => ({ ...c, trimSize: e.target.value as KdpFormatConfig["trimSize"] }))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {TRIM_SIZES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Book type</label>
              <select
                value={config.bookType}
                onChange={(e) => setConfig((c) => ({ ...c, bookType: e.target.value as KdpFormatConfig["bookType"] }))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {BOOK_TYPES.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Body font</label>
                <select
                  value={config.bodyFont}
                  onChange={(e) => setConfig((c) => ({ ...c, bodyFont: e.target.value as KdpFormatConfig["bodyFont"] }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {BODY_FONTS.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Heading font</label>
                <select
                  value={config.headingFont}
                  onChange={(e) => setConfig((c) => ({ ...c, headingFont: e.target.value as KdpFormatConfig["headingFont"] }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {HEADING_FONTS.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Font size</label>
              <select
                value={config.fontSize}
                onChange={(e) => setConfig((c) => ({ ...c, fontSize: Number(e.target.value) as KdpFormatConfig["fontSize"] }))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {FONT_SIZES.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Paragraph style</label>
              <select
                value={config.paragraphStyle}
                onChange={(e) => setConfig((c) => ({ ...c, paragraphStyle: e.target.value as KdpFormatConfig["paragraphStyle"] }))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {PARAGRAPH_STYLES.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Line spacing</label>
              <select
                value={config.lineSpacing}
                onChange={(e) => setConfig((c) => ({ ...c, lineSpacing: Number(e.target.value) as KdpFormatConfig["lineSpacing"] }))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {LINE_SPACING_OPTIONS.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-300">Interior</span>
              <label className="flex items-center gap-2 text-slate-300">
                <input type="radio" name="interior" checked={config.interiorColor === "bw"} onChange={() => setConfig((c) => ({ ...c, interiorColor: "bw" }))} className="accent-green-500" />
                Black & White
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                <input type="radio" name="interior" checked={config.interiorColor === "color"} onChange={() => setConfig((c) => ({ ...c, interiorColor: "color" }))} className="accent-green-500" />
                Color
              </label>
            </div>
            {config.interiorColor === "bw" && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-300">Paper</span>
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="radio" name="paper" checked={config.paperColor === "white"} onChange={() => setConfig((c) => ({ ...c, paperColor: "white" }))} className="accent-green-500" />
                  White
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="radio" name="paper" checked={config.paperColor === "cream"} onChange={() => setConfig((c) => ({ ...c, paperColor: "cream" }))} className="accent-green-500" />
                  Cream
                </label>
              </div>
            )}
            <div className="flex items-center gap-3">
              <input type="checkbox" id="bleed" checked={config.bleedImages} onChange={(e) => setConfig((c) => ({ ...c, bleedImages: e.target.checked }))} className="w-4 h-4 rounded accent-green-500" />
              <label htmlFor="bleed" className="text-sm text-slate-300">Bleed images (extend to page edges)</label>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Front matter</p>
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={!config.frontMatter.titlePage}
                  onChange={(e) => setConfig((c) => ({ ...c, frontMatter: { ...c.frontMatter, titlePage: !e.target.checked } }))}
                  className="accent-green-500"
                />
                My manuscript already has a title page — skip adding one
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                <input type="checkbox" checked={config.frontMatter.copyrightPage} onChange={(e) => setConfig((c) => ({ ...c, frontMatter: { ...c.frontMatter, copyrightPage: e.target.checked } }))} className="accent-green-500" />
                Copyright page
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                <input type="checkbox" checked={config.frontMatter.toc} onChange={(e) => setConfig((c) => ({ ...c, frontMatter: { ...c.frontMatter, toc: e.target.checked } }))} className="accent-green-500" />
                Table of contents
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                <input type="checkbox" checked={config.frontMatter.dedication} onChange={(e) => setConfig((c) => ({ ...c, frontMatter: { ...c.frontMatter, dedication: e.target.checked } }))} className="accent-green-500" />
                Dedication page
              </label>
              {config.frontMatter.dedication && (
                <textarea
                  value={config.frontMatter.dedicationText || ""}
                  onChange={(e) => setConfig((c) => ({ ...c, frontMatter: { ...c.frontMatter, dedicationText: e.target.value } }))}
                  placeholder="Dedication text..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              )}
            </div>

            <button
              onClick={handleGenerateReviewDocx}
              disabled={isProcessing}
              className="w-full rounded-xl bg-[#D4A843] hover:bg-[#c49a3d] text-[#1a1a12] font-bold py-4 px-6 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? "Generating..." : "Generate Review DOCX"}
            </button>
            <button
              onClick={handleGeneratePdf}
              disabled={isProcessing}
              className="w-full rounded-xl border-2 border-slate-600 text-slate-300 hover:border-slate-500 hover:bg-slate-800/50 font-semibold py-4 px-6 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-3"
            >
              Skip Review — Generate KDP PDF Directly
            </button>
            <Link href="/kdp-formatter" className="block text-center text-sm text-slate-400 hover:text-white mt-4">Cancel and upload a different file</Link>
          </div>
        )}

        {/* Step 3: Processing */}
        {isProcessing && (
          <div className="rounded-2xl bg-green-500/10 border border-green-500/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-green-300 font-medium">{PROGRESS_STEPS[processingStep]}</p>
            </div>
            <ul className="text-sm text-slate-400 space-y-1">
              {PROGRESS_STEPS.map((s, i) => (
                <li key={i} className={i <= processingStep ? "text-green-400" : ""}>
                  {i < processingStep ? "✓" : i === processingStep ? "…" : "○"} {s}
                </li>
              ))}
            </ul>
            {processingError && (
              <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">{processingError}</div>
            )}
          </div>
        )}

        {step === "upload" && (
          <div className="mt-8 rounded-xl bg-slate-800/40 border border-slate-700/60 p-4 text-sm text-slate-400 space-y-1">
            <p className="font-medium text-slate-300">What happens next:</p>
            <p>1. We analyse your manuscript — word count, chapters, structure</p>
            <p>2. You choose KDP trim size, font, and options</p>
            <p>3. Download your print-ready PDF for Amazon KDP</p>
          </div>
        )}
      </main>
    </div>
  );
}
