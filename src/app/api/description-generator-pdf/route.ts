import { NextRequest, NextResponse } from "next/server";
import { getDocumentProxy, extractText } from "unpdf";

const MAX_WORDS = 1000;
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

function firstNWords(text: string, n: number): string {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  return words.slice(0, n).join(" ");
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Not configured", message: "ANTHROPIC_API_KEY is not set." }, { status: 503 });

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
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    const raw = (text || "").replace(/\s+/g, " ").trim();
    if (!raw || raw.length < 100) return NextResponse.json({ error: "Too little text", message: "Could not extract enough text from the PDF. Use a text-based PDF (not a scan)." }, { status: 400 });
    const excerpt = firstNWords(raw, MAX_WORDS);

    const systemPrompt = "You are an expert in Amazon KDP metadata and book marketing. You output only valid JSON, no markdown or extra text.";
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
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 4096, messages: [{ role: "user", content: [{ type: "text", text: userPrompt }] }], system: systemPrompt }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = `Description generation failed (${res.status}).`;
      try { const j = JSON.parse(errText) as { error?: { message?: string } }; if (j?.error?.message) msg = j.error.message; } catch { /* ignore */ }
      return NextResponse.json({ error: "AI service error", message: msg }, { status: 502 });
    }

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const rawText = data?.content?.find((c) => c.type === "text")?.text?.trim() || "";
    let parsed: { description?: string; authorBio?: string; keywords?: string[]; bisacCategories?: Array<{ code: string; explanation: string }> };
    try {
      const jsonStr = rawText.replace(/^```json\s*|\s*```$/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ error: "Invalid response", message: "AI did not return valid JSON." }, { status: 502 });
    }

    if (!parsed?.description || !Array.isArray(parsed.keywords) || !Array.isArray(parsed.bisacCategories)) {
      return NextResponse.json({ error: "Incomplete response", message: "AI response missing required fields." }, { status: 502 });
    }

    return NextResponse.json({
      amazonDescription: parsed.description,
      authorBioTemplate: parsed.authorBio ?? "",
      seoKeywords: parsed.keywords,
      bisacCategories: parsed.bisacCategories,
    });
  } catch (e) {
    console.error("Description generator PDF error:", e);
    return NextResponse.json({ error: "Internal error", message: e instanceof Error ? e.message : "Request failed." }, { status: 500 });
  }
}
