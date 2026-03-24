"""Pydantic schemas for API and validation reports."""
from pydantic import BaseModel, Field


class PageIssue(BaseModel):
    """A single validation issue with page and optional bounding box."""
    page: int
    rule_id: str
    severity: str  # "ERROR" | "WARNING"
    message: str
    bbox: list[float] | None = None  # [x, y, width, height] in points


class ValidationSummary(BaseModel):
    """Summary counts for the report."""
    total_pages: int = 0
    error_count: int = 0
    warning_count: int = 0
    rules_checked: int = 0


class ScoreGrade(BaseModel):
    """KDP Rejection Risk Score grade metadata."""
    grade: str = "F"           # A+, A, B, C, D, F
    label: str = ""            # e.g. "KDP Ready"
    description: str = ""      # one-line explanation


class ValidationReport(BaseModel):
    """Full validation report returned by GET /report/{job_id}."""
    file_hash: str = ""
    file_size: int = 0
    ruleset_version: str = "kdp_preflight_v2.0.0"
    status: str                # "PASS" | "FAIL"
    readiness_score: int = 0   # 0–100
    approval_likelihood: int = 0
    score_grade: ScoreGrade = Field(default_factory=ScoreGrade)
    creation_tool: str = "unknown"  # detected from PDF metadata
    errors: list[PageIssue] = Field(default_factory=list)
    warnings: list[PageIssue] = Field(default_factory=list)
    summary: ValidationSummary = Field(default_factory=ValidationSummary)
    page_issues: list[PageIssue] = Field(default_factory=list, description="All issues with page + bbox for UI")


class JobStatus(BaseModel):
    """Job status returned by GET /status/{job_id}."""
    job_id: str
    status: str  # "pending" | "processing" | "completed" | "failed"
    message: str | None = None
    report: ValidationReport | None = None  # present when status == "completed"


class UploadResponse(BaseModel):
    """Response for POST /upload."""
    job_id: str
    message: str = "Upload received. Validation started."
