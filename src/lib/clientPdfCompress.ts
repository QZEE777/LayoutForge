/**
 * Client-side PDF compression/optimization. Runs entirely in the browser.
 * No server cost, no CloudConvert. Uses pdfjs-dist (Mozilla) + pdf-lib.
 * Only import from "use client" components.
 */

import { PDFDocument } from "pdf-lib";

const PDFJS_VERSION = "4.10.38";

export type PdfProfile = "web" | "print";

const PROFILE = {
  web: { scale: 1.5, jpegQuality: 0.72 },
  print: { scale: 2.5, jpegQuality: 0.88 },
} as const;

export interface CompressOptions {
  profile: PdfProfile;
  onProgress?: (page: number, total: number) => void;
}

/**
 * Compress/optimize a PDF in the browser. Returns a new PDF as a Blob.
 * Uses rasterization (pages → images → new PDF) so output is typically smaller for image-heavy PDFs.
 */
export async function compressPdfInBrowser(
  file: File,
  options: CompressOptions
): Promise<Blob> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("compressPdfInBrowser must run in the browser.");
  }

  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const { scale, jpegQuality } = PROFILE[options.profile];

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas 2d context.");

  const pageBlobs: { blob: Blob; width: number; height: number }[] = [];

  for (let i = 1; i <= numPages; i++) {
    options.onProgress?.(i, numPages);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        jpegQuality
      );
    });
    pageBlobs.push({ blob, width: viewport.width, height: viewport.height });
  }

  const doc = await PDFDocument.create();
  for (const { blob, width, height } of pageBlobs) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const image = await doc.embedJpg(bytes);
    const page = doc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
  }

  const pdfBytes = await doc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}
