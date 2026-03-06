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
      className={`rounded-xl bg-slate-800/40 border border-slate-700/60 p-4 text-sm text-slate-400 space-y-1 ${className}`}
      role="region"
      aria-label="What happens next"
    >
      <p className="font-medium text-slate-300">What happens next</p>
      {steps.map((line, i) => (
        <p key={i}>{`${i + 1}. ${line}`}</p>
      ))}
    </div>
  );
}
