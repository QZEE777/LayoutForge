import { NextRequest, NextResponse } from "next/server";

const ALLOWED_MIMES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/pdf",
] as const;
const MAX_WORDS = 3000;
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

export interface DescriptionGeneratorResult {
  amazonDescription: string;
  authorBioTemplate: string;
  seoKeywords: string[];
  bisacCategories: Array<{ code: string; explanation: string }>;
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value || "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstNWords(text: string, n: number): string {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  return words.slice(0, n).join(" ");
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Not configured", message: "ANTHROPIC_API_KEY is not set." },
        { status: 503 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid request", message: "Could not read upload. Use a file under 50MB." },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No file", message: "Send a file with field name 'file'." },
        { status: 400 }
      );
    }

    const f = file as File;
    const mime = f.type;
    const name = (f.name || "").toLowerCase();
    const isDocx = mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || name.endsWith(".docx");
    const isPdf = mime === "application/pdf" || name.endsWith(".pdf");
    if (!isDocx && !isPdf) {
      return NextResponse.json(
        { error: "Unsupported format", message: "Only .docx and .pdf are allowed. Make sure the file name ends with .docx or .pdf." },
        { status: 400 }
      );
    }
    if (isPdf) {
      return NextResponse.json(
        { error: "PDF not supported", message: "PDF upload is not supported yet. Please convert your PDF to .docx and try again." },
        { status: 400 }
      );
    }

    const arrayBuffer = await f.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const text = await extractTextFromDocx(buffer);

    if (!text || text.length < 100) {
      return NextResponse.json(
        { error: "Too little text", message: "Could not extract enough text from the file. Try a .docx file, or a PDF with selectable text (not a scan or image-only PDF)." },
        { status: 400 }
      );
    }

    const excerpt = firstNWords(text, MAX_WORDS);

    const systemPrompt = `You are an expert in Amazon KDP metadata and book marketing. You output only valid JSON, no markdown or extra text.`;
    const userPrompt = `From this manuscript excerpt, produce a JSON object with exactly these keys:

1. "amazonDescription" (string): A compelling Amazon book description, HTML formatted for KDP (use <p>, <b>, <i>, <br> only). About 200-400 words. Sales-focused, no spoilers.
2. "authorBioTemplate" (string): A short author bio template (2-4 sentences) the author can customize with their name and credits.
3. "seoKeywords" (array of strings): Exactly 7 keyword phrases that work well for Amazon search (e.g. "historical fiction world war two").
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
      console.error("Anthropic API error:", res.status, errText.slice(0, 500));
      let userMessage = `Description generation failed (${res.status}).`;
      try {
        const errJson = JSON.parse(errText) as { error?: { message?: string; type?: string } };
        if (errJson?.error?.message) userMessage = errJson.error.message;
      } catch {
        /* use default */
      }
      return NextResponse.json(
        { error: "AI service error", message: userMessage },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const textBlock = data?.content?.find((c) => c.type === "text");
    const rawText = textBlock?.text?.trim() || "";

    let parsed: DescriptionGeneratorResult;
    try {
      const jsonStr = rawText.replace(/^```json\s*|\s*```$/g, "").trim();
      parsed = JSON.parse(jsonStr) as DescriptionGeneratorResult;
    } catch {
      console.error("Failed to parse Claude response as JSON:", rawText.slice(0, 200));
      return NextResponse.json(
        { error: "Invalid response", message: "AI did not return valid JSON." },
        { status: 502 }
      );
    }

    if (!parsed.amazonDescription || !Array.isArray(parsed.seoKeywords) || !Array.isArray(parsed.bisacCategories)) {
      return NextResponse.json(
        { error: "Incomplete response", message: "AI response missing required fields." },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (e) {
    console.error("Description generator error:", e);
    return NextResponse.json(
      { error: "Internal error", message: e instanceof Error ? e.message : "Request failed." },
      { status: 500 }
    );
  }
}
