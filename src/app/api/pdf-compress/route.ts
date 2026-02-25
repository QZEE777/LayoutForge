import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
 * POST with JSON { email } only. Creates CloudConvert job and returns upload URL + form
 * params so the client can upload the file directly (avoids Vercel body size limit).
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Service not configured", message: "CLOUDCONVERT_API_KEY is not set." }, { status: 503 });

    let email: string;
    try {
      const body = await request.json();
      email = (body?.email as string)?.trim();
    } catch {
      return NextResponse.json({ error: "Invalid request", message: "Send JSON with email." }, { status: 400 });
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Invalid email", message: "Please enter a valid email address." }, { status: 400 });
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Service not configured", message: "Supabase is not configured." }, { status: 503 });
    }

    const id = crypto.randomUUID();

    const jobRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        tasks: {
          "upload-file": { operation: "import/upload" },
          "optimize-pdf": { operation: "optimize", input: "upload-file", input_format: "pdf", profile: "web", filename: "compressed.pdf" },
          "export-pdf": { operation: "export/url", input: "optimize-pdf" },
        },
      }),
    });

    const errText = await jobRes.text();
    if (!jobRes.ok) {
      const ccMsg = parseCloudConvertError(errText);
      const message = ccMsg || (jobRes.status === 401 ? "Invalid CloudConvert API key." : "Could not start compression.");
      console.error("[pdf-compress] Job creation failed:", jobRes.status, errText.substring(0, 500));
      return NextResponse.json({ error: "Compression error", message }, { status: 502 });
    }

    let jobData: { data?: { id?: string; tasks?: Array<Record<string, unknown>> } };
    try {
      jobData = JSON.parse(errText);
    } catch {
      return NextResponse.json({ error: "Compression error", message: "Invalid response from service." }, { status: 502 });
    }

    const jobId: string | undefined = jobData.data?.id;
    const tasks: Array<Record<string, unknown>> = jobData.data?.tasks ?? [];
    const uploadTask = tasks.find((t) => t.operation === "import/upload");
    const form = (uploadTask?.result as Record<string, unknown>)?.form as { url: string; parameters: Record<string, string> } | undefined;

    if (!jobId) return NextResponse.json({ error: "Compression error", message: "No job id from service." }, { status: 502 });
    if (!form?.url) return NextResponse.json({ error: "Compression error", message: "Could not get upload URL." }, { status: 502 });

    const { error: insertError } = await supabase
      .from("email_captures")
      .insert({ email, tool: "pdf-compress" });

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json({ error: "Failed to save email", message: "Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id,
      jobId,
      uploadUrl: form.url,
      formParameters: form.parameters,
      message: "Upload your file to the returned URL, then poll status.",
    });
  } catch (e) {
    console.error("PDF compress error:", e);
    const message = e instanceof Error ? e.message : "Request failed.";
    return NextResponse.json({ error: "Internal error", message }, { status: 500 });
  }
}
