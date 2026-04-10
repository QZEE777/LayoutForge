"use client";

import { useEffect, useRef, useState } from "react";

const BASE_WIDTH = 560;
const BLANK_CHECK_SAMPLE_COUNT = 120;

// Worker from public folder — do not change. import.meta.url resolution breaks in Next.js production.
const PDF_WORKER_SRC = "/pdf.worker.min.js";

interface PageIssue {
  page: number;
  rule_id: string;
  severity: string;
  message: string;
  bbox: number[] | null;
  fixDifficulty?: string;
}

interface CheckerPdfViewerProps {
  pdfUrl: string;
  pageIssues: PageIssue[];
  totalPages: number;
  requestedPage?: number | null;
  readinessScore?: number | null;
  passThreshold?: number;
}

function normalizeSeverity(issue: PageIssue): "critical" | "warning" {
  const severity = String(issue.severity ?? "").toLowerCase().trim();
  const issueType = String(issue.rule_id ?? "").toLowerCase().trim();
  if (severity === "critical" || severity === "error" || severity === "advanced") return "critical";
  if (issueType.includes("margin") || issueType.includes("bleed") || issueType.includes("trim") || issueType.includes("page_size") || issueType.includes("page-size")) {
    return "critical";
  }
  return "warning";
}

function makeOverlayLabel(issue: PageIssue): string {
  const message = String(issue.message ?? "").trim();
  if (!message) return "Issue";
  return message.length > 60 ? `${message.slice(0, 59)}…` : message;
}

