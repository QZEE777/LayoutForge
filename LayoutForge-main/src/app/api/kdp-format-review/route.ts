import { NextRequest, NextResponse } from "next/server";
import { saveUpload, updateMeta, type StoredManuscript } from "@/lib/storage";
import { getGutterInches } from "@/lib/kdpConfig";
import { estimatePageCount, type TrimSizeId } from "@/lib/kdpSpecs";

const MAX_CHARS = 100_000;
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const result = await mammoth.convertToHtml({ buffer });
  const html = (result.value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return html;
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const { getDocumentProxy, extractText } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return (text || "").replace(/\s+/g, " ").trim();
}

export interface FormatReviewSection {
  title: string;
  issues?: string[];
  recommendations?: string[];
  content?: string;
}

export interface FormatReviewResult {
  sections: FormatReviewSection[];
  summary: string;
  topActions: string[];
  kdpReadiness: string;
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

    let manuscriptText = "";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      const pasted = typeof body.pastedText === "string" ? body.pastedText.trim() : "";
      if (!pasted || pasted.length < 200) {
        return NextResponse.json(
          { error: "Too little text", message: "Paste at least 200 characters of your manuscript." },
          { status: 400 }
        );
      }
      manuscriptText = pasted.slice(0, MAX_CHARS);
    } else {
      const formData = await request.formData().catch(() => null);
      if (!formData) {
        return NextResponse.json(
          { error: "Invalid request", message: "Send pastedText (JSON) or a file (DOCX/PDF)." },
          { status: 400 }
        );
      }
      const file = formData.get("file");
      if (!file || !(file instanceof Blob)) {
        return NextResponse.json(
          { error: "No file", message: "Send a file with field name 'file', or send JSON with pastedText." },
          { status: 400 }
        );
      }
      const f = file as File;
      const name = (f.name || "").toLowerCase();
      const buffer = Buffer.from(await f.arrayBuffer());
      if (name.endsWith(".docx") || f.type?.includes("wordprocessingml")) {
        manuscriptText = await extractTextFromDocx(buffer);
      } else if (name.endsWith(".pdf") || f.type === "application/pdf") {
        manuscriptText = await extractTextFromPdf(buffer);
      } else {
        return NextResponse.json(
          { error: "Unsupported format", message: "Upload DOCX or PDF, or paste text." },
          { status: 400 }
        );
      }
      if (!manuscriptText || manuscriptText.length < 200) {
        return NextResponse.json(
          { error: "Too little text", message: "Could not extract enough text from the file." },
          { status: 400 }
        );
      }
      manuscriptText = manuscriptText.slice(0, MAX_CHARS);
    }

    const wordCount = manuscriptText.split(/\s+/).filter((w) => w.length > 0).length;
    const estimatedPages = estimatePageCount(wordCount, "6x9" as TrimSizeId, 11);
    const recommendedGutterInches = getGutterInches(estimatedPages);

    const systemPrompt = `You are a professional KDP (Kindle Direct Publishing) formatter. Review the manuscript for KDP interior requirements. Output only valid JSON, no markdown or extra text.`;

    const userPrompt = `Review this manuscript excerpt for Amazon KDP interior formatting. Return a JSON object with exactly these keys:

1. "sections" (array of objects). Each object has: "title" (string), "issues" (array of strings, optional), "recommendations" (array of strings, optional), "content" (string, optional brief notes). Use these section titles exactly:
   - "Front matter & back matter"
   - "Margins & gutter"
   - "Paragraphs & indentation"
   - "Spacing"
   - "Headings"
   - "Page breaks"
   - "Lists"
   - "Fonts & typography"
   - "KDP rules & gotchas"

2. "summary" (string): 2-4 sentences overall assessment.

3. "topActions" (array of strings): 3-5 prioritized actions the author should fix first.

4. "kdpReadiness" (string): One short line, e.g. "Close; fix gutter and chapter page breaks" or "Good; minor spacing tweaks recommended."

Manuscript excerpt (first ~${Math.min(25000, manuscriptText.length)} chars):

${manuscriptText.slice(0, 25000)}

Respond with only the JSON object.`;

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
      let msg = `Format review failed (${res.status}).`;
      try {
        const j = JSON.parse(errText) as { error?: { message?: string } };
        if (j?.error?.message) msg = j.error.message;
      } catch {
        /* ignore */
      }
      return NextResponse.json({ error: "AI service error", message: msg }, { status: 502 });
    }

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const textBlock = data?.content?.find((c) => c.type === "text");
    const raw = (textBlock?.text ?? "").replace(/^```json\s*|\s*```$/g, "").trim();

    let parsed: FormatReviewResult;
    try {
      parsed = JSON.parse(raw) as FormatReviewResult;
    } catch {
      console.error("[kdp-format-review] Parse error:", raw.slice(0, 300));
      return NextResponse.json(
        { error: "Invalid response", message: "AI did not return valid JSON." },
        { status: 502 }
      );
    }

    if (!Array.isArray(parsed.sections) || typeof parsed.summary !== "string") {
      return NextResponse.json(
        { error: "Incomplete response", message: "AI response missing required fields." },
        { status: 502 }
      );
    }

    const report = {
      outputType: "format-review" as const,
      chaptersDetected: 0,
      issues: [] as string[],
      fontUsed: "",
      trimSize: "6x9",
      formatReviewSections: parsed.sections,
      summary: parsed.summary,
      topActions: Array.isArray(parsed.topActions) ? parsed.topActions : [],
      kdpReadiness: typeof parsed.kdpReadiness === "string" ? parsed.kdpReadiness : "",
      wordCount,
      estimatedPages,
      recommendedGutterInches,
    };

    const stubBuffer = Buffer.from(manuscriptText.slice(0, 2000), "utf-8");
    const stored = await saveUpload(stubBuffer, "format-review-input.txt", "text/plain");
    await updateMeta(stored.id, {
      processingReport: report as unknown as StoredManuscript["processingReport"],
    });

    return NextResponse.json({ success: true, id: stored.id });
  } catch (e) {
    console.error("[kdp-format-review]", e);
    return NextResponse.json(
      { error: "Internal error", message: e instanceof Error ? e.message : "Request failed." },
      { status: 500 }
    );
  }
}
