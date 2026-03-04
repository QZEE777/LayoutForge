"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { truncateFilenameMiddle, formatFileSize } from "@/lib/formatFileName";
import { compressPdfInBrowser } from "@/lib/clientPdfCompress";
import { WhatHappensNext } from "@/components/WhatHappensNext";
import { ErrorRecovery } from "@/components/ErrorRecovery";

const MAX_MB = 50;

export default function KdpFormatterPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [doneBlobUrl, setDoneBlobUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState<string>("");

  const validateFile = useCallback((f: File): string | null => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    if (ext !== ".pdf") return "This tool accepts PDF files only.";
    if (f.size > MAX_MB * 1024 * 1024) return `File must be smaller than ${MAX_MB} MB.`;
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
      setDoneBlobUrl(null);
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
      setDoneBlobUrl(null);
    },
    [validateFile]
  );

  const handleOptimize = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);
    setDoneBlobUrl(null);
    try {
      const blob = await compressPdfInBrowser(file, {
        profile: "print",
        onProgress: (page, total) => setProgress(Math.round((100 * page) / total)),
      });
      const url = URL.createObjectURL(blob);
      setDoneBlobUrl(url);
      const base = file.name.replace(/\.pdf$/i, "") || "document";
      setOutputName(`${base}-optimized.pdf`);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Optimization failed.");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [file]);

  const handleReset = useCallback(() => {
    if (doneBlobUrl) URL.revokeObjectURL(doneBlobUrl);
    setDoneBlobUrl(null);
    setOutputName("");
    setFile(null);
    setError(null);
  }, [doneBlobUrl]);

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
            <span className="text-lg font-bold text-white">manu2print</span>
          </Link>
          <Link href="/formatter" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Tools
          </Link>
        </div>
      </header>

      <div className="border-b border-slate-800 bg-red-900/20">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-green-500/20 border border-green-500/30 px-2.5 py-0.5 text-xs font-medium text-green-300">FREE</span>
          <span className="text-sm font-semibold text-white">PDF Print Optimizer</span>
          <span className="mx-2 text-slate-600">|</span>
          <span className="text-sm text-slate-400">Shrink or print-optimize your PDF in your browser. No upload.</span>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">PDF Print Optimizer</h1>
          <p className="mt-2 text-slate-400">Shrink or print-optimize your PDF. FREE. Runs in your browser—your file never leaves your device. PDF only, up to {MAX_MB} MB.</p>
        </div>

        {doneBlobUrl ? (
          <div className="rounded-2xl bg-slate-800/50 border border-red-700/40 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Your PDF is ready</h2>
            </div>
            <p className="text-slate-400 text-sm mb-6">Download your print-optimized PDF.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={doneBlobUrl}
                download={outputName}
                className="rounded-xl bg-red-600 px-6 py-3.5 font-semibold text-white hover:bg-red-700 transition-colors text-center"
              >
                Download optimized PDF
              </a>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-slate-600 px-6 py-3.5 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Optimize another
              </button>
            </div>
          </div>
        ) : (
          <>
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
                disabled={processing}
                className="hidden"
              />
              <label htmlFor="file-input" className={`block cursor-pointer ${processing ? "opacity-50" : ""}`}>
                {file ? (
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-white overflow-hidden text-ellipsis max-w-full" title={file.name}>{truncateFilenameMiddle(file.name)}</p>
                    <p className="mt-1 text-sm text-slate-400">{formatFileSize(file.size)} — ready</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-slate-300 font-medium">Drag and drop a PDF here, or browse</p>
                    <p className="mt-2 text-xs text-slate-500">.pdf only • up to {MAX_MB} MB</p>
                  </div>
                )}
              </label>
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">
                {error}
                <p className="mt-2">
                  <Link href="/pdf-compress" className="text-amber-300 hover:text-white underline">
                    Try our free PDF Compressor for large files →
                  </Link>
                </p>
                <ErrorRecovery />
              </div>
            )}

            {processing && progress > 0 && (
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Processing in your browser…</span>
                  <span className="text-sm text-slate-500">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                  <div className="h-full bg-red-500 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button
                onClick={handleOptimize}
                disabled={!file || processing}
                className="flex-1 rounded-xl bg-red-600 px-6 py-3.5 font-semibold text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? "Optimizing…" : "Optimize PDF"}
              </button>
              {file && !processing && (
                <button
                  onClick={() => { setFile(null); setError(null); }}
                  className="rounded-xl border border-slate-700 px-5 py-3.5 font-medium text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </>
        )}

        <WhatHappensNext
          className="mt-8"
          steps={[
            "You select your PDF (up to 50MB).",
            "We optimize it in your browser for smaller size and print quality — no file is sent to our servers.",
            "You download the optimized PDF when ready.",
          ]}
        />
      </main>
    </div>
  );
}
