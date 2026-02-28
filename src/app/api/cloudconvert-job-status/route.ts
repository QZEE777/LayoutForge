import { NextRequest, NextResponse } from "next/server";
import { writeOutput, updateMeta } from "@/lib/storage";
import { extractTextFromPDFBuffer, extractTextFromDocxBuffer } from "@/lib/pdfTextExtract";

const MAX_WORDS = 1000;
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const MIN_EXTRACT_CHARS = 200;
const EXTRACTION_ERROR_MESSAGE =
  "Could not extract text from this PDF. If your manuscript is text-based (not a scan), try downloading it from Word/Google Docs as a fresh PDF and uploading again.";

const TOOL_TYPES = ["kdp-formatter-pdf", "keyword-research-pdf", "description-generator-pdf", "epub-maker"] as const;
type ToolType = (typeof TOOL_TYPES)[number];

function firstNWords(text: string, n: number): string {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  return words.slice(0, n).join(" ");
}

async function fetchTextFromUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch text (${res.status}).`);
  return res.text();
}

function normalizeText(text: string): string {
  return (text || "").replace(/\s+/g, " ").trim();
}

function hasEnoughText(normalized: string): boolean {
  return normalized.length >= MIN_EXTRACT_CHARS;
}

async function fetchBufferFromUrl(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch (${res.status}).`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Create a CloudConvert job to convert PDF (from url) to DOCX, poll until done, then fetch DOCX and extract text from word/document.xml.
 */
async function extractTextViaPdfToDocx(
  apiKey: string,
  pdfUrl: string
): Promise<string> {
  const jobRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      tasks: {
        "import-pdf": { operation: "import/url", url: pdfUrl },
        "convert-docx": {
          operation: "convert",
          input: "import-pdf",
          input_format: "pdf",
          output_format: "docx",
          filename: "document.docx",
        },
        "export-docx": { operation: "export/url", input: "convert-docx" },
      },
    }),
  });
  if (!jobRes.ok) {
    const err = await jobRes.text();
    console.error("[cloudconvert-job-status] PDF→DOCX job create failed:", jobRes.status, err.slice(0, 300));
    throw new Error("PDF to DOCX conversion could not be started.");
  }
  const jobData = (await jobRes.json()) as { data?: { id?: string } };
  const docxJobId = jobData.data?.id;
  if (!docxJobId) throw new Error("No job id from CloudConvert.");

  const maxAttempts = 45;
  const pollIntervalMs = 2000;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));
    const statusRes = await fetch(
      `https://api.cloudconvert.com/v2/jobs/${docxJobId}?include=tasks`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!statusRes.ok) continue;
    const statusData = await statusRes.json();
    const status = statusData.data?.status;
    if (status === "error") {
      const failed = statusData.data?.tasks?.find((t: { status: string }) => t.status === "error");
      throw new Error(failed?.message || "PDF to DOCX failed.");
    }
    if (status !== "finished") continue;

    const exportTask = statusData.data?.tasks?.find(
      (t: { operation: string; status: string }) => t.operation === "export/url" && t.status === "finished"
    );
    const docxUrl: string | undefined = exportTask?.result?.files?.[0]?.url;
    if (!docxUrl) throw new Error("DOCX export URL missing.");
    const docxBuffer = await fetchBufferFromUrl(docxUrl);
    return extractTextFromDocxBuffer(docxBuffer);
  }
  throw new Error("PDF to DOCX conversion timed out.");
}

async function runKeywordAi(excerpt: string): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
  const userPrompt =
    "From this manuscript excerpt, suggest exactly 7 keyword phrases for Amazon KDP book search. Return only a JSON object with one key: \"keywords\" (array of exactly 7 strings). No other text.\n\nExcerpt:\n\n" +
    excerpt;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: [{ type: "text", text: userPrompt }] }],
      system: "You output only valid JSON. No markdown or extra text.",
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    let msg = "Keyword generation failed.";
    if (res.status === 401) msg = "Invalid API key.";
    else if (res.status === 429) msg = "Rate limited.";
    else try {
      const j = JSON.parse(errText) as { error?: { message?: string } };
      if (j?.error?.message) msg = j.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const rawText = data?.content?.find((c) => c.type === "text")?.text?.trim() || "";
  const jsonStr = rawText.replace(/^```json\s*|\s*```$/g, "").trim();
  const parsed = JSON.parse(jsonStr) as { keywords?: string[] };
  return Array.isArray(parsed?.keywords) ? parsed.keywords.slice(0, 7) : [];
}

