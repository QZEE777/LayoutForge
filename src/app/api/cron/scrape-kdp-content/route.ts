import { NextRequest, NextResponse } from "next/server";

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_BASE_URL = "https://api.apify.com/v2";

type ApifyActorInput = Record<string, unknown>;

async function callApifyActor(actorId: string, input: ApifyActorInput) {
  if (!APIFY_TOKEN) {
    throw new Error("APIFY_API_TOKEN not configured");
  }

  const response = await fetch(`${APIFY_BASE_URL}/acts/${actorId}/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${APIFY_TOKEN}`,
    },
    body: JSON.stringify({
      ...input,
      memoryMbytes: 128,
    }),
  });

  if (!response.ok) {
    throw new Error(`Apify error: ${response.statusText}`);
  }

  const run = await response.json();
  return run.data.id;
}

async function getApifyDataset(datasetId: string) {
  if (!APIFY_TOKEN) {
    throw new Error("APIFY_API_TOKEN not configured");
  }

  const response = await fetch(`${APIFY_BASE_URL}/datasets/${datasetId}/items`, {
    headers: {
      Authorization: `Bearer ${APIFY_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch dataset: ${response.statusText}`);
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  // Verify auth
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[cron/scrape-kdp-content] Starting content scrape...");

    // Scrape Reddit KDP discussions
    const redditRunId = await callApifyActor("apify/reddit-post-scraper", {
      subreddits: ["kdp", "selfpublishing", "AmazonKDP"],
      maxPostsPerSubreddit: 20,
      sort: "hot",
    });

    // Wait a bit for Reddit scrape to complete
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Store results in memory for now (in production, save to Supabase)
    const scrapeResults = {
      timestamp: new Date().toISOString(),
      reddit_run_id: redditRunId,
      status: "scraping",
    };

    console.log("[cron/scrape-kdp-content] Scrape initiated:", scrapeResults);

    return NextResponse.json({
      success: true,
      message: "Content scrape scheduled",
      data: scrapeResults,
    });
  } catch (err) {
    console.error("[cron/scrape-kdp-content]", err);
    return NextResponse.json(
      { error: "Scrape failed", details: String(err) },
      { status: 500 }
    );
  }
}
