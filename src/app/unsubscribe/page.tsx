"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function UnsubscribeForm() {
  const searchParams  = useSearchParams();
  const emailFromUrl  = searchParams.get("email") ?? "";

  const [email,   setEmail]   = useState(emailFromUrl);
  const [status,  setStatus]  = useState<"idle" | "loading" | "done" | "error">("idle");

  // Auto-submit if email is pre-filled from the link
  useEffect(() => {
    if (emailFromUrl) handleUnsubscribe(emailFromUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUnsubscribe(addr: string) {
    const trimmed = addr.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FAF7EE",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 20px",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>

        {/* Logo */}
        <p style={{ marginBottom: 32, fontSize: 15, fontWeight: 900 }}>
          <span style={{ color: "#F05A28" }}>manu</span>
          <span style={{ color: "#2D6A2D" }}>2print</span>
        </p>

        {status === "done" ? (
          <>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "#2D6A2D", display: "flex",
              alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", fontSize: 24, color: "#fff",
            }}>✓</div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1A1208", marginBottom: 10 }}>
              You&apos;re unsubscribed
            </h1>
            <p style={{ fontSize: 14, color: "#6B6151", marginBottom: 28, lineHeight: 1.6 }}>
              {email} has been removed from scan reminder emails.
              You won&apos;t hear from us again unless you make a purchase.
            </p>
            <Link
              href="/kdp-pdf-checker"
              style={{
                display: "inline-block",
                background: "#F05A28",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                padding: "12px 24px",
                borderRadius: 10,
                textDecoration: "none",
              }}
            >
              Back to checker →
            </Link>
          </>
        ) : status === "error" ? (
          <>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1A1208", marginBottom: 10 }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: "#6B6151", marginBottom: 20 }}>
              Please try again or email us at{" "}
              <a href="mailto:hello@manu2print.com" style={{ color: "#F05A28" }}>
                hello@manu2print.com
              </a>
            </p>
            <button
              onClick={() => handleUnsubscribe(email)}
              style={{
                background: "#F05A28", color: "#fff", fontWeight: 700,
                fontSize: 14, padding: "12px 24px", borderRadius: 10,
                border: "none", cursor: "pointer",
              }}
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1A1208", marginBottom: 10 }}>
              Unsubscribe
            </h1>
            <p style={{ fontSize: 14, color: "#6B6151", marginBottom: 24, lineHeight: 1.6 }}>
              {status === "loading"
                ? "Removing you from our list…"
                : "Enter your email to stop receiving scan reminder emails."}
            </p>
            {status !== "loading" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: "1.5px solid rgba(0,0,0,0.12)",
                    fontSize: 14,
                    background: "#fff",
                    color: "#1A1208",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={() => handleUnsubscribe(email)}
                  disabled={!email.includes("@")}
                  style={{
                    background: "#1A1208", color: "#fff", fontWeight: 700,
                    fontSize: 14, padding: "13px", borderRadius: 10,
                    border: "none", cursor: "pointer", opacity: email.includes("@") ? 1 : 0.4,
                  }}
                >
                  Unsubscribe
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeForm />
    </Suspense>
  );
}