export default function CheckerPdfViewer({
  pdfUrl,
  pageIssues,
  totalPages: totalPagesProp,
  requestedPage = null,
  readinessScore = null,
  passThreshold = 95,
}: CheckerPdfViewerProps) {
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(totalPagesProp || 0);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const signedPdfUrlRef = useRef<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const fallbackReasonRef = useRef<"timeout" | "blank" | null>(null);
  const outcomeLabelRef = useRef<string | null>(null);
  const iframeLoadTimeoutRef = useRef<number | null>(null);

  const logOutcomeOnce = (label: string) => {
    if (outcomeLabelRef.current) return;
    outcomeLabelRef.current = label;
    // One final outcome label per preview session.
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

    // Sample variance across deterministic grid + random points.
    // This reduces false positives on sparse text-heavy pages.
    const sampleCount = BLANK_CHECK_SAMPLE_COUNT;
    const data = canvas.getContext("2d")?.getImageData(0, 0, w, h)?.data;
    if (!data) return;

    const samples: number[] = [];
    // Helper: brightness as luminance.
    const luminance = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

    const gridSize = 8;
    const sampledCoordinates: Array<{ x: number; y: number }> = [];
    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        const x = Math.min(w - 1, Math.floor(((gx + 0.5) / gridSize) * w));
        const y = Math.min(h - 1, Math.floor(((gy + 0.5) / gridSize) * h));
        sampledCoordinates.push({ x, y });
      }
    }
    for (let i = sampledCoordinates.length; i < sampleCount; i++) {
      sampledCoordinates.push({
        x: Math.floor(Math.random() * w),
        y: Math.floor(Math.random() * h),
      });
    }
    for (const { x, y } of sampledCoordinates) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Ignore fully transparent samples (shouldn't happen since we prefill).
      if (a === 0) continue;

      const bright = luminance(r, g, b);
      samples.push(bright);
    }

    if (samples.length < 40) return;

    const mean = samples.reduce((acc, v) => acc + v, 0) / samples.length;
    const variance = samples.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / samples.length;
    const stdDev = Math.sqrt(variance);

    // Conservative "near zero" variance check (uniform ~single color).
    const varianceNearZero = stdDev < 2.5;
    const nearWhite = mean > 235;
    const nearBlack = mean < 20;

    // "Meaningful paint" here means any sampled pixel that deviates
    // noticeably from the dominant brightness of the canvas.
    const meaningfulPaintThresholdFromMean = 6;
    const meaningfulPaintCount = samples.reduce((acc, v) => acc + (Math.abs(v - mean) > meaningfulPaintThresholdFromMean ? 1 : 0), 0);
    const noMeaningfulPaint = meaningfulPaintCount === 0;
    const definitelyHasContent = meaningfulPaintCount >= Math.max(3, Math.round(samples.length * 0.03));

    if (!definitelyHasContent && varianceNearZero && noMeaningfulPaint && (nearWhite || nearBlack)) {
      requestFallback("blank");
    }
  };

  const getIssueOverlayRect = (bbox: number[] | null) => {
    if (!bbox || bbox.length < 4 || !pageSize) return null;
    if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY)) return null;
    const [xRaw, yRaw, wRaw, hRaw] = bbox;
    if (![xRaw, yRaw, wRaw, hRaw].every((v) => Number.isFinite(v))) return null;

    const maxWidth = pageSize.width;
    const maxHeight = pageSize.height;
    const x = Math.max(0, Math.min(xRaw, maxWidth));
    const y = Math.max(0, Math.min(yRaw, maxHeight));
    const width = Math.max(0, Math.min(wRaw, maxWidth - x));
    const height = Math.max(0, Math.min(hRaw, maxHeight - y));

    if (width < 2 || height < 2) return null;
    return {
      x: x * scaleX,
      y: y * scaleY,
      width: width * scaleX,
      height: height * scaleY,
    };
  };

  const renderWidth = Math.round(BASE_WIDTH * scale);
  const scaleX = pageSize ? renderWidth / pageSize.width : 1;
  const scaleY = scaleX;
  const displayHeight = pageSize ? (pageSize.height / pageSize.width) * renderWidth : 300;
  const issuesForPage = pageIssues.filter((i) => i.page === pageNumber);
  const hasHighlights = issuesForPage.some((i) => !!getIssueOverlayRect(i.bbox));
  const issuePages = Array.from(
    new Set(
      pageIssues
        .map((i) => i.page)
        .filter((p) => Number.isFinite(p) && p > 0)
        .sort((a, b) => a - b)
    )
  );
  const showReadyMessage = issuePages.length === 0 || (readinessScore != null && readinessScore >= passThreshold);
  const issuePagesLabel =
    issuePages.length <= 8
      ? issuePages.join(", ")
      : `${issuePages.slice(0, 6).join(", ")}, ... ${issuePages[issuePages.length - 1]}`;
  const firstIssuePage = (() => {
    const validPages = pageIssues
      .filter((i) => Array.isArray(i.bbox) && i.bbox.length >= 4)
      .map((i) => i.page)
      .filter((p) => Number.isFinite(p) && p > 0)
      .sort((a, b) => a - b);
    return validPages.length > 0 ? validPages[0] : null;
  })();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRendering(false);
    pdfDocRef.current = null;
    setPdfLoaded(false);
    setSignedPdfUrl(null);
    signedPdfUrlRef.current = null;
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

      // `/api/r2-file?id=...` returns JSON: { url: presignedR2GetUrl }
      const res = await fetch(pdfUrl, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to get signed PDF URL (${res.status})`);
      }
      const data = (await res.json()) as { url?: string };
      if (!data?.url) {
        throw new Error("Signed PDF URL missing from response");
      }
      if (!cancelled) {
        signedPdfUrlRef.current = data.url;
        setSignedPdfUrl(data.url);
      }

      const loadingTask = pdfjsLib.getDocument({
        url: data.url,
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
        setPdfLoaded(true);
        setNumPages(pdf.numPages);
        setPageNumber(1);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          // If PDF.js cannot load (e.g., range request failures/timeouts),
          // switch to compatibility view instead of showing a hard error.
          requestFallback("timeout");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      pdfDocRef.current = null;
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdfLoaded || numPages < 1) return;
    if (!firstIssuePage) {
      setPageNumber(1);
      return;
    }
    setPageNumber(Math.min(Math.max(1, firstIssuePage), numPages));
  }, [pdfLoaded, firstIssuePage, numPages]);

  useEffect(() => {
    if (!pdfLoaded || numPages < 1 || requestedPage == null) return;
    const target = Math.min(Math.max(1, requestedPage), numPages);
    setPageNumber(target);
  }, [requestedPage, pdfLoaded, numPages]);

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
      try {
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
      } catch (err) {
        throw err;
      } finally {
        // Always clear the "Rendering page..." overlay after page.render completes,
        // even if the effect was cancelled mid-flight.
        setRendering(false);
      }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfUrl, pdfLoaded, pageNumber, scale, numPages, renderWidth]);

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
    const iframeSrc = signedPdfUrlRef.current ?? signedPdfUrl ?? pdfUrl;
    return (
      <div className="rounded-lg bg-[#24241a] border border-white/10 overflow-hidden">
        <div className="p-3 border-b border-white/10 bg-black/20 text-sm text-[#8B8B6B]">
          {msg}
        </div>
        <div className="p-2">
          <iframe
            src={iframeSrc}
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
      <div className="p-3 border-b border-white/10 bg-black/20">
        <div className="flex flex-wrap items-center gap-3">
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
        <div className="mt-2 flex justify-center">
          {showReadyMessage ? (
            <span
              className="text-center font-bebas text-sm sm:text-base tracking-wide uppercase"
              style={{ color: "#4cd964" }}
            >
              {readinessScore != null
                ? `READY FOR KDP - SCORE ${readinessScore}/100. CHECK REPORT FOR MINOR FIXES.`
                : "READY FOR KDP. CHECK REPORT FOR MINOR FIXES."}
            </span>
          ) : (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="text-xs font-semibold tracking-wide uppercase text-white/80">
                Error Pages: <span className="text-[#F4E3D7]">{issuePagesLabel}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (issuePages.length === 0) return;
                  const nextPage = issuePages.find((p) => p > pageNumber) ?? issuePages[0];
                  setPageNumber(nextPage);
                }}
                className="font-bebas text-sm sm:text-base tracking-wide uppercase rounded px-3 py-1"
                style={{ color: "#F05A28", background: "rgba(240,90,40,0.12)", border: "1px solid rgba(240,90,40,0.45)" }}
              >
                Jump To Next Error Page
              </button>
            </div>
          )}
        </div>
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
                const rect = getIssueOverlayRect(issue.bbox);
                if (!rect) return null;
                const normalized = normalizeSeverity(issue);
                const stroke = normalized === "critical" ? "#FF0000" : "#FF8C00";
                const label = makeOverlayLabel(issue);
                const labelY = Math.max(rect.y - 4, 8);
                return (
                  <g key={`${issue.page}-${issue.rule_id}-${idx}`}>
                    <text
                      x={rect.x}
                      y={labelY}
                      fill={stroke}
                      fontSize={6}
                      fontWeight={700}
                    >
                      {label}
                    </text>
                    <rect
                      x={rect.x}
                      y={rect.y}
                      width={rect.width}
                      height={rect.height}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={2}
                    >
                      <title>{issue.message}</title>
                    </rect>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>
      {hasHighlights ? (
        <p className="px-4 pb-3 text-xs text-center" style={{ color: "#F05A28" }}>
          Highlight legend: red = critical issues, orange = warnings.
        </p>
      ) : (
        <p className="px-4 pb-3 text-xs text-center" style={{ color: "#F05A28" }}>
          No on-page highlights for this page.
        </p>
      )}
    </div>
  );
}
