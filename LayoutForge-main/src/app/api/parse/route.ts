import { NextRequest, NextResponse } from "next/server";
import { getStored, readStoredFile } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id } = body;

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

    let wordCount = 0;
    let chapterCount = 0;
    let title = "";
    let previewText = "";

    const mimeType = meta.mimeType || "";

    if (mimeType === "application/pdf") {
      // For PDFs - use basic buffer size estimation, skip pdf-parse
      wordCount = Math.max(1000, Math.ceil(buffer.length / 10));
      chapterCount = Math.max(1, Math.ceil(wordCount / 3000));
      title = meta.originalName?.replace(/\.[^.]+$/, "") || "Untitled";
      previewText = "PDF manuscript ready for KDP formatting.";

    } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const mammoth = (await import("mammoth")).default;
      try {
        const result = await mammoth.convertToHtml({ buffer });
        const html = result.value || "";
        const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
        const headings = (html.match(/<h[1-3]/gi) || []).length;
        chapterCount = Math.max(1, headings || Math.ceil(wordCount / 3000));
        const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        title = titleMatch?.[1]?.replace(/<[^>]+>/g, "").trim() || meta.originalName?.replace(/\.[^.]+$/, "") || "Untitled";
        const words = text.split(/\s+/).filter((w) => w.length > 0);
        previewText = words.slice(0, 900).join(" ");
      } catch (e) {
        console.error("DOCX parse error:", e);
        return NextResponse.json({ error: "Parse failed", message: "Could not parse DOCX file." }, { status: 400 });
      }

    } else if (mimeType === "application/epub+zip") {
      const JSZip = (await import("jszip")).default;
      try {
        const zip = await JSZip.loadAsync(buffer);
        let text = "";
        for (const [zipPath, file] of Object.entries(zip.files)) {
          if (/\.x?html?$/i.test(zipPath)) {
            const content = await file.async("text");
            text += content + " ";
            if (text.length > 100000) break;
          }
        }
        const cleanText = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        wordCount = cleanText.split(/\s+/).filter((w) => w.length > 0).length;
        chapterCount = Math.max(1, Math.ceil(wordCount / 3000));
        title = meta.originalName?.replace(/\.[^.]+$/, "") || "Untitled";
        previewText = cleanText.split(/\s+/).slice(0, 900).join(" ");
      } catch (e) {
        console.error("EPUB parse error:", e);
        return NextResponse.json({ error: "Parse failed", message: "Could not parse EPUB file." }, { status: 400 });
      }

    } else {
      return NextResponse.json({ error: "Unsupported type", message: `Cannot parse files of type ${mimeType}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      id,
      wordCount,
      chapterCount,
      title,
      estimatedPages: Math.max(24, Math.ceil(wordCount / 300)),
      previewText,
    });

  } catch (e) {
    console.error("Parse route error:", e);
    return NextResponse.json(
      { error: "Internal error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}