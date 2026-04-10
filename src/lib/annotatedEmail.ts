import { getStored, normalizeAnnotatedPdfStatus, updateAnnotatedState } from "@/lib/storage";
import { sendAnnotatedPdfReadyEmail } from "@/lib/resend";

function extractJobId(annotatedUrl?: string): string | null {
  if (!annotatedUrl) return null;
  const m = annotatedUrl.match(/\/file\/([^/]+)\/annotated\/?$/);
  return m?.[1] ?? null;
}

export async function sendAnnotatedEmailIfReady(downloadId: string): Promise<boolean> {
  const meta = await getStored(downloadId);
  if (!meta) return false;
  if (!meta.annotatedEmail) return false;
  if (meta.annotatedEmailSentAt) return false;
  if (normalizeAnnotatedPdfStatus(meta.annotatedPdfStatus, meta.annotatedEmailSentAt) !== "ready") return false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com";
  const jobId = extractJobId(meta.annotatedPdfUrl);
  const fallbackUrl = jobId
    ? `${appUrl}/api/kdp-annotated-pdf?job_id=${encodeURIComponent(jobId)}`
    : `${appUrl}/download/${downloadId}?source=checker`;
  const annotatedUrl = meta.annotatedPdfDownloadUrl || fallbackUrl;

  await sendAnnotatedPdfReadyEmail(meta.annotatedEmail, annotatedUrl);
  await updateAnnotatedState(downloadId, { status: "delivered", markSent: true });
  return true;
}

