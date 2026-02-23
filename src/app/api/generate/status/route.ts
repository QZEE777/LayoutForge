import { NextRequest, NextResponse } from "next/server";
import { getStored, writeOutput, updateMeta } from "@/lib/storage";

/**
 * GET /api/generate/status?id={fileId}
 *
 * Polls CloudConvert for the conversion job status.
 * When the job is done, downloads the converted PDF and stores it.
 * Returns { status: "processing"|"done"|"error", outputFilename? }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing ID", message: "Provide ?id=<fileId>" },
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

    const convertStatus = (meta as Record<string, unknown>).convertStatus as string | undefined;
    const jobId = (meta as Record<string, unknown>).convertJobId as string | undefined;

    // Already completed on a previous poll
    if (convertStatus === "done") {
      const outputFilename = (meta as Record<string, unknown>).outputFilename as string;
      return NextResponse.json({ status: "done", id, outputFilename });
    }

    if (convertStatus === "error") {
      return NextResponse.json({ status: "error", message: "Conversion failed." });
    }

    // Fallback (no API key / sync generation already completed)
    if (!jobId) {
      return NextResponse.json({
        status: convertStatus || "processing",
        id,
      });
    }

    // ----------------------------------------------------------------
    // Check CloudConvert job status
    // ----------------------------------------------------------------
    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ status: "error", message: "API key not configured." });
    }

    const jobRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!jobRes.ok) {
      console.error("CloudConvert status check failed:", jobRes.status);
      return NextResponse.json({ status: "processing" });
    }

    const job = await jobRes.json();
    const jobStatus: string = job.data.status; // "waiting" | "processing" | "finished" | "error"

    if (jobStatus === "error") {
      await updateMeta(id, { convertStatus: "error" });
      return NextResponse.json({ status: "error", message: "Conversion failed on CloudConvert." });
    }

    if (jobStatus !== "finished") {
      return NextResponse.json({ status: "processing" });
    }

    // ----------------------------------------------------------------
    // Job finished — find export task and download the PDF
    // ----------------------------------------------------------------
    const exportTask = job.data.tasks.find(
      (t: { operation: string; status: string }) =>
        t.operation === "export/url" && t.status === "finished"
    );

    if (!exportTask?.result?.files?.[0]?.url) {
      console.error("CloudConvert: no export URL found", JSON.stringify(job.data.tasks));
      return NextResponse.json({ status: "error", message: "Could not retrieve converted file." });
    }

    const downloadUrl: string = exportTask.result.files[0].url;
    const downloadRes = await fetch(downloadUrl);
    if (!downloadRes.ok) {
      return NextResponse.json({ status: "error", message: "Failed to download converted PDF." });
    }

    const pdfBuffer = Buffer.from(await downloadRes.arrayBuffer());
    const outputFilename = `${id}-kdp-print.pdf`;
    await writeOutput(id, outputFilename, pdfBuffer);

    await updateMeta(id, {
      convertStatus: "done",
      outputFilename,
    });

    return NextResponse.json({ status: "done", id, outputFilename });

  } catch (e) {
    console.error("Status route error:", e);
    return NextResponse.json(
      { status: "error", message: `Status check failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 }
    );
  }
}
