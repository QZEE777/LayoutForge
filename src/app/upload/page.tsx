"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ALLOWED_TYPES = [".pdf", ".docx", ".epub"];
const MAX_MB = 50;

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((f: File): string | null => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    if (!ALLOWED_TYPES.includes(ext)) {
      return `Only ${ALLOWED_TYPES.join(", ")} files are accepted.`;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      return `File must be smaller than ${MAX_MB}MB.`;
    }
    return null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (!droppedFile) return;

      const validationError = validateFile(droppedFile);
      if (validationError) {
        setError(validationError);
        setFile(null);
        return;
      }

      setError(null);
      setFile(droppedFile);
    },
    [validateFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        setFile(null);
        return;
      }

      setError(null);
      setFile(selectedFile);
    },
    [validateFile]
  );

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 15, 90));
      }, 100);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Upload failed");
      }

      const data = await response.json();
      setProgress(100);

      // Redirect to preview
      router.push(`/preview/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      setProgress(0);
    }
  }, [file, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-slate-900">
            ScribeStack
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Upload manuscript</h1>
          <p className="mt-2 text-slate-600">
            PDF, DOCX, or EPUB. Maximum {MAX_MB}MB.
          </p>
        </div>

        {/* Upload area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-lg border-2 border-dashed p-12 text-center transition-all ${
            isDragging
              ? "border-blue-400 bg-blue-50"
              : "border-slate-300 bg-white hover:border-slate-400"
          }`}
        >
          <input
            type="file"
            id="file-input"
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />

          <label
            htmlFor="file-input"
            className={`block cursor-pointer ${uploading ? "opacity-50" : ""}`}
          >
            {file ? (
              <div>
                <p className="text-lg font-semibold text-slate-900">{file.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-slate-600">
                  Drag and drop here or <span className="text-blue-600 font-medium">choose a file</span>
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {ALLOWED_TYPES.join(", ")} • up to {MAX_MB}MB
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* Progress bar */}
        {uploading && progress > 0 && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Uploading...
              </span>
              <span className="text-sm text-slate-500">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? "Uploading..." : "Upload & Continue"}
          </button>

          {file && !uploading && (
            <button
              onClick={() => {
                setFile(null);
                setError(null);
              }}
              className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link href="/" className="text-blue-600 hover:underline">
            Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}
