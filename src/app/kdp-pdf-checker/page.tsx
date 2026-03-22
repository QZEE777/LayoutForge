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

function formatElapsedSeconds(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function KdpPdfCheckerPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [checkElapsedSec, setCheckElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uploading) {
      setCheckElapsedSec(0);
      return;
    }
    setCheckElapsedSec(0);
    const id = window.setInterval(() => {
      setCheckElapsedSec((n) => n + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [uploading]);

  const validateFile = useCallback((f: File): string | null => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    if (ext !== ".pdf") return "This tool accepts PDF files only.";
    if (f.size === 0) return "File is empty. Please choose a non-empty PDF.";
    return null;
  }, []);

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
    try {
      const createRes = await fetch("/api/create-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileSize: file.size }),
      });
      if (!createRes.ok) {
        const errData = (await createRes.json()) as { error?: string };
        throw new Error(errData.error || "Failed to create upload URL");
      }
      const { uploadUrl, fileKey, jobId } = (await createRes.json()) as {
        uploadUrl: string;
        fileKey: string;
        jobId: string;
      };
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "application/pdf" },
      });
      if (!uploadRes.ok) throw new Error("R2 upload failed");
      const saveRes = await fetch("/api/kdp-pdf-check-from-preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          fileKey,
          fileSizeMB: Math.round(fileSizeMB * 100) / 100,
        }),
      });
      let saveData: { success?: boolean; checkId?: string; id?: string; error?: string; message?: string };
      try {
        saveData = (await saveRes.json()) as typeof saveData;
      } catch {
        throw new Error("Could not start check. Try again.");
      }
      if (!saveRes.ok) throw new Error(saveData.message || saveData.error || "Could not save report.");
      if (saveData.id) {
        router.push(`/download/${saveData.id}?source=checker`);
        return;
      }
      if (saveData.checkId) {
        const checkId = saveData.checkId;
        const pollIntervalMs = 2500;
        const deadline = Date.now() + 5 * 60 * 1000;
        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, pollIntervalMs));
          const statusRes = await fetch(`/api/print-ready-check-status?checkId=${encodeURIComponent(checkId)}`);
          let statusData: { status?: string; downloadId?: string; error?: string };
          try {
            statusData = (await statusRes.json()) as typeof statusData;
          } catch {
            continue;
          }
          if (statusData.status === "done" && statusData.downloadId) {
            router.push(`/download/${statusData.downloadId}?source=checker`);
            return;
          }
          if (statusData.status === "failed") {
            throw new Error(statusData.error || "Check failed.");
          }
        }
        throw new Error("Check is taking longer than expected. Please try again.");
      }
      throw new Error("No report ID returned.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Check failed";
      const isFailedFetch = msg === "Failed to fetch" || msg.includes("R2 upload") || msg.includes("upload URL");
      if (isFailedFetch) {
        setError("Upload failed. Try again in a moment.");
      } else {
        setError(msg);
      }
    } finally {
      setUploading(false);
    }
  }, [file, router]);

  return (
    <SiteShell>
      {/* Top bar */}
      <div className="border-b border-m2p-border bg-m2p-orange-soft">
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-m2p-orange/20 border border-m2p-orange/30 px-2.5 py-0.5 text-xs font-medium text-m2p-orange">Paid</span>
          <span className="text-sm font-semibold text-m2p-ink">KDP PDF Checker</span>
          <span className="mx-2 text-m2p-muted">|</span>
          <span className="text-sm text-m2p-muted">$9 per scan · no subscription</span>
        </div>
      </div>

      {/* Section A — Hero / upload area */}
      <section className="bg-m2p-ivory py-12">
        <div className="mx-auto max-w-2xl px-6">
          <ToolBreadcrumb backHref="/" backLabel="All Tools" currentLabel="KDP PDF Checker" className="mb-6 text-m2p-muted [&_a]:text-m2p-muted [&_a:hover]:text-m2p-orange [&_span]:text-m2p-muted" />

          <h1 className="font-bebas text-3xl tracking-wide text-m2p-ink">KDP PDF Checker</h1>

          <p className="mt-2 text-m2p-muted text-base leading-relaxed">
            Upload your interior PDF and get a full KDP compliance report — margins, trim size,
            bleed, fonts, and page count — checked against all 26 KDP rules.
            Every issue is flagged with exact page numbers before you upload to Amazon.
          </p>
          <p className="mt-3 text-m2p-muted text-sm">
            Designed in Canva, InDesign, or Word? We analyze the final PDF —
            exactly what Amazon reviews.
          </p>

          {/* Tool chips — prepare before scanning */}
          <div className="mt-6">
            <p className="text-sm text-m2p-muted mb-3">
              <span className="font-semibold text-m2p-ink">Before you scan</span>
              {" — fix common issues first "}
              <span className="text-m2p-muted/60">(optional)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Compress PDF", href: "/pdf-compress" },
                { label: "Spine Width Calculator", href: "/spine-calculator" },
                { label: "Trim Size Comparison", href: "/trim-size-comparison" },
                { label: "Estimate Page Count", href: "/page-count-estimator" },
              ].map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-m2p-orange/30 bg-m2p-orange-soft px-4 py-1.5 text-sm font-medium text-m2p-orange hover:bg-m2p-orange hover:text-white transition-colors"
                >
                  {tool.label} →
                </Link>
              ))}
            </div>
          </div>

          {/* Dropzone */}
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

          {file && (
            <div className="mt-4 rounded-lg bg-m2p-orange-soft/50 border border-m2p-border p-3 text-sm text-m2p-muted">
              File will be uploaded securely and checked. You&apos;ll get the full report on the results page.
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
              disabled={!file || uploading}
              className="flex-1 rounded-xl bg-m2p-orange hover:bg-m2p-orange-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 transition-colors"
            >
              {uploading ? "Checking…" : "Check My PDF"}
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

          {/* Animated timer */}
          {uploading && (
            <div className="mt-6 rounded-2xl bg-m2p-ink border border-m2p-orange/20 p-6 text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full border-4 border-m2p-orange/20 border-t-m2p-orange animate-spin" />
              <p className="font-bebas text-m2p-ivory text-2xl tracking-wide mb-1">
                Scanning Your Manuscript
              </p>
              <p className="text-m2p-ivory/60 text-sm mb-3">
                Checking 26 KDP compliance rules…
              </p>
              <div className="font-bebas text-m2p-orange text-4xl tabular-nums">
                {formatElapsedSeconds(checkElapsedSec)}
              </div>
              <p className="text-m2p-ivory/40 text-xs mt-2">
                Most scans complete in under 90 seconds
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Section B — What happens next */}
      <section className="bg-m2p-ink py-10">
        <div className="mx-auto max-w-2xl px-6">
          <WhatHappensNext
            className="bg-white/5 border border-white/10 text-m2p-ivory/80 [&_p]:text-m2p-ivory/70 [&_.font-medium]:text-m2p-ivory"
            steps={[
              "Upload your PDF — any browser, any OS. No software needed.",
              "We scan 26 KDP rules — trim size, margins, bleed, fonts, page count. Every issue flagged with exact page numbers.",
              "Pay $9 and download your annotated PDF report. Fix issues. Upload to KDP with confidence.",
            ]}
          />
        </div>
      </section>
    </SiteShell>
  );
}
