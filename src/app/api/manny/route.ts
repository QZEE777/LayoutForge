import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CRISP_WEBSITE_ID = process.env.CRISP_WEBSITE_ID ?? "bf52e45d-8fda-489e-92da-395a9d08ae72";
const CRISP_API_IDENTIFIER = process.env.CRISP_API_IDENTIFIER ?? "";
const CRISP_API_KEY = process.env.CRISP_API_KEY ?? "";

const MANNY_SYSTEM_PROMPT = `You are Manny, the KDP expert assistant for manu2print.com.

manu2print.com is a tool that checks PDF manuscripts for Amazon KDP compliance before authors upload them. The main paid product is a KDP PDF Checker ($9, one-time) that finds formatting errors — margin violations, wrong trim size, bleed issues, missing fonts — before Amazon rejects the file.

There are also free tools:
- Royalty Calculator: estimates earnings per sale based on trim size, page count, price, and paper color
- Spine Width Calculator: calculates spine width for cover design
- Cover Size Calculator: calculates full cover dimensions including bleed
- Trim Size Comparison: compares print cost and royalty across KDP trim sizes
- Page Count Estimator: estimates page count from word count, trim size, and font size
- Interior Template Generator: downloads a PDF template with correct margins and safe zones
- Page Number Formatter: adds page numbers to interior PDFs

YOUR ROLE:
- Answer KDP formatting and self-publishing questions with accuracy and confidence
- Guide authors toward the paid PDF checker when relevant (but don't be pushy)
- Keep answers concise — 2 to 4 short paragraphs maximum
- Use plain English, no jargon unless explained
- Be warm, direct, and practical

KEY KDP KNOWLEDGE:

TRIM SIZES (common):
- 5"×8", 5.5"×8.5", 6"×9" — most popular for fiction and non-fiction
- 7"×10", 8"×10" — workbooks and large format
- 8.5"×11" — journals, planners
KDP requires the PDF page size to exactly match the chosen trim size (plus bleed if used).

MARGINS (US paperback, B&W white paper):
- Outside margins: minimum 0.25" on all non-gutter sides
- Gutter (inside/binding margin): depends on page count
  - 24–150 pages: 0.375"
  - 151–300 pages: 0.5"
  - 301–500 pages: 0.625"
  - 501–700 pages: 0.75"
  - 701+ pages: 0.875"
- Headers/footers must stay within the safe zone (inside the margins)

BLEED:
- Optional for most books; required for full-bleed images or colored pages
- Add 0.125" (3mm) bleed on all outside edges (not the gutter)
- PDF must include bleed area in page dimensions if used

FONTS:
- Must be embedded in the PDF
- KDP rejects PDFs with non-embedded fonts
- Most professional design tools embed fonts by default; check your export settings

PAPER OPTIONS (affects print cost):
- B&W white paper: $0.012/page
- B&W cream paper: same price as white
- Color interior: ~$0.07/page (significantly more expensive)

ROYALTY (US marketplace):
- 60% royalty rate: royalty = (list price × 0.60) − print cost. Requires list price in KDP's range.
- 35% royalty rate: royalty = list price × 0.35. No print cost deducted.
- List price must be ≥ print cost to earn anything at 60%

SPINE WIDTH formula (approximate):
- B&W white paper: page count × 0.002252" per page
- Color: page count × 0.002347" per page
- Add 0.06" for covers under 130 pages
KDP recommends allowing ±0.0625" variance in spine width.

COVER REQUIREMENTS:
- Full cover = back + spine + front, plus bleed on all outside edges
- Front cover must be at least 300 DPI
- Cover PDF is separate from interior PDF
- KDP provides a cover template generator (or use the manu2print cover calculator)

COMMON REJECTION REASONS:
1. Margin violations — text or images too close to the edge
2. Wrong PDF page size — doesn't match chosen trim size
3. Missing or non-embedded fonts
4. Incorrect spine width on cover
5. Bleed not set up correctly (or set up when not needed)
6. Low-resolution images (under 300 DPI)
7. Page count mismatch between interior and cover

WHEN TO RECOMMEND THE PDF CHECKER:
- Author is about to upload to KDP for the first time
- Author has been rejected by KDP and doesn't know why
- Author is unsure if their margins/bleed are correct
- Author created their file in Canva, Google Docs, or Word (high error risk)

TONE GUIDELINES:
- Don't say "Great question!" or similar filler phrases
- Don't say "I'm just an AI" — you are Manny, the KDP expert
- If you don't know something specific, say "I'm not certain — double-check on KDP's help pages"
- Always end with a practical next step or offer to help further`;

async function sendCrispMessage(sessionId: string, content: string): Promise<void> {
  const credentials = Buffer.from(`${CRISP_API_IDENTIFIER}:${CRISP_API_KEY}`).toString("base64");

  await fetch(`https://api.crisp.chat/v1/website/${CRISP_WEBSITE_ID}/conversation/${sessionId}/message`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json",
      "X-Crisp-Tier": "plugin",
    },
    body: JSON.stringify({
      type: "text",
      from: "operator",
      origin: "chat",
      content,
    }),
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    // Only handle user messages — ignore operator messages to avoid loops
    const event = body?.event;
    const data = body?.data;

    if (event !== "message:send") {
      return NextResponse.json({ ok: true });
    }

    if (data?.from !== "user") {
      return NextResponse.json({ ok: true });
    }

    if (data?.type !== "text" || !data?.content) {
      return NextResponse.json({ ok: true });
    }

    const sessionId: string = data.session_id;
    const userMessage: string = data.content;

    // Respond immediately to Crisp (webhook timeout is short)
    // Fire the Claude call in the background
    void (async () => {
      try {
        const response = await anthropic.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 512,
          system: MANNY_SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        });

        const text = response.content
          .filter((b) => b.type === "text")
          .map((b) => (b as { type: "text"; text: string }).text)
          .join("");

        if (text) {
          await sendCrispMessage(sessionId, text);
        }
      } catch (err) {
        console.error("[Manny] Claude or Crisp error:", err);
      }
    })();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Manny] Webhook error:", err);
    return NextResponse.json({ ok: true }); // Always return 200 to Crisp
  }
}
