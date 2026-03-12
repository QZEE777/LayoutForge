"use client";

// TODO: Manny watermark to be added to generated PDF output
import { useCallback, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { WhatHappensNext } from "@/components/WhatHappensNext";
import { ErrorRecovery } from "@/components/ErrorRecovery";
import { ToolBreadcrumb } from "@/components/ToolBreadcrumb";

const ALLOWED_EXT = ".docx";
const MAX_MB = 50;

const PROGRESS_STEPS = [
  "Parsing document...",
  "Detecting structure...",
  "Building review DOCX...",
  "Finalizing...",
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
            ...(meta.hasTitlePage === true || (meta.dedicationText != null && meta.dedicationText !== "")
              ? { frontMatter }
              : {}),
          };
        });
      } catch {
        // Non-fatal
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, uploadId]);

  const validateFile = useCallback((f: File): string | null => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    if (ext !== ALLOWED_EXT) return "Only .docx files are accepted.";
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
      const f = e.dataTransfer.files[0];
      if (!f) return;
      const err = validateFile(f);
      if (err) {
        setError(err);
        setFile(null);
        return;
      }
      setError(null);
      setFile(f);
    },
    [validateFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const err = validateFile(f);
      if (err) {
        setError(err);
        setFile(null);
        return;
      }
      setError(null);
      setFile(f);
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
      const interval = setInterval(() => setProgress((p) => Math.min(p + 15, 90)), 100);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      clearInterval(interval);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Upload failed");
      }
      const data = await response.json();
      setProgress(100);
      setUploadId(data.id);
      setStep("configure");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
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

      const stepInterval = setInterval(() => {
        setProcessingStep((s) => Math.min(s + 1, PROGRESS_STEPS.length - 1));
      }, 1200);

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

  const handleGenerateReviewDocx = useCallback(
    () => runGeneration("/api/kdp-format-docx-preview"),
    [runGeneration]
  );

  const handleGeneratePdf = useCallback(
    () => runGeneration("/api/kdp-format-docx"),
    [runGeneration]
  );

  const isConfigure = step === "configure";
  const isProcessing = step === "processing";

  return (
    <div className="min-h-screen bg-m2p-ivory">
      <header className="border-b border-m2p-border bg-m2p-ivory backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-green-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-m2p-ink">Manu2Print KDP</span>
          </Link>
          <Link href="/platform/kdp" className="text-sm text-m2p-muted hover:text-m2p-orange transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            All Tools
          </Link>
        </div>
      </header>

      <div className="border-b border-m2p-border bg-m2p-orange-soft">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-600/30 border border-green-500/30 flex items-center justify-center text-green-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-m2p-ink">KDP</span>
            <span className="mx-2 text-m2p-muted">|</span>
            <span className="text-sm text-m2p-muted">One template. Upload DOCX → KDP-ready DOCX + PDF.</span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="flex items-center gap-2 mb-6">
          <Image src="/MANNY AVATAR.png" alt="Manny" width={28} height={28} style={{ borderRadius: "50%" }} />
          <span><span style={{ color: "#F05A28", fontWeight: "bold" }}>manu</span><span style={{ color: "#4cd964", fontWeight: "bold" }}>2print</span></span>
        </div>
        <ToolBreadcrumb backHref="/" backLabel="All Tools" currentLabel="KDP Formatter" className="mb-6" />
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-m2p-ink">Upload your manuscript</h1>
          <p className="mt-2 text-m2p-muted">Supports DOCX only. Maximum {MAX_MB}MB.</p>
          <p className="mt-2 text-m2p-muted text-sm">If you design in Canva and export PDF, that PDF is your interior — use <Link href="/kdp-pdf-checker" className="text-green-400 hover:text-green-300 underline">Print Ready Check</Link> to verify. This formatter is for the Word/manuscript path.</p>
        </div>

        <div className="mb-8 flex items-center gap-2 text-sm">
          <span className={`flex items-center gap-1.5 ${step === "upload" ? "text-green-400 font-medium" : "text-m2p-muted"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "upload" ? "bg-green-600 text-white" : "bg-m2p-orange-soft text-m2p-muted"}`}>1</span>
            Upload
          </span>
          <span className="text-m2p-ink mx-1">——</span>
          <span className={`flex items-center gap-1.5 ${isConfigure || isProcessing ? "text-green-400 font-medium" : "text-m2p-muted"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isConfigure || isProcessing ? "bg-green-600 text-white font-bold" : "bg-m2p-orange-soft text-m2p-muted"}`}>2</span>
            Configure
          </span>
          <span className="text-m2p-ink mx-1">——</span>
          <span className="flex items-center gap-1.5 text-m2p-muted">
            <span className="w-6 h-6 rounded-full bg-m2p-orange-soft text-m2p-muted flex items-center justify-center text-xs">3</span>
            Download
          </span>
        </div>

        {step === "upload" && (
          <>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-14 text-center transition-all ${
                isDragging ? "border-green-400 bg-green-500/10" : "border-m2p-border bg-m2p-orange-soft/50 hover:border-m2p-orange hover:bg-m2p-orange-soft/70"
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
                    <p className="text-lg font-semibold text-m2p-ink overflow-hidden text-ellipsis max-w-full" title={file.name}>{truncateFilenameMiddle(file.name)}</p>
                    <p className="mt-1 text-sm text-m2p-muted">{formatFileSize(file.size)} — ready to upload</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-m2p-orange-soft flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-m2p-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-m2p-ink font-medium">Drag and drop here, or <span className="text-green-400 hover:text-green-300">browse files</span></p>
                    <p className="mt-2 text-xs text-m2p-muted">.docx only • up to {MAX_MB}MB</p>
                  </div>
                )}
              </label>
            </div>
            {error && (
              <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">
                {error}
                <ErrorRecovery />
              </div>
            )}
            {uploading && progress > 0 && (
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-sm"><span className="text-m2p-ink">Uploading...</span><span className="text-m2p-muted">{progress}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-m2p-orange-soft">
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
                <button onClick={() => { setFile(null); setError(null); }} className="rounded-xl border border-m2p-border px-5 py-3.5 font-medium text-m2p-muted hover:bg-m2p-orange-soft/50 transition-colors">Clear</button>
              )}
            </div>
          </>
        )}

        {isConfigure && (
          <div className="rounded-2xl bg-m2p-orange-soft/50 border border-m2p-border p-6 space-y-6">
            <h2 className="text-lg font-bold text-m2p-ink">KDP format settings</h2>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-start gap-3">
              <input
                type="checkbox"
                id="already-formatted"
                checked={!!config.alreadyFormatted}
                onChange={(e) => setConfig((c) => ({ ...c, alreadyFormatted: e.target.checked }))}
                className="mt-1 accent-amber-500"
              />
              <label htmlFor="already-formatted" className="text-sm text-m2p-ink cursor-pointer">
                <span className="font-medium">My manuscript is already KDP-ready</span>
                <span className="block mt-1 text-m2p-muted">Only Word Heading 1/2/3 define chapters. No “smart” detection.</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Book title *</label>
              <input
                type="text"
                value={config.bookTitle}
                onChange={(e) => setConfig((c) => ({ ...c, bookTitle: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-m2p-ivory border border-m2p-border text-m2p-ink focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Your book title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Author name *</label>
              <input
                type="text"
                value={config.authorName}
                onChange={(e) => setConfig((c) => ({ ...c, authorName: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-m2p-ivory border border-m2p-border text-m2p-ink focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Author name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-m2p-ink mb-2">Copyright year</label>
                <input
                  type="number"
                  value={config.copyrightYear}
                  onChange={(e) => setConfig((c) => ({ ...c, copyrightYear: parseInt(e.target.value, 10) || new Date().getFullYear() }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-m2p-ivory border border-m2p-border text-m2p-ink focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-m2p-ink mb-2">ISBN (optional)</label>
                <input
                  type="text"
                  value={config.isbn}
                  onChange={(e) => setConfig((c) => ({ ...c, isbn: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-m2p-ivory border border-m2p-border text-m2p-ink focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="ISBN"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Trim size</label>
              <select
                value={config.trimSize}
                onChange={(e) => setConfig((c) => ({ ...c, trimSize: e.target.value as KdpFormatConfig["trimSize"] }))}
                className="w-full px-4 py-2.5 rounded-xl bg-m2p-ivory border border-m2p-border text-m2p-ink focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {TRIM_SIZES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Book type</label>
              <select
                value={config.bookType}
                onChange={(e) => setConfig((c) => ({ ...c, bookType: e.target.value as KdpFormatConfig["bookType"] }))}
                className="w-full px-4 py-2.5 rounded-xl bg-m2p-ivory border border-m2p-border text-m2p-ink focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {BOOK_TYPES.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-m2p-ink mb-2">Body font</label>
                <select
                  value={config.bodyFont}
                  onChange={(e) => setConfig((c) => ({ ...c, bodyFont: e.target.value as KdpFormatConfig["bodyFont"] }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-m2p-ivory border border-m2p-border text-m2p-ink focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {BODY_FONTS.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-m2p-ink mb-2">Heading font</label>
                <select
                  value={config.headingFont}
                  onChange={(e) => setConfig((c) => ({ ...c, headingFont: e.target.value as KdpFormatConfig["headingFont"] }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-m2p-ivory border border-m2p-border text-m2p-ink focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {HEADING_FONTS.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Font size</label>
              <select
                value={config.fontSize}
                onChange={(e) => setConfig((c) => ({ ...c, fontSize: Number(e.target.value) as KdpFormatConfig["fontSize"] }))}
                className="w-full px-4 py-2.5 rounded-xl bg-m2p-ivory border border-m2p-border text-m2p-ink focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {FONT_SIZES.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Paragraph style</label>
              <select
                value={config.paragraphStyle}
                onChange={(e) => setConfig((c) => ({ ...c, paragraphStyle: e.target.value as KdpFormatConfig["paragraphStyle"] }))}
                className="w-full px-4 py-2.5 rounded-xl bg-m2p-ivory border border-m2p-border text-m2p-ink focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {PARAGRAPH_STYLES.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Line spacing</label>
              <select
                value={config.lineSpacing}
                onChange={(e) => setConfig((c) => ({ ...c, lineSpacing: Number(e.target.value) as KdpFormatConfig["lineSpacing"] }))}
                className="w-full px-4 py-2.5 rounded-xl bg-m2p-ivory border border-m2p-border text-m2p-ink focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {LINE_SPACING_OPTIONS.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-m2p-ink">Interior</span>
              <label className="flex items-center gap-2 text-m2p-ink">
                <input type="radio" name="interior" checked={config.interiorColor === "bw"} onChange={() => setConfig((c) => ({ ...c, interiorColor: "bw" }))} className="accent-green-500" />
                Black & White
              </label>
              <label className="flex items-center gap-2 text-m2p-ink">
                <input type="radio" name="interior" checked={config.interiorColor === "color"} onChange={() => setConfig((c) => ({ ...c, interiorColor: "color" }))} className="accent-green-500" />
                Color
              </label>
            </div>
            {config.interiorColor === "bw" && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-m2p-ink">Paper</span>
                <label className="flex items-center gap-2 text-m2p-ink">
                  <input type="radio" name="paper" checked={config.paperColor === "white"} onChange={() => setConfig((c) => ({ ...c, paperColor: "white" }))} className="accent-green-500" />
                  White
                </label>
                <label className="flex items-center gap-2 text-m2p-ink">
                  <input type="radio" name="paper" checked={config.paperColor === "cream"} onChange={() => setConfig((c) => ({ ...c, paperColor: "cream" }))} className="accent-green-500" />
                  Cream
                </label>
              </div>
            )}
            <div className="flex items-center gap-3">
              <input type="checkbox" id="bleed" checked={config.bleedImages} onChange={(e) => setConfig((c) => ({ ...c, bleedImages: e.target.checked }))} className="w-4 h-4 rounded accent-green-500" />
              <label htmlFor="bleed" className="text-sm text-m2p-ink">Bleed images (extend to page edges)</label>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-m2p-ink">Front matter</p>
              <label className="flex items-center gap-2 text-m2p-ink">
                <input
                  type="checkbox"
                  checked={!config.frontMatter.titlePage}
                  onChange={(e) => setConfig((c) => ({ ...c, frontMatter: { ...c.frontMatter, titlePage: !e.target.checked } }))}
                  className="accent-green-500"
                />
                My manuscript already has a title page — skip adding one
              </label>
              <label className="flex items-center gap-2 text-m2p-ink">
                <input type="checkbox" checked={config.frontMatter.copyrightPage} onChange={(e) => setConfig((c) => ({ ...c, frontMatter: { ...c.frontMatter, copyrightPage: e.target.checked } }))} className="accent-green-500" />
                Copyright page
              </label>
              <label className="flex items-center gap-2 text-m2p-ink">
                <input type="checkbox" checked={config.frontMatter.toc} onChange={(e) => setConfig((c) => ({ ...c, frontMatter: { ...c.frontMatter, toc: e.target.checked } }))} className="accent-green-500" />
                Table of contents
              </label>
              <label className="flex items-center gap-2 text-m2p-ink">
                <input type="checkbox" checked={config.frontMatter.dedication} onChange={(e) => setConfig((c) => ({ ...c, frontMatter: { ...c.frontMatter, dedication: e.target.checked } }))} className="accent-green-500" />
                Dedication page
              </label>
              {config.frontMatter.dedication && (
                <textarea
                  value={config.frontMatter.dedicationText || ""}
                  onChange={(e) => setConfig((c) => ({ ...c, frontMatter: { ...c.frontMatter, dedicationText: e.target.value } }))}
                  placeholder="Dedication text..."
                  className="w-full px-4 py-2 rounded-xl bg-m2p-ivory border border-m2p-border text-m2p-ink text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="w-full rounded-xl border-2 border-m2p-border text-m2p-ink hover:border-m2p-orange hover:bg-m2p-orange-soft/50 font-semibold py-4 px-6 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-3"
            >
              Skip Review — Generate KDP PDF Directly
            </button>
            <Link href="/kdp-formatter" className="block text-center text-sm text-m2p-muted hover:text-m2p-orange mt-4">Cancel and upload a different file</Link>
          </div>
        )}

        {isProcessing && (
          <div className="rounded-2xl bg-green-500/10 border border-green-500/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-green-300 font-medium">{PROGRESS_STEPS[processingStep]}</p>
            </div>
            <ul className="text-sm text-m2p-muted space-y-1">
              {PROGRESS_STEPS.map((s, i) => (
                <li key={i} className={i <= processingStep ? "text-green-400" : ""}>
                  {i < processingStep ? "✓" : i === processingStep ? "…" : "○"} {s}
                </li>
              ))}
            </ul>
            {processingError && (
              <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">
                {processingError}
                <ErrorRecovery />
              </div>
            )}
          </div>
        )}

        {step === "upload" && (
          <WhatHappensNext
            className="mt-8"
            steps={[
              "We analyse your manuscript — structure and chapters.",
              "You choose trim size, font, and front matter options.",
              "You're sent to the download page to complete payment and download your KDP-ready DOCX or PDF.",
            ]}
          />
        )}
        <p className="text-center text-m2p-muted text-xs mt-8">© manu2print.com — Built for indie authors</p>
      </main>
    </div>
  );
}
