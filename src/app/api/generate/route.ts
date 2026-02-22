import { NextRequest, NextResponse } from "next/server";
import { getStored, readStoredFile, writeOutput } from "@/lib/storage";
import {
  getTrimSize,
  estimatePageCount,
  type TrimSizeId,
} from "@/lib/kdpSpecs";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

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
    const tmpDir = os.tmpdir();
    const inputFile = path.join(tmpDir, `${id}-input.docx`);
    const htmlFile = path.join(tmpDir, `${id}-output.html`);
    const outputFilename = `${id}-kdp-print.pdf`;

    fs.writeFileSync(inputFile, buffer);

    let wordCount = 0;
    let pageCount = 100;

    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // Convert docx to pdf using LibreOffice headless
      await execAsync(`"C:\\Program Files\\LibreOffice\\program\\soffice.exe" --headless --convert-to pdf --outdir "${tmpDir}" "${inputFile}"`);
      const generatedPdfFile = path.join(tmpDir, `${id}-input.pdf`);
      const outputPdfFile = path.join(tmpDir, outputFilename);
      fs.renameSync(generatedPdfFile, outputPdfFile);
      const pdfBuffer = fs.readFileSync(outputPdfFile);
      await writeOutput(id, outputFilename, pdfBuffer);

      // Extract text for word count
      const mammoth = (await import("mammoth")).default;
      const result = await mammoth.convertToHtml({ buffer });
      const html = result.value || "";
      const textOnly = html.replace(/<[^>]+>/g, " ");
      wordCount = textOnly.split(/\s+/).filter((w) => w.length > 0).length;
      pageCount = estimatePageCount(wordCount, trimSize as TrimSizeId, fontSize);

    } else if (mimeType === "application/pdf") {
      await writeOutput(id, outputFilename, buffer);
    } else {
      return NextResponse.json(
        { error: "Unsupported format", message: "Only .docx and .pdf are supported." },
        { status: 400 }
      );
    }

    try { fs.unlinkSync(inputFile); } catch {}
    try { fs.unlinkSync(htmlFile); } catch {}

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
      { error: "Internal error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

