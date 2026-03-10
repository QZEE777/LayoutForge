"use client";

import { useState } from "react";

type Variant = "homepage" | "formatter";

export default function DocxVoteCard({ variant = "homepage" }: { variant?: Variant }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleVote = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/tool-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "docx-formatter" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (variant === "formatter") {
    return (
      <div className="group relative rounded-xl border-l-4 border-brave/60 p-5 flex flex-col bg-white border border-soft-border overflow-hidden">
        <span className="rounded-full bg-soft-border border border-soft-border px-2 py-0.5 text-xs font-medium text-soft-muted w-fit mb-2 self-center">
          Coming soon
        </span>
        <div className="relative flex flex-col items-center text-center">
          <h3 className="font-bebas text-xl tracking-wide text-amazon-navy mb-2">
            DOCX Manuscript Formatter
          </h3>
          <p className="font-sans text-sm flex-1 mb-4 text-soft-muted">
            Format your Word manuscript for KDP print. Auto margins, trim size, chapter breaks.
          </p>
          {status === "success" ? (
            <p className="font-sans text-sm text-brave font-medium">
              Vote recorded! We&apos;ll notify you when it launches.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleVote}
              disabled={status === "loading"}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold w-fit bg-brave text-amazon-navy hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {status === "loading" ? "Sending…" : "I want this tool →"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E0D8C4] rounded-2xl p-7 text-center relative shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="absolute top-4 right-4">
        <span className="text-[#7A6E5F] text-xs font-semibold uppercase tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>Coming Soon</span>
      </div>
      <div className="text-4xl mb-3">📝</div>
      <h3 className="text-xl text-[#1A1208] mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>DOCX Manuscript Formatter</h3>
      <p className="text-sm text-[#6B6151] mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
        Format your Word manuscript for KDP print. Auto margins, trim size, chapter breaks.
      </p>
      {status === "success" ? (
        <p className="text-sm text-[#F05A28] font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
          Vote recorded! We&apos;ll notify you when it launches.
        </p>
      ) : (
        <button
          type="button"
          onClick={handleVote}
          disabled={status === "loading"}
          className="inline-block rounded-xl px-5 py-2.5 text-sm font-semibold bg-[#F05A28] hover:bg-[#D94E20] text-white disabled:opacity-60 transition-all"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {status === "loading" ? "Sending…" : "I want this tool →"}
        </button>
      )}
    </div>
  );
}
