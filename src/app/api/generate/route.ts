import { NextRequest, NextResponse } from "next/server";
import { getStored, readStoredFile, updateMeta } from "@/lib/storage";
import { getTrimSize, type TrimSizeId } from "@/lib/kdpSpecs";

/**
 * POST /api/generate
 *
 * Starts a CloudConvert job to convert the uploaded document to a
 * KDP-compliant PDF.  Returns immediately with a jobId so the client
 * can poll /api/generate/status for progress (Vercel 10 s limit safe).
 *
 * If CLOUDCONVERT_API_KEY is not set the route falls back to the
 * legacy pdf-lib plain-text renderer so local dev still works.
 */
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

    const trim = getTrimSize(trimSize as TrimSizeId);
    if (!trim) {
      return NextResponse.json(
        { error: "Invalid trim size", message: `Trim size "${trimSize}" is not supported.` },
        { status: 400 }
      );
    }

    const mimeType = meta.mimeType || "";
    const isDocx = mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isPdf  = mimeType === "application/pdf";
    const isEpub = mimeType === "application/epub+zip";

    if (!isDocx && !isPdf && !isEpub) {
      return NextResponse.json(
        { error: "Unsupported format", message: "Please upload a DOCX, PDF, or EPUB file." },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------------
    // CloudConvert path (production)
    // ----------------------------------------------------------------
    const apiKey = process.env.CLOUDCONVERT_API_KEY;

    if (apiKey) {
      const buffer = await readStoredFile(id);
      if (!buffer) {
        return NextResponse.json(
          { error: "Read failed", message: "Could not read uploaded file." },
          { status: 404 }
        );
      }

      // Determine output file extension for import task
      let inputFilename = meta.originalName || "document";
      if (isDocx && !inputFilename.endsWith(".docx")) inputFilename += ".docx";
      if (isPdf  && !inputFilename.endsWith(".pdf"))  inputFilename += ".pdf";
      if (isEpub && !inputFilename.endsWith(".epub")) inputFilename += ".epub";

      // Step 1 — create job (upload + convert + export)
      const jobRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tasks: {
            "import-file": {
              operation: "import/upload",
            },
            "convert-to-pdf": {
              operation: "convert",
              input: "import-file",
              output_format: "pdf",
              engine: "libreoffice",
              // Ask LibreOffice to embed all fonts so KDP accepts the file
              engine_options: {
                optimize_print: true,
              },
            },
            "export-file": {
              operation: "export/url",
              input: "convert-to-pdf",
            },
          },
        }),
      });

      if (!jobRes.ok) {
        const errText = await jobRes.text();
        console.error("CloudConvert job create error:", errText);
        return NextResponse.json(
          { error: "Conversion service error", message: "Could not start conversion. Try again." },
          { status: 502 }
        );
      }

      const job = await jobRes.json();
      const jobId: string = job.data.id;

      // Find the upload task to get the presigned upload URL
      const uploadTask = job.data.tasks.find(
        (t: { operation: string }) => t.operation === "import/upload"
      );
      if (!uploadTask?.result?.form) {
        return NextResponse.json(
          { error: "Conversion service error", message: "Could not get upload URL." },
          { status: 502 }
        );
      }

      // Step 2 — upload the file to CloudConvert's presigned URL
      const { url: uploadUrl, parameters } = uploadTask.result.form;
      const uploadForm = new FormData();
      for (const [key, val] of Object.entries(parameters as Record<string, string>)) {
        uploadForm.append(key, val);
      }
      uploadForm.append("file", new Blob([buffer], { type: mimeType }), inputFilename);

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: uploadForm,
      });

      if (!uploadRes.ok) {
        console.error("CloudConvert file upload failed:", uploadRes.status);
        return NextResponse.json(
          { error: "Upload failed", message: "Could not upload file for conversion." },
          { status: 502 }
        );
      }

      // Persist job metadata so the status endpoint can track it
      await updateMeta(id, {
        convertJobId: jobId,
        convertStatus: "processing",
        trimSize,
        withBleed,
        fontSize,
      });

      return NextResponse.json({
        success: true,
        id,
        jobId,
        status: "processing",
        message: "Conversion started. Poll /api/generate/status for progress.",
      });
    }

    // ----------------------------------------------------------------
    // Fallback — no API key (local dev only)
    // Plain-text pdf-lib renderer — preserves layout but not styling.
    // ----------------------------------------------------------------
    console.warn("CLOUDCONVERT_API_KEY not set — using fallback pdf-lib renderer.");

    const buffer = await readStoredFile(id);
    if (!buffer) {
      return NextResponse.json({ error: "Read failed", message: "Could not read file." }, { status: 404 });
    }

    const { getPageDimensions, getGutterMargin, KDP_MARGINS, estimatePageCount, inchesToPoints } = await import("@/lib/kdpSpecs");
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

    let text = "";
    let wordCount = 0;

    if (isDocx) {
      const mammoth = (await import("mammoth")).default;
      const result = await mammoth.convertToHtml({ buffer });
      const html = result.value || "";
      text = html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<\/h[1-6]>/gi, "\n\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    } else {
      text = "PDF content — fallback renderer cannot reformat PDF files.";
    }

    wordCount = text.split(/\s+/).filter(Boolean).length;

    const pageDims = getPageDimensions(trimSize as TrimSizeId, withBleed);
    const pageW    = inchesToPoints(pageDims.widthInches);
    const pageH    = inchesToPoints(pageDims.heightInches);
    const estPages = estimatePageCount(wordCount, trimSize as TrimSizeId, fontSize);
    const gutterPts  = inchesToPoints(getGutterMargin(estPages));
    const outsidePts = inchesToPoints(KDP_MARGINS.minOutside);
    const topPts     = inchesToPoints(0.75);
    const bottomPts  = inchesToPoints(0.75);
    const textWidth  = pageW - gutterPts - outsidePts;

    const pdfDoc = await PDFDocument.create();
    const font   = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    const fs_pt = Number(fontSize) || 11;
    const lineH = fs_pt * 1.6;

    function wrapLine(line: string, maxW: number): string[] {
      const words = line.split(/\s+/);
      const out: string[] = [];
      let cur = "";
      for (const w of words) {
        const test = cur ? `${cur} ${w}` : w;
        if (font.widthOfTextAtSize(test, fs_pt) > maxW && cur) {
          out.push(cur);
          cur = w;
        } else {
          cur = test;
        }
      }
      if (cur) out.push(cur);
      return out;
    }

    let page = pdfDoc.addPage([pageW, pageH]);
    let y    = pageH - topPts - fs_pt;

    function nextPage() {
      page = pdfDoc.addPage([pageW, pageH]);
      y    = pageH - topPts - fs_pt;
    }

    for (const para of text.split(/\n\n+/)) {
      for (const rawLine of para.split("\n")) {
        const line = rawLine.trim();
        if (!line) { y -= lineH * 0.5; if (y < bottomPts + lineH) nextPage(); continue; }
        for (const wl of wrapLine(line, textWidth)) {
          if (y < bottomPts + lineH) nextPage();
          page.drawText(wl, { x: gutterPts, y, size: fs_pt, font, color: rgb(0, 0, 0) });
          y -= lineH;
        }
      }
      y -= lineH * 0.4;
      if (y < bottomPts + lineH) nextPage();
    }

    const outputFilename = `${id}-kdp-print.pdf`;
    const pdfBytes = await pdfDoc.save();
    const { writeOutput } = await import("@/lib/storage");
    await writeOutput(id, outputFilename, Buffer.from(pdfBytes));

    await updateMeta(id, {
      convertStatus: "done",
      outputFilename,
      trimSize,
      withBleed,
      fontSize,
    });

    return NextResponse.json({
      success: true,
      id,
      status: "done",
      outputFilename,
      pageCount: pdfDoc.getPageCount(),
      wordCount,
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
