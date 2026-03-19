"use client";

import { useEffect, useRef, useState } from "react";

const BASE_WIDTH = 560;

// Worker from public folder — do not change. import.meta.url resolution breaks in Next.js production.
const PDF_WORKER_SRC = "/pdf.worker.min.js";

interface PageIssue {
  page: number;
  rule_id: string;
  severity: string;
  message: string;
  bbox: number[] | null;
}

interface CheckerPdfViewerProps {
  pdfUrl: string;
  pageIssues: PageIssue[];
  totalPages: number;
}

export default function CheckerPdfViewer({ pdfUrl, pageIssues, totalPages: totalPagesProp }: CheckerPdfViewerProps) {
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(totalPagesProp || 0);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const fallbackReasonRef = useRef<"timeout" | "blank" | null>(null);
  const outcomeLabelRef = useRef<string | null>(null);
  const iframeLoadTimeoutRef = useRef<number | null>(null);

  const logOutcomeOnce = (label: string) => {
    if (outcomeLabelRef.current) return;
    outcomeLabelRef.current = label;
    // One final outcome label per preview session.
    console.log(`[CheckerPdfViewer] ${label}`);
    try {
      const sentry = (globalThis as any).Sentry;
      if (sentry?.captureMessage) {
        sentry.captureMessage(`CheckerPdfViewer outcome: ${label}`, "info");
      }
    } catch {
      // Never block render.
    }
  };

  const requestFallback = (reason: "timeout" | "blank") => {
    if (fallbackReasonRef.current) return;
    fallbackReasonRef.current = reason;
    setRendering(false);
    setFallbackMode(true);
  };

  const detectBlankCanvasAndMaybeFallback = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    if (w <= 0 || h <= 0) return;

    // Sample variance across many random points.
    const sampleCount = 25;
    const data = canvas.getContext("2d")?.getImageData(0, 0, w, h)?.data;
    if (!data) return;

    const samples: number[] = [];
    const meaningfulPaintThreshold = 20; // brightness delta from white
    let meaningfulPaintCount = 0;

    // Helper: brightness as luminance.
    const luminance = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

    for (let i = 0; i < sampleCount; i++) {
      const x = Math.floor(Math.random() * w);
      const y = Math.floor(Math.random() * h);
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Ignore fully transparent samples (shouldn't happen since we prefill).
      if (a === 0) continue;

      const bright = luminance(r, g, b);
      samples.push(bright);

      if (255 - bright > meaningfulPaintThreshold) {
        meaningfulPaintCount += 1;
      }
    }

    if (samples.length < 10) return;

    const mean = samples.reduce((acc, v) => acc + v, 0) / samples.length;
    const variance = samples.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / samples.length;
    const stdDev = Math.sqrt(variance);

    // Conservative "near zero" variance check (uniform ~single color).
    const varianceNearZero = stdDev < 2.5;
    const noMeaningfulPaint = meaningfulPaintCount === 0;

    if (varianceNearZero && noMeaningfulPaint) {
      requestFallback("blank");
    }
  };

  const issuesForPage = pageIssues.filter((i) => i.page === pageNumber);
  const hasHighlights =
    issuesForPage.some((i) => Array.isArray(i.bbox) && i.bbox.length >= 4);
  const renderWidth = Math.round(BASE_WIDTH * scale);
  const scaleX = pageSize ? renderWidth / pageSize.width : 1;
  const scaleY = scaleX;
  const displayHeight = pageSize ? (pageSize.height / pageSize.width) * renderWidth : 300;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRendering(false);
    pdfDocRef.current = null;
    setFallbackMode(false);
    fallbackReasonRef.current = null;
    outcomeLabelRef.current = null;
    if (iframeLoadTimeoutRef.current) {
      window.clearTimeout(iframeLoadTimeoutRef.current);
      iframeLoadTimeoutRef.current = null;
    }
    const load = async () => {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        rangeChunkSize: 65536,
        disableStream: false,
        disableRange: false,
      });
      const pdf = await loadingTask.promise;
      return { pdf };
    };
    load()
      .then(({ pdf }: { pdf: { numPages: number } }) => {
        if (cancelled) return;
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setPageNumber(1);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load PDF");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      pdfDocRef.current = null;
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdfUrl || !canvasRef.current || numPages < 1 || pageNumber < 1) return;
    if (!pdfDocRef.current) return;
    let cancelled = false;
    const isFirstPage = pageNumber === 1;
    const run = async () => {
      if (fallbackMode) return;
      setRendering(true);
      const pdf = pdfDocRef.current;

      // Hard timeout for first-page primary render.
      const hardTimeoutMs = 9000; // within your 8-10s window
      let timeoutId: number | null = null;
      if (isFirstPage) {
        timeoutId = window.setTimeout(() => {
          if (cancelled) return;
          if (outcomeLabelRef.current) return;
          if (fallbackReasonRef.current) return; // timeout must not override blank fallback
          requestFallback("timeout");
          logOutcomeOnce("pdfjs_timeout_fallback_success");
        }, hardTimeoutMs);
      }

      const page = await pdf.getPage(pageNumber);
      if (cancelled || !canvasRef.current) return;
      const viewport = page.getViewport({ scale });
      setPageSize({ width: viewport.width / scale, height: viewport.height / scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${renderWidth}px`;
      canvas.style.height = `${(viewport.height / viewport.width) * renderWidth}px`;
      canvas.style.backgroundColor = "#ffffff";
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      const renderContext = { canvasContext: ctx, viewport };
      const task = page.render(renderContext);
      await task.promise;

      if (timeoutId != null) window.clearTimeout(timeoutId);
      if (cancelled) return;

      // After render-complete event: only do blank detection on first page.
      if (isFirstPage && !fallbackMode) {
        const beforeFallback = fallbackReasonRef.current;
        await detectBlankCanvasAndMaybeFallback();
        if (fallbackReasonRef.current && beforeFallback !== fallbackReasonRef.current) {
          // Fallback will be logged upon iframe load.
          setRendering(false);
          return;
        }
      }

      // Primary success outcome.
      if (!fallbackMode && !outcomeLabelRef.current) {
        logOutcomeOnce("pdfjs_success");
      }
      setRendering(false);
    };
    run().catch((e: unknown) => {
      if (!cancelled) {
        if (!fallbackMode) {
          if (outcomeLabelRef.current == null) {
            logOutcomeOnce("pdfjs_failed_no_fallback");
          }
          setError(e instanceof Error ? e.message : "Failed to render page");
          setRendering(false);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pdfUrl, pageNumber, scale, numPages, renderWidth]);

  useEffect(() => {
    if (!fallbackMode) return;
    if (iframeLoadTimeoutRef.current) return;

    // If iframe never loads, treat it as "no fallback".
    iframeLoadTimeoutRef.current = window.setTimeout(() => {
      iframeLoadTimeoutRef.current = null;
      if (!outcomeLabelRef.current) {
        logOutcomeOnce("pdfjs_failed_no_fallback");
      }
    }, 6000);
  }, [fallbackMode, pdfUrl]);

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (fallbackMode) {
    const msg = fallbackReasonRef.current === "timeout" ? "Showing compatibility view" : "Showing compatibility view";
    return (
      <div className="rounded-lg bg-[#24241a] border border-white/10 overflow-hidden">
        <div className="p-3 border-b border-white/10 bg-black/20 text-sm text-[#8B8B6B]">
          {msg}
        </div>
        <div className="p-2">
          <iframe
            src={pdfUrl}
            title="Compatibility PDF view"
            className="w-full"
            style={{ width: "100%", height: 700, border: 0, background: "#ffffff" }}
            onLoad={() => {
              if (outcomeLabelRef.current) return;
              if (iframeLoadTimeoutRef.current) {
                window.clearTimeout(iframeLoadTimeoutRef.current);
                iframeLoadTimeoutRef.current = null;
              }
              if (fallbackReasonRef.current === "timeout") {
                logOutcomeOnce("pdfjs_timeout_fallback_success");
              } else if (fallbackReasonRef.current === "blank") {
                logOutcomeOnce("pdfjs_blank_fallback_success");
              } else {
                logOutcomeOnce("pdfjs_failed_no_fallback");
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg bg-[#24241a] border border-white/10 p-8 text-center text-[#8B8B6B]">
        Loading PDF…
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-[#24241a] border border-white/10 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 p-3 border-b border-white/10 bg-black/20">
        <button
          type="button"
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
          className="rounded px-3 py-1.5 text-sm font-medium bg-white/10 text-white disabled:opacity-40"
        >
          ‹ Prev
        </button>
        <span className="text-sm text-[#8B8B6B]">
          Page {pageNumber} of {numPages}
        </span>
        <button
          type="button"
          onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
          disabled={pageNumber >= numPages}
          className="rounded px-3 py-1.5 text-sm font-medium bg-white/10 text-white disabled:opacity-40"
        >
          Next ›
        </button>
        <label className="flex items-center gap-2 text-sm text-[#8B8B6B]">
          Zoom
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.1}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-24"
          />
          <span className="w-8">{Math.round(scale * 100)}%</span>
        </label>
      </div>
      <div className="p-4 flex justify-center" style={{ minHeight: 400 }}>
        <div style={{ position: "relative", width: renderWidth }}>
          {rendering ? (
            <div
              style={{ width: renderWidth, height: displayHeight }}
              className="absolute inset-0 flex items-center justify-center text-sm"
            >
              <span className="rounded-md bg-black/40 border border-white/10 px-3 py-1.5 text-[#8B8B6B]">
                Rendering page…
              </span>
            </div>
          ) : null}
          <canvas ref={canvasRef} className="block max-w-full h-auto" style={{ width: renderWidth }} />
          {displayHeight > 0 && issuesForPage.length > 0 && (
            <svg
              width={renderWidth}
              height={displayHeight}
              style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", width: renderWidth, height: displayHeight }}
              className="overflow-visible"
            >
              {issuesForPage.map((issue, idx) => {
                if (!issue.bbox || issue.bbox.length < 4) return null;
                const [x, y, w, h] = issue.bbox;
                const isError = issue.severity === "ERROR";
                return (
                  <rect
                    key={`${issue.page}-${issue.rule_id}-${idx}`}
                    x={x * scaleX}
                    y={y * scaleY}
                    width={w * scaleX}
                    height={h * scaleY}
                    fill="none"
                    stroke={isError ? "#dc2626" : "#ca8a04"}
                    strokeWidth={2}
                  >
                    <title>{issue.message}</title>
                  </rect>
                );
              })}
            </svg>
          )}
        </div>
      </div>
      {hasHighlights ? (
        <p className="px-4 pb-3 text-xs text-center" style={{ color: "#F05A28" }}>
          Red = error, yellow = warning. Hover over highlights for details.
        </p>
      ) : (
        <p className="px-4 pb-3 text-xs text-center" style={{ color: "#6B6151" }}>
          No on-page highlights for this page.
        </p>
      )}
    </div>
  );
}
