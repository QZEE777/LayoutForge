import { NextRequest, NextResponse } from "next/server";
import { getStored, readStoredFile, writeOutput, updateMeta } from "@/lib/storage";
import { parseDocxForKdp } from "@/lib/kdpDocxParser";
import { generateKdpDocx } from "@/lib/kdpDocxGenerator";
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
      isbn: typeof config.isbn === "string" ? config.isbn : "",
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
      console.error("[kdp-format-docx-preview] Parse error:", e);
      return NextResponse.json(
        { error: "Parse failed", message: "Could not parse DOCX. The file may be corrupted or password-protected." },
        { status: 400 }
      );
    }

    let docxBuffer: Buffer;
    try {
      docxBuffer = await generateKdpDocx(content, fullConfig);
    } catch (e) {
      console.error("[kdp-format-docx-preview] DOCX generation error:", e);
      return NextResponse.json(
        { error: "Generation failed", message: e instanceof Error ? e.message : "DOCX generation failed." },
        { status: 500 }
      );
    }

    const trim = fullConfig.trimSize;
    const gutterInches = getGutterInches(content.estimatedPageCount);
    const sectionsDetected = content.chapters.filter((c) => c.level === 1).length;
    const lessonsDetected = content.chapters.filter((c) => c.level === 2).length;

    const outputFilename = outputFilenameFromTitle(bookTitle, ".docx");
    await writeOutput(id, outputFilename, docxBuffer);

    const report = {
      pagesGenerated: 0,
      chaptersDetected: content.chapters.length,
      sectionsDetected,
      lessonsDetected,
      estimatedPages: content.estimatedPageCount,
      issues: content.detectedIssues,
      fontUsed: "Times New Roman",
      trimSize: trim,
      gutterInches,
      outputType: "docx" as const,
      status: "Review Draft ✓",
    };

    await updateMeta(id, {
      outputFilename,
      convertStatus: "done",
      processingReport: report,
    });

    return NextResponse.json({
      success: true,
      id,
      report: {
        ...report,
        pagesGenerated: undefined,
      },
    });
  } catch (e) {
    console.error("[kdp-format-docx-preview]", e);
    return NextResponse.json(
      { error: "Internal error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
