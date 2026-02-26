"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const tool = searchParams.get("tool") || "kdp-formatter";
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setValid(false);
      return;
    }
    fetch("/api/verify-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => r.json())
      .then((data) => setValid(data.hasAccess === true))
      .catch(() => setValid(false));
  }, [sessionId]);

  const fileId = searchParams.get("file_id");
  const toolHref = tool === "kdp-formatter-pdf" ? "/kdp-formatter-pdf" : tool === "epub-maker" ? "/epub-maker" : "/kdp-formatter";
  const backToDownload = fileId && sessionId
    ? `/download/${fileId}?session_id=${sessionId}${tool === "kdp-formatter-pdf" ? "&source=pdf" : ""}`
    : toolHref;

  if (valid === null) {
    return (
      <div className="min-h-screen bg-[#0F0D0B] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#2A2420] border-t-[#F5A623] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#a8a29e]">Verifying payment…</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-[#0F0D0B] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold text-[#FAF7F2] mb-2">Something went wrong</h1>
          <p className="text-sm text-[#a8a29e] mb-6">We couldn&apos;t verify your payment. Please try again or contact support.</p>
          <Link
            href="/"
            className="inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold bg-[#F5A623] text-[#0F0D0B] hover:opacity-90"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0D0B] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-[#FAF7F2] mb-2">Payment confirmed.</h1>
        <p className="text-[#a8a29e] mb-6">Your download is ready.</p>
        <Link
          href={backToDownload}
          className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold bg-[#F5A623] text-[#0F0D0B] hover:opacity-90"
        >
          Download Your File
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
