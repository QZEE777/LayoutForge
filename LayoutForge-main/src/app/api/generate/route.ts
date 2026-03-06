import { NextRequest, NextResponse } from "next/server";
import { getStored, readStoredFile } from "@/lib/storage";
import { getTrimSize, type TrimSizeId } from "@/lib/kdpSpecs";

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
        { error: "Not found", message: "File not found or expired. Please upload again." },
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
        { error: "Unsupported format", message: "Please upload a DOCX or PDF file." },
        { status: 400 }
      );
    }

    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    console.log("[generate] API key present:", !!apiKey, "| file:", id, "| mime:", mimeType);

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Service not configured",
          message: "The conversion service is not configured. Please contact support.",
        },
        { status: 503 }
      );
    }

    // Read the uploaded file
    const buffer = await readStoredFile(id);
    if (!buffer) {
      return NextResponse.json(
        { error: "Read failed", message: "Could not read uploaded file. Please upload again." },
        { status: 404 }
      );
    }

    // Determine filename for CloudConvert
    let inputFilename = meta.originalName || "document";
    if (isDocx && !inputFilename.toLowerCase().endsWith(".docx")) inputFilename += ".docx";
    if (isPdf  && !inputFilename.toLowerCase().endsWith(".pdf"))  inputFilename += ".pdf";
    if (isEpub && !inputFilename.toLowerCase().endsWith(".epub")) inputFilename += ".epub";

    // ----------------------------------------------------------------
    // Step 1: Create CloudConvert job
    // ----------------------------------------------------------------
    console.log("[generate] Creating CloudConvert job for:", inputFilename);

    const jobRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tasks: {
          "upload-file": {
            operation: "import/upload",
          },
          "convert-to-pdf": {
            operation: "convert",
            input: "upload-file",
            output_format: "pdf",
            engine: "libreoffice",
          },
          "export-pdf": {
            operation: "export/url",
            input: "convert-to-pdf",
          },
        },
      }),
    });

    if (!jobRes.ok) {
      const errText = await jobRes.text();
      console.error("[generate] Job creation failed:", jobRes.status, errText.substring(0, 300));
      return NextResponse.json(
        { error: "Conversion error", message: `Could not start conversion (${jobRes.status}). Check your API key.` },
        { status: 502 }
      );
    }

    const jobData = await jobRes.json();
    console.log("[generate] Job created:", jobData?.data?.id, "| tasks:", jobData?.data?.tasks?.length);

    const jobId: string = jobData.data?.id;
    const tasks: Array<Record<string, unknown>> = jobData.data?.tasks ?? [];

    // ----------------------------------------------------------------
    // Step 2: Find the upload task and get the presigned form URL
    // ----------------------------------------------------------------
    const uploadTask = tasks.find((t) => t.operation === "import/upload");
    console.log("[generate] Upload task found:", !!uploadTask, "| has form:", !!(uploadTask?.result as Record<string,unknown>)?.form);

    const form = (uploadTask?.result as Record<string,unknown>)?.form as {
      url: string;
      parameters: Record<string, string>;
    } | undefined;

    if (!form?.url) {
      console.error("[generate] No upload form URL. Task:", JSON.stringify(uploadTask).substring(0, 400));
      return NextResponse.json(
        { error: "Conversion error", message: "Could not get upload URL from CloudConvert." },
        { status: 502 }
      );
    }

    // ----------------------------------------------------------------
    // Step 3: Upload file to CloudConvert
    // ----------------------------------------------------------------
    console.log("[generate] Uploading", buffer.length, "bytes to CloudConvert...");

    const uploadForm = new FormData();
    for (const [key, val] of Object.entries(form.parameters)) {
      uploadForm.append(key, val);
    }
    // File MUST be appended last for S3 presigned POST
    uploadForm.append(
      "file",
      new Blob([buffer], { type: "application/octet-stream" }),
      inputFilename
    );

    const uploadRes = await fetch(form.url, {
      method: "POST",
      body: uploadForm,
    });

    console.log("[generate] Upload response status:", uploadRes.status);

    if (!uploadRes.ok && uploadRes.status !== 204) {
      const body = await uploadRes.text().catch(() => "");
      console.error("[generate] Upload failed:", uploadRes.status, body.substring(0, 300));
      return NextResponse.json(
        { error: "Upload failed", message: `File upload to conversion service failed (${uploadRes.status}).` },
        { status: 502 }
      );
    }

    // ----------------------------------------------------------------
    // Return jobId to client — client polls /api/generate/status
    // ----------------------------------------------------------------
    console.log("[generate] Job started successfully. jobId:", jobId);

    return NextResponse.json({
      success: true,
      id,
      jobId,
      status: "processing",
      message: "Conversion started.",
    });

  } catch (e) {
    console.error("[generate] Unexpected error:", e);
    return NextResponse.json(
      {
        error: "Internal error",
        message: `Generation failed: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    );
  }
}
