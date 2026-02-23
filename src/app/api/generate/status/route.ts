import { NextRequest, NextResponse } from "next/server";
import { writeOutput } from "@/lib/storage";

/**
 * GET /api/generate/status?id={fileId}&jobId={cloudConvertJobId}
 *
 * Polls CloudConvert for job status.
 * jobId is passed by the client (returned from POST /api/generate)
 * so this route does NOT depend on reading /tmp across containers.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id    = searchParams.get("id");
    const jobId = searchParams.get("jobId");

    if (!id || !jobId) {
      return NextResponse.json(
        { status: "error", message: "Missing id or jobId parameters." },
        { status: 400 }
      );
    }

    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { status: "error", message: "API key not configured on server." },
        { status: 503 }
      );
    }

    // Poll CloudConvert for job status
    const jobRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}?include=tasks`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!jobRes.ok) {
      console.error("[status] CloudConvert poll failed:", jobRes.status);
      return NextResponse.json({ status: "processing" });
    }

    const job = await jobRes.json();
    const jobStatus: string = job.data?.status ?? "waiting";

    console.log("[status] jobId:", jobId, "| status:", jobStatus);

    if (jobStatus === "error") {
      const failedTask = job.data?.tasks?.find(
        (t: { status: string; message?: string }) => t.status === "error"
      );
      const msg = failedTask?.message || "Conversion failed on CloudConvert.";
      return NextResponse.json({ status: "error", message: msg });
    }

    if (jobStatus !== "finished") {
      return NextResponse.json({ status: "processing" });
    }

    // Job finished — find the export URL
    const exportTask = job.data?.tasks?.find(
      (t: { operation: string; status: string }) =>
        t.operation === "export/url" && t.status === "finished"
    );

    const fileUrl: string | undefined = exportTask?.result?.files?.[0]?.url;
    if (!fileUrl) {
      console.error("[status] No export URL. Tasks:", JSON.stringify(job.data?.tasks).substring(0, 500));
      return NextResponse.json(
        { status: "error", message: "Conversion finished but file URL is missing." }
      );
    }

    // Download the converted PDF
    console.log("[status] Downloading converted PDF from CloudConvert...");
    const dlRes = await fetch(fileUrl);
    if (!dlRes.ok) {
      console.error("[status] PDF download failed:", dlRes.status);
      return NextResponse.json(
        { status: "error", message: `Failed to download converted PDF (${dlRes.status}).` }
      );
    }

    const pdfBuffer = Buffer.from(await dlRes.arrayBuffer());
    const outputFilename = `${id}-kdp-print.pdf`;
    await writeOutput(id, outputFilename, pdfBuffer);
    console.log("[status] PDF saved. Size:", pdfBuffer.length, "bytes");

    return NextResponse.json({ status: "done", id, outputFilename });

  } catch (e) {
    console.error("[status] Error:", e);
    return NextResponse.json(
      { status: "error", message: `Status check failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 }
    );
  }
}
