"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ToolBreadcrumb } from "@/components/ToolBreadcrumb";
import { WhatHappensNext } from "@/components/WhatHappensNext";
import PaymentGate from "@/components/PaymentGate";

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
      if (file && (file.name.toLowerCase().endsWith(".docx") || file.name.toLowerCase().endsWith(".pdf"))) {
        const formData = new FormData();
        formData.append("file", file, file.name);
        const res = await fetch("/api/kdp-format-review", { method: "POST", body: formData });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || data.error || `Review failed (${res.status}).`);
        if (data.id) router.push(`/download/${data.id}?source=format-review`);
        else throw new Error("No report ID returned.");
      } else {
        const text = pastedText.trim().slice(0, MAX_PASTE_CHARS);
        if (text.length < 200) throw new Error("Paste at least 200 characters.");
        const res = await fetch("/api/kdp-format-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pastedText: text }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || data.error || `Review failed (${res.status}).`);
        if (data.id) router.push(`/download/${data.id}?source=format-review`);
        else throw new Error("No report ID returned.");
      }
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

      <main className="mx-auto max-w-3xl px-4 py-8">
        <ToolBreadcrumb backHref="/platform/kdp" backLabel="KDP tools" currentLabel="KDP Format Review" />

        {/* Hero — viral hook */}
        <h1 className="text-3xl md:text-4xl font-bold text-[#F5F0E8] mt-4 mb-3 tracking-tight">
          Stop KDP rejections.
        </h1>
        <p className="text-xl text-[#D4A843] font-medium mb-2">
          Get a pro format review in minutes.
        </p>
        <p className="text-[#8B8B6B] mb-6 max-w-xl">
          Paste or upload your manuscript (DOCX or PDF). Our AI checks front matter, margins & gutter, widows & orphans, page breaks, fonts, and KDP gotchas — then gives you a clear <strong className="text-[#F5F0E8]">KDP Readiness</strong> line and <strong className="text-[#F5F0E8]">Top 3–5 fixes</strong> so you know exactly what to fix before you upload.
        </p>

        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B6B4B] mb-6">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Front matter order
          </span>
          <span className="text-white/30">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Margins & gutter
          </span>
          <span className="text-white/30">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Widows & orphans
          </span>
          <span className="text-white/30">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Page breaks & headings
          </span>
          <span className="text-white/30">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> KDP rules
          </span>
        </div>

        <WhatHappensNext
          steps={[
            "Paste text or upload DOCX/PDF",
            "AI reviews your manuscript (takes ~30 seconds)",
            "View report: KDP Readiness + Top fixes + full sections → download .txt",
          ]}
          className="!bg-[#24241a] !border-white/10 !text-[#8B8B6B] [&_p]:!text-[#8B8B6B] [&_.font-medium]:!text-[#F5F0E8]"
        />

        <PaymentGate tool="kdp-format-review">
          <div className="bg-[#24241a] border border-white/10 rounded-lg p-6 space-y-4 mt-6">
            <div>
              <label htmlFor="paste" className="block text-sm font-medium text-[#F5F0E8] mb-2">
                Paste manuscript text
              </label>
              <textarea
                id="paste"
                className="w-full h-40 px-3 py-2 bg-[#1a1a12] border border-white/20 rounded text-[#F5F0E8] placeholder-[#6B6B4B] resize-y"
                placeholder="Paste at least 200 characters of your manuscript here…"
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  if (file) setFile(null);
                }}
              />
              <p className="text-xs text-[#8B8B6B] mt-1">
                Or upload a file below. Max {MAX_PASTE_CHARS.toLocaleString()} characters.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F5F0E8] mb-2">Or upload DOCX / PDF</label>
              <input
                type="file"
                accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                className="block w-full text-sm text-[#8B8B6B] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[#D4A843] file:text-[#1a1a12] file:font-medium hover:file:bg-[#c4983a]"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setFile(f || null);
                  if (f && pastedText.trim().length > 0) setPastedText("");
                }}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!hasInput || loading}
              className="w-full py-3 px-4 rounded-lg font-semibold bg-[#D4A843] text-[#1a1a12] hover:bg-[#c4983a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Running review…" : "Run format review"}
            </button>
          </div>

          <p className="mt-4 text-sm text-[#8B8B6B]">
            $7 per use · $27 for 6 months. Same pricing as KDP PDF Checker. After payment you can view and download the report.
          </p>
        </PaymentGate>
      </main>
    </div>
  );
}
