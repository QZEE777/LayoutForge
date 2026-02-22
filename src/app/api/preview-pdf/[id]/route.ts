import { NextRequest, NextResponse } from "next/server";
import { getStored, readStoredFile } from "@/lib/storage";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Missing ID" },
        { status: 400 }
      );
    }

    const meta = await getStored(id);
    if (!meta) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    const buffer = await readStoredFile(id);
    if (!buffer) {
      return NextResponse.json(
        { error: "Read failed" },
        { status: 404 }
      );
    }

    const mimeType = meta.mimeType || "";
    const tmpDir = os.tmpdir();
    const previewId = `preview-${id}`;
    const inputFile = path.join(tmpDir, `${previewId}-input.docx`);
    const pdfFile = path.join(tmpDir, `${previewId}.pdf`);
    const pngDir = path.join(tmpDir, previewId);

    if (!fs.existsSync(pngDir)) {
      fs.mkdirSync(pngDir, { recursive: true });
    }

    fs.writeFileSync(inputFile, buffer);

    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      console.log(`[PREVIEW] Converting DOCX to PDF for ${id}`);
      await execAsync(`"C:\\Program Files\\LibreOffice\\program\\soffice.exe" --headless --convert-to pdf --outdir "${tmpDir}" "${inputFile}"`);
      const generatedPdfFile = path.join(tmpDir, `${previewId}-input.pdf`);
      fs.renameSync(generatedPdfFile, pdfFile);

      console.log(`[PREVIEW] Converting PDF to PNG for ${id}`);
      await execAsync(`"C:\\Program Files\\LibreOffice\\program\\soffice.exe" --headless --convert-to png --outdir "${pngDir}" "${pdfFile}"`);

      const files = fs.readdirSync(pngDir).filter(f => f.endsWith('.png')).sort();
      const images = files.slice(0, 3).map(file => {
        const filePath = path.join(pngDir, file);
        const data = fs.readFileSync(filePath);
        return {
          page: files.indexOf(file) + 1,
          base64: `data:image/png;base64,${data.toString('base64')}`
        };
      });

      try { fs.unlinkSync(inputFile); } catch {}
      try { fs.unlinkSync(pdfFile); } catch {}

      return NextResponse.json({
        success: true,
        id,
        images,
        pageCount: files.length
      });

    } else if (mimeType === "application/pdf") {
      console.log(`[PREVIEW] Converting PDF to PNG for ${id}`);
      await execAsync(`"C:\\Program Files\\LibreOffice\\program\\soffice.exe" --headless --convert-to png --outdir "${pngDir}" "${inputFile}"`);

      const files = fs.readdirSync(pngDir).filter(f => f.endsWith('.png')).sort();
      const images = files.slice(0, 3).map(file => {
        const filePath = path.join(pngDir, file);
        const data = fs.readFileSync(filePath);
        return {
          page: files.indexOf(file) + 1,
          base64: `data:image/png;base64,${data.toString('base64')}`
        };
      });

      try { fs.unlinkSync(inputFile); } catch {}

      return NextResponse.json({
        success: true,
        id,
        images,
        pageCount: files.length
      });
    }

    return NextResponse.json(
      { error: "Unsupported format" },
      { status: 400 }
    );

  } catch (e: any) {
    console.error("[PREVIEW] Error:", e?.message || e);
    return NextResponse.json(
      { error: "Preview generation failed", message: e?.message },
      { status: 500 }
    );
  }
}
