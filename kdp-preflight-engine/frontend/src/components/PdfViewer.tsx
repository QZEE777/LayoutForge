import { useCallback, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { PageIssue, ValidationReport } from "../types";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const RENDER_WIDTH = 600;

interface PdfViewerProps {
  fileUrl: string;
  report: ValidationReport;
}

interface PageViewport {
  widthPt: number;
  heightPt: number;
}

export function PdfViewer({ fileUrl, report }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageViewports, setPageViewports] = useState<Record<number, PageViewport>>({});
  const [currentPage, setCurrentPage] = useState(1);

  const onDocumentLoadSuccess = useCallback(
    async (pdf: pdfjs.PDFDocumentProxy) => {
      const n = pdf.numPages;
      setNumPages(n);
      const viewports: Record<number, PageViewport> = {};
      for (let i = 1; i <= n; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 1 });
        viewports[i] = { widthPt: vp.width, heightPt: vp.height };
      }
      setPageViewports(viewports);
    },
    []
  );

  const issuesForPage = (pageNum: number): PageIssue[] =>
    report.page_issues.filter((i) => i.page === pageNum);

  return (
    <>
      <div className="page-nav">
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
        >
          ‹
        </button>
        <span>
          Page {currentPage} of {numPages || "—"}
        </span>
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.min(numPages || 1, p + 1))}
          disabled={currentPage >= numPages}
        >
          ›
        </button>
      </div>

      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<div>Loading PDF…</div>}
        error={<div>Failed to load PDF.</div>}
      >
        {numPages > 0 && (
          <PageWithOverlay
            pageNumber={currentPage}
            viewport={pageViewports[currentPage]}
            issues={issuesForPage(currentPage)}
            renderWidth={RENDER_WIDTH}
          />
        )}
      </Document>
    </>
  );
}

interface PageWithOverlayProps {
  pageNumber: number;
  viewport: PageViewport | undefined;
  issues: PageIssue[];
  renderWidth: number;
}

function PageWithOverlay({
  pageNumber,
  viewport,
  issues,
  renderWidth,
}: PageWithOverlayProps) {
  if (!viewport) {
    return (
      <div className="page-wrapper">
        <Page pageNumber={pageNumber} width={renderWidth} />
      </div>
    );
  }

  const { widthPt, heightPt } = viewport;
  const scaleX = renderWidth / widthPt;
  const scaleY = scaleX; // keep aspect ratio; rendered height = heightPt * scaleX
  const displayHeight = heightPt * scaleX;

  return (
    <div
      className="page-wrapper"
      style={{ position: "relative", width: renderWidth, height: displayHeight }}
    >
      <Page pageNumber={pageNumber} width={renderWidth} />
      <svg
        className="page-overlay"
        width={renderWidth}
        height={displayHeight}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      >
        {issues.map((issue, idx) => {
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
            />
          );
        })}
      </svg>
    </div>
  );
}
