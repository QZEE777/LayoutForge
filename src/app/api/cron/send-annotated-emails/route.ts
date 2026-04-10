import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getStored } from "@/lib/storage";
import { listMetaIds } from "@/lib/r2Storage";
import { sendAnnotatedEmailIfReady } from "@/lib/annotatedEmail";

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

async function listCandidateIds(limit = 200): Promise<string[]> {
  if (process.env.USE_R2 === "true") {
    const ids = await listMetaIds();
    return ids.slice(0, limit);
  }
  const uploadDir = process.env.VERCEL ? path.join("/tmp", "uploads") : path.join(process.cwd(), "data", "uploads");
  const entries = await fs.readdir(uploadDir, { withFileTypes: true }).catch(() => []);
  const ids = entries
    .filter((e) => e.isFile() && e.name.endsWith(".meta.json"))
    .map((e) => e.name.replace(".meta.json", ""));
  return ids.slice(0, limit);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let sent = 0;
  let queued = 0;
  const ids = await listCandidateIds(250);
  for (const id of ids) {
    const meta = await getStored(id);
    if (!meta?.annotatedEmail || meta.annotatedEmailSentAt) continue;
    queued++;
    const didSend = await sendAnnotatedEmailIfReady(id).catch(() => false);
    if (didSend) sent++;
  }
  return NextResponse.json({ success: true, scanned: ids.length, queued, sent });
}

