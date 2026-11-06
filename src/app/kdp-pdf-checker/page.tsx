"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Crop, Ruler, Droplet, Type, FileText, Package, Palette, Frame, BookOpen,
  AlertTriangle, ListChecks, CheckCircle2, Loader2, Square, Check, Upload, X,
  ChevronDown, Menu, AlertCircle, Calculator, BookText, DollarSign, Minimize2,
  ArrowRight, type LucideIcon,
} from "lucide-react";
import { HARDCOVER_TRIM_SIZES, TRIM_SIZES } from "@/lib/kdpConfig";
import { BrandWordmark } from "@/components/BrandWordmark";
import { NavToolsDropdown } from "@/components/NavToolsDropdown";
import { formatFileSize } from "@/lib/formatFileName";
import { cleanFilenameForDisplay, hasKdpUnsafeFilename } from "@/lib/kdpReportEnhance";
import { CHECKER_MAX_UPLOAD_BYTES, CHECKER_MAX_UPLOAD_MB } from "@/lib/checkerUploadLimits";
import SocialLinks from "@/components/SocialLinks";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

/** localStorage key for in-flight / timed-out scan resume */
const LS_RESUME_KEY = "m2p_resume_check";

/** Shared keyboard focus ring (brand orange, visible on cream and white). */
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F05A28] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7EE]";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** XHR-based PUT so we get upload progress events that fetch() doesn't expose. */
function putWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error("R2 upload failed"));
    xhr.onerror = () => reject(new Error("R2 upload failed"));
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", "application/pdf");
    xhr.send(file);
  });
}

