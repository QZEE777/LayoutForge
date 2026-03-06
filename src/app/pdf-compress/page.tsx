"use client";

import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { truncateFilenameMiddle, formatFileSize } from "@/lib/formatFileName";
import { compressPdfInBrowser, type PdfProfile } from "@/lib/clientPdfCompress";
import { KdpUploadWarning } from "@/components/KdpUploadWarning";

const MAX_MB = 50;
const STORAGE_LEAD_CAPTURED = "pdf_compress_lead_captured";
const STORAGE_EMAIL = "pdf_compress_email";

export default function PdfCompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [doneBlobUrl, setDoneBlobUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState<string>("");
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [quality, setQuality] = useState<PdfProfile>("print");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromLocal = localStorage.getItem(STORAGE_LEAD_CAPTURED) === "1";
    const fromSession = sessionStorage.getItem(STORAGE_LEAD_CAPTURED) === "1";
    if (fromLocal || fromSession) {
      setLeadCaptured(true);
      const stored = localStorage.getItem(STORAGE_EMAIL) || sessionStorage.getItem(STORAGE_EMAIL);
      if (stored) setEmail(stored);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setError(null);
    setDoneBlobUrl(null);
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

  const handleSubmit = useCallback(async () => {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }
    const trimmedEmail = email.trim();
    const needLead = !leadCaptured;
    if (needLead) {
      if (!trimmedEmail) {
        setError("Please enter your email to continue.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setError("Please enter a valid email address.");
        return;
      }
    }

    setError(null);
    setDoneBlobUrl(null);
    setCompressing(true);
    setProgress(0);

    try {
      if (needLead) {
        setProgress(5);
        const leadRes = await fetch("/api/pdf-compress/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail }),
        });
        if (!leadRes.ok) {
          const data = await leadRes.json().catch(() => ({}));
          throw new Error(data.message || "Could not continue.");
        }
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_LEAD_CAPTURED, "1");
          localStorage.setItem(STORAGE_EMAIL, trimmedEmail);
          sessionStorage.setItem(STORAGE_LEAD_CAPTURED, "1");
          sessionStorage.setItem(STORAGE_EMAIL, trimmedEmail);
        }
        setLeadCaptured(true);
      }

      setProgress(10);
      const blob = await compressPdfInBrowser(file, {
        profile: quality,
        onProgress: (page, total) => setProgress(10 + Math.round((80 * page) / total)),
      });
      setProgress(95);
      const url = URL.createObjectURL(blob);
      setDoneBlobUrl(url);
      setOriginalSize(file.size);
      setCompressedSize(blob.size);
      const base = file.name.replace(/\.pdf$/i, "") || "document";
      setOutputName(`${base}-compressed.pdf`);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compression failed.");
    } finally {
      setCompressing(false);
      setProgress(0);
    }
  }, [file, email, leadCaptured, quality]);

  const handleReset = useCallback(() => {
    if (doneBlobUrl) URL.revokeObjectURL(doneBlobUrl);
    setDoneBlobUrl(null);
    setOutputName("");
    setOriginalSize(null);
    setCompressedSize(null);
    setFile(null);
    if (!leadCaptured) setEmail("");
    setError(null);
  }, [doneBlobUrl, leadCaptured]);

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
            <span className="text-lg font-bold text-white">manu2print</span>
          </Link>
          <Link href="/formatter" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Tools
          </Link>
        </div>
      </header>

      <div className="border-b border-slate-800 bg-red-900/20">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-medium text-emerald-400">FREE</span>
          <span className="text-sm font-semibold text-white">PDF Compressor</span>
          <span className="mx-2 text-slate-600">|</span>
          <span className="text-sm text-slate-400">Shrink PDFs in your browser. No upload to our servers. {leadCaptured ? "Pick a file to compress." : "Email required first time."}</span>
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-xl w-full px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">FREE PDF Compressor</h1>
        <p className="text-slate-400 mb-8">
          Compress your PDF in your browser—your file never leaves your device. Use the result in our Keyword Research and Amazon Description Generator. {leadCaptured ? "Pick a PDF below to compress another." : "Enter your email to continue."}
        </p>

        {doneBlobUrl ? (
          <div className="rounded-2xl bg-slate-800/50 border border-red-700/40 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Your PDF is ready</h2>
            </div>
            <p className="text-slate-400 text-sm mb-4">Download your compressed PDF. Use it in our Keyword Research or Description Generator.</p>
            <KdpUploadWarning variant="compressor" className="mb-4" />
            {originalSize != null && compressedSize != null && (
              <p className="text-slate-300 text-sm mb-4">
                Your file was <strong>{formatFileSize(originalSize)}</strong> and is now <strong>{formatFileSize(compressedSize)}</strong>
                {originalSize > 0 && (
                  <span className="text-slate-400">
                    {" "}({Math.round((1 - compressedSize / originalSize) * 100)}% smaller)
                  </span>
                )}
                .
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={doneBlobUrl}
                download={outputName}
                className="rounded-xl bg-red-600 px-6 py-3.5 font-semibold text-white hover:bg-red-700 transition-colors text-center"
              >
                Download compressed PDF
              </a>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-slate-600 px-6 py-3.5 font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Compress another
              </button>
            </div>
            <div className="mt-6 rounded-xl bg-slate-800/60 border border-slate-600/60 p-4 text-sm text-slate-400 space-y-2">
              <p className="font-medium text-slate-300">What happens next</p>
              <p>1. Use this smaller PDF in <Link href="/keyword-research-pdf" className="text-red-400 hover:text-red-300">7 Keyword Research</Link> or <Link href="/description-generator-pdf" className="text-red-400 hover:text-red-300">Amazon Description Generator</Link> (both have file size limits).</p>
              <p>2. For KDP print upload, use your <strong className="text-slate-300">original</strong> high-resolution interior file, not this copy.</p>
              <p>3. Need a proper print-ready PDF? Use our <Link href="/kdp-formatter" className="text-red-400 hover:text-red-300">KDP Formatter (DOCX)</Link> to generate one from your manuscript.</p>
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
              {file && (
                <div className="mt-2">
                  <p className="text-slate-500 text-sm overflow-hidden text-ellipsis max-w-full" title={file.name}>
                    {truncateFilenameMiddle(file.name)}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">{formatFileSize(file.size)}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Quality</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="quality"
                    checked={quality === "print"}
                    onChange={() => setQuality("print")}
                    disabled={compressing}
                    className="rounded border-slate-500 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-300">Better (crisper text)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="quality"
                    checked={quality === "web"}
                    onChange={() => setQuality("web")}
                    disabled={compressing}
                    className="rounded border-slate-500 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-300">Smaller file</span>
                </label>
              </div>
              <p className="mt-1 text-xs text-slate-500">Better quality is recommended for readability; smaller file uses more compression.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Your email</label>
              {leadCaptured ? (
                <>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full rounded-lg border border-slate-600 bg-slate-800/60 px-4 py-3 text-slate-400"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">We have your email on file. Just pick a PDF to compress.</p>
                </>
              ) : (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="you@example.com"
                    disabled={compressing}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">We use this only to stay in touch. No spam.</p>
                </>
              )}
            </div>
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">{error}</div>}
            {compressing && progress > 0 && (
              <div>
                <div className="mb-2 flex justify-between text-sm text-slate-400">
                  <span>Processing in your browser…</span>
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
              disabled={!file || (!leadCaptured && !email.trim()) || compressing}
              className="w-full rounded-xl bg-red-600 px-6 py-3.5 font-semibold text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {compressing ? "Compressing…" : "Compress PDF (FREE)"}
            </button>
          </div>
        )}

        <p className="text-slate-500 text-sm mt-6">
          After compressing, use your PDF in <Link href="/keyword-research-pdf" className="text-red-400 hover:text-red-300">7 Keyword Research</Link> or{" "}
          <Link href="/description-generator-pdf" className="text-red-400 hover:text-red-300">Amazon Description Generator</Link> (both accept PDFs up to 50MB).
        </p>
        <KdpUploadWarning variant="compressor" className="mt-4" />
      </main>
    </div>
  );
}
