"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatFileSize } from "@/lib/formatFileName";
import { cleanFilenameForDisplay } from "@/lib/kdpReportEnhance";
import { WhatHappensNext } from "@/components/WhatHappensNext";
import { ErrorRecovery } from "@/components/ErrorRecovery";
import { ToolBreadcrumb } from "@/components/ToolBreadcrumb";
import SiteShell from "@/components/SiteShell";

/** Host body limit (e.g. Vercel 4.5 MB). Files larger than this use direct preflight upload when available. */
const SERVER_MAX_MB = 4;
/** Max PDF size we accept (direct upload to preflight or fallback message). */
const MAX_SELECT_MB = 100;

const PREFLIGHT_POLL_MS = 2500;
const PREFLIGHT_MAX_WAIT_MS = 120000;
/** Timeout for direct upload to checker (cold start can take 50–60s on free tier; 15MB+ upload adds time). */
const DIRECT_UPLOAD_TIMEOUT_MS = 150000;

export default function KdpPdfCheckerPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preflightUrl = typeof process.env.NEXT_PUBLIC_KDP_PREFLIGHT_API_URL === "string"
    ? process.env.NEXT_PUBLIC_KDP_PREFLIGHT_API_URL.trim()
    : "";

  const validateFile = useCallback((f: File): string | null => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    if (ext !== ".pdf") return "This tool accepts PDF files only.";
    if (f.size === 0) return "File is empty. Please choose a non-empty PDF.";
    if (f.size > MAX_SELECT_MB * 1024 * 1024) return `File must be smaller than ${MAX_SELECT_MB} MB.`;
    return null;
  }, []);

  const fileSizeMB = file ? file.size / (1024 * 1024) : 0;
  const useDirectUpload = preflightUrl && file && fileSizeMB > SERVER_MAX_MB && fileSizeMB <= MAX_SELECT_MB;
  const fileTooBigForServer = file
    ? fileSizeMB > SERVER_MAX_MB && !preflightUrl
    : false;

  // Pre-warm the checker when user selects a large file so Render has time to wake before they click Check
  useEffect(() => {
    if (!file || !useDirectUpload || !preflightUrl) return;
    const url = preflightUrl.replace(/\/$/, "");
    fetch(`${url}/health`).catch(() => {});
  }, [file, useDirectUpload, preflightUrl]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (!droppedFile) return;
      const err = validateFile(droppedFile);
      if (err) {
        setError(err);
        setFile(null);
        return;
      }
      setError(null);
      setFile(droppedFile);
    },
    [validateFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (!selected) return;
      const err = validateFile(selected);
      if (err) {
        setError(err);
        setFile(null);
        return;
      }
      setError(null);
      setFile(selected);
    },
    [validateFile]
  );

  const handleSubmit = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    const fileSizeMB = file.size / (1024 * 1024);
    let wasDirectUpload = false;
    try {
      if (useDirectUpload && preflightUrl) {
        wasDirectUpload = true;
        const url = preflightUrl.replace(/\/$/, "");
        const form = new FormData();
        form.append("file", file, file.name.toLowerCase().endsWith(".pdf") ? file.name : "document.pdf");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), DIRECT_UPLOAD_TIMEOUT_MS);
        let res: Response;
        try {
          res = await fetch(`${url}/upload`, { method: "POST", body: form, signal: controller.signal });
        } finally {
          clearTimeout(timeoutId);
        }
        const responseText = await res.text();
        console.log("Render /upload response status:", res.status);
        console.log("Render /upload response body:", responseText);
        if (!res.ok) {
          throw new Error(`Render error ${res.status}: ${responseText}`);
        }
        const { job_id } = (JSON.parse(responseText) || { job_id: "" }) as { job_id: string };
        const deadline = Date.now() + PREFLIGHT_MAX_WAIT_MS;
        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, PREFLIGHT_POLL_MS));
          res = await fetch(`${url}/status/${job_id}`);
          const statusText = await res.text();
          console.log("Render /status response status:", res.status);
          console.log("Render /status response body:", statusText);
          if (!res.ok) continue;
          const statusData = (statusText ? JSON.parse(statusText) : { status: "" }) as { status: string; report?: unknown };
          if (statusData.status === "completed") break;
          if (statusData.status === "failed") throw new Error("Check failed. Try again.");
        }
        const saveRes = await fetch("/api/kdp-pdf-check-from-preflight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: job_id, fileSizeMB: Math.round(fileSizeMB * 100) / 100 }),
        });
        const saveData = (await saveRes.json()) as { id?: string; message?: string };
        if (!saveRes.ok) throw new Error(saveData.message || "Could not save report.");
        if (saveData.id) router.push(`/download/${saveData.id}?source=checker`);
        else throw new Error("No report ID returned.");
        return;
      }
      const formData = new FormData();
      formData.append("file", file, file.name.toLowerCase().endsWith(".pdf") ? file.name : "document.pdf");
      const res = await fetch("/api/kdp-pdf-check", { method: "POST", body: formData });
      const raw = await res.text();
      let data: { message?: string; id?: string };
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      if (!res.ok) {
        const msg =
          res.status === 413 && file
            ? `Your file is ${formatFileSize(file.size)}. This tool accepts up to ${SERVER_MAX_MB} MB per upload. Use our free PDF Compressor to shrink it first, then return here.`
            : data?.message || `Check failed (${res.status}). Try a smaller file or try again.`;
        throw new Error(msg);
      }
      if (data.id) router.push(`/download/${data.id}?source=checker`);
      else throw new Error("No report ID returned.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Check failed";
      const isFailedFetch = msg === "Failed to fetch";
      const isAbort = err instanceof Error && err.name === "AbortError";
      const fileOverLimit = file && file.size > SERVER_MAX_MB * 1024 * 1024;
      if (wasDirectUpload && (isFailedFetch || isAbort || msg.includes("Upload to checker"))) {
        setError(
          "The checker didn’t respond in time. Try again in a moment, or use our PDF Compressor and check a smaller file."
        );
      } else if (!wasDirectUpload && isFailedFetch && fileOverLimit) {
        setError(
          `Upload failed — files over ${SERVER_MAX_MB} MB can't be sent through this page. Use our PDF Compressor to shrink the file first, then try again.`
        );
      } else {
        setError(msg);
      }
    } finally {
      setUploading(false);
    }
  }, [file, router, useDirectUpload, preflightUrl]);

  return (
    <SiteShell>
      <div className="border-b border-m2p-border bg-m2p-orange-soft">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-m2p-orange/20 border border-m2p-orange/30 px-2.5 py-0.5 text-xs font-medium text-m2p-orange">Paid</span>
          <span className="text-sm font-semibold text-m2p-ink">Print Ready Check</span>
          <span className="mx-2 text-m2p-muted">|</span>
          <span className="text-sm text-m2p-muted">Full PDF validation: 26 KDP rules, trim, margins, bleed — pass/fail before you upload</span>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <ToolBreadcrumb backHref="/" backLabel="All Tools" currentLabel="Print Ready Check" className="mb-6 text-m2p-muted [&_a]:text-m2p-muted [&_a:hover]:text-m2p-orange [&_span]:text-m2p-muted" />
        <h1 className="font-bebas text-3xl tracking-wide text-m2p-ink">Print Ready Check</h1>
        <p className="mt-2 text-m2p-muted">Upload your interior PDF. We’ll report trim size, page count, and any issues so you can fix before uploading to KDP. Max {MAX_SELECT_MB} MB. $7 per use or $27 for 6 months.</p>
        <p className="mt-2 text-m2p-muted text-sm">Many indies design in Canva (or similar) and upload the PDF they export — we'll check that PDF against KDP specs. If you format from Word, use <Link href="/kdp-formatter" className="text-m2p-orange hover:underline">KDP Formatter (DOCX)</Link> for your print PDF.</p>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ position: "relative", overflow: "hidden" }}
          className={`mt-8 rounded-2xl border-2 border-dashed p-14 text-center transition-all ${
            isDragging ? "border-m2p-orange bg-m2p-orange-soft" : "border-m2p-border bg-white hover:border-m2p-orange/50"
          }`}
        >
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="checker-file"
          />
          <label htmlFor="checker-file" className="cursor-pointer block">
            {file ? (
              <div style={{ position: "relative", overflow: "hidden" }} className="min-h-[60px]">
                <p className="text-m2p-ink font-medium">{cleanFilenameForDisplay(file.name)}</p>
                <p className="text-sm text-m2p-muted mt-1">{formatFileSize(file.size)} — ready to check</p>
                <Image
                  src="/MANNY AVATAR.png"
                  alt=""
                  width={80}
                  height={80}
                  style={{
                    position: "absolute",
                    bottom: "0px",
                    right: "0px",
                    opacity: 0.12,
                    pointerEvents: "none",
                    borderRadius: "50%",
                  }}
                />
              </div>
            ) : (
              <>
                <p className="text-m2p-muted">Drop your PDF here or click to choose</p>
                <Image
                  src="/MANNY AVATAR.png"
                  alt=""
                  width={90}
                  height={90}
                  style={{
                    position: "absolute",
                    bottom: "0px",
                    right: "0px",
                    opacity: 0.15,
                    pointerEvents: "none",
                    borderRadius: "50%",
                  }}
                />
              </>
            )}
          </label>
        </div>

        {file && useDirectUpload && (
          <div className="mt-4 rounded-lg bg-m2p-orange-soft/50 border border-m2p-border p-3 text-sm text-m2p-muted">
            Large file: sent directly to the checker. You’ll get the full report and a visual preview on the results page.
          </div>
        )}
        {file && fileTooBigForServer && (
          <div className="mt-4 rounded-lg bg-m2p-orange-soft border border-m2p-orange/30 p-3 text-sm text-m2p-orange">
            Your file is <strong>{formatFileSize(file.size)}</strong>. For files over {SERVER_MAX_MB} MB, use our free{" "}
            <Link href="/pdf-compress" className="underline font-medium text-m2p-orange hover:opacity-90">
              PDF Compressor
            </Link>{" "}
            first, then check again (or try again later for large-file support).
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-600">
            {error}
            {file && (
              <p className="mt-2">
                <Link href="/pdf-compress" className="text-m2p-orange hover:underline">
                  Use our free PDF Compressor →
                </Link>
              </p>
            )}
            <ErrorRecovery />
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!file || uploading || fileTooBigForServer}
            className="flex-1 rounded-xl bg-m2p-orange hover:bg-m2p-orange-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 transition-colors"
          >
            {uploading ? "Checking…" : "Check PDF"}
          </button>
          {file && (
            <button
              type="button"
              onClick={() => { setFile(null); setError(null); }}
              className="rounded-xl border border-m2p-border text-m2p-muted hover:bg-m2p-orange-soft/50 py-3 px-6 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <WhatHappensNext
          className="mt-8 bg-m2p-orange-soft/50 border border-m2p-border text-m2p-muted [&_p]:text-m2p-muted [&_.font-medium]:text-m2p-ink"
          steps={[
            "We check your PDF: trim size, page count (24–828), and file size.",
            "You're redirected to the download page with your report (issues and what to fix).",
            "Complete payment and download your KDP format report.",
          ]}
        />
      </main>
    </SiteShell>
  );
}
