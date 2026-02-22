import { NextRequest, NextResponse } from "next/server";

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

    // AI Optimization - using a simple keyword extraction + description enhancement
    // In production, you'd use Claude API or similar for true AI optimization

    const keywordsList = keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    // Enhance description with keywords naturally
    const enhancedDescription = enhanceDescription(
      description,
      keywordsList,
      genre
    );

    // Generate suggested keywords based on genre and input
    const suggestedKeywords = generateKeywords(
      title,
      description,
      genre,
      keywordsList
    );

    // Get suggested categories
    const suggestedCategories = KDP_CATEGORIES[genre] || KDP_CATEGORIES.fiction;

    // Generate export text
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
