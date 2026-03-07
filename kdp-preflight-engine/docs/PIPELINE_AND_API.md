# KDP Preflight Engine — Pipeline & API

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser / Frontend)                          │
└─────────────────────────────────────────────────────────────────────────────────┘
    │                                    │                                    │
    │ POST /upload                        │ GET /status/{job_id}                │ GET /report/{job_id}
    │ (PDF file)                          │ (poll until completed)              │ (full ValidationReport)
    ▼                                    ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FastAPI (app/main.py)                                │
│  • SlowAPIMiddleware + limiter (5/minute on POST /upload)                         │
│  • CORS, 429 handler for RateLimitExceeded                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
    │
    │ upload: validate MIME/size → store file → security_checks → set_status(pending)
    │         → validate_pdf_task.delay(job_id, path) → return { job_id }
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Redis (broker + result backend)                      │
│  • Celery broker_url / result_backend                                             │
│  • job_store: status (pending|processing|completed|failed), report (JSON)         │
└─────────────────────────────────────────────────────────────────────────────────┘
    │
    │ Celery worker consumes validate_pdf_task
    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Celery Task (validate_pdf_task)                      │
│  1. set_status(processing)                                                        │
│  2. file_hash = compute_sha256(path)   // 8KB chunks                              │
│  3. file_size = path.stat().st_size                                               │
│  4. doc = analyze_document(path)       // may raise ActiveContentError,           │
│                                        //         ResourceLimitError              │
│  5. errors, warnings, rules_checked = run_validation(doc)                         │
│  6. report = build_report(..., file_hash, file_size, ruleset_version)             │
│  7. set_report(job_id, report); set_status(completed)                             │
└─────────────────────────────────────────────────────────────────────────────────┘
    │
    │ analyze_document: load_document (PyMuPDF) → _check_active_content
    │                  → _check_resource_limits → parse pages → analysis
    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PDF pipeline (core/)                                 │
│  • pdf_parser: load_document, _check_active_content, _check_resource_limits      │
│  • document_analyzer: analyze_document (trim_width_in, trim_height_in, etc.)      │
│  • kdp_rules_engine: run_validation(ALL_RULES), RULESET_VERSION                   │
│  • validation_report: bbox_to_xywh [x0,y0,x1,y1]→[x,y,w,h], build_report          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## API Endpoints & Data Flow

| Method | Endpoint | Purpose | Data flow |
|--------|----------|---------|-----------|
| **POST** | `/upload` | Upload PDF and start validation | Body: multipart file → validate MIME/size → store → security checks → enqueue Celery task → **Response:** `{ "job_id": "..." }` |
| **GET** | `/status/{job_id}` | Poll job status | Redis: status, message; if completed, attach full report → **Response:** `JobStatus` (job_id, status, message, report?) |
| **GET** | `/report/{job_id}` | Get validation report only | Redis: report JSON → **Response:** `ValidationReport` (file_hash, file_size, ruleset_version, status, errors, warnings, summary, page_issues) |

## ValidationReport Schema (relevant fields)

- **file_hash**: SHA256 hex (8KB chunk hashing).
- **file_size**: Bytes (from `path.stat().st_size`).
- **ruleset_version**: e.g. `"kdp_preflight_v1.0.0"`.
- **status**: `"PASS"` | `"FAIL"`.
- **errors** / **warnings**: Lists of `PageIssue` (page, rule_id, severity, message, **bbox**).
- **summary**: total_pages, error_count, warning_count, rules_checked.
- **page_issues**: All issues combined (for UI); **bbox** is `[x, y, width, height]` in PDF points (converted from [x0,y0,x1,y1] by `bbox_to_xywh`).

## Confirmation Summary

- **FastAPI + Redis + Celery**: Wired (upload enqueues task; worker runs validation; Redis stores status/report).
- **PDF parsing**: PyMuPDF in `pdf_parser`; document analysis and **26 rules** (including `KDP_TRIM_PROFILE`) in `ALL_RULES`; `run_validation` runs all rules and collects errors/warnings.
- **ValidationReport**: Includes file_hash, file_size, ruleset_version, errors, warnings, page_issues, summary; bbox is ** [x, y, w, h]**.
- **No destructive changes** to existing rules, report structure, or bbox handling when adding trim rule, limits, or rate limiting.
