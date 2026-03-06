"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ToolBreadcrumb } from "@/components/ToolBreadcrumb";
import { WhatHappensNext } from "@/components/WhatHappensNext";
import PaymentGate from "@/components/PaymentGate";
import { formatFileSize } from "@/lib/formatFileName";
import { extractTextFromFileInBrowser } from "@/lib/clientFormatReviewExtract";

const MAX_PASTE_CHARS = 100_000;

export default function KdpFormatReviewPage() {
  const router = useRouter();
  const [pastedText, setPastedText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasInput = pastedText.trim().length >= 200 || (file != null && file.size > 0);

  const handleSubmit = useCallback(async () => {
    if (!hasInput) return;
    setLoading(true);
    setError(null);
    try {
      let textToSend: string;
      if (file && (file.name.toLowerCase().endsWith(".docx") || file.name.toLowerCase().endsWith(".pdf"))) {
        const raw = await extractTextFromFileInBrowser(file);
        textToSend = raw.slice(0, MAX_PASTE_CHARS);
        if (textToSend.length < 200) throw new Error("Could not extract enough text from the file. Try pasting the manuscript above.");
      } else {
        textToSend = pastedText.trim().slice(0, MAX_PASTE_CHARS);
        if (textToSend.length < 200) throw new Error("Paste at least 200 characters.");
      }
      const res = await fetch("/api/kdp-format-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pastedText: textToSend }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || `Review failed (${res.status}).`);
      if (data.id) router.push(`/download/${data.id}?source=format-review`);
      else throw new Error("No report ID returned.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed");
    } finally {
      setLoading(false);
    }
  }, [hasInput, file, pastedText, router]);

  return (
    <div className="min-h-screen bg-[#1a1a12] text-[#F5F0E8]">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-[#F5F0E8]">
            manu2print
          </Link>
          <Link href="/platform/kdp" className="text-sm text-[#8B8B6B] hover:text-[#F5F0E8]">
            All KDP tools
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 bg-slate-50 text-slate-800 min-h-[calc(100vh-4rem)]">
        <ToolBreadcrumb backHref="/platform/kdp" backLabel="KDP tools" currentLabel="KDP Format Review" className="text-slate-500 [&_a]:text-slate-600 [&_a:hover]:text-slate-900" />

        {/* Hero — viral hook */}
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-4 mb-3 tracking-tight">
          Stop KDP rejections.
        </h1>
        <p className="text-xl text-amber-700 font-medium mb-2">
          Get a pro format review in minutes.
        </p>
        <p className="text-base text-slate-600 mb-6 max-w-xl leading-relaxed">
          Paste or upload your manuscript (DOCX or PDF). Our AI checks front matter, margins & gutter, widows & orphans, page breaks, fonts, and KDP gotchas — then gives you a clear <strong className="text-slate-800">KDP Readiness</strong> line and <strong className="text-slate-800">Top 3–5 fixes</strong> so you know exactly what to fix before you upload.
        </p>

        <div className="flex flex-wrap items-center gap-2 text-base text-slate-600 mb-6">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-emerald-600">✓</span> Front matter order
          </span>
          <span className="text-slate-400">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-emerald-600">✓</span> Margins & gutter
          </span>
          <span className="text-slate-400">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-emerald-600">✓</span> Widows & orphans
          </span>
          <span className="text-slate-400">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-emerald-600">✓</span> Page breaks & headings
          </span>
          <span className="text-slate-400">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-emerald-600">✓</span> KDP rules
          </span>
        </div>

        <WhatHappensNext
          steps={[
            "Paste text or upload DOCX/PDF",
            "AI reviews your manuscript (takes ~30 seconds)",
            "View report: KDP Readiness + Top fixes + full sections → download .txt",
          ]}
          className="!bg-slate-100 !border-slate-300 !text-slate-700 [&_p]:!text-slate-700 [&_.font-medium]:!text-slate-800"
        />

        <PaymentGate tool="kdp-format-review">
          <div className="bg-slate-100 border border-slate-300 rounded-lg p-6 space-y-5 mt-6">
            <div>
              <label htmlFor="paste" className="block text-base font-semibold text-slate-800 mb-2">
                Paste manuscript text
              </label>
              <textarea
                id="paste"
                className="w-full h-40 px-3 py-2.5 text-base bg-white border border-slate-300 rounded text-slate-800 placeholder-slate-400 resize-y focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Paste at least 200 characters of your manuscript here…"
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  if (file) setFile(null);
                }}
              />
              <p className="text-sm text-slate-600 mt-1.5">
                Or upload a file below. We extract text in your browser (any size – no upload limit). Max {MAX_PASTE_CHARS.toLocaleString()} characters used for the review.
              </p>
            </div>

            <div>
              <label className="block text-base font-semibold text-slate-800 mb-2">Or upload DOCX / PDF</label>
              <input
                type="file"
                accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                className="block w-full text-base text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded file:border-0 file:bg-amber-500 file:text-slate-900 file:font-semibold file:text-base hover:file:bg-amber-600"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setFile(f || null);
                  setError(null);
                  if (f && pastedText.trim().length > 0) setPastedText("");
                }}
              />
              {file && (
                <p className="text-sm text-slate-600 mt-1.5">
                  {formatFileSize(file.size)} — we&apos;ll extract text in your browser (no size limit).
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-base text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!hasInput || loading}
              className="w-full py-3.5 px-4 rounded-lg text-base font-semibold bg-amber-500 text-slate-900 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Extracting text & running review…" : "Run format review"}
            </button>
          </div>

          <p className="mt-4 text-base text-slate-600">
            $7 per use · $27 for 6 months. Same pricing as KDP PDF Checker. After payment you can view and download the report.
          </p>
        </PaymentGate>
      </main>
    </div>
  );
}
