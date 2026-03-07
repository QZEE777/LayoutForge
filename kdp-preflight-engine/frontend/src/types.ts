/**
 * Types matching the KDP Preflight backend API and report format.
 */

export interface PageIssue {
  page: number;
  rule_id: string;
  severity: "ERROR" | "WARNING";
  message: string;
  bbox: [number, number, number, number] | null; // [x, y, width, height] in PDF points
}

export interface ValidationSummary {
  total_pages: number;
  error_count: number;
  warning_count: number;
  rules_checked: number;
}

export interface ValidationReport {
  status: "PASS" | "FAIL";
  errors: PageIssue[];
  warnings: PageIssue[];
  summary: ValidationSummary;
  page_issues: PageIssue[];
}

export interface JobStatus {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  message: string | null;
  report: ValidationReport | null;
}

export interface UploadResponse {
  job_id: string;
  message: string;
}
