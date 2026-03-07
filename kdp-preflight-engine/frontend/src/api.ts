/**
 * API client for KDP Preflight backend.
 *
 * Configure base URL via environment variable:
 *   VITE_API_URL=http://localhost:8000
 * (no trailing slash). Defaults to same origin if unset.
 */
import type { JobStatus, UploadResponse, ValidationReport } from "./types";

const BASE =
  typeof import.meta.env.VITE_API_URL === "string" && import.meta.env.VITE_API_URL.length > 0
    ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
    : "";

function url(path: string): string {
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function uploadPdf(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResponse> {
  const xhr = new XMLHttpRequest();
  const form = new FormData();
  form.append("file", file);

  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as UploadResponse);
        } catch {
          reject(new Error("Invalid response"));
        }
      } else {
        reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.open("POST", url("/upload"));
    xhr.send(form);
  });
}

export async function getStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(url(`/status/${jobId}`));
  if (!res.ok) throw new Error(await res.text().catch(() => `Status ${res.status}`));
  return res.json() as Promise<JobStatus>;
}

export async function getReport(jobId: string): Promise<ValidationReport> {
  const res = await fetch(url(`/report/${jobId}`));
  if (!res.ok) {
    if (res.status === 202) throw new Error("REPORT_PENDING");
    throw new Error(await res.text().catch(() => `Report ${res.status}`));
  }
  return res.json() as Promise<ValidationReport>;
}
