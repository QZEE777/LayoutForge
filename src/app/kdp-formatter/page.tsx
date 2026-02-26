"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { truncateFilenameMiddle, formatFileSize } from "@/lib/formatFileName";

const ALLOWED_TYPES = [".docx"];
const MAX_MB = 50;

export default function KdpFormatterPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((f: File): string | null => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    if (!ALLOWED_TYPES.includes(ext)) {
      return "Only .docx files are accepted.";
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      return `File must be smaller than ${MAX_MB}MB.`;
    }
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
      const validationError = validateFile(droppedFile);
      if (validationError) {
        setError(validationError);
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
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
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

      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 15, 90));
      }, 100);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Upload failed");
      }

      const data = await response.json();
      setProgress(100);
      router.push(`/preview/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      setProgress(0);
    }
  }, [file, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-green-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">ScribeStack</span>
          </Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Tools
          </Link>
        </div>
      </header>

      {/* Tool banner */}
      <div className="border-b border-slate-800 bg-green-900/20">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-600/30 border border-green-500/30 flex items-center justify-center text-green-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-white">KDP Formatter</span>
            <span className="mx-2 text-slate-600">|</span>
            <span className="text-sm text-slate-400">Format your manuscript for Amazon KDP print</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Upload your manuscript</h1>
          <p className="mt-2 text-slate-400">
            Supports DOCX only. Maximum {MAX_MB}MB.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="mb-8 flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-green-400 font-medium">
            <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">1</span>
            Upload
          </span>
          <span className="text-slate-700 mx-1">——</span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-xs">2</span>
            Configure
          </span>
          <span className="text-slate-700 mx-1">——</span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-xs">3</span>
            Download
          </span>
        </div>

        {/* Upload area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-14 text-center transition-all ${
            isDragging
              ? "border-green-400 bg-green-500/10"
              : "border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/60"
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
          <label
            htmlFor="file-input"
            className={`block cursor-pointer ${uploading ? "opacity-50" : ""}`}
          >
            {file ? (
              <div>
                <div className="w-12 h-12 rounded-xl bg-green-600/20 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-white overflow-hidden text-ellipsis max-w-full" title={file.name}>{truncateFilenameMiddle(file.name)}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {formatFileSize(file.size)} — ready to upload
                </p>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-slate-300 font-medium">
                  Drag and drop here, or{" "}
                  <span className="text-green-400 hover:text-green-300">browse files</span>
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  .docx only • up to {MAX_MB}MB
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Progress bar */}
        {uploading && progress > 0 && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Uploading...</span>
              <span className="text-sm text-slate-500">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full bg-green-500 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 rounded-xl bg-green-600 px-6 py-3.5 font-semibold text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? "Uploading..." : "Upload & Continue"}
          </button>
          {file && !uploading && (
            <button
              onClick={() => { setFile(null); setError(null); }}
              className="rounded-xl border border-slate-700 px-5 py-3.5 font-medium text-slate-400 hover:bg-slate-800 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 rounded-xl bg-slate-800/40 border border-slate-700/60 p-4 text-sm text-slate-400 space-y-1">
          <p className="font-medium text-slate-300">What happens next:</p>
          <p>1. We analyse your manuscript — word count, chapters, structure</p>
          <p>2. You choose KDP trim size, font size, and bleed settings</p>
          <p>3. Download your print-ready PDF for Amazon KDP</p>
        </div>
      </main>
    </div>
  );
}
