"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [access, setAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(!!id);

  useEffect(() => {
    if (!id) {
      setChecking(false);
      return;
    }
    fetch("/api/verify-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ downloadId: id }),
    })
      .then((r) => r.json())
      .then((data) => {
        setAccess(!!data?.access);
      })
      .catch(() => setAccess(false))
      .finally(() => setChecking(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-[#1a1a12] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-display text-4xl text-[#F5F0E8] mb-4">
          Payment successful! 🎉
        </h1>
        <p className="text-[#8B8B6B] mb-8">
          Your manuscript is ready to download.
        </p>
        {checking && (
          <p className="text-[#8B8B6B] mb-6">Verifying your purchase…</p>
        )}
        {!checking && id && (
          <>
            {access ? (
              <p className="text-[#8B8B6B] mb-6">You're all set. Use the button below to get your file.</p>
            ) : (
              <p className="text-[#8B8B6B] mb-6">
                Your purchase may still be confirming. Open your download page below — if the download isn't ready yet, wait a moment and refresh.
              </p>
            )}
            <Link
              href={`/download/${id}`}
              className="inline-block bg-[#D4A843] hover:bg-[#c49a3d] text-[#1a1a12] font-bold px-6 py-3 rounded-lg mb-6"
            >
              Open download page
            </Link>
          </>
        )}
        <Link
          href="/"
          className="mt-6 inline-block text-[#8B8B6B] hover:text-[#F5F0E8]"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
