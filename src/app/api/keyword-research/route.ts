import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPdfBuffer } from "@/lib/pdfText";

const MAX_WORDS = 1000;
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

/** DOCX-only: use mammoth. Do not use for PDF. */
async function docxText(buffer: Buffer): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const r = await mammoth.convertToHtml({ buffer });
  return ((r.value as string) || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function firstNWords(text: string, n: number): string {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  return words.slice(0, n).join(" ");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData().catch(() => null);
    if (!formData) return NextResponse.json({ error: "Invalid request", message: "Could not read upload." }, { status: 400 });
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) return NextResponse.json({ error: "No file", message: "Send a file with field name file." }, { status: 400 });
    const f = file as File;
    const name = (f.name || "").toLowerCase();
    const isDocx = name.endsWith(".docx") || f.type.includes("wordprocessingml");
    const isPdf = name.endsWith(".pdf") || f.type === "application/pdf";
    if (!isDocx && !isPdf) return NextResponse.json({ error: "Unsupported format", message: "Only .docx or .pdf files are allowed." }, { status: 400 });
    const buffer = Buffer.from(await f.arrayBuffer());
    const text = isDocx ? await docxText(buffer) : await extractTextFromPdfBuffer(buffer);
    if (!text || text.length < 100) return NextResponse.json({ error: "Too little text", message: "Could not extract enough text." }, { status: 400 });
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log("keyword-research: ANTHROPIC_API_KEY length:", apiKey?.length ?? 0);
    if (!apiKey) return NextResponse.json({ error: "Not configured", message: "ANTHROPIC_API_KEY is not set." }, { status: 503 });
    const excerpt = firstNWords(text, MAX_WORDS);
    const userPrompt = "From this manuscript excerpt, suggest exactly 7 keyword phrases for Amazon KDP book search. Return only a JSON object with one key: \"keywords\" (array of exactly 7 strings). No other text.\n\nExcerpt:\n\n" + excerpt;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 1024, messages: [{ role: "user", content: [{ type: "text", text: userPrompt }] }], system: "You output only valid JSON. No markdown or extra text." }),
    });
    console.log("keyword-research: Anthropic response status:", res.status);
    if (!res.ok) {
      const errText = await res.text();
      console.log("keyword-research: Anthropic error response (full text):", errText);
      let msg = "Keyword generation failed. Check your API key and credits.";
      if (res.status === 401) msg = "Invalid API key. Update ANTHROPIC_API_KEY in Vercel (or .env.local) and redeploy.";
      else if (res.status === 403) msg = "Access denied. Check your API key has access to the Messages API.";
      else if (res.status === 429) msg = "Rate limited or out of credits. Add credits at platform.claude.com or try again later.";
      else {
        try {
          const errJson = JSON.parse(errText) as { error?: { message?: string } };
          const raw = errJson?.error?.message;
          if (raw && !/claude-\d|model\s*:/i.test(raw)) msg = raw;
        } catch { /* ignore */ }
      }
      return NextResponse.json({ error: "AI service error", message: msg }, { status: 502 });
    }
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const rawText = data?.content?.find((c) => c.type === "text")?.text?.trim() || "";
    let parsed: { keywords?: string[] };
    try {
      const jsonStr = rawText.replace(/^```json\s*|\s*```$/g, "").trim();
      parsed = JSON.parse(jsonStr) as { keywords?: string[] };
    } catch {
      return NextResponse.json({ error: "Invalid response", message: "AI did not return valid JSON." }, { status: 502 });
    }
    const keywords = Array.isArray(parsed?.keywords) ? parsed.keywords.slice(0, 7) : [];
    return NextResponse.json({ keywords });
  } catch (e) {
    console.error("Keyword research error:", e);
    return NextResponse.json({ error: "Internal error", message: e instanceof Error ? e.message : "Request failed." }, { status: 500 });
  }
}
