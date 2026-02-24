"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface Result {
  amazonDescription: string;
  authorBioTemplate: string;
  seoKeywords: string[];
  bisacCategories: Array<{ code: string; explanation: string }>;
}

export default function DescriptionGeneratorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setError(null);
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please choose a .docx file first.");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/description-generator", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Something went wrong.");
        return;
      }
      setResult(data);
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-white">Amazon Description Generator</span>
            <span className="mx-2 text-slate-600">|</span>
            <span className="text-sm text-slate-400">DOCX — description, author bio, SEO & BISAC</span>
          </div>
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">Amazon Description Generator</h1>
        <p className="text-slate-400 mb-8">
          Upload your manuscript (.docx). We use the first 3,000 words to generate a KDP-ready description, author bio template, SEO keywords, and BISAC suggestions.
        </p>

        <div className="rounded-2xl bg-slate-800/50 border border-green-700/40 p-6 mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-2">Manuscript file</label>
          <input
            ref={inputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-600 file:text-white file:font-medium file:hover:bg-green-700"
          />
          {file && <p className="mt-2 text-slate-500 text-sm">Selected: {file.name}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !file}
            className="mt-4 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Analyzing…" : "Analyze Manuscript"}
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm mb-8">{error}</div>
        )}

        {result && (
          <div className="space-y-8">
            <div className="rounded-2xl bg-slate-800/50 border border-green-700/40 p-6">
              <h2 className="text-lg font-bold text-white mb-3">Amazon book description (KDP-ready HTML)</h2>
              <div className="rounded-lg bg-slate-900/60 border border-slate-700 p-4 text-slate-300 text-sm leading-relaxed prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: result.amazonDescription }} />
            </div>
            <div className="rounded-2xl bg-slate-800/50 border border-green-700/40 p-6">
              <h2 className="text-lg font-bold text-white mb-3">Author bio template</h2>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{result.authorBioTemplate}</p>
            </div>
            <div className="rounded-2xl bg-slate-800/50 border border-green-700/40 p-6">
              <h2 className="text-lg font-bold text-white mb-3">7 SEO keywords</h2>
              <ul className="flex flex-wrap gap-2">
                {result.seoKeywords.map((kw, i) => (
                  <li key={i} className="rounded-lg bg-green-900/30 border border-green-700/40 px-3 py-1.5 text-sm text-slate-200">{kw}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-slate-800/50 border border-green-700/40 p-6">
              <h2 className="text-lg font-bold text-white mb-3">2 recommended BISAC categories</h2>
              <ul className="space-y-4">
                {result.bisacCategories.map((b, i) => (
                  <li key={i} className="border-l-2 border-green-500 pl-4">
                    <span className="font-mono text-green-400">{b.code}</span>
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
