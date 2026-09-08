/** Classify SDK errors without exposing credentials, URLs or object keys to customers. */
export class CheckerStorageError extends Error {
  constructor(public readonly code: string, public readonly retryable: boolean, cause: unknown) {
    super(retryable
      ? "The storage connection was interrupted. Please try the scan again."
      : "The scan service could not access the uploaded PDF. This requires a service fix; changing your PDF will not help.");
    this.name = "CheckerStorageError";
    this.cause = cause;
  }
}

export function classifyCheckerStorageError(error: unknown): CheckerStorageError {
  if (error instanceof CheckerStorageError) return error;
  const e = error as { name?: string; code?: string; $metadata?: { httpStatusCode?: number } } | null;
  const code = e?.code || e?.name || "StorageError";
  const status = e?.$metadata?.httpStatusCode;
  const retryable = status === 429 || (status != null && status >= 500)
    || ["TimeoutError", "RequestTimeout", "AbortError", "ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "SlowDown"].includes(code);
  return new CheckerStorageError(code, retryable, error);
}

/** R2 rejects malformed credentials; detect this before taking work from the queue. */
export function validateCheckerStorageConfig(env: Record<string, string | undefined>): void {
  if (!env.R2_ENDPOINT && !env.R2_ACCOUNT_ID) throw new Error("R2_ENDPOINT or R2_ACCOUNT_ID is required.");
  if (!env.R2_BUCKET_NAME?.trim()) throw new Error("R2_BUCKET_NAME is required.");
  if (!/^[a-f0-9]{32}$/i.test(env.R2_ACCESS_KEY_ID ?? "")) {
    throw new Error("R2_ACCESS_KEY_ID must be the 32-character R2 access key ID, not the API token or secret.");
  }
  if (!env.R2_SECRET_ACCESS_KEY) throw new Error("R2_SECRET_ACCESS_KEY is required.");
}
