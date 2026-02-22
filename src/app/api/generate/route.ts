import { NextRequest, NextResponse } from "next/server";
import { getStored, readStoredFile, writeOutput } from "@/lib/storage";
import {
  getTrimSize,
  getPageDimensions,
  getGutterMargin,
  KDP_MARGINS,
  estimatePageCount,
  inchesToPoints,
  type TrimSizeId,
} from "@/lib/kdpSpecs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, trimSize = "6x9", withBleed = false, fontSize = 11 } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Missing ID", message: "Please provide a file ID." },
        { status: 400 }
      );
    }

    const meta = await getStored(id);
    if (!meta) {
      return NextResponse.json(
        { error: "Not found", message: "File not found or expired." },
        { status: 404 }
      );
    }

    const buffer = await readStoredFile(id);
    if (!buffer) {
      return NextResponse.json(
        { error: "Read failed", message: "Could not read file." },
        { status: 404 }
      );
    }

    const trim = getTrimSize(trimSize as TrimSizeId);
    if (!trim) {
      return NextResponse.json(
        { error: "Invalid trim size", message: `Trim size "${trimSize}" not supported.` },
        { status: 400 }
      );
    }

    const mimeType = meta.mimeType || "";
    const outputFilename = `${id}-kdp-print.pdf`;
    let wordCount = 0;
    let pageCount = 100;

    if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // Extract text from DOCX using mammoth
      const mammoth = (await import("mammoth")).default;
      const result = await mammoth.convertToHtml({ buffer });
      const html = result.value || "";

      // Convert HTML to plain text with paragraph breaks
      const text = html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<\/h[1-6]>/gi, "\n\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

      // Build KDP PDF using pdf-lib (pure JS, no external tools needed)
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

      const pageDims = getPageDimensions(trimSize as TrimSizeId, withBleed);
      const pageW = inchesToPoints(pageDims.widthInches);
      const pageH = inchesToPoints(pageDims.heightInches);

      const estPages = estimatePageCount(wordCount, trimSize as TrimSizeId, fontSize);
      const gutterPts = inchesToPoints(getGutterMargin(estPages));
      const outsidePts = inchesToPoints(KDP_MARGINS.minOutside);
      const topPts = inchesToPoints(0.75);
      const bottomPts = inchesToPoints(0.75);
      const textWidth = pageW - gutterPts - outsidePts;

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);

      const fs_pt = Number(fontSize) || 11;
      const lineHeight = fs_pt * 1.6;

      // Word-wrap a single line of text to fit within maxWidth
      function wrapLine(line: string, maxWidth: number): string[] {
        const words = line.split(/\s+/);
        const wrapped: string[] = [];
        let current = "";
        for (const word of words) {
          const test = current ? `${current} ${word}` : word;
          if (font.widthOfTextAtSize(test, fs_pt) > maxWidth && current) {
            wrapped.push(current);
            current = word;
          } else {
            current = test;
          }
        }
        if (current) wrapped.push(current);
        return wrapped;
      }

      let page = pdfDoc.addPage([pageW, pageH]);
      let pageNum = 1;
      let y = pageH - topPts - fs_pt;

      function nextPage() {
        page = pdfDoc.addPage([pageW, pageH]);
        pageNum++;
        y = pageH - topPts - fs_pt;
      }

      const paragraphs = text.split(/\n\n+/);

      for (const para of paragraphs) {
        const rawLines = para.split("\n");
        for (const rawLine of rawLines) {
          const trimmedLine = rawLine.trim();
          if (!trimmedLine) {
            y -= lineHeight * 0.5;
            if (y < bottomPts + lineHeight) nextPage();
            continue;
          }
          const wrappedLines = wrapLine(trimmedLine, textWidth);
          for (const wl of wrappedLines) {
            if (y < bottomPts + lineHeight) nextPage();
            page.drawText(wl, {
              x: gutterPts,
              y,
              size: fs_pt,
              font,
              color: rgb(0, 0, 0),
            });
            y -= lineHeight;
          }
        }
        // Paragraph spacing
        y -= lineHeight * 0.4;
        if (y < bottomPts + lineHeight) nextPage();
      }

      pageCount = pdfDoc.getPageCount();
      const pdfBytes = await pdfDoc.save();
      await writeOutput(id, outputFilename, Buffer.from(pdfBytes));
    } else if (mimeType === "application/pdf") {
      // PDF pass-through — save as-is
      await writeOutput(id, outputFilename, buffer);
      wordCount = Math.max(1000, Math.ceil(buffer.length / 10));
      pageCount = estimatePageCount(wordCount, trimSize as TrimSizeId, fontSize);
    } else {
      return NextResponse.json(
        {
          error: "Unsupported format",
          message: "Only .docx and .pdf files are supported for generation.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      id,
      pdfId: id,
      outputFilename,
      pageCount,
      wordCount,
      trimSize,
      withBleed,
      fontSize,
    });
  } catch (e) {
    console.error("Generate route error:", e);
    return NextResponse.json(
      {
        error: "Internal error",
        message: `Generation failed: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    );
  }
}