async function runDescriptionAi(excerpt: string): Promise<{
  amazonDescription: string;
  authorBioTemplate: string;
  seoKeywords: string[];
  bisacCategories: Array<{ code: string; explanation: string }>;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
  const systemPrompt =
    "You are an expert in Amazon KDP metadata and book marketing. You output only valid JSON, no markdown or extra text.";
  const userPrompt = `From this manuscript excerpt, produce a JSON object with exactly these keys:

1. "description" (string): A compelling Amazon book description, HTML formatted for KDP (use <p>, <b>, <i>, <br> only). About 200-400 words. Sales-focused, no spoilers.
2. "authorBio" (string): A short author bio template (2-4 sentences) the author can customize with their name and credits.
3. "keywords" (array of strings): Exactly 7 keyword phrases that work well for Amazon search.
4. "bisacCategories" (array of 2 objects): Each object has "code" (e.g. "FIC014000") and "explanation" (one sentence why this BISAC fits the book).

Manuscript excerpt:

${excerpt}

Respond with only the JSON object, no other text.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: [{ type: "text", text: userPrompt }] }],
      system: systemPrompt,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    let msg = `Description generation failed (${res.status}).`;
    try {
      const j = JSON.parse(errText) as { error?: { message?: string } };
      if (j?.error?.message) msg = j.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const rawText = data?.content?.find((c) => c.type === "text")?.text?.trim() || "";
  const jsonStr = rawText.replace(/^```json\s*|\s*```$/g, "").trim();
  const parsed = JSON.parse(jsonStr) as {
    description?: string;
    authorBio?: string;
    keywords?: string[];
    bisacCategories?: Array<{ code: string; explanation: string }>;
  };
  if (
    !parsed?.description ||
    !Array.isArray(parsed.keywords) ||
    !Array.isArray(parsed.bisacCategories)
  ) {
    throw new Error("AI response missing required fields.");
  }
  return {
    amazonDescription: parsed.description,
    authorBioTemplate: parsed.authorBio ?? "",
    seoKeywords: parsed.keywords,
    bisacCategories: parsed.bisacCategories,
  };
}

/**
 * GET ?jobId=xxx&toolType=xxx&id=xxx (id required for kdp-formatter-pdf)
 * Polls CloudConvert; when finished returns download URL (formatter) or AI result (keyword/description).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const toolType = searchParams.get("toolType") as ToolType | null;
    const id = searchParams.get("id");

    if (!jobId) {
      return NextResponse.json({ status: "error", message: "Missing jobId." }, { status: 400 });
    }
    if (!toolType || !TOOL_TYPES.includes(toolType)) {
      return NextResponse.json(
        { status: "error", message: "Missing or invalid toolType." },
        { status: 400 }
      );
    }
    if ((toolType === "kdp-formatter-pdf" || toolType === "epub-maker") && !id) {
      return NextResponse.json(
        { status: "error", message: "id is required for this tool." },
        { status: 400 }
      );
    }

    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { status: "error", message: "API key not configured." },
        { status: 503 }
      );
    }

    const jobRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}?include=tasks`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!jobRes.ok) {
      console.error("[cloudconvert-job-status] Poll failed:", jobRes.status);
      return NextResponse.json({ status: "processing" });
    }

    const job = await jobRes.json();
    const jobStatus: string = job.data?.status ?? "waiting";

    if (jobStatus === "error") {
      const failedTask = job.data?.tasks?.find(
        (t: { status: string; message?: string }) => t.status === "error"
      );
      const msg = failedTask?.message || "Job failed on CloudConvert.";
      return NextResponse.json({ status: "error", message: msg });
    }

    if (jobStatus !== "finished") {
      return NextResponse.json({ status: "processing" });
    }

    const tasks = job.data?.tasks ?? [];

    if (toolType === "kdp-formatter-pdf") {
      const exportTask = tasks.find(
        (t: { operation: string; status: string }) =>
          t.operation === "export/url" && t.status === "finished"
      );
      const fileUrl: string | undefined = exportTask?.result?.files?.[0]?.url;
      if (!fileUrl) {
        return NextResponse.json({
          status: "error",
          message: "Conversion finished but file URL is missing.",
        });
      }
      const dlRes = await fetch(fileUrl);
      if (!dlRes.ok) {
        return NextResponse.json({
          status: "error",
          message: `Failed to download converted PDF (${dlRes.status}).`,
        });
      }
      const pdfBuffer = Buffer.from(await dlRes.arrayBuffer());
      const outputFilename = "kdp-print.pdf";
      await writeOutput(id!, outputFilename, pdfBuffer);
      return NextResponse.json({
        status: "done",
        id,
        downloadUrl: `/api/download/${id}/${outputFilename}`,
      });
    }

    if (toolType === "epub-maker") {
      const exportTask = tasks.find(
        (t: { operation: string; status: string }) =>
          t.operation === "export/url" && t.status === "finished"
      );
      const fileUrl: string | undefined = exportTask?.result?.files?.[0]?.url;
      if (!fileUrl) {
        return NextResponse.json({
          status: "error",
          message: "Conversion finished but EPUB URL is missing.",
        });
      }
      const dlRes = await fetch(fileUrl);
      if (!dlRes.ok) {
        return NextResponse.json({
          status: "error",
          message: `Failed to download converted EPUB (${dlRes.status}).`,
        });
      }
      const epubBuffer = Buffer.from(await dlRes.arrayBuffer());
      const outputFilename = "book.epub";
      await writeOutput(id!, outputFilename, epubBuffer);
      await updateMeta(id!, {
        outputFilename,
        processingReport: {
          outputType: "epub",
          chaptersDetected: 0,
          issues: [],
          fontUsed: "",
          trimSize: "",
        },
      });
      return NextResponse.json({
        status: "done",
        id,
        downloadUrl: `/api/download/${id}/${outputFilename}`,
      });
    }

    if (toolType === "keyword-research-pdf" || toolType === "description-generator-pdf") {
      const exportTask = tasks.find(
        (t: { operation: string; status: string }) =>
          t.operation === "export/url" && t.status === "finished"
      );
      const txtFileUrl: string | undefined = exportTask?.result?.files?.[0]?.url;
      if (!txtFileUrl) {
        return NextResponse.json({
          status: "error",
          message: "Conversion finished but text file URL is missing.",
        });
      }

      let normalized = normalizeText(await fetchTextFromUrl(txtFileUrl));
      const uploadTask = tasks.find(
        (t: { operation: string; status: string }) => t.operation === "import/upload" && t.status === "finished"
      );
      const pdfUrl: string | undefined = uploadTask?.result?.files?.[0]?.url;

      if (!hasEnoughText(normalized) && pdfUrl) {
        try {
          const pdfBuffer = await fetchBufferFromUrl(pdfUrl);
          const pdfText = await extractTextFromPDFBuffer(pdfBuffer);
          normalized = normalizeText(pdfText);
        } catch (e) {
          console.warn("[cloudconvert-job-status] pdf-parse fallback failed:", e);
        }
      }

      if (!hasEnoughText(normalized) && apiKey && pdfUrl) {
        try {
          const docxText = await extractTextViaPdfToDocx(apiKey, pdfUrl);
          normalized = normalizeText(docxText);
        } catch (e) {
          console.warn("[cloudconvert-job-status] PDF→DOCX fallback failed:", e);
        }
      }

      if (!hasEnoughText(normalized)) {
        return NextResponse.json({
          status: "error",
          message: EXTRACTION_ERROR_MESSAGE,
        });
      }

      const excerpt = firstNWords(normalized, MAX_WORDS);

      if (toolType === "keyword-research-pdf") {
        const keywords = await runKeywordAi(excerpt);
        return NextResponse.json({ status: "done", keywords });
      }

      const descriptionResult = await runDescriptionAi(excerpt);
      return NextResponse.json({
        status: "done",
        ...descriptionResult,
      });
    }

    return NextResponse.json({ status: "error", message: "Unsupported toolType." }, { status: 400 });
  } catch (e) {
    console.error("[cloudconvert-job-status] Error:", e);
    const message = e instanceof Error ? e.message : "Status check failed.";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 }
    );
  }
}
