import "dotenv/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_ENDPOINT,
  NEXT_PUBLIC_R2_PUBLIC_URL,
} = process.env;

const required = {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_ENDPOINT,
  NEXT_PUBLIC_R2_PUBLIC_URL,
};

const missing = Object.entries(required)
  .filter(([, value]) => !value || !String(value).trim())
  .map(([key]) => key);

if (missing.length) {
  throw new Error(`Missing required env vars: ${missing.join(", ")}`);
}

const coversDir = path.join(projectRoot, "public", "book-covers");
const outputJsonPath = path.join(projectRoot, "src", "data", "book-covers.json");

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function toTitle(filename) {
  return filename
    .replace(/\.png$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

async function main() {
  const entries = await readdir(coversDir, { withFileTypes: true });
  const pngFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".png"))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  if (pngFiles.length === 0) {
    console.log("No .png files found in public/book-covers.");
  }

  const basePublicUrl = NEXT_PUBLIC_R2_PUBLIC_URL.replace(/\/+$/, "");
  const covers = [];

  for (const filename of pngFiles) {
    const filePath = path.join(coversDir, filename);
    const key = `book-covers/${filename}`;
    const body = await readFile(filePath);

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: "image/png",
      })
    );

    const publicUrl = `${basePublicUrl}/${key}`;
    console.log(publicUrl);

    covers.push({
      title: toTitle(filename),
      filename,
      url: publicUrl,
    });
  }

  await writeFile(outputJsonPath, `${JSON.stringify(covers, null, 2)}\n`, "utf8");
  console.log(`Wrote ${covers.length} entries to src/data/book-covers.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
