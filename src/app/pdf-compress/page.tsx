"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

const MAX_MB = 50;

export default function PdfCompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; outputFilename: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setError(null);
    setDone(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (!f.name.toLowerCase().endsWith(".pdf") && f.type !== "application/pdf") {
      setError("Please select a PDF file.");
      setFile(null);
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB}MB.`);
      setFile(null);
      return;
    }
    setFile(f);
  };

  const pollStatus = useCallback(async (id: string, jobId: string) => {
    const res = await fetch(`/api/pdf-compress/status?id=${encodeURIComponent(id)}&jobId=${encodeURIComponent(jobId)}`);
    const data = await res.json();
    if (data.status === "done") return { done: true, id: data.id, outputFilename: data.outputFilename };
    if (data.status === "error") throw new Error(data.message || "Compression failed.");
    return { done: false };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email to get your compressed PDF.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setDone(null);
    setCompressing(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("email", trimmedEmail);
      const progressInterval = setInterval(() => setProgress((p) => Math.min(p + 10, 85)), 200);
      const response = await fetch("/api/pdf-compress", { method: "POST", body: formData });
      clearInterval(progressInterval);
      setProgress(90);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Compression start failed.");
      }

      const data = await response.json();
      const id = data.id;
      const jobId = data.jobId;
      if (!id || !jobId) throw new Error("Server did not return id or jobId.");

      while (true) {
        const result = await pollStatus(id, jobId);
        if (result.done && result.outputFilename) {
          setProgress(100);
          setDone({ id, outputFilename: result.outputFilename });
          return;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compression failed.");
    } finally {
      setCompressing(false);
      setProgress(0);
    }
  }, [file, email, pollStatus]);

  const downloadUrl = done ? `/api/download/${done.id}/${encodeURIComponent(done.outputFilename)}` : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
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
          <span className="inline-flex items-center rounded-full bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 text-xs font-medium text-red-300">Free</span>
          <span className="text-sm font-semibold text-white">PDF Compressor</span>
          <span className="mx-2 text-slate-600">|</span>
          <span className="text-sm text-slate-400">Shrink PDFs for our keyword & description tools. Email required.</span>
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-xl w-full px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">Free PDF Compressor</h1>
        <p className="text-slate-400 mb-8">
          Compress your PDF so it’s under 4MB and ready for our 7 Keyword Research and Amazon Description Generator tools. We’ll send you the download link—no signup beyond your email.
        </p>

        {done ? (
          <div className="rounded-2xl bg-slate-800/50 border border-red-700/40 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Your PDF is ready</h2>
            </div>
            <p className="text-slate-400 text-sm mb-6">Download your compressed PDF below. Use it in our Keyword Research or Description Generator (under 4MB).</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={downloadUrl ?? "#"}
                download={done.outputFilename}
                className="rounded-xl bg-red-600 px-6 py-3.5 font-semibold text-white hover:bg-red-700 transition-colors text-center"
              >
                Download compressed PDF
              </a>
              <button
                type="button"
                onClick={() => { setDone(null); setFile(null); setEmail(""); setError(null); }}
                className="rounded-xl border border-slate-600 px-6 py-3.5 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Compress another
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-800/50 border border-red-700/40 p-6 mb-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">PDF file</label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={compressing}
                className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white file:font-medium file:hover:bg-red-700"
              />
              {file && <p className="mt-2 text-slate-500 text-sm">Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Your email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="you@example.com"
                disabled={compressing}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
              <p className="mt-1.5 text-xs text-slate-500">We use this only to deliver your file. No spam.</p>
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">{error}</div>}
            {compressing && progress > 0 && (
              <div>
                <div className="mb-2 flex justify-between text-sm text-slate-400">
                  <span>{progress < 90 ? "Uploading…" : "Compressing…"}</span>
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
              disabled={!file || !email.trim() || compressing}
              className="w-full rounded-xl bg-red-600 px-6 py-3.5 font-semibold text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {compressing ? "Compressing…" : "Compress PDF (free)"}
            </button>
          </div>
        )}

        <p className="text-slate-500 text-sm mt-6">
          After compressing, use your PDF in <Link href="/keyword-research-pdf" className="text-red-400 hover:text-red-300">7 Keyword Research</Link> or{" "}
          <Link href="/description-generator-pdf" className="text-red-400 hover:text-red-300">Amazon Description Generator</Link> (both accept PDFs under 4MB).
        </p>
      </main>
    </div>
  );
}
