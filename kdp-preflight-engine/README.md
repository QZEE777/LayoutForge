# KDP Preflight Engine

A deterministic PDF validation service that checks whether a book interior PDF will pass **Amazon Kindle Direct Publishing (KDP)** paperback upload requirements before submission.

## Goal

- Accept a book interior PDF and return a **PASS/FAIL** report with detailed page-level validation errors.
- Use **deterministic** PDF parsing and rule validation (no generative AI).
- Architecture suitable for evolution into a SaaS platform with API integrations.

## Architecture

```
User Upload → Security Scan → PDF Parser → Document Analyzer → KDP Rules Engine → Validation Report → API Response
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11, FastAPI, PyMuPDF (fitz), Pydantic |
| Queue / Workers | Redis, Celery |
| Frontend | React, PDF.js, Canvas/SVG overlays |
| Storage | Cloudflare R2 or AWS S3 |
| Security | ClamAV, MIME validation, encrypted PDF reject, 100MB max, sandboxed processing |
| Deployment | Docker |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Accept PDF upload, store file, trigger validation job, return `job_id` |
| GET | `/status/{job_id}` | Return job processing status |
| GET | `/report/{job_id}` | Return validation report JSON |

### Validation Rules (25 KDP rules)

1. Minimum page count (24)
2. Maximum page count (828)
3. Consistent trim size
4. Allowed trim sizes (5×8, 5.25×8, 5.5×8.5, 6×9, 7×10, 8.5×11)
5. Bleed validation (0.125" beyond trim if used)
6. Inside gutter margin (by page count: 24–150 → 0.375", etc.)
7. Outside margin minimum (0.25")
8. Top margin minimum (0.25")
9. Bottom margin minimum (0.25")
10. Text outside trim
11. Image bleed validation
12. Image resolution (≥300 DPI)
13. Image color mode (RGB or Grayscale)
14. Embedded fonts
15. Minimum font size (7pt)
16. PDF version (1.4+)
17. Transparency flattening
18. Orientation consistency
19. Empty page detection
20. Image placement (margin zones)
21. Rotated pages (reject)
22. Restricted font embedding
23. Mixed page sizes
24. Trim box validation
25. Safe zone validation

### Project Structure

```
kdp-preflight-engine/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── config.py            # Settings
│   ├── api/
│   │   ├── upload.py
│   │   ├── status.py
│   │   ├── report.py
│   ├── core/
│   │   ├── pdf_parser.py
│   │   ├── document_analyzer.py
│   │   ├── kdp_rules_engine.py
│   │   ├── validation_report.py
│   ├── rules/
│   │   ├── __init__.py
│   │   ├── margin_rules.py
│   │   ├── font_rules.py
│   │   ├── image_rules.py
│   │   ├── page_rules.py
│   ├── tasks/
│   │   └── validate_pdf.py    # Celery task
│   ├── security.py
│   └── storage.py
├── frontend/                 # React + PDF.js (optional MVP)
├── docker-compose.yml
├── Dockerfile
├── Dockerfile.worker
└── README.md
```

## Setup

### Prerequisites

- Python 3.11+
- Redis
- Docker (optional)

### Local development

```bash
cd kdp-preflight-engine
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -e ".[dev]"

# Start Redis (e.g. Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Environment
cp .env.example .env
# Edit .env: REDIS_URL, R2/S3 credentials, CLAMAV_HOST (optional)

# Run API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run Celery worker (separate terminal)
celery -A app.tasks.validate_pdf worker -l info
```

### Docker

```bash
docker-compose up -d
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

## Security

- MIME type validated before processing (`application/pdf`).
- Encrypted PDFs rejected.
- Max file size: 100 MB.
- ClamAV scan on upload (when `CLAMAV_HOST` set).
- PDF processing runs in Celery worker (isolated from API).

## Logging

Structured logs (structlog) include: `upload_received`, `scan_passed`, `validation_started`, `validation_completed`.

## Visual error highlighting

Each issue in `page_issues` (and in `errors` / `warnings`) can include a `bbox` array `[x, y, width, height]` in PDF points. The frontend can overlay red (errors) or amber (warnings) rectangles on the PDF.js canvas or SVG layer for the given page using these coordinates.

## Extensibility

New rules can be added under `app/rules/` (e.g. `margin_rules.py`, `font_rules.py`, `image_rules.py`) and registered in `app/rules/__init__.py` (add to `ALL_RULES`). Each rule is a function `(doc: dict) -> list[dict]` with keys `page`, `rule_id`, `severity`, `message`, `bbox` (optional).

## Example report

See `examples/sample_report.json` for the validation report JSON shape.

## React frontend

A minimal React app in `frontend/` uploads PDFs, polls for the report, and displays the PDF with error/warning overlays (red/yellow rectangles from `page_issues[].bbox`). See **`frontend/README.md`** for setup, API base URL (`VITE_API_URL`), and bbox-to-screen coordinate mapping.

```bash
cd frontend && npm install && npm run dev
```

## Pre-push checklist

Before committing and pushing, run these locally so CI and deploys stay green:

**Backend**

```bash
cd kdp-preflight-engine
pip install -e .
python -c "from app.main import app; print('Backend OK')"
# Optional: pytest (if you add tests)
```

**Frontend**

```bash
cd kdp-preflight-engine/frontend
npm run build
```

If both succeed, it’s safe to commit and push.

## License

Proprietary. Part of manu2print / KDP tooling.
