import React, { useCallback, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { PageIssue, ValidationReport } from "../types";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Optional: set worker if not already set (e.g. by bundler)
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

const BASE_WIDTH = 600;
const SAFE_MARGIN_PT = 18; // 0.25"
const BLEED_PT = 9; // 0.125"

interface Props {
  pdfUrl: string;
  report: ValidationReport;
}

interface PageViewport {
  widthPt: number;
  heightPt: number;
}

export const KdpPdfViewer: React.FC<Props> = ({ pdfUrl, report }) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [showTrim, setShowTrim] = useState(true);
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [showBleed, setShowBleed] = useState(true);
  const [showIssues, setShowIssues] = useState(true);
  const [pageViewports, setPageViewports] = useState<Record<number, PageViewport>>({});

  const pageIssues: PageIssue[] =
    report.page_issues?.filter((p) => p.page === pageNumber) ?? [];

  const onDocumentLoadSuccess = useCallback(async (pdf: pdfjs.PDFDocumentProxy) => {
    const n = pdf.numPages;
    setNumPages(n);
    const viewports: Record<number, PageViewport> = {};
    for (let i = 1; i <= n; i++) {
      const page = await pdf.getPage(i);
      const vp = page.getViewport({ scale: 1 });
      viewports[i] = { widthPt: vp.width, heightPt: vp.height };
    }
    setPageViewports(viewports);
  }, []);

  const viewport = pageViewports[pageNumber];
  const renderWidth = Math.round(BASE_WIDTH * zoom);
  const scaleX = viewport ? renderWidth / viewport.widthPt : 1;
  const scaleY = scaleX;
  const displayHeight = viewport ? Math.round(viewport.heightPt * scaleY) : 0;

  return (
    <div className="kdp-pdf-viewer">
      <div className="kdp-pdf-viewer-controls" style={{ marginBottom: "8px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
        <button
          type="button"
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
        >
          Prev
        </button>
        <span>
          {pageNumber} / {numPages || "—"}
        </span>
        <button
          type="button"
          onClick={() => setPageNumber((p) => Math.min(numPages || 1, p + 1))}
          disabled={pageNumber >= numPages}
        >
          Next
        </button>
        <label style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "8px" }}>
          Zoom
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
          <span style={{ minWidth: "36px" }}>{Math.round(zoom * 100)}%</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            type="checkbox"
            checked={showTrim}
            onChange={(e) => setShowTrim(e.target.checked)}
          />
          Trim
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            type="checkbox"
            checked={showSafeZone}
            onChange={(e) => setShowSafeZone(e.target.checked)}
          />
          Safe zone
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            type="checkbox"
            checked={showBleed}
            onChange={(e) => setShowBleed(e.target.checked)}
          />
          Bleed
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            type="checkbox"
            checked={showIssues}
            onChange={(e) => setShowIssues(e.target.checked)}
          />
          Issues
        </label>
      </div>

      <div
        className="page-wrapper"
        style={{
          position: "relative",
          display: "inline-block",
          width: renderWidth,
          height: displayHeight || "auto",
        }}
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div>Loading PDF…</div>}
          error={<div>Failed to load PDF.</div>}
        >
          {numPages > 0 && (
            <>
              <Page pageNumber={pageNumber} width={renderWidth} />
              {viewport && (
                <svg
                  className="page-overlay kdp-overlay"
                  width={renderWidth}
                  height={displayHeight}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                  }}
                >
                  {/* Bleed: outside trim by BLEED_PT (0.125") */}
                  {showBleed && (
                    <g className="overlay-bleed">
                      <rect
                        x={-BLEED_PT * scaleX}
                        y={-BLEED_PT * scaleY}
                        width={viewport.widthPt * scaleX + 2 * BLEED_PT * scaleX}
                        height={viewport.heightPt * scaleY + 2 * BLEED_PT * scaleY}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth={1}
                        strokeDasharray="4 2"
                      />
                    </g>
                  )}
                  {/* Trim: page boundary */}
                  {showTrim && (
                    <rect
                      x={0}
                      y={0}
                      width={viewport.widthPt * scaleX}
                      height={viewport.heightPt * scaleY}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      className="overlay-trim"
                    />
                  )}
                  {/* Safe zone: inset SAFE_MARGIN_PT (0.25") */}
                  {showSafeZone && (
                    <rect
                      x={SAFE_MARGIN_PT * scaleX}
                      y={SAFE_MARGIN_PT * scaleY}
                      width={(viewport.widthPt - 2 * SAFE_MARGIN_PT) * scaleX}
                      height={(viewport.heightPt - 2 * SAFE_MARGIN_PT) * scaleY}
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      className="overlay-safe"
                    />
                  )}
                  {/* Page issues: bbox [x, y, w, h] in PDF points → pixels */}
                  {showIssues &&
                    pageIssues.map((issue, idx) => {
                      if (!issue.bbox) return null;
                      const [x, y, w, h] = issue.bbox;
                      const isError = issue.severity === "ERROR";
                      return (
                        <rect
                          key={`${issue.page}-${issue.rule_id}-${idx}`}
                          x={x * scaleX}
                          y={y * scaleY}
                          width={w * scaleX}
                          height={h * scaleY}
                          className={isError ? "error-rect" : "warning-rect"}
                          aria-label={issue.message}
                        >
                          <title>{issue.message}</title>
                        </rect>
                      );
                    })}
                </svg>
              )}
            </>
          )}
        </Document>
      </div>
    </div>
  );
};
