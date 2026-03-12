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
      <div className="group relative rounded-xl border-l-4 border-m2p-orange/60 p-5 flex flex-col bg-white border border-m2p-border overflow-hidden">
        <span className="rounded-full bg-m2p-orange-soft border border-m2p-border px-2 py-0.5 text-xs font-medium text-m2p-muted w-fit mb-2 self-center">
          Coming soon
        </span>
        <div className="relative flex flex-col items-center text-center">
          <h3 className="font-bebas text-xl tracking-wide text-m2p-ink mb-2">
            DOCX Manuscript Formatter
          </h3>
          <p className="font-sans text-sm flex-1 mb-4 text-m2p-muted">
            Format your Word manuscript for KDP print. Auto margins, trim size, chapter breaks.
          </p>
          {status === "success" ? (
            <p className="font-sans text-sm text-m2p-orange font-medium">
              Vote recorded! We&apos;ll notify you when it launches.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleVote}
              disabled={status === "loading"}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold w-fit bg-m2p-orange text-white hover:bg-m2p-orange-hover disabled:opacity-60 transition-opacity"
            >
              {status === "loading" ? "Sending…" : "I want this tool →"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-m2p-border rounded-2xl p-7 text-center relative shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="absolute top-4 right-4">
        <span className="text-m2p-muted text-xs font-semibold uppercase tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>Coming Soon</span>
      </div>
      <div className="text-4xl mb-3">📝</div>
      <h3 className="text-xl text-m2p-ink mb-2 font-bebas">DOCX Manuscript Formatter</h3>
      <p className="text-sm text-m2p-muted mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
        Format your Word manuscript for KDP print. Auto margins, trim size, chapter breaks.
      </p>
      {status === "success" ? (
        <p className="text-sm text-m2p-orange font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
          Vote recorded! We&apos;ll notify you when it launches.
        </p>
      ) : (
        <button
          type="button"
          onClick={handleVote}
          disabled={status === "loading"}
          className="inline-block rounded-xl px-5 py-2.5 text-sm font-semibold bg-m2p-orange hover:bg-m2p-orange-hover text-white disabled:opacity-60 transition-all"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {status === "loading" ? "Sending…" : "I want this tool →"}
        </button>
      )}
    </div>
  );
}
