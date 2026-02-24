import { NextRequest, NextResponse } from "next/server";
import { saveUpload } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Service not configured", message: "CLOUDCONVERT_API_KEY is not set." }, { status: 503 });

    const formData = await request.formData().catch(() => null);
    if (!formData) return NextResponse.json({ error: "Invalid request", message: "Could not read upload." }, { status: 400 });
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) return NextResponse.json({ error: "No file", message: "Send a file with field name file." }, { status: 400 });
    const f = file as File;
    const name = (f.name || "").toLowerCase();
    if (!name.endsWith(".pdf") && f.type !== "application/pdf") {
      return NextResponse.json({ error: "Unsupported format", message: "This tool accepts PDF files only." }, { status: 400 });
    }

    const buffer = Buffer.from(await f.arrayBuffer());
    const inputFilename = name.endsWith(".pdf") ? name : "document.pdf";
    const stored = await saveUpload(buffer, inputFilename, "application/pdf");
    const id = stored.id;

    const jobRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        tasks: {
          "upload-file": { operation: "import/upload" },
          "convert-to-pdf": { operation: "convert", input: "upload-file", output_format: "pdf" },
          "export-pdf": { operation: "export/url", input: "convert-to-pdf" },
        },
      }),
    });

    if (!jobRes.ok) {
      const errText = await jobRes.text();
      console.error("[kdp-formatter-pdf] Job creation failed:", jobRes.status, errText.substring(0, 300));
      return NextResponse.json({ error: "Conversion error", message: "Could not start conversion. Check your API key." }, { status: 502 });
    }

    const jobData = await jobRes.json();
    const jobId: string = jobData.data?.id;
    const tasks: Array<Record<string, unknown>> = jobData.data?.tasks ?? [];
    const uploadTask = tasks.find((t) => t.operation === "import/upload");
    const form = (uploadTask?.result as Record<string, unknown>)?.form as { url: string; parameters: Record<string, string> } | undefined;

    if (!form?.url) return NextResponse.json({ error: "Conversion error", message: "Could not get upload URL from CloudConvert." }, { status: 502 });

    const uploadForm = new FormData();
    for (const [key, val] of Object.entries(form.parameters)) uploadForm.append(key, val);
    uploadForm.append("file", new Blob([buffer], { type: "application/octet-stream" }), inputFilename);

    const uploadRes = await fetch(form.url, { method: "POST", body: uploadForm });
    if (!uploadRes.ok && uploadRes.status !== 204) {
      return NextResponse.json({ error: "Upload failed", message: "File upload to conversion service failed." }, { status: 502 });
    }

    return NextResponse.json({ success: true, id, jobId, status: "processing", message: "Conversion started. Poll /api/generate/status?id=" + id + "&jobId=" + jobId + " then download via /api/download/[id]/[filename]." });
  } catch (e) {
    console.error("KDP formatter PDF error:", e);
    return NextResponse.json({ error: "Internal error", message: e instanceof Error ? e.message : "Request failed." }, { status: 500 });
  }
}
