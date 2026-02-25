"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MAX_MB = 50;

export default function KdpFormatterPdfPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);

  const validateFile = useCallback((f: File): string | null => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    if (ext !== ".pdf") return "This tool accepts PDF files only.";
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
      const selected = e.target.files?.[0];
      if (!selected) return;
      const err = validateFile(selected);
      if (err) {
        setError(err);
        setFile(null);
        return;
      }
      setError(null);
      setFile(selected);
    },
    [validateFile]
  );

  const [progressLabel, setProgressLabel] = useState<string>("");

  const pollStatus = useCallback(
    async (id: string, jId: string) => {
      const res = await fetch(
        `/api/cloudconvert-job-status?jobId=${encodeURIComponent(jId)}&toolType=kdp-formatter-pdf&id=${encodeURIComponent(id)}`
      );
      const data = await res.json();
      if (data.status === "done") return { done: true, id };
      if (data.status === "error") throw new Error(data.message || "Conversion failed.");
      return { done: false };
    },
    []
  );

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError(null);
    setConverting(false);
    setJobId(null);
    setFileId(null);
    setProgressLabel("Preparing upload…");

    try {
      setProgress(5);
      const initRes = await fetch("/api/cloudconvert-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          filesize: file.size,
          toolType: "kdp-formatter-pdf",
        }),
      });
      if (!initRes.ok) {
        const data = await initRes.json().catch(() => ({}));
        throw new Error(data.message || "Could not get upload URL.");
      }
      const initData = await initRes.json();
      const { id, jobId: jId, uploadUrl, formData: formParams } = initData;
      if (!id || !jId || !uploadUrl || !formParams) throw new Error("Server did not return upload details.");
      setFileId(id);
      setJobId(jId);
      setProgress(10);
      setProgressLabel("Uploading…");

      const uploadForm = new FormData();
      for (const [key, val] of Object.entries(formParams)) uploadForm.append(key, val as string);
      const inputFilename = file.name.toLowerCase().endsWith(".pdf") ? file.name : "document.pdf";
      uploadForm.append("file", file, inputFilename);

      const uploadRes = await fetch(uploadUrl, { method: "POST", body: uploadForm });
      if (!uploadRes.ok && uploadRes.status !== 204) {
        throw new Error(`Upload failed (${uploadRes.status}). Try again.`);
      }
      setProgress(40);
      setProgressLabel("Processing…");
      setConverting(true);

      while (true) {
        setProgress((p) => Math.min(p + 5, 90));
        const result = await pollStatus(id, jId);
        if (result.done) {
          setProgress(100);
          setProgressLabel("Ready to download");
          router.push(`/download/${id}?source=pdf`);
          return;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
      setConverting(false);
      setProgressLabel("");
    }
  }, [file, router, pollStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-red-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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

      <div className="border-b border-slate-800 bg-red-900/20">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 text-xs font-medium text-red-300">PDF</span>
          <span className="text-sm font-semibold text-white">KDP Formatter (PDF)</span>
          <span className="mx-2 text-slate-600">|</span>
          <span className="text-sm text-slate-400">Convert PDF to KDP-ready print PDF</span>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Upload your PDF</h1>
          <p className="mt-2 text-slate-400">PDF only. Maximum {MAX_MB}MB.</p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-14 text-center transition-all ${
            isDragging ? "border-red-400 bg-red-500/10" : "border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/60"
          }`}
        >
          <input
            type="file"
            id="file-input"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <label htmlFor="file-input" className={`block cursor-pointer ${uploading ? "opacity-50" : ""}`}>
            {file ? (
              <div>
                <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-white">{file.name}</p>
                <p className="mt-1 text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB — ready to upload</p>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-slate-300 font-medium">Drag and drop a PDF here, or browse</p>
                <p className="mt-2 text-xs text-slate-500">.pdf only • up to {MAX_MB}MB</p>
              </div>
            )}
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">{error}</div>
        )}

        {uploading && progress > 0 && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">{progressLabel || (converting ? "Processing…" : "Uploading…")}</span>
              <span className="text-sm text-slate-500">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-700">
              <div className="h-full bg-red-500 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 rounded-xl bg-red-600 px-6 py-3.5 font-semibold text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (converting ? "Converting…" : "Uploading…") : "Upload & Convert"}
          </button>
          {file && !uploading && (
            <button
              onClick={() => {
                setFile(null);
                setError(null);
              }}
              className="rounded-xl border border-slate-700 px-5 py-3.5 font-medium text-slate-400 hover:bg-slate-800 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="mt-8 rounded-xl bg-slate-800/40 border border-slate-700/60 p-4 text-sm text-slate-400 space-y-1">
          <p className="font-medium text-slate-300">What happens next:</p>
          <p>1. Your PDF is sent to CloudConvert for KDP-ready conversion.</p>
          <p>2. When done, you are redirected to the download page.</p>
          <p>3. Download your print-ready PDF for Amazon KDP.</p>
        </div>
      </main>
    </div>
  );
}
