"use client";

interface WhatHappensNextProps {
  steps: string[];
  className?: string;
}

/**
 * Consistent "What happens next" block for paid-tool upload pages.
 * Use exactly 3 steps so users see the same flow pattern: process → redirect → pay & download.
 */
export function WhatHappensNext({ steps, className = "" }: WhatHappensNextProps) {
  return (
    <div
      className={`rounded-xl bg-m2p-orange-soft/50 border border-m2p-border p-4 text-sm text-m2p-muted space-y-1 ${className}`}
      role="region"
      aria-label="What happens next"
    >
      <p className="font-medium text-m2p-ink">What happens next</p>
      {steps.map((line, i) => (
        <p key={i}>{`${i + 1}. ${line}`}</p>
      ))}
    </div>
  );
}
