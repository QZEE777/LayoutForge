"use client";

import { useEffect, useState } from "react";
import {
  getKdpRiskSignals,
  type PageContent,
  type RiskSignal,
} from "@/lib/kdpRiskSignals";

// Matches the worker path used by CheckerPdfViewer — do not change.
const PDF_WORKER_SRC = "/pdf.worker.min.js";

const PAGE_CAP = 150;
const TIMEOUT_MS = 15_000;

interface Props {
  /** Same pdfUrl prop used by CheckerPdfViewer (/api/r2-file?id=...). */
  pdfUrl: string;
  pageCount: number;
}

export default function KdpRiskSignalsPanel({ pdfUrl, pageCount }: Props) {
  const [signals, setSignals] = useState<RiskSignal[] | null>(null);

  useEffect(() => {
    if (!pdfUrl || pageCount === 0) return;

    let cancelled = false;

    const run = async (): Promise<void> => {
      // Step 1 — get the signed R2 URL (same flow as CheckerPdfViewer)
      const res = await fetch(pdfUrl, { cache: "no-store" });
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as { url?: string };
      if (!data?.url || cancelled) return;

      // Step 2 — load pdf.js (cached after first import, no double download)
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;

      const pdf = await pdfjsLib.getDocument({ url: data.url }).promise;
      if (cancelled) return;

      // Step 3 — extract text per page, capped at PAGE_CAP
      const numPages = Math.min(pdf.numPages, PAGE_CAP);
      const pages: PageContent[] = [];

      for (let i = 1; i <= numPages; i++) {
        if (cancelled) return;
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items
          .map((item: unknown) =>
            item && typeof item === "object" && "str" in item
              ? String((item as { str: string }).str)
              : ""
          )
          .join(" ")
          .trim();
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        pages.push({ pageNumber: i, text, wordCount });
      }

      if (cancelled) return;

      // Step 4 — run detectors
      const result = getKdpRiskSignals(pages);
      setSignals(result);
    };

    // 15-second hard timeout — silently stays null if exceeded
    const timeoutId = window.setTimeout(() => {
      cancelled = true;
    }, TIMEOUT_MS);

    run()
      .catch(() => {
        // Silent on any error — panel stays hidden
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [pdfUrl, pageCount]);

  // Render nothing until signals are resolved, or if no signals detected
  if (!signals || signals.length === 0) return null;

  return (
    <div
      className="mt-7 rounded-2xl border overflow-hidden"
      style={{ borderColor: "rgba(0,0,0,0.09)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 border-b"
        style={{
          background: "#1A1208",
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        <p className="text-[11px] font-black tracking-[0.18em] text-white uppercase">
          KDP Risk Signals
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
          Advisory only — content patterns that may trigger a KDP quality review
        </p>
      </div>

      {/* Signal rows */}
      <div className="divide-y divide-black/[0.05]" style={{ background: "#FAF8F4" }}>
        {signals.map((signal) => (
          <SignalRow key={signal.type} signal={signal} />
        ))}
      </div>
    </div>
  );
}

// ── Signal row with expandable detail ─────────────────────────────────────────

function SignalRow({ signal }: { signal: RiskSignal }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-5 py-4">
      <button
        type="button"
        className="w-full flex items-start gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="shrink-0 text-base mt-0.5">⚠️</span>
        <p className="flex-1 text-sm font-semibold" style={{ color: "#1A1208" }}>
          {signal.message}
        </p>
        <span
          className="shrink-0 text-sm ml-2 transition-transform duration-200"
          style={{
            color: "#f05a28",
            display: "inline-block",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          +
        </span>
      </button>

      {open && (
        <div className="mt-3 ml-7 space-y-3">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-1"
              style={{ color: "#9B8E7E" }}
            >
              Why this matters
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#6B6151" }}>
              {signal.whyItMatters}
            </p>
          </div>
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-1"
              style={{ color: "#9B8E7E" }}
            >
              What to check
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#6B6151" }}>
              {signal.whatToCheck}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
