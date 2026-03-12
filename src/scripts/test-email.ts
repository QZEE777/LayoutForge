import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const { sendDownloadLinkEmail } = await import("../lib/resend");
  console.log("Sending test email...");
  const result = await sendDownloadLinkEmail(
    "qqfs777@gmail.com",
    "https://www.manu2print.com/download/test-123"
  );
  console.log("Success:", result);
}

main().catch(console.error);
