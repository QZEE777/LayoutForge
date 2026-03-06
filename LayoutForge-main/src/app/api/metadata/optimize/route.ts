import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

interface MetadataForm {
  title: string;
  subtitle: string;
  author: string;
  genre: string;
  description: string;
  keywords: string;
  seriesName: string;
  seriesNumber: string;
  isbn: string;
  copyrightYear: string;
}

const KDP_CATEGORIES: Record<string, string[]> = {
  fiction: [
    "Literary Fiction",
    "Science Fiction & Fantasy",
    "Mystery & Suspense",
    "Romance",
    "Adventure",
  ],
  mystery: ["Mystery", "Thriller & Suspense", "Crime & Mystery"],
  romance: ["Romance", "Contemporary Romance", "Historical Romance"],
  scifi: ["Science Fiction", "Science Fiction & Fantasy", "Dystopian"],
  fantasy: ["Fantasy", "Science Fiction & Fantasy", "Epic Fantasy"],
  nonfiction: ["Biographies & Memoirs", "History", "Self-Help"],
  "self-help": [
    "Self-Help",
    "Motivational",
    "Health & Wellness",
    "Business & Money",
  ],
  business: ["Business & Money", "Entrepreneurship", "Leadership"],
  biography: ["Biographies & Memoirs", "History"],
  other: ["General", "Other"],
};

interface AIOptimized {
  optimizedDescription: string;
  suggestedKeywords: string[];
  suggestedCategories: string[];
}

async function optimizeWithAI(body: MetadataForm): Promise<AIOptimized | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const { title, subtitle, author, genre, description, keywords } = body;
  const userKeywords = keywords
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  const systemPrompt =
    "You are an expert in Amazon KDP metadata. Output only valid JSON, no markdown.";
  const userPrompt = `Given this book metadata, return a JSON object with exactly these keys:

1. "optimizedDescription" (string): Improve the book description for Amazon—sales-focused, 150–300 words, no spoilers. Keep the author's voice.
2. "suggestedKeywords" (array of strings): Exactly 7 keyword phrases for KDP search (e.g. "historical romance regency").
3. "suggestedCategories" (array of strings): Up to 5 Amazon KDP category names that fit this book (e.g. "Romance > Historical Romance").

Book title: ${title}${subtitle ? `\nSubtitle: ${subtitle}` : ""}
Author: ${author}
Genre: ${genre}
Current description: ${description}
${userKeywords.length ? `Author's keywords: ${userKeywords.join(", ")}` : ""}

Respond with only the JSON object.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 2048,
        messages: [{ role: "user", content: [{ type: "text", text: userPrompt }] }],
        system: systemPrompt,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const textBlock = data?.content?.find((c) => c.type === "text");
    const raw = (textBlock?.text ?? "").replace(/^```json\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(raw) as AIOptimized;
    if (
      typeof parsed?.optimizedDescription !== "string" ||
      !Array.isArray(parsed?.suggestedKeywords) ||
      !Array.isArray(parsed?.suggestedCategories)
    )
      return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MetadataForm;

    const { title, subtitle, author, genre, description, keywords } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description required" },
        { status: 400 }
      );
    }

    const keywordsList = keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    let enhancedDescription: string;
    let suggestedKeywords: string[];
    let suggestedCategories: string[];

    const aiResult = await optimizeWithAI(body);
    if (aiResult) {
      enhancedDescription = aiResult.optimizedDescription;
      suggestedKeywords = aiResult.suggestedKeywords.slice(0, 10);
      suggestedCategories = aiResult.suggestedCategories.length
        ? aiResult.suggestedCategories
        : KDP_CATEGORIES[genre] || KDP_CATEGORIES.fiction;
    } else {
      enhancedDescription = enhanceDescription(description, keywordsList, genre);
      suggestedKeywords = generateKeywords(title, description, genre, keywordsList);
      suggestedCategories = KDP_CATEGORIES[genre] || KDP_CATEGORIES.fiction;
    }

    const exportText = generateExportText(
      body,
      enhancedDescription,
      suggestedKeywords,
      suggestedCategories
    );

    return NextResponse.json({
      optimizedDescription: enhancedDescription,
      suggestedKeywords,
      suggestedCategories,
      exportText,
    });
  } catch (e) {
    console.error("Metadata optimization error:", e);
    return NextResponse.json(
      { error: "Optimization failed" },
      { status: 500 }
    );
  }
}

function enhanceDescription(
  original: string,
  keywords: string[],
  genre: string
): string {
  let enhanced = original;

  // Add genre context if missing
  if (!enhanced.toLowerCase().includes(genre)) {
    enhanced = `A ${genre} story about ${enhanced}`;
  }

  return enhanced;
}

function generateKeywords(
  title: string,
  description: string,
  genre: string,
  userKeywords: string[]
): string[] {
  const suggestedSet = new Set<string>(userKeywords);

  // Add genre-specific keywords
  const genreKeywords: Record<string, string[]> = {
    fiction: [
      "novel",
      "story",
      "characters",
      "plot",
      "adventure",
      "drama",
      "engaging",
    ],
    mystery: ["mystery", "thriller", "suspense", "detective", "crime"],
    romance: [
      "romance",
      "love story",
      "couple",
      "relationship",
      "emotional",
    ],
    scifi: ["science fiction", "futuristic", "technology", "space", "dystopian"],
    fantasy: ["fantasy", "magic", "adventure", "world", "epic"],
    nonfiction: [
      "non-fiction",
      "true story",
      "informative",
      "educational",
    ],
    "self-help": [
      "self-help",
      "personal development",
      "motivation",
      "practical",
    ],
    business: ["business", "leadership", "entrepreneurship", "strategy"],
  };

  const keywords = genreKeywords[genre] || [];
  keywords.forEach((k) => suggestedSet.add(k));

  // Extract words from title
  title
    .split(" ")
    .filter((w) => w.length > 4)
    .forEach((w) => suggestedSet.add(w.toLowerCase()));

  return Array.from(suggestedSet).slice(0, 10);
}

function generateExportText(
  metadata: MetadataForm,
  description: string,
  keywords: string[],
  categories: string[]
): string {
  return `
BOOK METADATA FOR AMAZON KDP
============================

TITLE: ${metadata.title}${metadata.subtitle ? `\nSUBTITLE: ${metadata.subtitle}` : ""}
AUTHOR: ${metadata.author}
GENRE: ${metadata.genre}
COPYRIGHT YEAR: ${metadata.copyrightYear}
${metadata.isbn ? `ISBN: ${metadata.isbn}` : ""}

BOOK DESCRIPTION:
${description}

KEYWORDS (for discoverability):
${keywords.join(", ")}

SUGGESTED KDP CATEGORIES:
${categories.map((c) => `- ${c}`).join("\n")}

${
  metadata.seriesName
    ? `SERIES INFORMATION:
Series Name: ${metadata.seriesName}
Book Number: ${metadata.seriesNumber}`
    : ""
}

============================
Ready to paste into Amazon KDP dashboard!
`;
}
