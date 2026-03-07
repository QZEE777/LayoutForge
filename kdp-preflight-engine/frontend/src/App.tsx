import { useCallback, useEffect, useState } from "react";
import { getReport, getStatus, uploadPdf } from "./api";
import type { ValidationReport } from "./types";
import { ErrorPanel } from "./components/ErrorPanel";
import { KdpPdfViewer } from "./components/KdpPdfViewer";
import { UploadForm } from "./components/UploadForm";

type FlowStatus = "idle" | "uploading" | "polling" | "completed" | "failed";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [flowStatus, setFlowStatus] = useState<FlowStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const reset = useCallback(() => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null);
    setFileUrl(null);
    setJobId(null);
    setFlowStatus("idle");
    setStatusMessage(null);
    setReport(null);
    setError(null);
  }, [fileUrl]);

  const handleUpload = useCallback(
    async (f: File) => {
      reset();
      setFile(f);
      setFileUrl(URL.createObjectURL(f));
      setFlowStatus("uploading");
      setStatusMessage("Uploading…");
      setUploadProgress(0);
      setError(null);
      try {
        const { job_id } = await uploadPdf(f, (pct) => {
          setUploadProgress(pct);
          setStatusMessage(`Uploading… ${pct}%`);
        });
        setJobId(job_id);
        setFlowStatus("polling");
        setStatusMessage("Validating…");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
        setFlowStatus("failed");
      }
    },
    [reset]
  );

  useEffect(() => {
    if (!jobId || flowStatus !== "polling") return;
    const t = setInterval(async () => {
      try {
        const s = await getStatus(jobId);
        setStatusMessage(s.message || s.status);
        if (s.status === "completed") {
          const r = s.report ?? (await getReport(jobId));
          setReport(r);
          setFlowStatus("completed");
          return;
        }
        if (s.status === "failed") {
          setError(s.message || "Validation failed");
          setFlowStatus("failed");
          return;
        }
      } catch (e) {
        if (e instanceof Error && e.message === "REPORT_PENDING") return;
        setError(e instanceof Error ? e.message : "Request failed");
        setFlowStatus("failed");
      }
    }, 1500);
    return () => clearInterval(t);
  }, [jobId, flowStatus]);

  return (
    <div className="app">
      <h1 style={{ marginTop: 0 }}>KDP Preflight</h1>
      <UploadForm
        onUpload={handleUpload}
        disabled={flowStatus === "uploading" || flowStatus === "polling"}
        status={flowStatus}
        statusMessage={statusMessage}
        uploadProgress={uploadProgress}
      />
      {error && (
        <div className="upload-section" style={{ color: "#b91c1c" }}>
          {error}
        </div>
      )}
      {report && fileUrl && file && (
        <div className="viewer-layout">
          <div className="viewer-main">
            <div
              className={`report-summary ${report.status.toLowerCase()}`}
            >
              <strong>{report.status}</strong> — {report.summary.error_count} error(s),{" "}
              {report.summary.warning_count} warning(s) across{" "}
              {report.summary.total_pages} pages.
            </div>
            <KdpPdfViewer pdfUrl={fileUrl} report={report} />
          </div>
          <div className="viewer-sidebar">
            <ErrorPanel report={report} />
          </div>
        </div>
      )}
    </div>
  );
}
