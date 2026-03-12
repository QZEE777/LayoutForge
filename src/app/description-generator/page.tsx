"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { truncateFilenameMiddle, formatFileSize } from "@/lib/formatFileName";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

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
    <div className="min-h-screen bg-m2p-ivory flex flex-col">
      <header className="border-b border-m2p-border bg-m2p-ivory backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-lg font-bold text-m2p-ink">manu2print</span>
          </Link>
          <Link href="/" className="text-sm text-m2p-muted hover:text-m2p-orange transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Tools
          </Link>
        </div>
      </header>

      {/* Tool banner */}
      <div className="border-b border-m2p-border bg-m2p-orange-soft">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-600/30 border border-green-500/30 flex items-center justify-center text-green-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-m2p-ink">Amazon Description Generator</span>
            <span className="mx-2 text-m2p-muted">|</span>
            <span className="text-sm text-m2p-muted">DOCX — description, author bio, SEO & BISAC</span>
          </div>
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-10">
        <div className="flex items-center justify-center gap-2 mb-6 w-full">
          <Image src="/MANNY AVATAR.png" alt="Manny" width={70} height={70} style={{ borderRadius: "50%" }} />
          <span><span style={{ color: "#F05A28", fontWeight: "bold" }}>manu</span><span style={{ color: "#4cd964", fontWeight: "bold" }}>2print</span></span>
        </div>
        <h1 className="text-3xl font-bold text-m2p-ink mb-2">Amazon Description Generator</h1>
        <p className="text-m2p-muted mb-8">
          Upload your manuscript (.docx). We use the first 3,000 words to generate a KDP-ready description, author bio template, SEO keywords, and BISAC suggestions.
        </p>

        <div className="rounded-2xl bg-m2p-orange-soft/50 border border-m2p-border p-6 mb-8">
          <label className="block text-sm font-medium text-m2p-ink mb-2">Manuscript file</label>
          <input
            ref={inputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="block w-full text-sm text-m2p-ink file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-600 file:text-white file:font-medium file:hover:bg-green-700"
          />
          {file && (
            <div className="mt-2">
              <p className="text-m2p-muted text-sm overflow-hidden text-ellipsis max-w-full" title={file.name}>
                {truncateFilenameMiddle(file.name)}
              </p>
              <p className="text-m2p-muted text-xs mt-0.5">{formatFileSize(file.size)}</p>
            </div>
          )}
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
            <div className="rounded-2xl bg-m2p-orange-soft/50 border border-m2p-border p-6">
              <h2 className="text-lg font-bold text-white mb-3">Amazon book description (KDP-ready HTML)</h2>
              <div className="rounded-lg bg-m2p-ivory border border-m2p-border p-4 text-m2p-ink text-sm leading-relaxed prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(result.amazonDescription) }} />
            </div>
            <div className="rounded-2xl bg-m2p-orange-soft/50 border border-m2p-border p-6">
              <h2 className="text-lg font-bold text-white mb-3">Author bio template</h2>
              <p className="text-m2p-ink text-sm leading-relaxed whitespace-pre-wrap">{result.authorBioTemplate}</p>
            </div>
            <div className="rounded-2xl bg-m2p-orange-soft/50 border border-m2p-border p-6">
              <h2 className="text-lg font-bold text-white mb-3">7 SEO keywords</h2>
              <ul className="flex flex-wrap gap-2">
                {result.seoKeywords.map((kw, i) => (
                  <li key={i} className="rounded-lg bg-green-900/30 border border-green-700/40 px-3 py-1.5 text-sm text-m2p-ink">{kw}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-m2p-orange-soft/50 border border-m2p-border p-6">
              <h2 className="text-lg font-bold text-white mb-3">2 recommended BISAC categories</h2>
              <ul className="space-y-4">
                {result.bisacCategories.map((b, i) => (
                  <li key={i} className="border-l-2 border-green-500 pl-4">
                    <span className="font-mono text-green-400">{b.code}</span>
                    <p className="text-m2p-ink text-sm mt-1">{b.explanation}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <p className="text-center text-m2p-muted text-xs mt-8">© manu2print.com — Built for indie authors</p>
      </main>
    </div>
  );
}
