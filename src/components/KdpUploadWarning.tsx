"use client";

import Link from "next/link";

interface KdpUploadWarningProps {
  /** Variant: compressor = for FREE PDF Compressor (smaller copy for our tools). optimizer = for PDF Print Optimizer (rasterized, not final KDP). */
  variant: "compressor" | "optimizer";
  className?: string;
}

/**
 * Prominent warning: do not use this tool's output as your final KDP print upload.
 * Compressor = for smaller copies for our other tools. Optimizer = rasterized, use original or KDP Formatter DOCX for KDP.
 */
export function KdpUploadWarning({ variant, className = "" }: KdpUploadWarningProps) {
  return (
    <div
      role="alert"
      className={`rounded-xl border-2 border-amber-500/70 bg-amber-500/10 px-4 py-3 text-sm ${className}`}
      aria-label="Important notice about KDP print upload"
    >
      <div className="flex gap-3">
        <span className="shrink-0 mt-0.5 text-amber-400" aria-hidden>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </span>
        <div className="space-y-1">
          <p className="font-semibold text-amber-200">KDP print upload</p>
          {variant === "compressor" && (
            <>
              <p className="text-amber-100/95">
                This tool makes a <strong>smaller copy</strong> so you can use your PDF in our Keyword Research and Description Generator (they have file size limits). It is <strong>not</strong> for uploading to KDP as your interior.
              </p>
              <p className="text-amber-100/90 mt-1">
                For your actual KDP interior upload, use your <strong>original high-resolution file</strong>, or create a print-ready PDF from our <Link href="/kdp-formatter" className="underline font-medium text-amber-200 hover:text-amber-100">KDP Formatter (DOCX)</Link>.
              </p>
              <p className="text-amber-100/90 mt-2 text-xs border-t border-amber-500/30 pt-2">
                If you design in Canva (or similar) and export PDF, that PDF is your interior — use our <Link href="/kdp-pdf-checker" className="underline font-medium text-amber-200 hover:text-amber-100">KDP Preflight</Link> to verify. If you write in Word, use KDP Formatter (DOCX) to generate your print PDF.
              </p>
            </>
          )}
          {variant === "optimizer" && (
            <>
              <p className="text-amber-100/95">
                This optimizer runs in your browser and produces a <strong>rasterized</strong> PDF (smaller and crisper for viewing). It is <strong>not</strong> a replacement for a true print-ready interior.
              </p>
              <p className="text-amber-100/90 mt-1">
                For KDP print upload use your <strong>original high-resolution interior PDF</strong>, or generate a print-ready PDF from our <Link href="/kdp-formatter" className="underline font-medium text-amber-200 hover:text-amber-100">KDP Formatter (DOCX)</Link> (margins, trim, bleed, proper resolution).
              </p>
              <p className="text-amber-100/90 mt-2 text-xs border-t border-amber-500/30 pt-2">
                If you design in Canva (or similar) and export PDF, that PDF is your interior — use our <Link href="/kdp-pdf-checker" className="underline font-medium text-amber-200 hover:text-amber-100">KDP Preflight</Link> to verify. If you write in Word, use KDP Formatter (DOCX) to generate your print PDF.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
