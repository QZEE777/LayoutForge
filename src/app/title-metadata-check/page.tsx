"use client";

import { useState } from "react";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import {
  checkKdpMetadata,
  type MetadataCheckResult,
  type FieldStatus,
} from "@/lib/kdpMetadataRules";

// ── Constants ──────────────────────────────────────────────────────────────────

const TITLE_MAX = 200;
const SUBTITLE_MAX = 200;
const KEYWORD_MAX = 50;
const NUM_KEYWORDS = 7;

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusColor(s: FieldStatus): string {
  if (s === "error") return "#DC2626";
  if (s === "warning") return "#f05a28";
  return "#1A6B2A";
}

function statusIcon(s: FieldStatus): string {
  if (s === "error") return "✕";
  if (s === "warning") return "⚠";
  return "✓";
}

function statusBg(s: FieldStatus): string {
  if (s === "error") return "rgba(220,38,38,0.06)";
  if (s === "warning") return "rgba(240,90,40,0.06)";
  return "rgba(26,107,42,0.06)";
}

function statusBorder(s: FieldStatus): string {
  if (s === "error") return "rgba(220,38,38,0.2)";
  if (s === "warning") return "rgba(240,90,40,0.2)";
  return "rgba(26,107,42,0.2)";
}

function charCountColor(len: number, max: number): string {
  if (len > max) return "#DC2626";
  if (len > max * 0.9) return "#f05a28";
  return "#9B8E7E";
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function CharCounter({ len, max }: { len: number; max: number }) {
  return (
    <span className="text-xs tabular-nums" style={{ color: charCountColor(len, max) }}>
      {len}/{max}
    </span>
  );
}

function FieldResult({
  label,
  field,
  result,
}: {
  label: string;
  field: string;
  result: MetadataCheckResult;
}) {
  const status = result.fieldStatus[field] ?? "pass";
  const fieldIssues = result.issues.filter((i) => i.field === field);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: statusBg(status), border: `1px solid ${statusBorder(status)}` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shrink-0"
          style={{ background: statusColor(status), color: "#fff" }}
        >
          {statusIcon(status)}
        </span>
        <p className="font-bold text-sm" style={{ color: "#1A1208" }}>{label}</p>
      </div>

      {fieldIssues.length === 0 ? (
        <p className="text-xs ml-7" style={{ color: "#6B6151" }}>No issues detected.</p>
      ) : (
        <div className="ml-7 space-y-3">
          {fieldIssues.map((issue, i) => (
            <div key={i}>
              <p className="text-xs font-semibold mb-0.5" style={{ color: statusColor(issue.severity === "error" ? "error" : "warning") }}>
                {issue.message}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#6B6151" }}>{issue.fix}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TitleMetadataCheckPage() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [keywords, setKeywords] = useState<string[]>(Array(NUM_KEYWORDS).fill(""));
  const [result, setResult] = useState<MetadataCheckResult | null>(null);

  const updateKeyword = (index: number, value: string) => {
    setKeywords((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleCheck = () => {
    const res = checkKdpMetadata({
      title,
      subtitle: subtitle.trim() || undefined,
      keywords,
    });
    setResult(res);
    setTimeout(() => {
      document.getElementById("metadata-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleReset = () => {
    setTitle("");
    setSubtitle("");
    setKeywords(Array(NUM_KEYWORDS).fill(""));
    setResult(null);
  };

  const activeKeywords = keywords.filter((k) => k.trim().length > 0);

  return (
    <SiteShell>
      <section className="bg-m2p-ivory py-16">
        <div className="mx-auto max-w-3xl px-6">

          {/* Header */}
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            Free Tool
          </p>
          <h1
            className="font-black leading-tight mb-3"
            style={{
              color: "#1A1208",
              fontSize: "clamp(1.8rem,4vw,2.6rem)",
              letterSpacing: "-0.025em",
            }}
          >
            Title &amp; Metadata Check
          </h1>
          <p className="text-base leading-relaxed mb-10" style={{ color: "#6B6151" }}>
            Paste your KDP book title, subtitle, and keywords below. We check for terms
            that may trigger a KDP quality review — character limits, risky promotional
            language, keyword stuffing, and more. Free. Instant. No account needed.
          </p>

          {/* ── Form ─────────────────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold" style={{ color: "#1A1208" }}>
                  Book title <span style={{ color: "#f05a28" }}>*</span>
                </label>
                <CharCounter len={title.length} max={TITLE_MAX} />
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setResult(null); }}
                placeholder="e.g. The Complete Guide to Self-Publishing on KDP"
                maxLength={TITLE_MAX + 20}
                className="w-full rounded-xl border px-4 py-3 text-sm font-medium transition-colors focus:outline-none"
                style={{
                  borderColor: "rgba(0,0,0,0.12)",
                  color: "#1A1208",
                  background: "#fff",
                }}
              />
            </div>

            {/* Subtitle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold" style={{ color: "#1A1208" }}>
                  Subtitle <span className="font-normal text-xs" style={{ color: "#9B8E7E" }}>(optional)</span>
                </label>
                <CharCounter len={subtitle.length} max={SUBTITLE_MAX} />
              </div>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => { setSubtitle(e.target.value); setResult(null); }}
                placeholder="e.g. A Step-by-Step System for First-Time Authors"
                maxLength={SUBTITLE_MAX + 20}
                className="w-full rounded-xl border px-4 py-3 text-sm font-medium transition-colors focus:outline-none"
                style={{
                  borderColor: "rgba(0,0,0,0.12)",
                  color: "#1A1208",
                  background: "#fff",
                }}
              />
            </div>

            {/* Keywords */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold" style={{ color: "#1A1208" }}>
                  Keywords <span className="font-normal text-xs" style={{ color: "#9B8E7E" }}>(up to 7, optional)</span>
                </label>
                <span className="text-xs" style={{ color: "#9B8E7E" }}>max {KEYWORD_MAX} chars each</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: NUM_KEYWORDS }, (_, i) => (
                  <div key={i} className="relative">
                    <input
                      type="text"
                      value={keywords[i]}
                      onChange={(e) => { updateKeyword(i, e.target.value); setResult(null); }}
                      placeholder={`Keyword ${i + 1}`}
                      maxLength={KEYWORD_MAX + 10}
                      className="w-full rounded-xl border px-4 py-3 text-sm font-medium transition-colors focus:outline-none pr-12"
                      style={{
                        borderColor: "rgba(0,0,0,0.12)",
                        color: "#1A1208",
                        background: "#fff",
                      }}
                    />
                    {keywords[i].length > 0 && (
                      <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums pointer-events-none"
                        style={{ color: charCountColor(keywords[i].length, KEYWORD_MAX) }}
                      >
                        {keywords[i].length}/{KEYWORD_MAX}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCheck}
                disabled={!title.trim()}
                className="flex-1 rounded-xl font-black py-4 text-base transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#f05a28", color: "#fff" }}
              >
                Check my metadata →
              </button>
              {result && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl border py-4 px-5 text-sm font-semibold transition-colors hover:bg-black/[0.03]"
                  style={{ borderColor: "rgba(0,0,0,0.1)", color: "#9B8E7E" }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* ── Results ───────────────────────────────────────────────────────── */}
          {result && (
            <div id="metadata-results" className="mt-12">

              {/* Summary banner */}
              <div
                className="rounded-2xl p-5 mb-6 flex items-start gap-4"
                style={{
                  background: result.errorCount > 0
                    ? "rgba(220,38,38,0.05)"
                    : result.warningCount > 0
                    ? "rgba(240,90,40,0.05)"
                    : "rgba(26,107,42,0.05)",
                  border: `1px solid ${result.errorCount > 0
                    ? "rgba(220,38,38,0.2)"
                    : result.warningCount > 0
                    ? "rgba(240,90,40,0.2)"
                    : "rgba(26,107,42,0.2)"}`,
                }}
              >
                <span className="text-2xl shrink-0">
                  {result.errorCount > 0 ? "❌" : result.warningCount > 0 ? "⚠️" : "✅"}
                </span>
                <div>
                  <p className="font-black text-base mb-0.5" style={{ color: "#1A1208" }}>
                    {result.issueCount === 0
                      ? "No issues detected"
                      : `${result.issueCount} issue${result.issueCount > 1 ? "s" : ""} found`}
                  </p>
                  <p className="text-sm" style={{ color: "#6B6151" }}>
                    {result.issueCount === 0
                      ? "Your metadata looks clean. No risky terms or limit violations detected."
                      : `${result.errorCount > 0 ? `${result.errorCount} error${result.errorCount > 1 ? "s" : ""} (character limits)` : ""}${result.errorCount > 0 && result.warningCount > 0 ? " · " : ""}${result.warningCount > 0 ? `${result.warningCount} advisory warning${result.warningCount > 1 ? "s" : ""} (risky terms)` : ""}`}
                  </p>
                </div>
              </div>

              {/* Per-field results */}
              <div className="space-y-3">
                {/* Title */}
                <FieldResult label="Title" field="title" result={result} />

                {/* Subtitle */}
                {subtitle.trim().length > 0 && (
                  <FieldResult label="Subtitle" field="subtitle" result={result} />
                )}

                {/* Keywords */}
                {keywords.map((kw, i) =>
                  kw.trim().length > 0 ? (
                    <FieldResult
                      key={i}
                      label={`Keyword ${i + 1}`}
                      field={`keyword_${i + 1}`}
                      result={result}
                    />
                  ) : null
                )}
              </div>

              {/* Advisory note */}
              <p className="text-xs mt-6 leading-relaxed" style={{ color: "#9B8E7E" }}>
                This tool checks for known risk patterns based on KDP&apos;s published content guidelines.
                It is advisory only — KDP makes its own final determination on every listing.
                Warnings indicate terms that <em>may</em> trigger review, not guaranteed rejection.
              </p>
            </div>
          )}

          {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
          <div
            className="mt-14 rounded-2xl p-6 text-center"
            style={{ background: "rgba(240,90,40,0.04)", border: "1px solid rgba(240,90,40,0.12)" }}
          >
            <p className="font-black text-base mb-1" style={{ color: "#1A1208" }}>
              Metadata checked — now check your PDF
            </p>
            <p className="text-sm mb-4" style={{ color: "#6B6151" }}>
              KDP rejects more books for interior formatting errors than metadata issues.
              Check your PDF before you upload.
            </p>
            <Link
              href="/kdp-pdf-checker"
              className="inline-flex items-center gap-2 rounded-xl font-black text-sm px-6 py-3 transition-opacity hover:opacity-85"
              style={{ background: "#f05a28", color: "#fff" }}
            >
              Check my PDF →
            </Link>
            <p className="text-xs mt-2" style={{ color: "#9B8E7E" }}>
              Free score preview · Full annotated report $9 · No subscription
            </p>
          </div>

        </div>
      </section>
    </SiteShell>
  );
}
