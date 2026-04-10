"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BrandWordmark } from "@/components/BrandWordmark";
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
    <div
      className="divide-y rounded-2xl border border-[#1A6B2A]/10 bg-white/90 px-4 py-1 sm:px-6 shadow-[0_12px_40px_-20px_rgba(13,61,24,0.2)]"
      style={{ borderColor: "rgba(0,0,0,0.06)" }}
    >
      {items.map((item, i) => (
        <div key={i}>
          <button
            type="button"
            className="w-full flex items-center justify-between gap-4 py-4 text-left transition-colors hover:bg-black/[0.02] rounded-lg -mx-1 px-1"
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

// ── Scan context types ────────────────────────────────────────────────────────

export type BookType   = "paperback" | "hardcover";
export type BleedMode  = "no-bleed" | "bleed";
export type ColorMode  = "bw" | "color";

export interface ScanContext {
  bookType:  BookType;
  bleedMode: BleedMode;
  colorMode: ColorMode;
}

// ── Chip picker helper ────────────────────────────────────────────────────────

function ChipGroup<T extends string>({
  label, options, value, onChange,
}: {
  label: string;
  options: { value: T; label: string; icon: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1.5 text-center" style={{ color: "#9B8E7E" }}>
        {label}
      </p>
      <div className="flex gap-2">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 transition-all font-semibold text-sm"
              style={{
                background: active ? "#f05a28" : "rgba(0,0,0,0.04)",
                color: active ? "#fff" : "#6B6151",
                border: `1.5px solid ${active ? "#f05a28" : "rgba(0,0,0,0.1)"}`,
              }}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Upload Widget ─────────────────────────────────────────────────────────────

function UploadWidget({
  file, isDragging, uploading, checkElapsedSec, error,
  scanContext, onScanContextChange,
  onDragOver, onDragLeave, onDrop, onFileSelect, onSubmit, onClear,
}: {
  file: File | null;
  isDragging: boolean;
  uploading: boolean;
  checkElapsedSec: number;
  error: string | null;
  scanContext: ScanContext;
  onScanContextChange: (ctx: ScanContext) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onClear: () => void;
}) {
  if (uploading) {
    const activeCheckIdx = Math.min(Math.floor(checkElapsedSec / 6), CHECKS.length - 1);
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: "#1A1208", border: "1px solid rgba(240,90,40,0.2)" }}>
        <div className="mx-auto mb-5 w-16 h-16 rounded-full border-4 animate-spin"
          style={{ borderColor: "rgba(240,90,40,0.2)", borderTopColor: "#f05a28" }} />
        <p className="text-2xl font-black mb-1" style={{ color: "#fff", letterSpacing: "-0.01em" }}>
          Scanning your manuscript…
        </p>
        <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
          Checking 26 KDP compliance rules
        </p>
        {/* Live check progress */}
        <div className="grid grid-cols-2 gap-2 mb-5 text-left">
          {CHECKS.slice(0, -1).map((check, i) => {
            const done = i < activeCheckIdx;
            const active = i === activeCheckIdx;
            return (
              <div key={check.label} className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: done ? "rgba(76,217,100,0.12)" : active ? "rgba(240,90,40,0.15)" : "rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 14 }}>{done ? "✅" : active ? "⏳" : check.icon}</span>
                <span className="text-xs font-medium truncate"
                  style={{ color: done ? "#4cd964" : active ? "#f05a28" : "rgba(255,255,255,0.3)" }}>
                  {check.label}
                </span>
              </div>
            );
          })}
        </div>
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
    <div className="rounded-2xl overflow-hidden shadow-[0_20px_50px_-24px_rgba(13,61,24,0.35)]" style={{ border: "1px solid rgba(26,107,42,0.12)", background: "#fff" }}>
      {/* Card header */}
      <div
        className="px-6 py-4 flex items-center justify-between backdrop-blur-sm"
        style={{
          background: "linear-gradient(180deg, rgba(26,18,8,0.97) 0%, #1A1208 100%)",
          borderBottom: "1px solid rgba(76,217,100,0.12)",
        }}
      >
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

        {/* ── Scan context pickers ── */}
        <div className="mb-4 space-y-3 rounded-xl p-4" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-xs font-bold uppercase tracking-wide text-center" style={{ color: "#6B6151" }}>
            Tell us about your book
          </p>
          <ChipGroup<BookType>
            label="Book type"
            value={scanContext.bookType}
            onChange={(v) => onScanContextChange({ ...scanContext, bookType: v })}
            options={[
              { value: "paperback", label: "Paperback", icon: "📖" },
              { value: "hardcover", label: "Hardcover", icon: "📕" },
            ]}
          />
          <ChipGroup<BleedMode>
            label="Bleed"
            value={scanContext.bleedMode}
            onChange={(v) => onScanContextChange({ ...scanContext, bleedMode: v })}
            options={[
              { value: "no-bleed", label: "No bleed", icon: "⬜" },
              { value: "bleed",    label: "With bleed", icon: "🩸" },
            ]}
          />
          <ChipGroup<ColorMode>
            label="Interior"
            value={scanContext.colorMode}
            onChange={(v) => onScanContextChange({ ...scanContext, colorMode: v })}
            options={[
              { value: "bw",    label: "Black & white", icon: "⚫" },
              { value: "color", label: "Full color",    icon: "🎨" },
            ]}
          />
        </div>

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
  const [showLandingHeader, setShowLandingHeader] = useState(true);
  const [scanContext, setScanContext]     = useState<ScanContext>({
    bookType:  "paperback",
    bleedMode: "no-bleed",
    colorMode: "bw",
  });

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

  useEffect(() => {
    const onScroll = () => setShowLandingHeader(window.scrollY < 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      const ctxParams = `&bk=${scanContext.bookType}&bl=${scanContext.bleedMode === "bleed" ? "1" : "0"}&cm=${scanContext.colorMode}`;
      if (saveData.id) { router.push(`/download/${saveData.id}?source=checker${ctxParams}`); return; }
      if (saveData.checkId) {
        const checkId = saveData.checkId;
        const deadline = Date.now() + 5 * 60 * 1000;
        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 2500));
          const statusRes = await fetch(`/api/print-ready-check-status?checkId=${encodeURIComponent(checkId)}`);
          let statusData: { status?: string; downloadId?: string; error?: string };
          try { statusData = (await statusRes.json()) as typeof statusData; } catch { continue; }
          if (statusData.status === "done" && statusData.downloadId) {
            router.push(`/download/${statusData.downloadId}?source=checker${ctxParams}`); return;
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
  }, [file, router, scanContext]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #FAF7EE 0%, #F2EBDF 35%, #FAF8F4 100%)" }}
    >

      {/* ══════════════════════════════════════════════════════════
          HEADER — logo only (trust signal, not navigation)
      ══════════════════════════════════════════════════════════ */}
      {showLandingHeader && (
        <header
          id="checker-top"
          className="sticky top-0 z-20 border-b border-[#1A6B2A]/10 bg-[#FAF7EE]/75 backdrop-blur-md"
        >
          <div className="mx-auto max-w-5xl px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <Link href="/" className="flex items-center gap-3 shrink-0 min-w-0">
              <Image src="/MANNY AVATAR.png" alt="manu2print" width={70} height={70} className="h-[70px] w-[70px] shrink-0 rounded-full object-cover" />
              <BrandWordmark variant="onLight" className="text-lg sm:text-xl" />
            </Link>
            <Link href="/dashboard"
              className="text-xs font-medium hover:opacity-70 transition-opacity shrink-0"
              style={{ color: "#9B8E7E" }}>
              Already purchased? View dashboard →
            </Link>
          </div>
        </header>
      )}

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

              <div className="relative mb-7 overflow-hidden rounded-3xl border border-orange-200/35 bg-white/55 px-5 py-4 shadow-[0_12px_40px_-16px_rgba(240,90,40,0.25)] backdrop-blur-md ring-1 ring-orange-500/[0.08]">
                <div
                  className="pointer-events-none absolute inset-0 opacity-90"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,248,242,0.95) 0%, rgba(255,255,255,0.4) 45%, rgba(76,217,100,0.06) 100%)",
                  }}
                  aria-hidden
                />
                <p className="relative text-center text-sm font-semibold tracking-tight text-[#c2410c] mb-3">
                  Most files fail on
                </p>
                <div className="relative grid grid-cols-2 gap-2">
                  {["Margins", "Trim size", "Font embedding", "Bleed settings"].map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 rounded-2xl border border-black/[0.04] bg-white/75 px-3 py-2.5 text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-colors hover:border-orange-200/50"
                      style={{ color: "#2c2419" }}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#f05a28]/15 to-[#4cd964]/12 text-[10px] font-bold text-[#f05a28]">
                        ✦
                      </span>
                      <span className="leading-tight">{f}</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: "🔒", text: "Secure upload" },
                  { icon: "🚫", text: "No account required" },
                  { icon: "📊", text: "See score free · $9 unlocks full report" },
                  { icon: "📥", text: "Instant download" },
                ].map(({ icon, text }) => (
                  <div
                    key={text}
                    className="group flex items-center gap-3 rounded-2xl border border-[#1A6B2A]/10 bg-white/75 px-4 py-3 shadow-[0_6px_28px_-12px_rgba(13,61,24,0.14)] backdrop-blur-sm transition-all duration-200 hover:border-[#1A6B2A]/18 hover:shadow-[0_10px_36px_-14px_rgba(13,61,24,0.2)]"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg shadow-inner ring-1 ring-black/[0.04]"
                      style={{
                        background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,247,238,0.9) 100%)",
                      }}
                    >
                      {icon}
                    </span>
                    <span className="text-left text-xs font-medium leading-snug text-[#5c5346]">{text}</span>
                  </div>
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
                scanContext={scanContext}
                onScanContextChange={setScanContext}
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
      <section style={{ background: "linear-gradient(180deg, #1A1208 0%, #0f0c09 100%)" }}>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold tracking-tight mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
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
              <p className="text-sm font-bold mb-6" style={{ color: "#f05a28" }}>
                Every rejection resets your timeline.
              </p>
              <p className="text-base font-semibold mb-5" style={{ color: "rgba(255,255,255,0.7)" }}>Or…</p>
              <div className="space-y-3">
                <div
                  className="rounded-2xl px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm"
                  style={{ background: "rgba(240,90,40,0.1)", border: "1px solid rgba(240,90,40,0.28)" }}
                >
                  <p className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm font-semibold tracking-tight">
                    <span style={{ color: "#ff9a6b" }}>Without</span>
                    <BrandWordmark variant="onDark" className="text-sm" />
                  </p>
                  <span className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
                    Upload → wait → rejection → guess → repeat
                  </span>
                </div>
                <div
                  className="rounded-2xl px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm"
                  style={{ background: "rgba(76,217,100,0.09)", border: "1px solid rgba(76,217,100,0.28)" }}
                >
                  <p className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm font-semibold tracking-tight">
                    <span style={{ color: "#7ee89a" }}>With</span>
                    <BrandWordmark variant="onDark" className="text-sm" />
                  </p>
                  <span className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.78)" }}>
                    Upload → scan → fix → publish
                  </span>
                </div>
              </div>
            </div>

            {/* Mock comparison */}
            <div className="space-y-3">
              <div
                className="rounded-2xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm"
                style={{ background: "rgba(240,90,40,0.08)", border: "1px solid rgba(240,90,40,0.22)" }}
              >
                <p className="mb-2 text-sm font-semibold tracking-tight" style={{ color: "#ff9a6b" }}>
                  Amazon&apos;s rejection email
                </p>
                <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.45)" }}>
                  &ldquo;Your file has been rejected. Please review the KDP formatting
                  guidelines and resubmit your manuscript.&rdquo;
                </p>
              </div>
              <div className="text-center text-xl" style={{ color: "rgba(255,255,255,0.15)" }}>↓</div>
              <div
                className="rounded-2xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm"
                style={{ background: "rgba(76,217,100,0.08)", border: "1px solid rgba(76,217,100,0.24)" }}
              >
                <p className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm font-semibold tracking-tight">
                  <BrandWordmark variant="onDark" className="text-sm" />
                  <span style={{ color: "#9ef5b2" }}>tells you exactly</span>
                </p>
                <div className="space-y-2.5">
                  {[
                    { page: "p.3",  issue: "Gutter margin 0.31\" — needs 0.50\"" },
                    { page: "p.1",  issue: "Trim 8.5×11 detected — KDP expects 6×9" },
                    { page: "p.5",  issue: "Image 187 DPI — will print blurry" },
                  ].map((item) => (
                    <div
                      key={item.issue}
                      className="flex items-start gap-2.5 rounded-xl bg-black/15 px-2.5 py-2 ring-1 ring-white/[0.06]"
                    >
                      <span
                        className="mt-0.5 shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-mono font-bold tabular-nums"
                        style={{ background: "rgba(76,217,100,0.2)", color: "#b8f5c8" }}
                      >
                        {item.page}
                      </span>
                      <span className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
                        {item.issue}
                      </span>
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
      <section style={{ background: "linear-gradient(180deg, #14100c 0%, #1A1208 40%, #0f0c09 100%)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
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
                className="rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-200 hover:bg-white/[0.07] hover:border-white/12"
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
      <section className="border-t border-[#1A6B2A]/8" style={{ background: "linear-gradient(180deg, #FAF8F4 0%, #F5F0E8 100%)" }}>
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
              <div key={s.step} className="rounded-2xl p-6 text-left transition-all duration-200 hover:border-[#1A6B2A]/22 hover:shadow-[0_12px_32px_-16px_rgba(13,61,24,0.18)]"
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
          <div className="text-center mb-2">
            <a
              href="#checker-top"
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide transition-opacity hover:opacity-80"
              style={{ color: "#f05a28" }}
            >
              ↑ Back to upload
            </a>
          </div>
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
            scanContext={scanContext}
            onScanContextChange={setScanContext}
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
      <section className="border-t border-black/[0.04]" style={{ background: "#FAF8F4" }}>
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
