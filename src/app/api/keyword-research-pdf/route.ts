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
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Not configured", message: "ANTHROPIC_API_KEY is not set." }, { status: 503 });
    const userPrompt = "From this manuscript excerpt, suggest exactly 7 keyword phrases for Amazon KDP book search. Return only a JSON object with one key: \"keywords\" (array of exactly 7 strings). No other text.\n\nExcerpt:\n\n" + excerpt;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 1024, messages: [{ role: "user", content: [{ type: "text", text: userPrompt }] }], system: "You output only valid JSON. No markdown or extra text." }),
    });
    if (!res.ok) {
      const errText = await res.text();
      let msg = "Keyword generation failed. Check your API key and credits.";
      if (res.status === 401) msg = "Invalid API key.";
      else if (res.status === 429) msg = "Rate limited. Try again later.";
      else try { const j = JSON.parse(errText) as { error?: { message?: string } }; if (j?.error?.message) msg = j.error.message; } catch { /* ignore */ }
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
    console.error("Keyword research PDF error:", e);
    return NextResponse.json({ error: "Internal error", message: e instanceof Error ? e.message : "Request failed." }, { status: 500 });
  }
}
