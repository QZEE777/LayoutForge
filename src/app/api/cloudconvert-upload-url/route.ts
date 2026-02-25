import { NextRequest, NextResponse } from "next/server";

const MAX_FILESIZE_BYTES = 50 * 1024 * 1024; // 50MB

const TOOL_TYPES = ["kdp-formatter-pdf", "keyword-research-pdf", "description-generator-pdf"] as const;
type ToolType = (typeof TOOL_TYPES)[number];

function parseCloudConvertError(body: string): string {
  try {
    const j = JSON.parse(body) as { message?: string; errors?: Array<{ message?: string }> };
    if (j?.message) return j.message;
    if (Array.isArray(j?.errors) && j.errors[0]?.message) return j.errors[0].message;
  } catch {
    /* ignore */
  }
  return "";
}

/**
 * POST { filename, filesize, toolType }.
 * Returns signed CloudConvert upload URL so the client can upload the file directly (bypasses Vercel body limit).
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Service not configured", message: "CLOUDCONVERT_API_KEY is not set." },
        { status: 503 }
      );
    }

    let body: { filename?: string; filesize?: number; toolType?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request", message: "Send JSON with filename, filesize, and toolType." },
        { status: 400 }
      );
    }

    const filename = typeof body.filename === "string" ? body.filename.trim() : "";
    const filesize = typeof body.filesize === "number" ? body.filesize : 0;
    const toolType = body.toolType as string | undefined;

    if (!filename || !toolType || !TOOL_TYPES.includes(toolType as ToolType)) {
      return NextResponse.json(
        { error: "Invalid request", message: "filename and toolType (kdp-formatter-pdf | keyword-research-pdf | description-generator-pdf) required." },
        { status: 400 }
      );
    }

    if (filesize <= 0 || filesize > MAX_FILESIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large", message: "File must be between 1 byte and 50MB." },
        { status: 400 }
      );
    }

    const inputFilename = filename.toLowerCase().endsWith(".pdf") ? filename : "document.pdf";

    let tasks: Record<string, Record<string, unknown>>;

    if (toolType === "kdp-formatter-pdf") {
      tasks = {
        "upload-file": { operation: "import/upload" },
        "optimize-pdf": {
          operation: "optimize",
          input: "upload-file",
          input_format: "pdf",
          profile: "print",
          filename: "kdp-formatted.pdf",
        },
        "export-pdf": { operation: "export/url", input: "optimize-pdf" },
      };
    } else if (toolType === "keyword-research-pdf" || toolType === "description-generator-pdf") {
      tasks = {
        "upload-file": { operation: "import/upload" },
        "convert-txt": {
          operation: "convert",
          input: "upload-file",
          input_format: "pdf",
          output_format: "txt",
          filename: "extract.txt",
        },
        "export-txt": { operation: "export/url", input: "convert-txt" },
      };
    } else {
      return NextResponse.json(
        { error: "Invalid toolType", message: "Unsupported toolType." },
        { status: 400 }
      );
    }

    const jobRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ tasks }),
    });

    const errText = await jobRes.text();
    if (!jobRes.ok) {
      const ccMsg = parseCloudConvertError(errText);
      const message =
        ccMsg ||
        (jobRes.status === 401 ? "Invalid CloudConvert API key." : "Could not start job.");
      console.error("[cloudconvert-upload-url] Job creation failed:", jobRes.status, errText.substring(0, 500));
      return NextResponse.json({ error: "Conversion error", message }, { status: 502 });
    }

    let jobData: { data?: { id?: string; tasks?: Array<Record<string, unknown>> } };
    try {
      jobData = JSON.parse(errText);
    } catch {
      return NextResponse.json(
        { error: "Conversion error", message: "Invalid response from conversion service." },
        { status: 502 }
      );
    }

    const jobId = jobData.data?.id;
    const taskList = jobData.data?.tasks ?? [];
    const uploadTask = taskList.find((t) => t.operation === "import/upload");
    const form = (uploadTask?.result as Record<string, unknown>)?.form as
      | { url: string; parameters: Record<string, string> }
      | undefined;

    if (!jobId) {
      return NextResponse.json(
        { error: "Conversion error", message: "No job id from conversion service." },
        { status: 502 }
      );
    }
    if (!form?.url) {
      return NextResponse.json(
        { error: "Conversion error", message: "Could not get upload URL from CloudConvert." },
        { status: 502 }
      );
    }

    const response: {
      uploadUrl: string;
      jobId: string;
      formData: Record<string, string>;
      id?: string;
    } = {
      uploadUrl: form.url,
      jobId,
      formData: form.parameters ?? {},
    };

    // KDP Formatter needs an id for the download page (we save result to out/{id}/kdp-print.pdf)
    if (toolType === "kdp-formatter-pdf") {
      response.id = crypto.randomUUID();
    }

    return NextResponse.json(response);
  } catch (e) {
    console.error("[cloudconvert-upload-url] Error:", e);
    const message = e instanceof Error ? e.message : "Request failed.";
    return NextResponse.json({ error: "Internal error", message }, { status: 500 });
  }
}
