import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { id: verificationId } = await params;

  const { data, error } = await supabase
    .from("verification_results")
    .select("verification_id, filename_clean, readiness_score, kdp_ready, scan_date, issues_count")
    .eq("verification_id", verificationId)
    .maybeSingle();

  if (error || !data) {
    return (
      <div className="min-h-screen bg-m2p-ivory flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <p className="mb-3">
            <span style={{ color: "#F05A28", fontWeight: "bold", fontSize: "1.5rem" }}>manu</span>
            <span style={{ color: "#4cd964", fontWeight: "bold", fontSize: "1.5rem" }}>2print</span>
          </p>
          <h1 className="text-2xl font-semibold text-m2p-ink mb-2">Verification not found</h1>
          <p className="text-m2p-muted mb-6">This verification link is invalid or has expired.</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-m2p-orange text-white px-5 py-2.5 text-sm font-semibold hover:bg-m2p-orange-hover"
          >
            Check your own manuscript → manu2print.com
          </Link>
        </div>
      </div>
    );
  }

  const score = data.readiness_score ?? 0;
  let statusLabel = "NEEDS WORK";
  let statusColor = "text-red-700";
  let badgeBg = "bg-red-100";

  if (score >= 90) {
    statusLabel = "READY FOR KDP";
    statusColor = "text-green-700";
    badgeBg = "bg-green-100";
  } else if (score >= 70) {
    statusLabel = "NEARLY READY";
    statusColor = "text-amber-700";
    badgeBg = "bg-amber-100";
  }

  const scanDate =
    typeof data.scan_date === "string" && data.scan_date
      ? new Date(data.scan_date).toLocaleString()
      : "—";

  return (
    <div className="min-h-screen bg-m2p-ivory flex items-center justify-center px-6 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
        <Image
          src="/MANNY AVATAR.png"
          alt=""
          width={260}
          height={260}
          className="rounded-full object-cover"
        />
      </div>
      <div className="relative max-w-lg w-full bg-white/90 border border-m2p-border rounded-2xl p-6 shadow-sm">
        <div className="mb-4">
          <p className="mb-1">
            <span style={{ color: "#F05A28", fontWeight: "bold", fontSize: "1.5rem" }}>manu</span>
            <span style={{ color: "#4cd964", fontWeight: "bold", fontSize: "1.5rem" }}>2print</span>
          </p>
          <p className="text-xs text-m2p-muted">KDP &amp; Kindle tools for indie authors</p>
        </div>

        <h1 className="text-xl font-semibold text-m2p-ink mb-2">KDP Readiness Verified</h1>
        <p className="text-sm text-m2p-muted mb-4">
          This page confirms the readiness score for a manuscript scanned with Manu2Print&apos;s
          Print Ready Check.
        </p>

        <div className="mb-4">
          <p className="text-xs font-medium text-m2p-muted uppercase tracking-wide mb-1">
            Manuscript
          </p>
          <p className="text-lg font-semibold text-m2p-ink">
            {data.filename_clean || "Untitled — PDF"}
          </p>
        </div>

        <div className="mb-4">
          <p className="text-xs font-medium text-m2p-muted uppercase tracking-wide mb-1">
            Book Readiness Score
          </p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${statusColor}`}>{score}/100</span>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeBg} ${statusColor}`}>
              {statusLabel === "READY FOR KDP"
                ? "✅ READY FOR KDP"
                : statusLabel === "NEARLY READY"
                ? "⚠️ NEARLY READY"
                : "❌ NEEDS WORK"}
            </span>
          </div>
          {typeof data.issues_count === "number" && (
            <p className="mt-2 text-xs text-m2p-muted">
              Issues detected: {data.issues_count}
            </p>
          )}
        </div>

        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-m2p-muted">
          <div>
            <p className="font-medium text-m2p-ink">Scan date</p>
            <p>{scanDate}</p>
          </div>
          <div>
            <p className="font-medium text-m2p-ink">Verification ID</p>
            <p className="break-all text-xs text-m2p-muted">{data.verification_id}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            href="/kdp-pdf-checker"
            className="inline-flex items-center justify-center rounded-lg bg-m2p-orange text-white px-5 py-2.5 text-sm font-semibold hover:bg-m2p-orange-hover"
          >
            Check your own manuscript → manu2print.com
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-m2p-muted">
          © manu2print — Built for indie authors
        </p>
      </div>
    </div>
  );
}

