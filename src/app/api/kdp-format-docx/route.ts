import { NextRequest, NextResponse } from "next/server";
import { getStored, readStoredFile, writeOutput, updateMeta } from "@/lib/storage";
import { parseDocxForKdp } from "@/lib/kdpDocxParser";
import { generateKdpPdf } from "@/lib/kdpPdfGenerator";
import { buildFormatReviewText } from "@/lib/formatReviewExport";
import { type KdpFormatConfig, getGutterInches, validateTrimSize } from "@/lib/kdpConfig";
import { outputFilenameFromTitle } from "@/lib/formatFileName";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, config } = body as { id?: string; config?: KdpFormatConfig };

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Missing ID", message: "Please provide an upload ID." },
        { status: 400 }
      );
    }

    if (!config || typeof config !== "object") {
      return NextResponse.json(
        { error: "Missing config", message: "Please provide format configuration." },
        { status: 400 }
      );
    }

    const bookTitle = typeof config.bookTitle === "string" ? config.bookTitle : "";
    const authorName = typeof config.authorName === "string" ? config.authorName : "";
    if (!bookTitle.trim() || !authorName.trim()) {
      return NextResponse.json(
        { error: "Missing fields", message: "Book title and author name are required." },
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

    const mimeType = meta.mimeType || "";
    if (mimeType !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      return NextResponse.json(
        { error: "Invalid type", message: "Only DOCX files can be formatted." },
        { status: 400 }
      );
    }

    const buffer = await readStoredFile(id);
    if (!buffer) {
      return NextResponse.json(
        { error: "Read failed", message: "Could not read uploaded file." },
        { status: 404 }
      );
    }

    const fullConfig: KdpFormatConfig = {
      bookTitle,
      authorName,
      copyrightYear: typeof config.copyrightYear === "number" ? config.copyrightYear : new Date().getFullYear(),
      isbn: typeof config.isbn === "string" ? config.isbn.trim() : "",
      trimSize: validateTrimSize(config.trimSize),
      bookType: config.bookType || "nonfiction",
      bodyFont: config.bodyFont || "ebgaramond",
      headingFont: config.headingFont || "playfair",
      fontSize: config.fontSize ?? 11,
      paragraphStyle: config.paragraphStyle || "nonfiction",
      lineSpacing: config.lineSpacing ?? 1.3,
      interiorColor: config.interiorColor || "bw",
      paperColor: config.paperColor || "white",
      bleedImages: !!config.bleedImages,
      frontMatter: {
        titlePage: config.frontMatter?.titlePage !== false,
        copyrightPage: config.frontMatter?.copyrightPage !== false,
        toc: config.frontMatter?.toc !== false,
        dedication: !!config.frontMatter?.dedication,
        dedicationText: typeof config.frontMatter?.dedicationText === "string" ? config.frontMatter.dedicationText : "",
      },
    };

    let content;
    try {
      content = await parseDocxForKdp(buffer);
    } catch (e) {
      console.error("[kdp-format-docx] Parse error:", e);
      return NextResponse.json(
        { error: "Parse failed", message: "Could not parse DOCX. The file may be corrupted or password-protected." },
        { status: 400 }
      );
    }

    content.frontMatter.title = fullConfig.bookTitle;
    content.frontMatter.author = fullConfig.authorName;

    let result;
    try {
      result = await generateKdpPdf(content, fullConfig);
    } catch (e) {
      console.error("[kdp-format-docx] PDF generation error:", e);
      return NextResponse.json(
        { error: "Generation failed", message: e instanceof Error ? e.message : "PDF generation failed." },
        { status: 500 }
      );
    }

    const trim = fullConfig.trimSize;
    const gutterInches = getGutterInches(result.pageCount);

    const outputFilename = outputFilenameFromTitle(bookTitle, ".pdf");
    await writeOutput(id, outputFilename, Buffer.from(result.pdfBytes));

    const formatReviewText = buildFormatReviewText(content, fullConfig);
    const report = {
      pagesGenerated: result.pageCount,
      chaptersDetected: content.chapters.length,
      issues: content.detectedIssues,
      fontUsed: "Times Roman",
      trimSize: trim,
      gutterInches,
      formatReviewText,
    };

    await updateMeta(id, {
      outputFilename,
      convertStatus: "done",
      pageCount: result.pageCount,
      trimSize: trim,
      processingReport: report,
    });

    return NextResponse.json({
      success: true,
      id,
      report: {
        pagesGenerated: report.pagesGenerated,
        chaptersDetected: report.chaptersDetected,
        issues: report.issues,
        fontUsed: report.fontUsed,
        trimSize: report.trimSize,
        gutterInches: report.gutterInches,
      },
    });
  } catch (e) {
    console.error("[kdp-format-docx]", e);
    return NextResponse.json(
      { error: "Internal error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
