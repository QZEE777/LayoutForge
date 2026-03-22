"use client";

import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { truncateFilenameMiddle, formatFileSize } from "@/lib/formatFileName";
import { compressPdfInBrowser, type PdfProfile } from "@/lib/clientPdfCompress";
import ToolPageShell from "@/components/ToolPageShell";
import KdpConversionBridge from "@/components/KdpConversionBridge";

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
    <ToolPageShell>
      <div className="mx-auto max-w-xl w-full px-6 py-8">
        <h1 className="font-bebas text-3xl font-bold text-m2p-ink mb-2 text-center">
          Free PDF Compressor for KDP Authors
        </h1>
        <p className="text-m2p-muted text-sm leading-relaxed mb-3 text-center">
          Compress your PDF directly in your browser — your file never leaves your device.
          Reduce file size for faster uploads and sharing.
        </p>
        <p className="text-m2p-muted text-sm mb-5 text-center">
          Designed in Canva, InDesign, or Word? Compress your working file here —
          then check your final PDF before publishing.
        </p>

        {doneBlobUrl ? (
          <>
            <div className="rounded-2xl bg-white border border-m2p-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-m2p-live/20 border border-m2p-live/40 flex items-center justify-center">
                  <svg className="w-6 h-6 text-m2p-live" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="font-bebas text-xl font-bold text-m2p-ink">Your PDF is ready</h2>
              </div>
              <p className="text-m2p-muted text-sm mb-4">Download your compressed PDF.</p>
              <div className="rounded-xl bg-m2p-orange-soft border border-m2p-orange/20 p-4 text-sm text-m2p-muted mb-4">
                <p className="font-semibold text-m2p-ink mb-1">KDP Upload Note</p>
                <p>This creates a smaller version for sharing and preview only.</p>
                <p className="mt-1">For KDP upload, always use your original high-resolution file.</p>
                <p className="mt-1">
                  <Link href="/kdp-pdf-checker" className="text-m2p-orange hover:underline font-medium">
                    Run a compliance check before submitting →
                  </Link>
                </p>
              </div>
              {originalSize != null && compressedSize != null && (
                <p className="text-m2p-muted text-sm mb-4">
                  Your file was <strong className="text-m2p-ink">{formatFileSize(originalSize)}</strong> and is now <strong className="text-m2p-ink">{formatFileSize(compressedSize)}</strong>
                  {originalSize > 0 && (
                    <span className="text-m2p-muted">
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
                  className="rounded-xl bg-m2p-orange px-6 py-3.5 font-semibold text-white hover:bg-m2p-orange-hover transition-colors text-center"
                >
                  Download compressed PDF
                </a>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl border border-m2p-border px-6 py-3.5 font-medium text-m2p-muted hover:bg-m2p-orange-soft/50 transition-colors"
                >
                  Compress another
                </button>
              </div>
              <div className="mt-5 rounded-xl bg-m2p-orange-soft/50 border border-m2p-border p-4 text-sm text-m2p-muted space-y-2">
                <p className="font-medium text-m2p-ink">What happens next</p>
                <p>1. Use this smaller PDF for sharing, review, or preview purposes.</p>
                <p>2. For KDP print upload, use your <strong className="text-m2p-ink">original</strong> high-resolution interior file, not this copy.</p>
                <p>3. Before your KDP upload, check your original file for compliance issues that cause rejection.</p>
              </div>
            </div>
            <KdpConversionBridge />
          </>
        ) : (
          <div className="rounded-2xl bg-white border-2 p-6 mb-5 space-y-5" style={{ borderColor: "#2D6A2D" }}>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">PDF file</label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={compressing}
                className="block w-full text-sm text-m2p-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-m2p-orange file:text-white file:font-medium file:hover:bg-m2p-orange-hover"
              />
              {file && (
                <div className="mt-2">
                  <p className="text-m2p-muted text-sm overflow-hidden text-ellipsis max-w-full" title={file.name}>
                    {truncateFilenameMiddle(file.name)}
                  </p>
                  <p className="text-m2p-muted text-xs mt-0.5">{formatFileSize(file.size)}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Quality</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="quality"
                    checked={quality === "print"}
                    onChange={() => setQuality("print")}
                    disabled={compressing}
                    className="rounded border-m2p-border text-m2p-live focus:ring-m2p-live"
                  />
                  <span className="text-sm text-m2p-muted">Better (crisper text)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="quality"
                    checked={quality === "web"}
                    onChange={() => setQuality("web")}
                    disabled={compressing}
                    className="rounded border-m2p-border text-m2p-live focus:ring-m2p-live"
                  />
                  <span className="text-sm text-m2p-muted">Smaller file</span>
                </label>
              </div>
              <p className="mt-1 text-xs text-m2p-muted">Better quality is recommended for readability; smaller file uses more compression.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Your email</label>
              {leadCaptured ? (
                <>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full rounded-lg border border-m2p-border bg-m2p-ivory px-4 py-3 text-m2p-muted"
                  />
                  <p className="mt-1.5 text-xs text-m2p-muted">We have your email on file. Just pick a PDF to compress.</p>
                </>
              ) : (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="you@example.com"
                    disabled={compressing}
                    className="w-full rounded-lg border border-m2p-border bg-white px-4 py-3 text-m2p-ink placeholder-m2p-muted focus:border-m2p-orange focus:ring-1 focus:ring-m2p-orange"
                  />
                  <p className="mt-1.5 text-xs text-m2p-muted">We use this only to stay in touch. No spam.</p>
                </>
              )}
            </div>
            {error && <div className="rounded-lg bg-m2p-orange/10 border border-m2p-orange/30 p-3 text-sm text-m2p-orange">{error}</div>}
            {compressing && progress > 0 && (
              <div>
                <div className="mb-2 flex justify-between text-sm text-m2p-muted">
                  <span>Processing in your browser…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-m2p-border overflow-hidden">
                  <div className="h-full bg-m2p-orange transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!file || (!leadCaptured && !email.trim()) || compressing}
              className="w-full rounded-xl bg-m2p-orange px-6 py-3.5 font-semibold text-white hover:bg-m2p-orange-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {compressing ? "Compressing…" : "Compress PDF (FREE)"}
            </button>
          </div>
        )}

        <KdpConversionBridge />
      </div>
    </ToolPageShell>
  );
}
