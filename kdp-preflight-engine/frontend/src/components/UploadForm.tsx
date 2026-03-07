import { useRef } from "react";

type FlowStatus = "idle" | "uploading" | "polling" | "completed" | "failed";

interface UploadFormProps {
  onUpload: (file: File) => void;
  disabled: boolean;
  status: FlowStatus;
  statusMessage: string | null;
  uploadProgress: number;
}

export function UploadForm({
  onUpload,
  disabled,
  status,
  statusMessage,
  uploadProgress,
}: UploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      alert("Please select a PDF file.");
      return;
    }
    onUpload(f);
  };

  const triggerUpload = () => {
    inputRef.current?.click();
  };

  return (
    <div className="upload-section">
      <h2>Upload interior PDF</h2>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleChange}
        style={{ display: "none" }}
      />
      <button onClick={triggerUpload} disabled={disabled}>
        {status === "idle" || status === "completed" || status === "failed"
          ? "Choose PDF"
          : "Uploading…"}
      </button>
      {(status === "uploading" || status === "polling") && (
        <>
          <span className="status-badge" style={{ marginLeft: "0.75rem" }}>
            {status === "uploading" ? "uploading" : "validating"}
          </span>
          {statusMessage && (
            <div style={{ marginTop: "0.5rem", color: "#666" }}>
              {statusMessage}
            </div>
          )}
          {status === "uploading" && (
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
