import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Rate limit: 3 applications per IP per hour
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function generateCode(name: string): string {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}${suffix}`;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const rl = rateLimit.get(ip);
  if (rl && now < rl.resetAt) {
    if (rl.count >= 3) {
      return NextResponse.json({ error: "Too many applications. Try again later." }, { status: 429 });
    }
    rl.count++;
  } else {
    rateLimit.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
  }

  let email: string, name: string, website: string, reason: string;
  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    name = typeof body?.name === "string" ? body.name.trim().slice(0, 100) : "";
    website = typeof body?.website === "string" ? body.website.trim().slice(0, 200) : "";
    reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !email.includes("@") || !name) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check for existing application
  const { data: existing } = await supabase
    .from("affiliates")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      ok: true,
      existing: true,
      status: existing.status,
    });
  }

  // Generate unique referral code
  let code = generateCode(name);
  let attempts = 0;
  while (attempts < 5) {
    const { data: taken } = await supabase
      .from("affiliates")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!taken) break;
    code = generateCode(name);
    attempts++;
  }

  await supabase.from("affiliates").insert({
    email,
    name,
    code,
    website: website || null,
    reason: reason || null,
    status: "pending",
    commission_rate: 0.30,
  });

  return NextResponse.json({ ok: true, existing: false });
}
