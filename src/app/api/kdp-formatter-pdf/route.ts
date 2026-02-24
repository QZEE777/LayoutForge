import { NextRequest, NextResponse } from "next/server";
import { saveUpload } from "@/lib/storage";

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

    let id: string;
    try {
      const stored = await saveUpload(buffer, inputFilename, "application/pdf");
      id = stored.id;
    } catch (storageErr) {
      console.error("[kdp-formatter-pdf] saveUpload failed:", storageErr);
      const msg = storageErr instanceof Error ? storageErr.message : "Storage failed.";
      return NextResponse.json({ error: "Storage error", message: msg }, { status: 500 });
    }

    const jobRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        tasks: {
          "upload-file": { operation: "import/upload" },
          "convert-to-pdf": { operation: "convert", input: "upload-file", input_format: "pdf", output_format: "pdf" },
          "export-pdf": { operation: "export/url", input: "convert-to-pdf" },
        },
      }),
    });

    const errText = await jobRes.text();
    if (!jobRes.ok) {
      const ccMsg = parseCloudConvertError(errText);
      const message = ccMsg || (jobRes.status === 401 ? "Invalid CloudConvert API key." : "Could not start conversion. Check CLOUDCONVERT_API_KEY.");
      console.error("[kdp-formatter-pdf] Job creation failed:", jobRes.status, errText.substring(0, 500));
      return NextResponse.json({ error: "Conversion error", message }, { status: 502 });
    }

    let jobData: { data?: { id?: string; tasks?: Array<Record<string, unknown>> } };
    try {
      jobData = JSON.parse(errText);
    } catch {
      return NextResponse.json({ error: "Conversion error", message: "Invalid response from conversion service." }, { status: 502 });
    }

    const jobId: string | undefined = jobData.data?.id;
    const tasks: Array<Record<string, unknown>> = jobData.data?.tasks ?? [];
    const uploadTask = tasks.find((t) => t.operation === "import/upload");
    const form = (uploadTask?.result as Record<string, unknown>)?.form as { url: string; parameters: Record<string, string> } | undefined;

    if (!jobId) return NextResponse.json({ error: "Conversion error", message: "No job id from conversion service." }, { status: 502 });
    if (!form?.url) return NextResponse.json({ error: "Conversion error", message: "Could not get upload URL from CloudConvert." }, { status: 502 });

    const uploadForm = new FormData();
    for (const [key, val] of Object.entries(form.parameters)) uploadForm.append(key, val);
    uploadForm.append("file", new Blob([buffer], { type: "application/pdf" }), inputFilename);

    const uploadRes = await fetch(form.url, { method: "POST", body: uploadForm });
    if (!uploadRes.ok && uploadRes.status !== 204) {
      const uploadErr = await uploadRes.text();
      console.error("[kdp-formatter-pdf] Upload to CloudConvert failed:", uploadRes.status, uploadErr?.substring(0, 200));
      return NextResponse.json({ error: "Upload failed", message: `File upload to conversion service failed (${uploadRes.status}).` }, { status: 502 });
    }

    return NextResponse.json({ success: true, id, jobId, status: "processing", message: "Conversion started." });
  } catch (e) {
    console.error("KDP formatter PDF error:", e);
    const message = e instanceof Error ? e.message : "Request failed.";
    return NextResponse.json({ error: "Internal error", message }, { status: 500 });
  }
}
