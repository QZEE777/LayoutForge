import { NextRequest, NextResponse } from "next/server";
import { writeOutput } from "@/lib/storage";

/**
 * GET /api/pdf-compress/status?id={fileId}&jobId={cloudConvertJobId}
 * Polls CloudConvert for optimize job; on done, downloads and saves as {id}-compressed.pdf.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const jobId = searchParams.get("jobId");

    if (!id || !jobId) {
      return NextResponse.json({ status: "error", message: "Missing id or jobId." }, { status: 400 });
    }

    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ status: "error", message: "API key not configured." }, { status: 503 });
    }

    const jobRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}?include=tasks`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!jobRes.ok) {
      console.error("[pdf-compress/status] CloudConvert poll failed:", jobRes.status);
      return NextResponse.json({ status: "processing" });
    }

    const job = await jobRes.json();
    const jobStatus: string = job.data?.status ?? "waiting";

    if (jobStatus === "error") {
      const failedTask = job.data?.tasks?.find((t: { status: string; message?: string }) => t.status === "error");
      const msg = failedTask?.message || "Compression failed.";
      return NextResponse.json({ status: "error", message: msg });
    }

    if (jobStatus !== "finished") {
      return NextResponse.json({ status: "processing" });
    }

    const exportTask = job.data?.tasks?.find(
      (t: { operation: string; status: string }) => t.operation === "export/url" && t.status === "finished"
    );
    const fileUrl: string | undefined = exportTask?.result?.files?.[0]?.url;
    if (!fileUrl) {
      return NextResponse.json({ status: "error", message: "Compression finished but file URL missing." });
    }

    const dlRes = await fetch(fileUrl);
    if (!dlRes.ok) {
      return NextResponse.json({ status: "error", message: `Failed to download (${dlRes.status}).` });
    }

    const pdfBuffer = Buffer.from(await dlRes.arrayBuffer());
    const outputFilename = `${id}-compressed.pdf`;
    await writeOutput(id, outputFilename, pdfBuffer);

    return NextResponse.json({ status: "done", id, outputFilename });
  } catch (e) {
    console.error("[pdf-compress/status] Error:", e);
    return NextResponse.json(
      { status: "error", message: e instanceof Error ? e.message : "Status check failed." },
      { status: 500 }
    );
  }
}
