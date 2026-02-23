"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

type GenStatus = "idle" | "starting" | "processing" | "done" | "error";

export default function PreviewPage() {
  const params  = useParams();
  const router  = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [info, setInfo]         = useState<ManuscriptInfo | null>(null);
  const [loading, setLoading]   = useState(true);
  const [infoError, setInfoError] = useState<string | null>(null);

  const [trimSize, setTrimSize]   = useState<TrimSizeId>("6x9");
  const [withBleed, setWithBleed] = useState(false);
  const [fontSize, setFontSize]   = useState(11);

  const [genStatus, setGenStatus]   = useState<GenStatus>("idle");
  const [genMessage, setGenMessage] = useState("");
  const jobIdRef = useRef<string | null>(null);

  // Load manuscript info on mount
  useEffect(() => {
    if (!id) { setInfoError("Invalid file ID"); setLoading(false); return; }
    fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.message || data.error);
        setInfo({
          wordCount: data.wordCount,
          chapterCount: data.chapterCount,
          title: data.title,
          estimatedPages: data.estimatedPages,
          previewText: data.previewText,
        });
      })
      .catch((err) => setInfoError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Poll CloudConvert status
  const poll = useCallback(async () => {
    const jobId = jobIdRef.current;
    if (!jobId) return;

    try {
      const res  = await fetch(`/api/generate/status?id=${id}&jobId=${jobId}`);
      const data = await res.json();

      if (data.status === "done") {
        setGenStatus("done");
        router.push(`/download/${id}`);
        return;
      }

      if (data.status === "error") {
        setGenStatus("error");
        setGenMessage(data.message || "Conversion failed. Please try again.");
        return;
      }

      // Still processing — schedule next poll
      setTimeout(poll, 4000);
    } catch {
      setTimeout(poll, 5000);
    }
  }, [id, router]);

  const handleGenerate = async () => {
    if (!id) return;
    setGenStatus("starting");
    setGenMessage("Connecting to conversion service...");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, trimSize, withBleed, fontSize }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGenStatus("error");
        setGenMessage(data.message || `Error ${res.status}: generation failed.`);
        return;
      }

      if (!data.jobId) {
        setGenStatus("error");
        setGenMessage("No job ID returned from server. Check your CloudConvert API key.");
        return;
      }

      // Store jobId in ref and start polling
      jobIdRef.current = data.jobId;
      setGenStatus("processing");
      setGenMessage("Converting your manuscript — preserving all fonts, images, and formatting...");
      setTimeout(poll, 4000);

    } catch (err) {
      setGenStatus("error");
      setGenMessage(`Request failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const isWorking = genStatus === "starting" || genStatus === "processing";

  if (!id) return (
    <div className="min-h-screen bg-slate-950 p-10">
      <p className="text-red-400 mb-4">Invalid file ID.</p>
      <Link href="/kdp-formatter" className="text-blue-400 hover:underline">Upload a file</Link>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Analysing your manuscript...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

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
          <Link href="/kdp-formatter" className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            New upload
          </Link>
        </div>
      </header>

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

        {/* Manuscript summary */}
        {info && (
          <div className="mb-8 rounded-2xl bg-slate-800/50 border border-slate-700/60 p-6">
            <h1 className="text-2xl font-bold text-white mb-4 truncate">{info.title || "Your Manuscript"}</h1>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div><p className="text-slate-500 mb-1">Words</p><p className="text-xl font-bold text-white">{info.wordCount.toLocaleString()}</p></div>
              <div><p className="text-slate-500 mb-1">Chapters</p><p className="text-xl font-bold text-white">{info.chapterCount}</p></div>
              <div><p className="text-slate-500 mb-1">Est. pages</p><p className="text-xl font-bold text-white">{info.estimatedPages}</p></div>
              <div><p className="text-slate-500 mb-1">Status</p><p className="text-xl font-bold text-green-400">Ready</p></div>
            </div>
          </div>
        )}

        {infoError && (
          <div className="mb-8 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">{infoError}</div>
        )}

        {info?.previewText && (
          <div className="mb-8 rounded-2xl bg-slate-800/50 border border-slate-700/60 p-6">
            <h2 className="text-base font-semibold text-white mb-3">Content Preview</h2>
            <div className="max-h-44 overflow-y-auto rounded-lg bg-slate-900/60 border border-slate-700 p-4 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {info.previewText}
            </div>
          </div>
        )}

        {/* KDP Options */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/60 p-6 space-y-6">
          <h2 className="text-lg font-bold text-white">KDP Format Settings</h2>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Trim size</label>
            <select
              value={trimSize}
              onChange={(e) => setTrimSize(e.target.value as TrimSizeId)}
              disabled={isWorking}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {KDP_TRIM_SIZES.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">Match the page size you set in your Word document.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Font size — <span className="text-blue-400">{fontSize}pt</span>
            </label>
            <input type="range" min="9" max="14" step="0.5" value={fontSize}
              onChange={(e) => setFontSize(parseFloat(e.target.value))}
              disabled={isWorking} className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>9pt</span><span>11pt (standard)</span><span>14pt</span>
            </div>
          </div>

          <div className="flex items-center gap-3 py-1">
            <input type="checkbox" id="bleed" checked={withBleed}
              onChange={(e) => setWithBleed(e.target.checked)}
              disabled={isWorking} className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
            />
            <label htmlFor="bleed" className="text-sm text-slate-300 cursor-pointer">
              Include bleed (0.125") — only for full-page background images
            </label>
          </div>

          {/* Error */}
          {genStatus === "error" && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
              <p className="text-sm font-semibold text-red-400 mb-1">Conversion failed</p>
              <p className="text-sm text-red-300">{genMessage}</p>
              <p className="text-xs text-slate-500 mt-2">
                Visit <code className="bg-slate-800 px-1 rounded">/api/cc-test</code> in your browser to verify the API key is working.
              </p>
            </div>
          )}

          {/* Progress */}
          {isWorking && (
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <p className="text-sm font-medium text-blue-300">{genMessage}</p>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse w-3/5" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                LibreOffice is processing your document. Typically 15–60 seconds.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2 border-t border-slate-700">
            <button
              onClick={handleGenerate}
              disabled={isWorking}
              className="flex-1 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isWorking ? "Converting..." : "Generate KDP PDF"}
            </button>
            <Link href={`/metadata/${id}`}
              className="rounded-xl border border-slate-700 px-5 py-3.5 font-medium text-slate-300 hover:bg-slate-800 transition-colors text-center">
              Add Metadata
            </Link>
            <Link href="/kdp-formatter"
              className="rounded-xl border border-slate-700 px-5 py-3.5 font-medium text-slate-400 hover:bg-slate-800 transition-colors">
              Cancel
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-slate-800/30 border border-slate-700/50 p-4 text-sm text-slate-400">
          <p className="font-medium text-slate-300 mb-1">What gets preserved:</p>
          <p>All fonts, images, colors, headers, tables, bullet lists, and emoji from your original document.</p>
        </div>

      </main>
    </div>
  );
}
