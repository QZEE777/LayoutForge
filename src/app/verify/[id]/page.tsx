import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { VerifyClient } from "./client";

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
      <div style={{ fontFamily: "system-ui,sans-serif", background: "#FAF7EE", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
          <p style={{ marginBottom: 12 }}>
            <span style={{ color: "#F05A28", fontWeight: 900, fontSize: "1.4rem" }}>manu</span>
            <span style={{ color: "#2D6A2D", fontWeight: 900, fontSize: "1.4rem" }}>2print</span>
          </p>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1A1208", marginBottom: 8 }}>Verification not found</h1>
          <p style={{ fontSize: 14, color: "#6B6151", marginBottom: 28 }}>This verification link is invalid or has expired.</p>
          <Link
            href="/kdp-pdf-checker"
            style={{ display: "inline-block", background: "#F05A28", color: "#fff", fontWeight: 700, fontSize: 14, padding: "13px 28px", borderRadius: 10, textDecoration: "none" }}
          >
            Check your own manuscript →
          </Link>
        </div>
      </div>
    );
  }

  const score = data.readiness_score ?? 0;

  const statusLevel =
    score >= 90 ? "ready" :
    score >= 70 ? "nearly" :
    score >= 50 ? "needs-work" :
    "reject";

  const statusLabel =
    statusLevel === "ready"      ? "READY FOR KDP" :
    statusLevel === "nearly"     ? "NEARLY READY" :
    statusLevel === "needs-work" ? "NEEDS WORK" :
    "LIKELY REJECTED";

  const verifyUrl = `https://www.manu2print.com/verify/${verificationId}`;

  return (
    <VerifyClient
      score={score}
      statusLabel={statusLabel}
      statusLevel={statusLevel}
      issuesCount={typeof data.issues_count === "number" ? data.issues_count : null}
      filename={data.filename_clean ?? ""}
      verifyUrl={verifyUrl}
    />
  );
}

