"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { KDP_TRIM_SIZES, type TrimSizeId } from "@/lib/kdpSpecs";

interface ManuscriptInfo {
  wordCount: number;
  chapterCount: number;
  title: string;
  estimatedPages: number;
  previewText?: string;
}

type GenerateStatus = "idle" | "starting" | "processing" | "done" | "error";

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [info, setInfo]       = useState<ManuscriptInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // KDP options
  const [trimSize, setTrimSize]   = useState<TrimSizeId>("6x9");
  const [withBleed, setWithBleed] = useState(false);
  const [fontSize, setFontSize]   = useState(11);

  // Generation state
  const [genStatus, setGenStatus]   = useState<GenerateStatus>("idle");
  const [genMessage, setGenMessage] = useState("");
  const [pollCount, setPollCount]   = useState(0);

  // Load manuscript info
  useEffect(() => {
    if (!id) { setError("Invalid file ID"); setLoading(false); return; }

    async function loadInfo() {
      try {
        const res = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to load manuscript info");
        }
        const data = await res.json();
        setInfo({
          wordCount: data.wordCount,
          chapterCount: data.chapterCount,
          title: data.title,
          estimatedPages: data.estimatedPages,
          previewText: data.previewText,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load info");
      } finally {
        setLoading(false);
      }
    }
    loadInfo();
  }, [id]);

  // Poll for generation status
  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/generate/status?id=${id}`);
      const data = await res.json();

      if (data.status === "done") {
        setGenStatus("done");
        setGenMessage("Your KDP PDF is ready!");
        router.push(`/download/${id}`);
        return;
      }

      if (data.status === "error") {
        setGenStatus("error");
        setGenMessage(data.message || "Conversion failed. Please try again.");
        return;
      }

      // Still processing — increment counter (triggers next useEffect poll)
      setPollCount((c) => c + 1);
    } catch {
      setGenStatus("error");
      setGenMessage("Lost connection. Please try again.");
    }
  }, [id, router]);

  // Auto-poll when processing
  useEffect(() => {
    if (genStatus !== "processing") return;
    const timer = setTimeout(pollStatus, 3000);
    return () => clearTimeout(timer);
  }, [genStatus, pollCount, pollStatus]);

  const handleGenerate = async () => {
    if (!id) return;
    setGenStatus("starting");
    setGenMessage("Uploading to conversion service...");
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, trimSize, withBleed, fontSize }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Generation failed");
      }

      const data = await res.json();

      if (data.status === "done") {
        // Synchronous fallback (local dev, no API key)
        router.push(`/download/${id}`);
        return;
      }

      // Async — start polling
      setGenStatus("processing");
      setGenMessage("Converting your manuscript... this takes 15–60 seconds.");
      setPollCount(0);

    } catch (err) {
      setGenStatus("error");
      setGenMessage(err instanceof Error ? err.message : "Generation failed");
    }
  };

  const isGenerating = genStatus === "starting" || genStatus === "processing";

  // ---- Loading state ----
  if (!id) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <p className="text-red-400">Invalid file ID.</p>
        <Link href="/kdp-formatter" className="mt-4 block text-blue-400 hover:underline">Upload a file</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Analysing your manuscript...</p>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <p className="text-red-400">{error || "Could not load manuscript information."}</p>
        <Link href="/kdp-formatter" className="mt-4 block text-blue-400 hover:underline">Upload another file</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">ScribeStack</span>
          </Link>
          <Link href="/kdp-formatter" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            New upload
          </Link>
        </div>
      </header>

      {/* Steps */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-xs">1</span>
            Upload
          </span>
          <span className="text-slate-700 mx-1">——</span>
          <span className="flex items-center gap-1.5 text-blue-400 font-medium">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
            Configure
          </span>
          <span className="text-slate-700 mx-1">——</span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-xs">3</span>
            Download
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-10">

        {/* Manuscript summary card */}
        <div className="mb-8 rounded-2xl bg-slate-800/50 border border-slate-700/60 p-6">
          <h1 className="text-2xl font-bold text-white mb-4 truncate">{info.title || "Your Manuscript"}</h1>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500 mb-1">Words</p>
              <p className="text-xl font-bold text-white">{info.wordCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Chapters</p>
              <p className="text-xl font-bold text-white">{info.chapterCount}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Est. pages</p>
              <p className="text-xl font-bold text-white">{info.estimatedPages}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Status</p>
              <p className="text-xl font-bold text-green-400">Ready</p>
            </div>
          </div>
        </div>

        {/* Preview text */}
        {info.previewText && (
          <div className="mb-8 rounded-2xl bg-slate-800/50 border border-slate-700/60 p-6">
            <h2 className="text-base font-semibold text-white mb-3">Content Preview</h2>
            <div className="max-h-48 overflow-y-auto rounded-lg bg-slate-900/60 border border-slate-700 p-4 font-mono text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {info.previewText}
            </div>
          </div>
        )}

        {/* KDP Options */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/60 p-6 space-y-6">
          <h2 className="text-lg font-bold text-white">KDP Format Settings</h2>

          {/* Trim size */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Trim size</label>
            <select
              value={trimSize}
              onChange={(e) => setTrimSize(e.target.value as TrimSizeId)}
              disabled={isGenerating}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {KDP_TRIM_SIZES.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              6x9 is the most popular for novels and non-fiction. Match the trim size you set in your DOCX.
            </p>
          </div>

          {/* Font size */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Font size — <span className="text-blue-400">{fontSize}pt</span>
            </label>
            <input
              type="range" min="9" max="14" step="0.5"
              value={fontSize}
              onChange={(e) => setFontSize(parseFloat(e.target.value))}
              disabled={isGenerating}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>9pt (small)</span>
              <span>11pt (standard)</span>
              <span>14pt (large)</span>
            </div>
          </div>

          {/* Bleed */}
          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox" id="bleed"
              checked={withBleed}
              onChange={(e) => setWithBleed(e.target.checked)}
              disabled={isGenerating}
              className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
            />
            <label htmlFor="bleed" className="text-sm text-slate-300 cursor-pointer">
              Include bleed (0.125") — only needed for full-page background images
            </label>
          </div>

          {/* Error message */}
          {(genStatus === "error" || error) && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">
              {genMessage || error}
            </div>
          )}

          {/* Generation progress */}
          {isGenerating && (
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <p className="text-sm font-medium text-blue-300">{genMessage}</p>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "60%" }} />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                LibreOffice is converting your document — preserving all fonts, images, and formatting.
              </p>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex gap-3 pt-2 border-t border-slate-700">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? "Converting..." : "Generate KDP PDF"}
            </button>
            <Link
              href={`/metadata/${id}`}
              className="rounded-xl border border-slate-700 px-5 py-3.5 font-medium text-slate-300 hover:bg-slate-800 transition-colors text-center"
            >
              Add Metadata
            </Link>
            <Link
              href="/kdp-formatter"
              className="rounded-xl border border-slate-700 px-5 py-3.5 font-medium text-slate-400 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>

        {/* KDP info */}
        <div className="mt-6 rounded-xl bg-slate-800/30 border border-slate-700/50 p-4 text-sm text-slate-400 space-y-1">
          <p className="font-medium text-slate-300">What the KDP PDF includes:</p>
          <p>All original formatting — fonts, images, colors, headers, tables, and emoji are preserved.</p>
          <p>File is ready for direct upload to Amazon KDP Manuscript Manager.</p>
        </div>

      </main>
    </div>
  );
}
