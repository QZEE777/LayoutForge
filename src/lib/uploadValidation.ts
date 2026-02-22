/**
 * File upload validation for LayoutForge.
 * Validates file type, size, name, and content.
 */

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE_MB: 50,
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
  ALLOWED_MIMES: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/epub+zip",
    "text/plain",
  ],
  ALLOWED_EXTENSIONS: [".pdf", ".docx", ".epub", ".txt"],
} as const;

export interface ValidationError {
  code:
    | "NO_FILE"
    | "INVALID_TYPE"
    | "FILE_TOO_LARGE"
    | "INVALID_NAME"
    | "EXECUTABLE"
    | "UNKNOWN";
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: ValidationError;
}

const DANGEROUS_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".msi",
  ".scr",
  ".vbs",
  ".js",
  ".jar",
  ".sh",
  ".ps1",
  ".app",
]);

/**
 * Validate a file upload.
 */
export function validateUpload(
  file: File | null | undefined
): ValidationResult {
  if (!file) {
    return {
      valid: false,
      error: {
        code: "NO_FILE",
        message: "Please select a file to upload.",
      },
    };
  }

  // Check file name
  const fileName = file.name || "";
  if (!fileName) {
    return {
      valid: false,
      error: {
        code: "INVALID_NAME",
        message: "File name is required.",
      },
    };
  }

  // Check for dangerous extensions
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: {
        code: "EXECUTABLE",
        message: "Executable files are not allowed.",
      },
    };
  }

  // Check extension
  const isKnownExt = UPLOAD_CONFIG.ALLOWED_EXTENSIONS.some((e) =>
    fileName.toLowerCase().endsWith(e)
  );
  if (!isKnownExt) {
    return {
      valid: false,
      error: {
        code: "INVALID_TYPE",
        message: `Only ${UPLOAD_CONFIG.ALLOWED_EXTENSIONS.join(", ")} files are accepted.`,
      },
    };
  }

  // Check MIME type
  const mimeType = file.type || "";
  if (mimeType && !(UPLOAD_CONFIG.ALLOWED_MIMES as readonly string[]).includes(mimeType)) {
    return {
      valid: false,
      error: {
        code: "INVALID_TYPE",
        message: `File type "${mimeType}" is not supported.`,
      },
    };
  }

  // Check file size
  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: `File is too large. Maximum size is ${UPLOAD_CONFIG.MAX_FILE_SIZE_MB}MB.`,
      },
    };
  }

  return { valid: true };
}

/**
 * Sanitize file name for safe storage.
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^\w\s.-]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 200);
}

/**
 * Get file extension from name.
 */
export function getFileExtension(fileName: string): string {
  const match = fileName.match(/\.[^.]+$/);
  return match ? match[0] : "";
}

/**
 * Detect file type from MIME or extension.
 */
export function detectFileType(
  fileName: string,
  mimeType: string
): "pdf" | "docx" | "epub" | "txt" | "unknown" {
  const ext = getFileExtension(fileName).toLowerCase();

  if (ext === ".pdf" || mimeType === "application/pdf") return "pdf";
  if (
    ext === ".docx" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "docx";
  if (ext === ".epub" || mimeType === "application/epub+zip") return "epub";
  if (ext === ".txt" || mimeType === "text/plain") return "txt";

  return "unknown";
}
