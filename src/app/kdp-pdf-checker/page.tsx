"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatFileSize } from "@/lib/formatFileName";
import { WhatHappensNext } from "@/components/WhatHappensNext";
import { ErrorRecovery } from "@/components/ErrorRecovery";
import { ToolBreadcrumb } from "@/components/ToolBreadcrumb";

/** Host body limit (e.g. Vercel 4.5 MB). Files larger than this use direct preflight upload when available. */
const SERVER_MAX_MB = 4;
/** Max PDF size we accept (direct upload to preflight or fallback message). */
const MAX_SELECT_MB = 100;

const PREFLIGHT_POLL_MS = 2500;
const PREFLIGHT_MAX_WAIT_MS = 120000;

export default function KdpPdfCheckerPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preflightUrl = typeof process.env.NEXT_PUBLIC_KDP_PREFLIGHT_API_URL === "string"
    ? process.env.NEXT_PUBLIC_KDP_PREFLIGHT_API_URL.trim()
    : "";

  const validateFile = useCallback((f: File): string | null => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    if (ext !== ".pdf") return "This tool accepts PDF files only.";
    if (f.size === 0) return "File is empty. Please choose a non-empty PDF.";
    if (f.size > MAX_SELECT_MB * 1024 * 1024) return `File must be smaller than ${MAX_SELECT_MB} MB.`;
    return null;
  }, []);

  const fileSizeMB = file ? file.size / (1024 * 1024) : 0;
  const useDirectUpload = preflightUrl && file && fileSizeMB > SERVER_MAX_MB && fileSizeMB <= MAX_SELECT_MB;
  const fileTooBigForServer = file
    ? fileSizeMB > SERVER_MAX_MB && !preflightUrl
    : false;

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

  const handleSubmit = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    const fileSizeMB = file.size / (1024 * 1024);
    try {
      if (useDirectUpload && preflightUrl) {
        const url = preflightUrl.replace(/\/$/, "");
        const form = new FormData();
        form.append("file", file, file.name.toLowerCase().endsWith(".pdf") ? file.name : "document.pdf");
        let res = await fetch(`${url}/upload`, { method: "POST", body: form });
        if (!res.ok) throw new Error("Upload to checker failed. Try again.");
        const { job_id } = (await res.json()) as { job_id: string };
        const deadline = Date.now() + PREFLIGHT_MAX_WAIT_MS;
        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, PREFLIGHT_POLL_MS));
          res = await fetch(`${url}/status/${job_id}`);
          if (!res.ok) continue;
          const statusData = (await res.json()) as { status: string; report?: unknown };
          if (statusData.status === "completed") break;
          if (statusData.status === "failed") throw new Error("Check failed. Try again.");
        }
        const saveRes = await fetch("/api/kdp-pdf-check-from-preflight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: job_id, fileSizeMB: Math.round(fileSizeMB * 100) / 100 }),
        });
        const saveData = (await saveRes.json()) as { id?: string; message?: string };
        if (!saveRes.ok) throw new Error(saveData.message || "Could not save report.");
        if (saveData.id) router.push(`/download/${saveData.id}?source=checker`);
        else throw new Error("No report ID returned.");
        return;
      }
      const formData = new FormData();
      formData.append("file", file, file.name.toLowerCase().endsWith(".pdf") ? file.name : "document.pdf");
      const res = await fetch("/api/kdp-pdf-check", { method: "POST", body: formData });
      const raw = await res.text();
      let data: { message?: string; id?: string };
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      if (!res.ok) {
        const msg =
          res.status === 413 && file
            ? `Your file is ${formatFileSize(file.size)}. This tool accepts up to ${SERVER_MAX_MB} MB per upload. Use our free PDF Compressor to shrink it first, then return here.`
            : data?.message || `Check failed (${res.status}). Try a smaller file or try again.`;
        throw new Error(msg);
      }
      if (data.id) router.push(`/download/${data.id}?source=checker`);
      else throw new Error("No report ID returned.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Check failed";
      const isFailedFetch = msg === "Failed to fetch";
      const fileOverLimit = file && file.size > SERVER_MAX_MB * 1024 * 1024;
      setError(
        isFailedFetch && fileOverLimit
          ? `Upload failed — files over ${SERVER_MAX_MB} MB can't be sent through this page. Use our PDF Compressor to shrink the file first, then try again.`
          : msg
      );
    } finally {
      setUploading(false);
    }
  }, [file, router, useDirectUpload, preflightUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-lg font-bold text-white">manu2print</span>
          </Link>
          <Link href="/platform/kdp" className="text-sm text-slate-400 hover:text-white transition-colors">
            All Tools
          </Link>
        </div>
      </header>

      <div className="border-b border-slate-800 bg-amber-500/10">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-xs font-medium text-amber-300">Paid</span>
          <span className="text-sm font-semibold text-white">KDP Preflight</span>
          <span className="mx-2 text-slate-600">|</span>
          <span className="text-sm text-slate-400">Full PDF validation: 26 KDP rules, trim, margins, bleed — pass/fail before you upload</span>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <ToolBreadcrumb backHref="/" backLabel="All Tools" currentLabel="KDP Preflight" className="mb-6" />
        <h1 className="text-3xl font-bold text-white">KDP Preflight</h1>
        <p className="mt-2 text-slate-400">Upload your interior PDF. We’ll report trim size, page count, and any issues so you can fix before uploading to KDP. Max {MAX_SELECT_MB} MB. $7 per use or $27 for 6 months.</p>
        <p className="mt-2 text-slate-500 text-sm">Many indies design in Canva (or similar) and upload the PDF they export — we'll check that PDF against KDP specs. If you format from Word, use <Link href="/kdp-formatter" className="text-amber-300 hover:text-amber-200 underline">KDP Formatter (DOCX)</Link> for your print PDF.</p>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-8 rounded-2xl border-2 border-dashed p-14 text-center transition-all ${
            isDragging ? "border-amber-400 bg-amber-500/10" : "border-slate-700 bg-slate-800/40 hover:border-slate-500"
          }`}
        >
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="checker-file"
          />
          <label htmlFor="checker-file" className="cursor-pointer block">
            {file ? (
              <div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-sm text-slate-400 mt-1">{formatFileSize(file.size)} — ready to check</p>
              </div>
            ) : (
              <p className="text-slate-400">Drop your PDF here or click to choose</p>
            )}
          </label>
        </div>

        {file && useDirectUpload && (
          <div className="mt-4 rounded-lg bg-slate-700/50 border border-slate-600 p-3 text-sm text-slate-300">
            Your file is <strong>{formatFileSize(file.size)}</strong>. Files over {SERVER_MAX_MB} MB are sent directly to the checker (you’ll get the full report; the on-page visual overlay is only for files under {SERVER_MAX_MB} MB).
          </div>
        )}
        {file && fileTooBigForServer && (
          <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-200">
            Your file is <strong>{formatFileSize(file.size)}</strong>. For files over {SERVER_MAX_MB} MB, use our free{" "}
            <Link href="/pdf-compress" className="underline font-medium text-amber-200 hover:text-white">
              PDF Compressor
            </Link>{" "}
            first, then check again (or try again later for large-file support).
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
            {file && (
              <p className="mt-2">
                <Link href="/pdf-compress" className="text-amber-300 hover:text-white underline">
                  Use our free PDF Compressor →
                </Link>
              </p>
            )}
            <ErrorRecovery />
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!file || uploading || fileTooBigForServer}
            className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 transition-colors"
          >
            {uploading ? "Checking…" : "Check PDF"}
          </button>
          {file && (
            <button
              type="button"
              onClick={() => { setFile(null); setError(null); }}
              className="rounded-xl border border-slate-600 text-slate-400 hover:bg-slate-800 py-3 px-6 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <WhatHappensNext
          className="mt-8"
          steps={[
            "We check your PDF: trim size, page count (24–828), and file size.",
            "You're redirected to the download page with your report (issues and what to fix).",
            "Complete payment and download your KDP format report.",
          ]}
        />
      </main>
    </div>
  );
}
