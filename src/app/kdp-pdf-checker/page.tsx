"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatFileSize } from "@/lib/formatFileName";
import { cleanFilenameForDisplay } from "@/lib/kdpReportEnhance";
import { ErrorRecovery } from "@/components/ErrorRecovery";
import SiteShell from "@/components/SiteShell";

function formatElapsedSeconds(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const CHECKS = [
  { icon: "📐", label: "Trim size validation" },
  { icon: "📏", label: "Margin compliance" },
  { icon: "🩸", label: "Bleed zone analysis" },
  { icon: "🔤", label: "Font embedding check" },
  { icon: "📄", label: "Page count accuracy" },
  { icon: "🖼️", label: "Image resolution" },
  { icon: "📦", label: "File size limits" },
  { icon: "🎨", label: "Color mode (CMYK/RGB)" },
  { icon: "🔲", label: "Safe zone compliance" },
  { icon: "📚", label: "Spine & cover checks" },
  { icon: "⚠️", label: "Exact page number flags" },
  { icon: "✅", label: "26 KDP rules total" },
];

const PREP_TOOLS = [
  { label: "Compress PDF", href: "/pdf-compress" },
  { label: "Spine Width Calculator", href: "/spine-calculator" },
  { label: "Trim Size Comparison", href: "/trim-size-comparison" },
  { label: "Estimate Page Count", href: "/page-count-estimator" },
];

export default function KdpPdfCheckerPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [checkElapsedSec, setCheckElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uploading) { setCheckElapsedSec(0); return; }
    setCheckElapsedSec(0);
    const id = window.setInterval(() => setCheckElapsedSec((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [uploading]);

  const validateFile = useCallback((f: File): string | null => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    if (ext !== ".pdf") return "This tool accepts PDF files only.";
    if (f.size === 0) return "File is empty. Please choose a non-empty PDF.";
    return null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;
    const err = validateFile(droppedFile);
    if (err) { setError(err); setFile(null); return; }
    setError(null); setFile(droppedFile);
  }, [validateFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const err = validateFile(selected);
    if (err) { setError(err); setFile(null); return; }
    setError(null); setFile(selected);
  }, [validateFile]);

  const handleSubmit = useCallback(async () => {
    if (!file) return;
    setUploading(true); setError(null);
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
        uploadUrl: string; fileKey: string; jobId: string;
      };
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT", body: file, headers: { "Content-Type": "application/pdf" },
      });
      if (!uploadRes.ok) throw new Error("R2 upload failed");
      const saveRes = await fetch("/api/kdp-pdf-check-from-preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, fileKey, fileSizeMB: Math.round(fileSizeMB * 100) / 100 }),
      });
      let saveData: { success?: boolean; checkId?: string; id?: string; error?: string; message?: string };
      try { saveData = (await saveRes.json()) as typeof saveData; }
      catch { throw new Error("Could not start check. Try again."); }
      if (!saveRes.ok) throw new Error(saveData.message || saveData.error || "Could not save report.");
      if (saveData.id) { router.push(`/download/${saveData.id}?source=checker`); return; }
      if (saveData.checkId) {
        const checkId = saveData.checkId;
        const deadline = Date.now() + 5 * 60 * 1000;
        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 2500));
          const statusRes = await fetch(`/api/print-ready-check-status?checkId=${encodeURIComponent(checkId)}`);
          let statusData: { status?: string; downloadId?: string; error?: string };
          try { statusData = (await statusRes.json()) as typeof statusData; } catch { continue; }
          if (statusData.status === "done" && statusData.downloadId) {
            router.push(`/download/${statusData.downloadId}?source=checker`); return;
          }
          if (statusData.status === "failed") throw new Error(statusData.error || "Check failed.");
        }
        throw new Error("Check is taking longer than expected. Please try again.");
      }
      throw new Error("No report ID returned.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Check failed";
      const isFailedFetch = msg === "Failed to fetch" || msg.includes("R2 upload") || msg.includes("upload URL");
      setError(isFailedFetch ? "Upload failed. Try again in a moment." : msg);
    } finally {
      setUploading(false);
    }
  }, [file, router]);

  return (
    <SiteShell>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="bg-m2p-ivory">
        <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-start">

            {/* LEFT — copy */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-m2p-orange/10 border border-m2p-orange/20 px-3 py-1 mb-5">
                <span className="w-2 h-2 rounded-full bg-m2p-orange animate-pulse" />
                <span className="text-xs font-semibold text-m2p-orange uppercase tracking-wide">$9 · No Subscription · Instant Report</span>
              </div>

              <h1 className="font-bebas text-5xl lg:text-6xl tracking-wide text-m2p-ink leading-none mb-4">
                KDP PDF<br />
                <span className="text-m2p-orange">Checker</span>
              </h1>

              <p className="text-m2p-ink/80 text-lg leading-relaxed mb-6">
                Upload your interior PDF and get a full KDP compliance report
                — margins, trim size, bleed, fonts, and page count —
                checked against <strong>all 26 KDP rules</strong>.
                Every issue flagged with exact page numbers <em>before</em> Amazon rejects you.
              </p>

              <p className="text-m2p-muted text-sm mb-8">
                Designed in Canva, InDesign, or Word? We analyze the final exported PDF
                — exactly what Amazon&apos;s system reviews.
              </p>

              {/* What's included */}
              <div className="rounded-2xl border border-m2p-border bg-white p-5 mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-m2p-green mb-3">What&apos;s included in your $9 report</p>
                <ul className="space-y-2">
                  {[
                    "Full annotated PDF with issues highlighted on each page",
                    "Exact page numbers for every violation found",
                    "Margin, trim size, bleed & safe zone analysis",
                    "Font embedding & image resolution check",
                    "Plain-English fix instructions for each issue",
                    "Instant download — no account required",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-m2p-ink/80">
                      <span className="text-m2p-green mt-0.5 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap gap-4 text-xs text-m2p-muted">
                {[
                  "🔒 Secure upload",
                  "⚡ Results in ~90 sec",
                  "🚫 No account needed",
                  "💳 One-time $9 payment",
                ].map((t) => (
                  <span key={t} className="flex items-center gap-1">{t}</span>
                ))}
              </div>
            </div>

            {/* RIGHT — upload */}
            <div className="lg:sticky lg:top-8">

              {/* Scanning state */}
              {uploading ? (
                <div className="rounded-2xl bg-m2p-ink border border-m2p-orange/20 p-8 text-center">
                  <div className="mx-auto mb-5 w-16 h-16 rounded-full border-4 border-m2p-orange/20 border-t-m2p-orange animate-spin" />
                  <p className="font-bebas text-m2p-ivory text-3xl tracking-wide mb-1">Scanning Your Manuscript</p>
                  <p className="text-m2p-ivory/60 text-sm mb-4">Checking 26 KDP compliance rules…</p>
                  <div className="font-bebas text-m2p-orange text-5xl tabular-nums">{formatElapsedSeconds(checkElapsedSec)}</div>
                  <p className="text-m2p-ivory/40 text-xs mt-3">Most scans complete in under 90 seconds</p>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-m2p-border bg-white shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div className="bg-m2p-ink px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold text-sm">KDP PDF Checker</p>
                      <p className="text-white/50 text-xs">Upload → Scan → Fix → Publish</p>
                    </div>
                    <div className="text-right">
                      <p className="text-m2p-orange font-bebas text-2xl">$9</p>
                      <p className="text-white/40 text-xs">one-time</p>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Dropzone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative rounded-xl border-2 border-dashed p-10 text-center transition-all cursor-pointer mb-4 ${
                        isDragging
                          ? "border-m2p-orange bg-m2p-orange/5"
                          : file
                          ? "border-m2p-green bg-green-50"
                          : "border-m2p-border bg-m2p-ivory hover:border-m2p-orange/50"
                      }`}
                    >
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileSelect}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        id="checker-file"
                      />

                      {file ? (
                        <div>
                          <div className="text-3xl mb-2">📄</div>
                          <p className="text-m2p-ink font-semibold text-sm">{cleanFilenameForDisplay(file.name)}</p>
                          <p className="text-m2p-green text-xs mt-1">{formatFileSize(file.size)} · ready to scan ✓</p>
                        </div>
                      ) : (
                        <div>
                          <div className="mx-auto w-12 h-12 rounded-full bg-m2p-orange/10 flex items-center justify-center mb-3">
                            <Image src="/MANNY AVATAR.png" alt="Manny" width={40} height={40} className="rounded-full" />
                          </div>
                          <p className="text-m2p-ink font-medium text-sm">Drop your PDF here</p>
                          <p className="text-m2p-muted text-xs mt-1">or click to browse</p>
                          <p className="text-m2p-muted/60 text-xs mt-3">PDF files only · any size</p>
                        </div>
                      )}
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                        {error}
                        {file && (
                          <p className="mt-2">
                            <Link href="/pdf-compress" className="text-m2p-orange hover:underline">
                              Try our free PDF Compressor →
                            </Link>
                          </p>
                        )}
                        <ErrorRecovery />
                      </div>
                    )}

                    {/* CTA */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!file || uploading}
                        className="flex-1 rounded-xl bg-m2p-orange hover:bg-m2p-orange-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 text-base transition-colors"
                      >
                        {uploading ? "Checking…" : "Check My PDF →"}
                      </button>
                      {file && (
                        <button
                          type="button"
                          onClick={() => { setFile(null); setError(null); }}
                          className="rounded-xl border border-m2p-border text-m2p-muted hover:bg-m2p-ivory py-3.5 px-4 text-sm transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {!file && (
                      <p className="text-center text-xs text-m2p-muted mt-3">
                        You&apos;ll pay $9 on the results page — after you see the report
                      </p>
                    )}

                    {file && (
                      <p className="text-center text-xs text-m2p-muted mt-3">
                        ✓ File uploaded securely · report ready in ~90 seconds
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* My orders link */}
              <p className="text-center text-xs text-m2p-muted mt-4">
                Already purchased?{" "}
                <Link href="/my-orders" className="text-m2p-orange hover:underline">View your orders →</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT WE CHECK ──────────────────────────────────────── */}
      <section className="bg-m2p-ink py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-10">
            <h2 className="font-bebas text-4xl text-m2p-ivory tracking-wide mb-2">
              26 KDP Rules. <span className="text-m2p-orange">Every One.</span>
            </h2>
            <p className="text-m2p-ivory/60 text-sm max-w-lg mx-auto">
              We run your PDF through the same compliance checks Amazon uses — so you know exactly what to fix before you upload.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CHECKS.map((check) => (
              <div key={check.label} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3">
                <span className="text-xl shrink-0">{check.icon}</span>
                <span className="text-white/80 text-sm">{check.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section className="bg-m2p-ivory py-14">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-bebas text-4xl text-m2p-ink tracking-wide text-center mb-10">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: "📤",
                title: "Upload Your PDF",
                desc: "Drag and drop or click to choose. Any browser, any OS. No software needed.",
              },
              {
                step: "02",
                icon: "🔍",
                title: "We Scan 26 KDP Rules",
                desc: "Margins, trim size, bleed, fonts, page count — every issue flagged with exact page numbers in under 90 seconds.",
              },
              {
                step: "03",
                icon: "📥",
                title: "Download & Fix",
                desc: "Pay $9 and download your annotated PDF report. Fix the issues, upload to KDP with confidence.",
              },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border border-m2p-border bg-white p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-bebas text-m2p-orange text-3xl leading-none">{s.step}</span>
                  <span className="text-2xl">{s.icon}</span>
                </div>
                <h3 className="font-semibold text-m2p-ink mb-2">{s.title}</h3>
                <p className="text-m2p-muted text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREPARE YOUR PDF ───────────────────────────────────── */}
      <section className="bg-m2p-border/30 border-t border-m2p-border py-10">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-m2p-green mb-4">
            Before you scan — fix common issues first (optional)
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {PREP_TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-m2p-green/40 bg-white px-4 py-2 text-sm font-medium text-m2p-green hover:bg-m2p-green hover:text-white transition-colors"
              >
                {tool.label} →
              </Link>
            ))}
          </div>
        </div>
      </section>

    </SiteShell>
  );
}
