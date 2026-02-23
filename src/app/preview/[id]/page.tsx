"use client";

import { useEffect, useState } from "react";
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

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [info, setInfo] = useState<ManuscriptInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Config state
  const [trimSize, setTrimSize] = useState<TrimSizeId>("6x9");
  const [withBleed, setWithBleed] = useState(false);
  const [fontSize, setFontSize] = useState(11);
  const [generating, setGenerating] = useState(false);

  // Load manuscript info
  useEffect(() => {
    if (!id) {
      setError("Invalid file ID");
      setLoading(false);
      return;
    }

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
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load info");
        setInfo(null);
      } finally {
        setLoading(false);
      }
    }

    loadInfo();
  }, [id]);

  const handleGenerate = async () => {
    if (!id) return;

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          trimSize,
          withBleed,
          fontSize,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Generation failed");
      }

      await res.json();
      router.push(`/download/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setGenerating(false);
    }
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <p className="text-red-600">Invalid file ID.</p>
        <Link href="/upload" className="mt-4 block text-blue-600 hover:underline">
          Upload a file
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full mx-auto" />
          </div>
          <p className="text-slate-600">Loading manuscript info...</p>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <p className="text-red-600">
          {error || "Could not load manuscript information."}
        </p>
        <Link href="/upload" className="mt-4 block text-blue-600 hover:underline">
          Upload another file
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-slate-900">
            ScribeStack
          </Link>
          <Link href="/upload" className="text-sm text-slate-600 hover:text-slate-900">
            New upload
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-3xl px-4 py-12">
        {/* Manuscript info */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm border border-slate-200">
          <h1 className="text-3xl font-bold text-slate-900">{info.title}</h1>
          <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Word count</p>
              <p className="text-lg font-semibold text-slate-900">
                {info.wordCount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Chapters</p>
              <p className="text-lg font-semibold text-slate-900">
                {info.chapterCount}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Est. pages</p>
              <p className="text-lg font-semibold text-slate-900">
                {info.estimatedPages}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Status</p>
              <p className="text-lg font-semibold text-blue-600">Ready</p>
            </div>
          </div>
        </div>

        {/* Manuscript Preview */}
        {info.previewText && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Manuscript Preview (First ~3 Pages)
            </h2>
            <div className="text-sm text-slate-600 mb-4 p-3 bg-blue-50 rounded border border-blue-200">
              ℹ️ This shows the first ~3 pages of your content. Click "Generate PDF" below to see your manuscript formatted with your selected trim size, font size, margins, and bleed settings applied. You'll see the exact KDP layout when you download the PDF.
            </div>
            <div className="max-h-96 overflow-y-auto border border-slate-300 rounded-lg bg-slate-50 p-4 font-mono text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
              {info.previewText}
            </div>
          </div>
        )}

        {/* KDP Options */}
        <div className="space-y-6 rounded-lg bg-white p-6 shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">KDP Format Options</h2>

          {/* Trim size */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Trim size
            </label>
            <select
              value={trimSize}
              onChange={(e) => setTrimSize(e.target.value as TrimSizeId)}
              disabled={generating}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {KDP_TRIM_SIZES.map((size) => (
                <option key={size.id} value={size.id}>
                  {size.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Standard: 6×9" (most popular). Wider margins apply to larger page counts.
            </p>
          </div>

          {/* Font size */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Font size (points)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="9"
                max="14"
                step="0.5"
                value={fontSize}
                onChange={(e) => setFontSize(parseFloat(e.target.value))}
                disabled={generating}
                className="flex-1"
              />
              <span className="text-sm font-medium text-slate-900 w-12 text-right">
                {fontSize}pt
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Standard: 11pt. Smaller = more content per page.
            </p>
          </div>

          {/* Bleed */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="bleed"
              checked={withBleed}
              onChange={(e) => setWithBleed(e.target.checked)}
              disabled={generating}
              className="w-4 h-4 rounded border-slate-300 cursor-pointer"
            />
            <label htmlFor="bleed" className="text-sm font-medium text-slate-700 cursor-pointer">
              Include bleed (0.125") for full-edge images
            </label>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* Generate button */}
          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? "Generating PDF..." : "Generate PDF"}
            </button>
            <Link
              href={`/metadata/${id}`}
              className="flex-1 rounded-lg border border-green-300 bg-green-50 px-6 py-3 font-medium text-green-700 hover:bg-green-100 transition-colors text-center"
            >
              📝 Add Metadata
            </Link>
            <Link
              href="/upload"
              className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>

        {/* Info box */}
        <div className="mt-8 rounded-lg bg-blue-50 p-4 text-sm text-blue-900 border border-blue-200">
          <p>
            <strong>KDP compliant:</strong> PDF will include proper margins, trim size, and bleed settings for Amazon KDP printing.
          </p>
        </div>
      </main>
    </div>
  );
}
