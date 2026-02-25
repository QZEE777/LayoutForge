"use client";

import { useState } from "react";
import Link from "next/link";
import { truncateFilenameMiddle, formatFileSize } from "@/lib/formatFileName";

export default function KeywordResearchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[] | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setError(null);
    setKeywords(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please choose a .docx file first.");
      return;
    }
    setError(null);
    setKeywords(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/keyword-research", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Something went wrong.");
        return;
      }
      setKeywords(data.keywords || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
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

      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">7 Keyword Research</h1>
        <p className="text-slate-400 mb-8">
          Upload your manuscript (.docx or .pdf). Claude suggests 7 Amazon KDP keyword phrases from the first 3,000 words.
        </p>

        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/60 p-6 mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-2">Manuscript file</label>
          <input
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white file:font-medium"
          />
          {file && (
          <div className="mt-2">
            <p className="text-slate-500 text-sm overflow-hidden text-ellipsis max-w-full" title={file.name}>Selected: {truncateFilenameMiddle(file.name)}</p>
            <p className="text-slate-500 text-xs mt-0.5">{formatFileSize(file.size)}</p>
          </div>
        )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !file}
            className="mt-4 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Getting keywords…" : "Get 7 Keywords"}
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm mb-8">{error}</div>
        )}

        {keywords && keywords.length > 0 && (
          <div className="rounded-2xl bg-slate-800/50 border border-slate-700/60 p-6">
            <h2 className="text-lg font-bold text-white mb-3">7 Amazon KDP keyword phrases</h2>
            <ul className="flex flex-wrap gap-2">
              {keywords.map((kw, i) => (
                <li key={i} className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 text-sm text-emerald-200 font-medium">
                  {kw}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
