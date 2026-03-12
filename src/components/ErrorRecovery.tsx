"use client";

/**
 * Shown below error messages on paid tools. Retry-focused, no human support CTA — keeps ops minimal.
 */
export function ErrorRecovery() {
  return (
    <p className="mt-2 text-xs text-m2p-muted">
      Try again in a moment. If it persists, try again later or from a different browser or device.
    </p>
  );
}