function formatElapsedSeconds(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Data ──────────────────────────────────────────────────────────────────────

/** Shown one by one while a scan runs. */
const CHECKS: Array<{ icon: LucideIcon; label: string }> = [
  { icon: Crop, label: "Trim size" },
  { icon: Ruler, label: "Margin compliance" },
  { icon: Droplet, label: "Bleed zone" },
  { icon: Type, label: "Font embedding" },
  { icon: FileText, label: "Page count" },
  { icon: Frame, label: "Image resolution" },
  { icon: Package, label: "File size limits" },
  { icon: Palette, label: "Colour mode" },
  { icon: Square, label: "Safe zone" },
  { icon: BookOpen, label: "Spine & cover" },
  { icon: AlertTriangle, label: "Page number flags" },
  { icon: ListChecks, label: "26 rules total" },
];

const NAV_LINKS: Array<{ href: string; label: string; active?: boolean }> = [
  { href: "/kdp-pdf-checker", label: "KDP PDF Checker", active: true },
  { href: "/blog", label: "Publishing Guides" },
  { href: "#pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

const HERO_POINTS = [
  "Check margins, trim size and bleed",
  "Verify fonts and embedding",
  "Catch layout and print-ready issues",
  "Save time and avoid KDP rejections",
];

const STEPS: Array<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: Upload, title: "Upload your PDF", body: "Add the interior file you plan to send to KDP." },
  { icon: ListChecks, title: "Review your score", body: "See a free readiness score and how many issues we found." },
  { icon: BookOpen, title: "Fix with confidence", body: "Unlock the full report: every issue by page, with a plain-English fix." },
];

const FEATURED_TOOLS: Array<{ icon: LucideIcon; name: string; description: string; href: string }> = [
  {
    icon: Calculator,
    name: "Spine Width Calculator",
    description: "Get the exact spine width for your paperback cover from page count and paper.",
    href: "/spine-calculator",
  },
  {
    icon: BookText,
    name: "Page Count Estimator",
    description: "Estimate your page count from word count, trim size and font size.",
    href: "/page-count-estimator",
  },
  {
    icon: DollarSign,
    name: "Royalty Calculator",
    description: "See what Amazon pays you per sale after print cost, before you set a price.",
    href: "/royalty-calculator",
  },
  {
    icon: Minimize2,
    name: "PDF Compressor",
    description: "Shrink a large manuscript PDF for upload without blurring text or images.",
    href: "/pdf-compress",
  },
];

const MORE_TOOLS: Array<{ name: string; href: string }> = [
  { name: "Banned Keyword Checker", href: "/banned-keyword-checker" },
  { name: "Title & Metadata Check", href: "/title-metadata-check" },
  { name: "Page Number Formatter", href: "/page-number-formatter" },
];

const PACKS = [
  { label: "Author Pack", price: "$21", scans: "5 scans", perScan: "$4.20 / scan", type: "author_pack" },
  { label: "Indie Pack", price: "$39", scans: "10 scans", perScan: "$3.90 / scan", type: "indie_pack", best: true },
  { label: "Pro Pack", price: "$69", scans: "20 scans", perScan: "$3.45 / scan", type: "pro_pack" },
];

const FAQS = [
  {
    q: "What does the KDP PDF Checker check for?",
    a: "Your interior PDF is checked against 26 of KDP's published print requirements: trim size, margins, bleed, font embedding, page size consistency, image resolution, colour mode, file size and more. The report tells you which rules your file fails and on which pages.",
  },
  {
    q: "What's the difference between the free score and the paid report?",
    a: "The free readiness score shows your score out of 100 and how many issues we found, so you know whether there's a problem. The $9 full report shows every issue on the exact page it appears, with a plain-English fix for each one, plus the annotated PDF.",
  },
  {
    q: "What do I get for $9?",
    a: "One full scan with the complete report and annotated PDF, and one free recheck. No subscription, and credits never expire.",
  },
  {
    q: "Can I recheck my PDF after making changes?",
    a: "Yes. Your $9 includes one free recheck. Fix the issues in your layout app, export a new PDF and run it through the checker again to confirm it's clean before you upload to Amazon.",
  },
  {
    q: "What book types and trim sizes are supported?",
    a: `Paperback and hardcover interiors, black & white or colour, with or without bleed. You can pick a standard KDP trim (paperback 5×8 up to 8.5×11; hardcover 5.5×8.5 up to 8.25×11), or leave it on "Detect from PDF" and we read the size from your file. PDFs up to ${CHECKER_MAX_UPLOAD_MB} MB.`,
  },
  {
    q: "Does this replace Amazon KDP's review?",
    a: "No. Amazon still runs its own review, and no tool can guarantee acceptance. The checker catches the formatting issues behind most rejections so you can fix them before you upload.",
  },
  {
    q: "Will it fix my PDF automatically?",
    a: "No. It shows you every issue and how to fix it. You make the corrections in your layout app (InDesign, Canva, Word, Affinity Publisher), export a new PDF, then upload to KDP.",
  },
  {
    q: "How long does a scan take?",
    a: "Most scans finish within 5 minutes. Larger files can take a little longer, so keep the tab open while it runs.",
  },
];

// ── FAQ Accordion ─────────────────────────────────────────────────────────────

function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-[#E0D8C4]">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <h3>
              <button
                type="button"
                id={`faq-q-${i}`}
                aria-expanded={isOpen}
                aria-controls={`faq-a-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className={cn(
                  "flex w-full items-center justify-between gap-4 rounded-md py-3.5 text-left text-[15px] font-medium text-[#1A1208] transition-colors hover:text-[#F05A28]",
                  FOCUS,
                )}
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 text-[#6B6151] transition-transform duration-200", isOpen && "rotate-180")}
                  aria-hidden
                />
              </button>
            </h3>
            {isOpen && (
              <p
                id={`faq-a-${i}`}
                role="region"
                aria-labelledby={`faq-q-${i}`}
                className="pb-4 pr-6 text-sm leading-relaxed text-[#5C5346]"
              >
                {item.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Scan context types ────────────────────────────────────────────────────────

export type BookType   = "paperback" | "hardcover";
export type BleedMode  = "no-bleed" | "bleed";
export type ColorMode  = "bw" | "color";
export type PaperType  = "white" | "cream" | "groundwood" | "standard-color" | "premium-color";

export interface ScanContext {
  bookType:  BookType;
  bleedMode: BleedMode;
  colorMode: ColorMode;
  paperType: PaperType;
  /** Optional KDP trim id (TRIM_SIZES / HARDCOVER id); empty = detect from PDF only. */
  intendedTrimId: string;
}

const PAPERBACK_INTENDED_IDS = ["5x8", "5.5x8.5", "6x9", "6.14x9.21", "8.5x11", "8.5x8.5", "7x10", "8x10"] as const;
const HARDCOVER_INTENDED_IDS = ["hc-5.5x8.5", "hc-6x9", "hc-6.14x9.21", "hc-7x10", "hc-8.25x11"] as const;

function labelForKdpTrimId(id: string): string {
  const pb = TRIM_SIZES.find((t) => t.id === id);
  if (pb) return pb.name;
  const hc = HARDCOVER_TRIM_SIZES.find((t) => t.id === id);
  if (hc) return hc.name;
  return id;
}

// ── Option row (radio pair) ───────────────────────────────────────────────────

function OptionRow<T extends string>({
  name, label, options, value, onChange,
}: {
  name: string;
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="grid grid-cols-2 items-center gap-x-2 gap-y-1.5 sm:grid-cols-[7.5rem_1fr_1fr]">
      <legend className="sr-only">{label}</legend>
      <span aria-hidden className="col-span-2 text-sm font-semibold text-[#1A1208] sm:col-span-1">
        {label}
      </span>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <label key={opt.value} className="block cursor-pointer">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={active}
              onChange={() => onChange(opt.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-[#F05A28] peer-focus-visible:ring-offset-1",
                active
                  ? "border-[#1F7A34]/35 bg-[#EEF5E9] font-semibold text-[#1A1208]"
                  : "border-[#E0D8C4] bg-white text-[#5C5346] hover:border-[#1F7A34]/30",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                  active ? "border-[#1F7A34]" : "border-[#B8AC98]",
                )}
              >
                {active && <span className="h-2 w-2 rounded-full bg-[#1F7A34]" />}
              </span>
              <span className="leading-tight">{opt.label}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

// ── Upload Widget ─────────────────────────────────────────────────────────────

function UploadWidget({
  file, isDragging, uploading, checkElapsedSec, uploadProgress, error,
  scanContext, onScanContextChange,
  onDragOver, onDragLeave, onDrop, onFileSelect, onSubmit, onClear,
}: {
  file: File | null;
  isDragging: boolean;
  uploading: boolean;
  checkElapsedSec: number;
  uploadProgress: number | null;
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
    // ── Upload phase — show progress bar ────────────────────────────────────
    if (uploadProgress !== null) {
      return (
        <div className="rounded-2xl border border-[#F05A28]/20 bg-[#1A1208] p-8 text-center" role="status" aria-live="polite">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#F05A28]/20 bg-[#F05A28]/10">
            <Upload className="h-6 w-6 text-[#F05A28]" aria-hidden />
          </div>
          <p className="mb-1 text-2xl font-black tracking-tight text-white">Uploading your PDF…</p>
          <p className="mb-6 text-sm text-white/60">Sending to secure storage — do not close this tab</p>
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#F05A28] transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm font-black tabular-nums text-[#F05A28]">{uploadProgress}%</p>
        </div>
      );
    }

    // ── Scan phase — spinner + live check grid ──────────────────────────────
    const activeCheckIdx = Math.min(Math.floor(checkElapsedSec / 6), CHECKS.length - 1);
    return (
      <div className="rounded-2xl border border-[#F05A28]/20 bg-[#1A1208] p-8 text-center" role="status" aria-live="polite">
        <div className="mx-auto mb-5 h-16 w-16 animate-spin rounded-full border-4 border-[#F05A28]/20 border-t-[#F05A28]" />
        <p className="mb-1 text-2xl font-black tracking-tight text-white">Scanning your manuscript…</p>
        <p className="mb-4 text-sm text-white/60">Checking 26 KDP compliance rules</p>
        <div className="mb-5 grid grid-cols-2 gap-2 text-left">
          {CHECKS.slice(0, -1).map((check, i) => {
            const done = i < activeCheckIdx;
            const active = i === activeCheckIdx;
            return (
              <div
                key={check.label}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2",
                  done ? "bg-[#4cd964]/10" : active ? "bg-[#F05A28]/15" : "bg-white/5",
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#4cd964]" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#F05A28]" />
                ) : (
                  <check.icon className="h-3.5 w-3.5 shrink-0 text-white/30" />
                )}
                <span
                  className={cn(
                    "truncate text-xs font-medium",
                    done ? "text-[#4cd964]" : active ? "text-[#F05A28]" : "text-white/40",
                  )}
                >
                  {check.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="text-5xl font-black tabular-nums text-[#F05A28]">
          {formatElapsedSeconds(checkElapsedSec)}
        </div>
        <p className={cn("mt-3 text-xs", checkElapsedSec >= 60 ? "text-white/60" : "text-white/40")}>
          {checkElapsedSec >= 60
            ? "Larger files can take a few minutes longer. Keep this tab open while we finish your scan."
            : "Most scans finish within 5 minutes"}
        </p>
      </div>
    );
  }

  // KDP hardcovers: no groundwood paper and no standard color.
  const isHardcover = scanContext.bookType === "hardcover";
  const paperOptions: { value: PaperType; label: string }[] = scanContext.colorMode === "bw"
    ? [{ value: "white", label: "White paper" }, { value: "cream", label: "Cream paper" },
       ...(isHardcover ? [] : [{ value: "groundwood" as PaperType, label: "Groundwood" }])]
    : [...(isHardcover ? [] : [{ value: "standard-color" as PaperType, label: "Standard color" }]),
       { value: "premium-color" as PaperType, label: "Premium color" }];

  return (
    <div className="rounded-2xl border border-[#E0D8C4] bg-white/95 p-5 shadow-[0_24px_60px_-28px_rgba(26,18,8,0.35)] sm:p-6">
      <h2 className="text-[1.9rem] font-extrabold leading-none tracking-[-0.02em] text-[#1A1208] sm:text-[2.1rem]">
        KDP PDF Checker
      </h2>
      <p className="mt-1.5 text-[15px] text-[#5C5346]">Check your book file against KDP&apos;s print rules.</p>

      {/* Dropzone — the whole area opens the file picker */}
      <input
        id="checker-file"
        type="file"
        accept=".pdf,application/pdf"
        onChange={onFileSelect}
        className="peer sr-only"
      />
      <label
        htmlFor="checker-file"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "mt-5 flex cursor-pointer items-center gap-5 rounded-xl border-2 border-dashed px-5 py-5 transition-colors",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-[#F05A28] peer-focus-visible:ring-offset-2",
          isDragging
            ? "border-[#F05A28] bg-[#FEF0EB]"
            : file && error
            ? "border-amber-400 bg-amber-50"
            : file
            ? "border-[#1F7A34]/50 bg-[#EEF5E9]"
            : "border-[#D9CFB9] bg-[#FCFAF5] hover:border-[#F05A28]/60",
        )}
      >
        <span className="relative flex h-16 w-14 shrink-0 items-center justify-center rounded-md border-2 border-[#1A1208] bg-white" aria-hidden>
          <span className="absolute right-[-2px] top-[-2px] h-4 w-4 rounded-bl-md border-b-2 border-l-2 border-[#1A1208] bg-[#FCFAF5]" />
          <span className="absolute bottom-2.5 left-[-8px] rounded bg-[#F05A28] px-1.5 py-0.5 text-[11px] font-black text-white">PDF</span>
        </span>
        <span className="h-14 w-px shrink-0 bg-[#E0D8C4]" aria-hidden />
        <span className="min-w-0 flex-1 text-center">
          {file ? (
            <>
              <span className="block truncate font-semibold text-[#1A1208]">{cleanFilenameForDisplay(file.name)}</span>
              <span className={cn("mt-1 block text-xs", error ? "text-amber-800" : "text-[#1F7A34]")}>
                {formatFileSize(file.size)}
                {error
                  ? " · tap Check my PDF again (last scan did not finish)"
                  : " · selected — tap Check my PDF to upload & scan"}
              </span>
              {hasKdpUnsafeFilename(file.name) && (
                <span className="mt-1 block text-xs font-semibold text-amber-800">
                  Rename this file before uploading to KDP: KDP rejects file names with emoji or symbols like # % ? / :
                </span>
              )}
            </>
          ) : (
            <>
              <span className="block text-lg font-bold text-[#1A1208] sm:text-xl">Drop your PDF here</span>
              <span className="mt-2 flex items-center justify-center gap-3 text-sm text-[#5C5346]">
                or
                <span className="rounded-lg border-2 border-[#1F7A34] px-4 py-1.5 font-bold text-[#1F7A34]">Choose PDF</span>
              </span>
              <span className="mt-2 block text-xs text-[#6B6151]">PDF files only · up to {CHECKER_MAX_UPLOAD_MB}&nbsp;MB</span>
            </>
          )}
        </span>
      </label>

      {/* Error */}
      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
          {file && /file too large|exceeds.*(?:mb|limit)|too large.*(?:mb|upload)/i.test(error) && (
            <p className="mt-2">
              <Link href="/pdf-compress" className={cn("font-semibold text-[#C2410C] hover:underline", FOCUS)}>
                Try our free PDF Compressor →
              </Link>
            </p>
          )}
        </div>
      )}

      {/* Book settings */}
      <div className="mt-5 space-y-2.5">
        <OptionRow<BookType>
          name="bookType"
          label="Book type"
          value={scanContext.bookType}
          onChange={(v) => onScanContextChange({
            ...scanContext, bookType: v, intendedTrimId: "",
            paperType: v === "hardcover" && scanContext.paperType === "groundwood" ? "white"
              : v === "hardcover" && scanContext.paperType === "standard-color" ? "premium-color"
              : scanContext.paperType,
          })}
          options={[
            { value: "paperback", label: "Paperback" },
            { value: "hardcover", label: "Hardcover" },
          ]}
        />
        <OptionRow<BleedMode>
          name="bleedMode"
          label="Bleed"
          value={scanContext.bleedMode}
          onChange={(v) => onScanContextChange({ ...scanContext, bleedMode: v })}
          options={[
            { value: "no-bleed", label: "No bleed" },
            { value: "bleed", label: "With bleed" },
          ]}
        />
        <OptionRow<ColorMode>
          name="colorMode"
          label="Interior color"
          value={scanContext.colorMode}
          onChange={(v) => onScanContextChange({ ...scanContext, colorMode: v, paperType: v === "bw" ? "white" : scanContext.bookType === "hardcover" ? "premium-color" : "standard-color" })}
          options={[
            { value: "bw", label: "Black & white" },
            { value: "color", label: "Full color" },
          ]}
        />
        <OptionRow<PaperType>
          name="paperType"
          label={scanContext.colorMode === "bw" ? "Paper color" : "Color tier"}
          value={scanContext.paperType}
          onChange={(v) => onScanContextChange({ ...scanContext, paperType: v })}
          options={paperOptions}
        />
        <div className="grid grid-cols-1 items-center gap-x-2 gap-y-1.5 pt-0.5 sm:grid-cols-[7.5rem_1fr]">
          <label htmlFor="checker-trim" className="text-sm font-semibold text-[#1A1208]">
            Trim size <span className="font-normal text-[#6B6151]">(optional)</span>
          </label>
          <div className="relative">
            <select
              id="checker-trim"
              aria-describedby="checker-trim-help"
              className={cn(
                "w-full appearance-none rounded-lg border border-[#E0D8C4] bg-white py-2 pl-3 pr-9 text-sm font-medium text-[#1A1208]",
                FOCUS,
              )}
              value={scanContext.intendedTrimId}
              onChange={(e) => onScanContextChange({ ...scanContext, intendedTrimId: e.target.value })}
            >
              <option value="">Detect from PDF</option>
              {(scanContext.bookType === "hardcover" ? HARDCOVER_INTENDED_IDS : PAPERBACK_INTENDED_IDS).map((id) => (
                <option key={id} value={id}>
                  {labelForKdpTrimId(id)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A1208]" aria-hidden />
          </div>
          <p id="checker-trim-help" className="text-xs leading-snug text-[#6B6151] sm:col-start-2">
            Pick your KDP trim so the report compares your file to it.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!file || uploading}
          className={cn(
            "flex-1 rounded-xl bg-[#F05A28] py-3.5 text-lg font-extrabold text-white shadow-[0_8px_20px_-8px_rgba(240,90,40,0.7)] transition-colors hover:bg-[#D94E20] sm:text-xl",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#F05A28]",
            FOCUS,
          )}
        >
          {uploading ? "Checking…" : "Check my PDF — free"}
        </button>
        {file && (
          <button
            type="button"
            onClick={onClear}
            className={cn("rounded-xl border border-[#E0D8C4] px-4 text-sm font-medium text-[#5C5346] hover:bg-[#F5F0E3]", FOCUS)}
          >
            Clear
          </button>
        )}
      </div>

      <p className="mt-3 text-center text-sm text-[#5C5346]">
        {file && error
          ? "Fix the message above, then tap Check again — your file stays selected."
          : "Free readiness score. $9 unlocks the full report."}
      </p>
    </div>
  );
}

// ── Static sections ───────────────────────────────────────────────────────────

function ReportPreview() {
  const rows: Array<{ ok: boolean; name: string; finding: string }> = [
    { ok: false, name: "Margins", finding: "Too small on 3 pages" },
    { ok: true, name: "Trim size", finding: "Matches 6 × 9 in" },
    { ok: true, name: "Fonts", finding: "All fonts are embedded" },
    { ok: true, name: "Bleed", finding: "Not required (no bleed selected)" },
  ];
  return (
    <div className="rounded-2xl border border-[#E0D8C4] bg-white/90 p-4 shadow-[0_20px_50px_-30px_rgba(26,18,8,0.35)] sm:p-5">
      <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Annotated page */}
        <div className="relative mx-auto w-full max-w-[19rem] md:mx-0" aria-hidden>
          <div className="relative rounded-sm border border-[#E0D8C4] bg-white px-5 pb-8 pt-6 shadow-[0_10px_24px_-14px_rgba(26,18,8,0.45)]">
            <div className="absolute inset-2.5 rounded-[2px] border-[1.5px] border-dashed border-[#E0483E]" />
            <p className="text-center font-serif text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A1208]">Chapter 1</p>
            <p className="mt-2 text-center font-serif text-lg font-bold text-[#1A1208]">A Fresh Start</p>
            <p className="mt-3 font-serif text-[10px] leading-[1.55] text-[#2E2A22]">
              The kettle clicked off just as the first light reached the window. She had promised herself one page
              before breakfast, and for once the words came easily, as if they had been waiting all night.
            </p>
          </div>
          <div className="absolute -right-2 top-6 rounded-md border border-[#E0483E]/50 bg-[#FDEDEC] px-2 py-1 text-[10px] font-semibold leading-tight text-[#B42318] shadow-sm sm:-right-6">
            Margin too small
            <span className="block font-normal">(0.20 in)</span>
          </div>
        </div>

        {/* Report summary */}
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-lg font-bold text-[#1A1208]">PDF Check Report</p>
            <p className="text-sm text-[#5C5346]">
              Score: <span className="text-lg font-extrabold text-[#1F7A34]">88 / 100</span>
            </p>
          </div>
          <ul className="mt-3 divide-y divide-[#EDE8D8]">
            {rows.map((r) => (
              <li key={r.name} className="flex items-center gap-3 py-2.5 text-sm">
                {r.ok ? (
                  <Check className="h-4 w-4 shrink-0 text-[#1F7A34]" strokeWidth={3} aria-label="Pass" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#E0483E]" strokeWidth={2.5} aria-label="Issue" />
                )}
                <span className="w-20 shrink-0 font-semibold text-[#1A1208]">{r.name}</span>
                <span className="text-[#5C5346]">{r.finding}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-[#6B6151]">Example report for illustration. Your report covers all 26 checks.</p>
        </div>
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [resumeUrl, setResumeUrl]               = useState<string | null>(null);
  const [uploadProgress, setUploadProgress]     = useState<number | null>(null);
  const [scanContext, setScanContext]     = useState<ScanContext>({
    bookType:  "paperback",
    intendedTrimId: "",
    bleedMode: "no-bleed",
    colorMode: "bw",
    paperType: "white",
  });

  // ── Share token attribution — set cookie + localStorage on ?sh= param ───────
  useEffect(() => {
    const sh = searchParams.get("sh");
    if (!sh || !sh.startsWith("sh_") || sh.length > 22) return;

    // Sanitise token (alphanumeric + underscore only)
    if (!/^sh_[a-z0-9]{16}$/.test(sh)) return;

    const COOKIE_NAME = "m2p_sh";
    const TWELVE_MONTHS = 60 * 60 * 24 * 365;

    // Set 12-month cookie (always reset on new click = re-engagement reset)
    document.cookie = `${COOKIE_NAME}=${sh}; max-age=${TWELVE_MONTHS}; path=/; SameSite=Lax`;

    // localStorage fallback
    try { localStorage.setItem(COOKIE_NAME, sh); } catch { /* blocked */ }

    // Fire-and-forget click record to API
    fetch("/api/share/click", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token: sh, source_page: "kdp-pdf-checker" }),
    }).catch(() => { /* attribution loss acceptable */ });
  }, [searchParams]);

  // The progress card is much shorter than the form, so keep it in view instead of
  // leaving the reader looking at the sections below once the upload starts.
  useEffect(() => {
    if (uploading) document.getElementById("checker")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [uploading]);

  useEffect(() => {
    if (!uploading) { setCheckElapsedSec(0); return; }
    setCheckElapsedSec(0);
    const id = window.setInterval(() => setCheckElapsedSec((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [uploading]);

  // ── Resume banner — check if a previous scan completed while tab was closed ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_RESUME_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { checkId: string; ctxParams: string; ts: number };
      // Expire after 24 hours
      if (Date.now() - saved.ts > 86_400_000) { localStorage.removeItem(LS_RESUME_KEY); return; }
      fetch(`/api/print-ready-check-status?checkId=${encodeURIComponent(saved.checkId)}`)
        .then((r) => r.json())
        .then((d: { status?: string; downloadId?: string }) => {
          if (d.status === "done" && d.downloadId) {
            setResumeUrl(`/download/${d.downloadId}?source=checker${saved.ctxParams}`);
            localStorage.removeItem(LS_RESUME_KEY);
          }
        })
        .catch(() => {/* silent — banner is best-effort */});
    } catch {/* localStorage blocked */}
  }, []);

  const validateFile = useCallback((f: File): string | null => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    if (ext !== ".pdf") return "This tool accepts PDF files only.";
    if (f.size === 0) return "File is empty. Please choose a non-empty PDF.";
    if (f.size > CHECKER_MAX_UPLOAD_BYTES) {
      return `This file is ${formatFileSize(f.size)}. The checker accepts PDFs up to ${CHECKER_MAX_UPLOAD_MB} MB — try our free PDF Compressor or reduce image resolution, then export again.`;
    }
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
      setUploadProgress(0);
      await putWithProgress(uploadUrl, file, setUploadProgress);
      setUploadProgress(null); // upload done — scan phase begins
      const saveBody = JSON.stringify({
        printOptions: { bookType: scanContext.bookType, bleedMode: scanContext.bleedMode, colorMode: scanContext.colorMode, paperType: scanContext.paperType },
        jobId,
        fileKey,
        fileSizeMB: Math.round(fileSizeMB * 100) / 100,
        ...(scanContext.intendedTrimId.trim()
          ? { intendedTrimId: scanContext.intendedTrimId.trim() }
          : {}),
      });
      const postPreflight = () =>
        fetch("/api/kdp-pdf-check-from-preflight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: saveBody,
        });
      let saveRes = await postPreflight();
      let saveData: { success?: boolean; checkId?: string; id?: string; error?: string; message?: string };
      try {
        saveData = (await saveRes.json()) as typeof saveData;
      } catch {
        throw new Error("Could not start check. Try again.");
      }
      if (!saveRes.ok && saveRes.status === 409) {
        await new Promise((r) => setTimeout(r, 2500));
        saveRes = await postPreflight();
        try {
          saveData = (await saveRes.json()) as typeof saveData;
        } catch {
          throw new Error("Could not start check. Try again.");
        }
      }
      if (!saveRes.ok) throw new Error(saveData.message || saveData.error || "Could not save report.");
      const ctxParams = `&bk=${scanContext.bookType}&bl=${scanContext.bleedMode === "bleed" ? "1" : "0"}&cm=${scanContext.colorMode}`;
      if (saveData.id) { router.push(`/download/${saveData.id}?source=checker${ctxParams}`); return; }
      if (saveData.checkId) {
        const checkId = saveData.checkId;
        // Persist so a tab-close or timeout can be resumed on return
        try { localStorage.setItem(LS_RESUME_KEY, JSON.stringify({ checkId, ctxParams, ts: Date.now() })); } catch {}
        // Must exceed the backend's PREFLIGHT_STATUS_DEADLINE_MS (8 min) so we don't
        // show "timed out" while the server is still legitimately working.
        const deadline = Date.now() + 9 * 60 * 1000;
        let waitMs = 2500;
        const MAX_WAIT_MS = 10000;
        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, waitMs));
          const statusRes = await fetch(`/api/print-ready-check-status?checkId=${encodeURIComponent(checkId)}`);
          let statusData: { status?: "queued" | "processing" | "done" | "failed"; downloadId?: string; error?: string; message?: string };
          try { statusData = (await statusRes.json()) as typeof statusData; } catch { continue; }
          if (statusData.status === "done" && statusData.downloadId) {
            try { localStorage.removeItem(LS_RESUME_KEY); } catch {}
            router.push(`/download/${statusData.downloadId}?source=checker${ctxParams}`); return;
          }
          if (statusData.status === "failed") throw new Error(statusData.error || statusData.message || "Check failed.");
          waitMs = Math.min(MAX_WAIT_MS, Math.round(waitMs * 1.4));
        }
        throw new Error("Check timed out. Your file is likely still processing - please re-open the checker in a minute.");
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
    <div className="min-h-screen bg-[#FAF7EE] text-[#1A1208]">

      {/* ── Resume banner ─────────────────────────────────────── */}
      {resumeUrl && (
        <div className="flex items-center justify-between gap-4 bg-[#F05A28] px-5 py-3 text-sm font-semibold text-white">
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Your report is ready —</span>
          <Link href={resumeUrl} className="shrink-0 underline underline-offset-2 transition-opacity hover:opacity-80">
            View it now →
          </Link>
          <button
            type="button"
            onClick={() => setResumeUrl(null)}
            className="ml-auto shrink-0 opacity-80 transition-opacity hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 border-b border-[#E0D8C4]/70 bg-[#FAF7EE]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-6">
          <Link href="/" className={cn("flex shrink-0 items-center gap-2.5 rounded-lg", FOCUS)}>
            <Image src="/MANNY AVATAR.png" alt="" width={44} height={44} className="rounded-full" priority />
            <BrandWordmark variant="onLight" className="text-2xl sm:text-[1.7rem]" />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.slice(0, 2).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={l.active ? "page" : undefined}
                className={cn(
                  "rounded text-[15px] font-medium transition-colors",
                  l.active
                    ? "border-b-2 border-[#F05A28] pb-0.5 text-[#F05A28]"
                    : "text-[#1A1208] hover:text-[#F05A28]",
                  FOCUS,
                )}
              >
                {l.label}
              </Link>
            ))}
            <NavToolsDropdown />
            {NAV_LINKS.slice(2).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn("rounded text-[15px] font-medium text-[#1A1208] transition-colors hover:text-[#F05A28]", FOCUS)}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className={cn("rounded-lg p-2 text-[#1A1208] md:hidden", FOCUS)}
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-nav"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            {mobileNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileNavOpen && (
          <nav id="mobile-nav" aria-label="Main" className="border-t border-[#E0D8C4] bg-[#FAF7EE] px-5 pb-4 pt-2 md:hidden">
            {[...NAV_LINKS, ...FEATURED_TOOLS.map((t) => ({ href: t.href, label: t.name }))].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileNavOpen(false)}
                className={cn("block rounded-md py-2.5 text-base font-medium text-[#1A1208] hover:text-[#F05A28]", FOCUS)}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main>
        {/* ══ HERO + CHECKER ═══════════════════════════════════════ */}
        <section className="mx-auto max-w-6xl px-5 pb-10 pt-8 sm:px-6 lg:pb-14 lg:pt-12">
          <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,29rem)] lg:grid-rows-[auto_1fr]">

            {/* Message + offer */}
            <div className="lg:col-start-1 lg:row-start-1">
              <h1 className="text-[2rem] font-extrabold leading-[1.06] tracking-[-0.035em] text-[#1A1208] sm:text-5xl lg:text-[3.4rem]">
                Your PDF looks right.{" "}
                <span className="whitespace-nowrap">
                  Will KDP{" "}
                  <span className="relative inline-block">
                    reject
                    <svg
                      aria-hidden
                      viewBox="0 0 200 16"
                      preserveAspectRatio="none"
                      className="absolute -bottom-2 left-0 h-3 w-full text-[#F05A28] sm:-bottom-2.5"
                    >
                      <path d="M3 11 C 60 3, 140 2, 197 8" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                    </svg>
                  </span>{" "}
                  it?
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-xl font-medium leading-snug text-[#1A1208] sm:text-[1.4rem]">
                Find margins, trim, font and bleed issues before you upload.
              </p>
              <p className="mt-3 max-w-xl text-base text-[#5C5346] sm:text-lg">
                Save hours of frustration and get back to publishing.
              </p>

              <div className="mt-6 inline-flex max-w-full items-stretch overflow-hidden rounded-xl border-2 border-[#1F7A34]/30 bg-white shadow-[0_10px_24px_-16px_rgba(26,18,8,0.4)]">
                <span className="flex shrink-0 items-center whitespace-nowrap bg-[#F05A28] px-4 py-2.5 text-2xl font-extrabold tracking-tight text-white sm:px-5 sm:text-[2rem]">
                  Only $9
                </span>
                <span className="flex items-center px-4 py-2.5 text-[15px] font-semibold leading-tight text-[#1A1208] sm:px-5 sm:text-lg">
                  Full report + one free recheck
                </span>
              </div>
            </div>

            {/* Checker */}
            <div id="checker" className="scroll-mt-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <UploadWidget
                file={file}
                isDragging={isDragging}
                uploading={uploading}
                checkElapsedSec={checkElapsedSec}
                uploadProgress={uploadProgress}
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

            {/* What it checks */}
            <ul className="space-y-2.5 lg:col-start-1 lg:row-start-2 lg:self-start">
              {HERO_POINTS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[17px] font-semibold text-[#1A1208] sm:text-lg">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#1F7A34]" strokeWidth={3} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ══ HOW IT WORKS ═════════════════════════════════════════ */}
        <section aria-labelledby="how-heading" className="mx-auto max-w-6xl px-5 sm:px-6">
          <h2 id="how-heading" className="sr-only">How it works</h2>
          <ol className="grid gap-6 border-y border-[#E0D8C4] py-7 md:grid-cols-3 md:gap-0">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className={cn("flex items-start gap-4 md:px-6", i > 0 && "md:border-l md:border-[#E0D8C4]", i === 0 && "md:pl-0")}
              >
                <s.icon className={cn("h-10 w-10 shrink-0", i === 0 ? "text-[#F05A28]" : "text-[#1F7A34]")} strokeWidth={1.6} aria-hidden />
                <div>
                  <h3 className="text-lg font-bold text-[#1A1208]">
                    <span className="sr-only">Step {i + 1}: </span>{s.title}
                  </h3>
                  <p className="mt-0.5 text-sm leading-snug text-[#5C5346]">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ══ REPORT PREVIEW ═══════════════════════════════════════ */}
        <section aria-labelledby="report-heading" className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:py-14">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,2fr)]">
            <div>
              <h2 id="report-heading" className="text-3xl font-extrabold leading-tight tracking-[-0.025em] text-[#1A1208]">
                A clear, practical report for your book.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-[#5C5346] sm:text-lg">
                Get a page-by-page check with an overall score, flagged issues and straightforward fixes, so you can
                publish with confidence.
              </p>
            </div>
            <ReportPreview />
          </div>
        </section>

        {/* ══ FREE TOOLS ═══════════════════════════════════════════ */}
        <section aria-labelledby="tools-heading" className="border-t border-[#E0D8C4]">
          <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:py-14">
            <div className="flex items-center justify-center gap-5">
              <span className="hidden h-0.5 w-20 bg-[#1F7A34] sm:block" aria-hidden />
              <h2 id="tools-heading" className="text-center text-3xl font-extrabold tracking-[-0.025em] text-[#1A1208] sm:text-[2.2rem]">
                Free tools for authors
              </h2>
              <span className="hidden h-0.5 w-20 bg-[#1F7A34] sm:block" aria-hidden />
            </div>
            <p className="mx-auto mt-2 max-w-2xl text-center text-base text-[#5C5346]">
              Practical, easy-to-use tools to help you prepare, check and publish your book.
            </p>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURED_TOOLS.map((tool) => (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    className={cn(
                      "group flex h-full flex-col rounded-2xl border border-[#E0D8C4] bg-white/80 p-5 shadow-[0_10px_30px_-22px_rgba(26,18,8,0.4)] transition-all hover:-translate-y-0.5 hover:border-[#1F7A34]/35 hover:shadow-[0_16px_36px_-22px_rgba(26,18,8,0.45)]",
                      FOCUS,
                    )}
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF5E9]">
                      <tool.icon className="h-6 w-6 text-[#1F7A34]" strokeWidth={1.8} aria-hidden />
                    </span>
                    <span className="mt-4 text-base font-bold text-[#1A1208] group-hover:text-[#F05A28]">{tool.name}</span>
                    <span className="mt-1 text-sm leading-snug text-[#5C5346]">{tool.description}</span>
                    <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-[#1F7A34]">
                      Open tool <ArrowRight className="h-4 w-4" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-semibold text-[#5C5346]">More free tools:</span>
              {MORE_TOOLS.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    "rounded-lg border-2 border-[#1F7A34] px-3.5 py-1.5 text-sm font-bold text-[#1F7A34] transition-colors hover:bg-[#1F7A34] hover:text-white",
                    FOCUS,
                  )}
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FAQ + PRICING ════════════════════════════════════════ */}
        <section className="mx-auto max-w-6xl px-5 pb-12 sm:px-6 lg:pb-14">
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#E0D8C4] bg-white/80 p-5 shadow-[0_14px_36px_-26px_rgba(26,18,8,0.4)] sm:p-6">
              <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-[#1A1208]">Frequently Asked Questions</h2>
              <div className="mt-3">
                <FaqAccordion items={FAQS} />
              </div>
            </div>

            <div
              id="pricing"
              className="scroll-mt-24 rounded-2xl border border-[#E0D8C4] bg-gradient-to-br from-white to-[#F5F0E3] p-5 shadow-[0_14px_36px_-26px_rgba(26,18,8,0.4)] sm:p-6"
            >
              <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-[#1A1208]">Simple, transparent pricing</h2>
              <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                <p className="text-7xl font-extrabold leading-none tracking-[-0.04em] text-[#F05A28] sm:border-r sm:border-[#E0D8C4] sm:pr-6 sm:text-8xl">
                  $9
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2.5 text-[15px] text-[#1A1208]">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#1F7A34]" strokeWidth={3} aria-hidden />
                    <span><strong>One full scan</strong> (complete report + annotated PDF)</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-[15px] text-[#1A1208]">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#1F7A34]" strokeWidth={3} aria-hidden />
                    <span>
                      <strong>One free recheck</strong>
                      <span className="block text-sm text-[#5C5346]">Recheck your updated PDF at no extra cost.</span>
                    </span>
                  </li>
                </ul>
              </div>
              <a
                href="/api/create-checkout-session?price_type=single_use"
                className={cn(
                  "mt-6 block rounded-xl bg-[#F05A28] py-3.5 text-center text-lg font-extrabold text-white shadow-[0_8px_20px_-8px_rgba(240,90,40,0.7)] transition-colors hover:bg-[#D94E20] sm:text-xl",
                  FOCUS,
                )}
              >
                Get the full report for $9
              </a>
              <p className="mt-2 text-center text-xs text-[#6B6151]">No subscription · Credits never expire</p>

              {/* Packs */}
              <div className="mt-6 border-t border-[#E0D8C4] pt-5">
                <p className="text-sm font-semibold text-[#5C5346]">Checking several books? Save with a pack.</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                  {PACKS.map((pack) => (
                    <li
                      key={pack.type}
                      className={cn(
                        "relative flex flex-col rounded-xl border bg-white p-3",
                        pack.best ? "border-[#F05A28]/40" : "border-[#E0D8C4]",
                      )}
                    >
                      {pack.best && (
                        <span className="absolute -top-2.5 right-3 rounded-full bg-[#F05A28] px-2 py-0.5 text-[10px] font-bold text-white">
                          Best value
                        </span>
                      )}
                      <span className="text-xs font-bold text-[#1A1208]">{pack.label}</span>
                      <span className="text-xl font-extrabold text-[#1A1208]">{pack.price}</span>
                      <span className="text-xs text-[#5C5346]">{pack.scans} · {pack.perScan}</span>
                      <a
                        href={`/api/create-checkout-session?price_type=${pack.type}`}
                        className={cn("mt-2 rounded-lg bg-[#1A1208] py-1.5 text-center text-xs font-bold text-white hover:bg-[#2E2A22]", FOCUS)}
                      >
                        Buy {pack.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ══ CLOSING CTA ══════════════════════════════════════════ */}
        <section className="mx-auto max-w-6xl px-5 pb-12 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-b from-[#F5EDE0] to-[#FBE3D3] px-6 py-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <h2 className="text-3xl font-extrabold tracking-[-0.025em] text-[#1A1208] sm:text-[2.2rem]">Check your PDF now.</h2>
            <p className="mt-2 text-base text-[#5C5346] sm:text-lg">
              Get a free readiness score, or unlock the full report for only $9.
            </p>
            <a
              href="#checker"
              className={cn(
                "mt-6 inline-flex items-center gap-2.5 rounded-xl bg-[#F05A28] px-8 py-3.5 text-lg font-extrabold text-white shadow-[0_8px_20px_-8px_rgba(240,90,40,0.7)] transition-colors hover:bg-[#D94E20] sm:text-xl",
                FOCUS,
              )}
            >
              <Upload className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              Upload your PDF — free
            </a>
          </div>
        </section>
      </main>

      {/* ══ FOOTER ═══════════════════════════════════════════════ */}
      <footer className="border-t border-[#E0D8C4]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-6 sm:px-6 lg:flex-row lg:justify-between">
          <Link href="/" className={cn("flex shrink-0 items-center gap-2.5 rounded-lg", FOCUS)}>
            <Image src="/MANNY AVATAR.png" alt="" width={40} height={40} className="rounded-full" />
            <BrandWordmark variant="onLight" className="text-2xl" />
          </Link>
          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium">
            {[
              { href: "/kdp-pdf-checker", label: "KDP PDF Checker" },
              { href: "/blog", label: "Publishing Guides" },
              { href: "#pricing", label: "Pricing" },
              { href: "/faq", label: "FAQ" },
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded transition-colors hover:text-[#F05A28]",
                  l.href === "/kdp-pdf-checker" ? "text-[#F05A28]" : "text-[#1A1208]",
                  FOCUS,
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <SocialLinks variant="light" size="sm" />
        </div>
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 border-t border-[#E0D8C4]/70 px-5 py-4 text-xs text-[#6B6151] sm:flex-row sm:justify-between sm:px-6">
          <p>
            © 2026 manu2print.com ·{" "}
            <Link href="/admin" className="cursor-default select-none text-inherit no-underline" tabIndex={-1}>KDP</Link>{" "}
            tools for indie authors
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className={cn("rounded hover:text-[#F05A28]", FOCUS)}>Privacy</Link>
            <Link href="/terms" className={cn("rounded hover:text-[#F05A28]", FOCUS)}>Terms</Link>
            <Link href="/refunds" className={cn("rounded hover:text-[#F05A28]", FOCUS)}>Refunds</Link>
            <Link href="/cookies" className={cn("rounded hover:text-[#F05A28]", FOCUS)}>Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
