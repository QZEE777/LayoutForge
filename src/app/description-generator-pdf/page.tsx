"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { truncateFilenameMiddle, formatFileSize } from "@/lib/formatFileName";

const MAX_MB = 50;
const MAX_SIZE_BYTES = MAX_MB * 1024 * 1024;
const SIZE_ERROR_MESSAGE = `File must be under ${MAX_MB}MB.`;

interface Result {
  amazonDescription: string;
  authorBioTemplate: string;
  seoKeywords: string[];
  bisacCategories: Array<{ code: string; explanation: string }>;
}

export default function DescriptionGeneratorPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setResult(null);
    if (!f) {
      setFile(null);
      setError(null);
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setFile(null);
      setError(SIZE_ERROR_MESSAGE);
      return;
    }
    setFile(f);
    setError(null);
  };

  const pollStatus = useCallback(async (jobId: string) => {
    const res = await fetch(
      `/api/cloudconvert-job-status?jobId=${encodeURIComponent(jobId)}&toolType=description-generator-pdf`
    );
    const data = await res.json();
    if (data.status === "done")
      return {
        done: true,
        amazonDescription: data.amazonDescription,
        authorBioTemplate: data.authorBioTemplate,
        seoKeywords: data.seoKeywords,
        bisacCategories: data.bisacCategories,
      };
    if (data.status === "error") throw new Error(data.message || "Processing failed.");
    return { done: false };
  }, []);

  const handleSubmit = async () => {
    if (!file) {
      setError("Please choose a PDF file first.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(SIZE_ERROR_MESSAGE);
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    setProgress(0);
    setProgressLabel("Preparing upload…");

    try {
      setProgress(5);
      const initRes = await fetch("/api/cloudconvert-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          filesize: file.size,
          toolType: "description-generator-pdf",
        }),
      });
      if (!initRes.ok) {
        const data = await initRes.json().catch(() => ({}));
        throw new Error(data.message || "Could not get upload URL.");
      }
      const initData = await initRes.json();
      const { jobId, uploadUrl, formData: formParams } = initData;
      if (!jobId || !uploadUrl || !formParams) throw new Error("Server did not return upload details.");
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

      while (true) {
        setProgress((p) => Math.min(p + 5, 90));
        const pollResult = await pollStatus(jobId);
        if (pollResult.done && "amazonDescription" in pollResult && pollResult.amazonDescription) {
          setProgress(100);
          setProgressLabel("Ready");
          setResult({
            amazonDescription: pollResult.amazonDescription,
            authorBioTemplate: pollResult.authorBioTemplate ?? "",
            seoKeywords: pollResult.seoKeywords ?? [],
            bisacCategories: pollResult.bisacCategories ?? [],
          });
          return;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
      setProgress(0);
      setProgressLabel("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-red-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">manu2print</span>
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
          <span className="text-sm font-semibold text-white">Amazon Description Generator (PDF)</span>
          <span className="mx-2 text-slate-600">|</span>
          <span className="text-sm text-slate-400">Description, author bio, SEO & BISAC from PDF</span>
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">Amazon Description Generator (PDF)</h1>
        <p className="text-slate-400 mb-8">
          Upload your PDF manuscript (up to {MAX_MB}MB). We use the first 1,000 words to generate a KDP-ready description, author bio template, SEO keywords, and BISAC suggestions. Text-based PDFs only (not scans).
        </p>

        <div className="rounded-2xl bg-slate-800/50 border border-red-700/40 p-6 mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-2">Manuscript file (PDF only, max {MAX_MB}MB)</label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white file:font-medium file:hover:bg-red-700"
          />
          {file && (
          <div className="mt-2">
            <p className="text-slate-500 text-sm overflow-hidden text-ellipsis max-w-full" title={file.name}>Selected: {truncateFilenameMiddle(file.name)}</p>
            <p className="text-slate-500 text-xs mt-0.5">{formatFileSize(file.size)}</p>
          </div>
        )}
          {loading && progress > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-sm text-slate-400">
                <span>{progressLabel}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                <div className="h-full bg-red-500 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !file}
            className="mt-4 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (progressLabel || "Analyzing…") : "Analyze Manuscript"}
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm mb-8">
            {error}
            {error === SIZE_ERROR_MESSAGE && (
              <Link href="/pdf-compress" className="mt-2 block text-red-300 hover:text-red-200 font-medium">
                Free PDF Compressor →
              </Link>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-8">
            <div className="rounded-2xl bg-slate-800/50 border border-red-700/40 p-6">
              <h2 className="text-lg font-bold text-white mb-3">Amazon book description (KDP-ready HTML)</h2>
              <div className="rounded-lg bg-slate-900/60 border border-slate-700 p-4 text-slate-300 text-sm leading-relaxed prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: result.amazonDescription }} />
            </div>
            <div className="rounded-2xl bg-slate-800/50 border border-red-700/40 p-6">
              <h2 className="text-lg font-bold text-white mb-3">Author bio template</h2>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{result.authorBioTemplate}</p>
            </div>
            <div className="rounded-2xl bg-slate-800/50 border border-red-700/40 p-6">
              <h2 className="text-lg font-bold text-white mb-3">7 SEO keywords</h2>
              <ul className="flex flex-wrap gap-2">
                {result.seoKeywords.map((kw, i) => (
                  <li key={i} className="rounded-lg bg-red-900/30 border border-red-700/40 px-3 py-1.5 text-sm text-slate-200">{kw}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-slate-800/50 border border-red-700/40 p-6">
              <h2 className="text-lg font-bold text-white mb-3">2 recommended BISAC categories</h2>
              <ul className="space-y-4">
                {result.bisacCategories.map((b, i) => (
                  <li key={i} className="border-l-2 border-red-500 pl-4">
                    <span className="font-mono text-red-400">{b.code}</span>
                    <p className="text-slate-300 text-sm mt-1">{b.explanation}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
