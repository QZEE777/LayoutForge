"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatFileSize } from "@/lib/formatFileName";
import { cleanFilenameForDisplay } from "@/lib/kdpReportEnhance";
import { ErrorRecovery } from "@/components/ErrorRecovery";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatElapsedSeconds(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const CHECKS = [
  { icon: "📐", label: "Trim size" },
  { icon: "📏", label: "Margin compliance" },
  { icon: "🩸", label: "Bleed zone" },
  { icon: "🔤", label: "Font embedding" },
  { icon: "📄", label: "Page count" },
  { icon: "🖼️", label: "Image resolution" },
  { icon: "📦", label: "File size limits" },
  { icon: "🎨", label: "Colour mode" },
  { icon: "🔲", label: "Safe zone" },
  { icon: "📚", label: "Spine & cover" },
  { icon: "⚠️", label: "Page number flags" },
  { icon: "✅", label: "26 rules total" },
];

const FAQS = [
  {
    q: "When do I pay?",
    a: "After the scan. Upload free, see your readiness score and issue count — then pay $9 to unlock the full annotated report and fix instructions.",
  },
  {
    q: "What formats does it accept?",
    a: "PDF only. That's what KDP requires. Export from Canva, InDesign, Word, or Affinity Publisher — then upload that file.",
  },
  {
    q: "How long does it take?",
    a: "Under 90 seconds for most files. Larger files (100+ pages, lots of images) may take up to 3 minutes.",
  },
  {
    q: "What does the annotated PDF show?",
    a: "Every issue highlighted on the exact page it appears — margin violations, low-res images, trim errors. Plus plain-English instructions for fixing each one.",
  },
  {
    q: "Will fixing these issues guarantee KDP approval?",
    a: "No tool can guarantee that — Amazon's review is theirs. But fixing every flagged issue removes the most common rejection causes. Your odds go up significantly.",
  },
  {
    q: "Does it cover interior manuscripts only?",
    a: "Yes. This checks interior PDFs. Cover files have different specs — cover checking is coming soon.",
  },
];

// ── FAQ Accordion ─────────────────────────────────────────────────────────────

function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
      {items.map((item, i) => (
        <div key={i}>
          <button
            className="w-full flex items-center justify-between gap-4 py-4 text-left"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="font-semibold text-sm" style={{ color: "#1A1208" }}>{item.q}</span>
            <span className="shrink-0 text-lg leading-none transition-transform duration-200"
              style={{ color: "#f05a28", transform: open === i ? "rotate(45deg)" : "rotate(0deg)" }}>
              +
            </span>
          </button>
          {open === i && (
            <p className="text-sm pb-4 leading-relaxed" style={{ color: "#6B6151" }}>{item.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Upload Widget ─────────────────────────────────────────────────────────────

function UploadWidget({
  file, isDragging, uploading, checkElapsedSec, error,
  onDragOver, onDragLeave, onDrop, onFileSelect, onSubmit, onClear,
}: {
  file: File | null;
  isDragging: boolean;
  uploading: boolean;
  checkElapsedSec: number;
  error: string | null;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onClear: () => void;
}) {
  if (uploading) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: "#1A1208", border: "1px solid rgba(240,90,40,0.2)" }}>
        <div className="mx-auto mb-5 w-16 h-16 rounded-full border-4 animate-spin"
          style={{ borderColor: "rgba(240,90,40,0.2)", borderTopColor: "#f05a28" }} />
        <p className="text-2xl font-black mb-1" style={{ color: "#fff", letterSpacing: "-0.01em" }}>
          Scanning your manuscript…
        </p>
        <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
          Checking 26 KDP compliance rules
        </p>
        <div className="text-5xl font-black tabular-nums" style={{ color: "#f05a28" }}>
          {formatElapsedSeconds(checkElapsedSec)}
        </div>
        <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.3)" }}>
          Most scans finish in under 90 seconds
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg" style={{ border: "2px solid rgba(0,0,0,0.07)", background: "#fff" }}>
      {/* Card header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ background: "#1A1208" }}>
        <div>
          <p className="font-bold text-sm" style={{ color: "#fff" }}>KDP PDF Checker</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Upload → Scan → Fix → Publish
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black" style={{ color: "#f05a28" }}>$9</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>one-time</p>
        </div>
      </div>

      <div className="p-6">
        {/* Dropzone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative rounded-xl border-2 border-dashed p-10 text-center transition-all cursor-pointer mb-4 ${
            isDragging
              ? "border-orange-400 bg-orange-50"
              : file
              ? "border-green-400 bg-green-50"
              : "border-gray-200 bg-gray-50 hover:border-orange-300"
          }`}
        >
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={onFileSelect}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          {file ? (
            <div>
              <div className="text-3xl mb-2">📄</div>
              <p className="font-semibold text-sm" style={{ color: "#1A1208" }}>
                {cleanFilenameForDisplay(file.name)}
              </p>
              <p className="text-xs mt-1" style={{ color: "#2d8a3e" }}>
                {formatFileSize(file.size)} · ready to scan ✓
              </p>
            </div>
          ) : (
            <div>
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ background: "rgba(240,90,40,0.08)" }}>
                <Image src="/MANNY AVATAR.png" alt="Manny" width={40} height={40} className="rounded-full" />
              </div>
              <p className="font-semibold text-sm" style={{ color: "#1A1208" }}>
                Drop your PDF here
              </p>
              <p className="text-xs mt-1" style={{ color: "#9B8E7E" }}>or click to browse</p>
              <p className="text-xs mt-3" style={{ color: "#C4B5A0" }}>PDF files only · any size</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}>
            {error}
            {file && (
              <p className="mt-2">
                <Link href="/pdf-compress" style={{ color: "#f05a28" }} className="hover:underline">
                  Try our free PDF Compressor →
                </Link>
              </p>
            )}
            <ErrorRecovery />
          </div>
        )}

        {/* CTA button */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!file || uploading}
            className="flex-1 rounded-xl font-black py-4 text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#f05a28", color: "#fff" }}
          >
            {uploading ? "Checking…" : "Check My PDF →"}
          </button>
          {file && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-xl border py-4 px-4 text-sm transition-colors"
              style={{ borderColor: "rgba(0,0,0,0.1)", color: "#9B8E7E" }}
            >
              Clear
            </button>
          )}
        </div>

        <p className="text-center text-xs mt-3" style={{ color: "#9B8E7E" }}>
          {file
            ? "✓ File ready · score in ~90 seconds · $9 to unlock full report"
            : "Score is free. $9 unlocks the full annotated report."}
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function KdpPdfCheckerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [file, setFile]                   = useState<File | null>(null);
  const [isDragging, setIsDragging]       = useState(false);
  const [uploading, setUploading]         = useState(false);
  const [checkElapsedSec, setCheckElapsedSec] = useState(0);
  const [error, setError]                 = useState<string | null>(null);

  // ── Share token attribution — set cookie + localStorage on ?sh= param ───────
  useEffect(() => {
    const sh = searchParams.get("sh");
    if (!sh || !sh.startsWith("sh_") || sh.length > 22) return;

    // Sanitise token (alphanumeric + underscore only)
    if (!/^sh_[a-z0-9]{16}$/.test(sh)) return;

    const COOKIE_NAME = "m2p_sh";
    const THIRTY_DAYS = 30 * 24 * 60 * 60;

    // Set 30-day cookie (always reset on new click = re-engagement reset)
    document.cookie = `${COOKIE_NAME}=${sh}; max-age=${THIRTY_DAYS}; path=/; SameSite=Lax`;

    // localStorage fallback
    try { localStorage.setItem(COOKIE_NAME, sh); } catch { /* blocked */ }

    // Fire-and-forget click record to API
    fetch("/api/share/click", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token: sh, source_page: "kdp-pdf-checker" }),
    }).catch(() => { /* attribution loss acceptable */ });
  }, [searchParams]);

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

  const handleDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) { setError(err); setFile(null); return; }
    setError(null); setFile(f);
  }, [validateFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) { setError(err); setFile(null); return; }
    setError(null); setFile(f);
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: "#FAF8F4" }}>

      {/* ══════════════════════════════════════════════════════════
          HEADER — logo only (trust signal, not navigation)
      ══════════════════════════════════════════════════════════ */}
      <header style={{ background: "#FAF8F4", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/MANNY AVATAR.png" alt="manu2print" width={32} height={32} className="rounded-full" />
            <span>
              <span style={{ color: "#F05A28", fontWeight: "bold", fontSize: "1.1rem" }}>manu</span>
              <span style={{ color: "#4cd964", fontWeight: "bold", fontSize: "1.1rem" }}>2print</span>
            </span>
          </Link>
          <Link href="/dashboard"
            className="text-xs font-medium hover:opacity-70 transition-opacity"
            style={{ color: "#9B8E7E" }}>
            Already purchased? View dashboard →
          </Link>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          HERO — headline + upload widget
      ══════════════════════════════════════════════════════════ */}
      <section>
        <div className="mx-auto max-w-5xl px-6 py-14 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-start">

            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide mb-6"
                style={{ background: "rgba(240,90,40,0.08)", color: "#f05a28", border: "1px solid rgba(240,90,40,0.15)" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#f05a28" }} />
                $9 · One time · Results in ~90 seconds
              </div>

              <h1 className="font-black leading-tight mb-4"
                style={{ color: "#1A1208", fontSize: "clamp(2rem,4vw,2.8rem)", letterSpacing: "-0.025em", textWrap: "balance" } as React.CSSProperties}>
                Your PDF looks right.{" "}
                <span style={{ color: "#f05a28" }}>KDP will still reject it.</span>
              </h1>

              <p className="text-base font-semibold mb-4" style={{ color: "#3a3020" }}>
                Check it before you upload — or fix it after rejection.
              </p>

              <p className="text-base leading-relaxed mb-5" style={{ color: "#6B6151" }}>
                Get a precise, page-by-page compliance report in minutes — so you can fix every issue before Amazon sees it.
              </p>

              <div className="rounded-xl px-4 py-3 mb-7"
                style={{ background: "rgba(240,90,40,0.05)", border: "1px solid rgba(240,90,40,0.12)" }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#f05a28" }}>Most files fail on:</p>
                <div className="grid grid-cols-2 gap-1">
                  {["Margins", "Trim size", "Font embedding", "Bleed settings"].map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-sm" style={{ color: "#3a3020" }}>
                      <span style={{ color: "#f05a28" }}>·</span> {f}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 mb-7">
                {[
                  "Annotated PDF with every issue highlighted by page",
                  "Exact page numbers for every violation",
                  "Plain-English fix instructions — no guesswork",
                  "Works with Canva, InDesign, Word, and PDF exports",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="shrink-0 mt-0.5" style={{ color: "#4cd964" }}>✓</span>
                    <span className="text-sm leading-relaxed" style={{ color: "#3a3020" }}>{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 text-xs" style={{ color: "#9B8E7E" }}>
                {["🔒 Secure upload", "🚫 No account required", "📊 See score free · $9 unlocks full report", "📥 Instant download"].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>

            {/* Right — upload widget */}
            <div className="lg:sticky lg:top-8">
              <UploadWidget
                file={file}
                isDragging={isDragging}
                uploading={uploading}
                checkElapsedSec={checkElapsedSec}
                error={error}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onFileSelect={handleFileSelect}
                onSubmit={handleSubmit}
                onClear={() => { setFile(null); setError(null); }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          THE PROBLEM — Amazon's rejection cycle
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: "#1A1208" }}>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: "rgba(255,255,255,0.25)" }}>
                The problem
              </p>
              <h2 className="font-black leading-tight mb-4"
                style={{ color: "#fff", fontSize: "clamp(1.6rem,3vw,2.2rem)", letterSpacing: "-0.02em" }}>
                Amazon doesn&apos;t tell you what&apos;s wrong.
                <br />
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75em", fontWeight: 700 }}>It sends you back to guess.</span>
              </h2>
              <p className="text-base leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
                Upload → wait → vague rejection → guess → re-upload → repeat.
                Sometimes for days. Sometimes for weeks.
              </p>
              <p className="text-sm font-bold mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>
                Every rejection resets your timeline.
              </p>
              <p className="text-base font-semibold mb-5" style={{ color: "rgba(255,255,255,0.7)" }}>Or…</p>
              <div className="space-y-3">
                <div className="rounded-xl px-4 py-3"
                  style={{ background: "rgba(240,90,40,0.08)", border: "1px solid rgba(240,90,40,0.2)" }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#f05a28" }}>Without manu2print</p>
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Upload → wait → rejection → guess → repeat
                  </span>
                </div>
                <div className="rounded-xl px-4 py-3"
                  style={{ background: "rgba(76,217,100,0.08)", border: "1px solid rgba(76,217,100,0.2)" }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#4cd964" }}>With manu2print</p>
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                    Upload → scan → fix → publish
                  </span>
                </div>
              </div>
            </div>

            {/* Mock comparison */}
            <div className="space-y-3">
              <div className="rounded-xl p-4"
                style={{ background: "rgba(240,90,40,0.07)", border: "1px solid rgba(240,90,40,0.18)" }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#f05a28" }}>
                  Amazon&apos;s rejection email
                </p>
                <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.45)" }}>
                  &ldquo;Your file has been rejected. Please review the KDP formatting
                  guidelines and resubmit your manuscript.&rdquo;
                </p>
              </div>
              <div className="text-center text-xl" style={{ color: "rgba(255,255,255,0.15)" }}>↓</div>
              <div className="rounded-xl p-4"
                style={{ background: "rgba(76,217,100,0.07)", border: "1px solid rgba(76,217,100,0.18)" }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#4cd964" }}>
                  manu2print tells you exactly
                </p>
                <div className="space-y-2">
                  {[
                    { page: "p.3",  issue: "Gutter margin 0.31\" — needs 0.50\"" },
                    { page: "p.1",  issue: "Trim 8.5×11 detected — KDP expects 6×9" },
                    { page: "p.5",  issue: "Image 187 DPI — will print blurry" },
                  ].map((item) => (
                    <div key={item.issue} className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
                        style={{ background: "rgba(76,217,100,0.15)", color: "#4cd964" }}>
                        {item.page}
                      </span>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>{item.issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          26 CHECKS
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: "#1A1208", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="mx-auto max-w-5xl px-6 pb-16">
          <div className="text-center mb-8">
            <h2 className="font-black text-3xl mb-2"
              style={{ color: "#fff", letterSpacing: "-0.02em" }}>
              KDP checks 26 rules.{" "}
              <span style={{ color: "#f05a28" }}>Miss one — you&apos;re rejected.</span>
            </h2>
            <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.4)", maxWidth: 480, margin: "0 auto" }}>
              We check every one before you upload — so you don&apos;t find out the hard way.
            </p>
            <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.25)", maxWidth: 480, margin: "8px auto 0" }}>
              Visual correctness does not guarantee approval. We check the same categories KDP reviews before every submission.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {CHECKS.map((check) => (
              <div key={check.label}
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-lg shrink-0">{check.icon}</span>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{check.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: "#FAF8F4" }}>
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9B8E7E" }}>
            How it works
          </p>
          <h2 className="font-black text-3xl mb-2" style={{ color: "#1A1208", letterSpacing: "-0.02em" }}>
            Three steps. No guesswork.
          </h2>
          <p className="text-sm mb-10" style={{ color: "#9B8E7E" }}>
            If your file isn&apos;t perfect, KDP will catch it. We catch it first.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Upload your PDF",
                body: "The exact file you plan to submit to KDP. Interior manuscripts only, any page count.",
              },
              {
                step: "02",
                title: "See every issue",
                body: "Margins, trim size, bleed, fonts — flagged by page. Score and issue count shown immediately.",
              },
              {
                step: "03",
                title: "Fix once. Upload once.",
                body: "Pay $9 to unlock the full annotated report. Fix the issues, re-export, publish with confidence.",
              },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl p-6 text-left"
                style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <p className="font-black text-4xl mb-3" style={{ color: "rgba(240,90,40,0.18)" }}>{s.step}</p>
                <p className="font-bold text-sm mb-2" style={{ color: "#1A1208" }}>{s.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "#6B6151" }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECOND CTA — upload widget repeated
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: "rgba(240,90,40,0.04)", borderTop: "1px solid rgba(240,90,40,0.1)", borderBottom: "1px solid rgba(240,90,40,0.1)" }}>
        <div className="mx-auto max-w-lg px-6 py-16">
          <div className="text-center mb-8">
            <h2 className="font-black text-3xl mb-2"
              style={{ color: "#1A1208", letterSpacing: "-0.02em" }}>
              Stop guessing.{" "}
              <span style={{ color: "#f05a28" }}>Start knowing.</span>
            </h2>
            <p className="text-sm mb-2" style={{ color: "#6B6151" }}>
              Check your file before Amazon does.
            </p>
            <p className="text-xs" style={{ color: "#9B8E7E" }}>
              No waiting. No re-uploads. No guesswork.
            </p>
          </div>

          {/* Affiliate "Perfect for" block */}
          <div className="rounded-xl px-5 py-4 mb-6 text-center"
            style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#9B8E7E" }}>Perfect for</p>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-1">
              {["Canva users", "First-time authors", "Self-publishers", "Book formatters"].map((t) => (
                <span key={t} className="text-sm" style={{ color: "#6B6151" }}>· {t}</span>
              ))}
            </div>
          </div>
          <UploadWidget
            file={file}
            isDragging={isDragging}
            uploading={uploading}
            checkElapsedSec={checkElapsedSec}
            error={error}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
            onSubmit={handleSubmit}
            onClear={() => { setFile(null); setError(null); }}
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════ */}
      <section style={{ background: "#FAF8F4" }}>
        <div className="mx-auto max-w-2xl px-6 py-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-center" style={{ color: "#9B8E7E" }}>
            Questions
          </p>
          <h2 className="font-black text-3xl mb-8 text-center"
            style={{ color: "#1A1208", letterSpacing: "-0.02em" }}>
            Common questions
          </h2>
          <FaqAccordion items={FAQS} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER — minimal, legal only
      ══════════════════════════════════════════════════════════ */}
      <footer style={{ borderTop: "1px solid rgba(0,0,0,0.07)", background: "#FAF8F4" }}>
        <div className="mx-auto max-w-5xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "#C4B5A0" }}>
            © 2026 manu2print.com · KDP tools for indie authors
          </p>
          <div className="flex items-center gap-4 text-xs" style={{ color: "#9B8E7E" }}>
            <Link href="/privacy"  className="hover:opacity-70 transition-opacity">Privacy</Link>
            <Link href="/terms"    className="hover:opacity-70 transition-opacity">Terms</Link>
            <Link href="/refunds"  className="hover:opacity-70 transition-opacity">Refunds</Link>
            <Link href="/contact"  className="hover:opacity-70 transition-opacity">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
