# manu2print / LayoutForge Operating Rules

This is a live SaaS product.

## Product
manu2print is a publishing compliance platform for indie authors.
Current product: KDP PDF Checker.
Roadmap: IngramSpark, B&N, and other retailer checkers using the same engine.

Core flow:
Upload PDF → store file → create scan job → process PDF → generate score/report → paywall → unlock full report.

## Execution Rule
Claude Code is the primary code execution tool.
cto.new is used for planning, task breakdown, and situational awareness only.

Do not execute the same task in both tools.

## Protected Areas
Do not modify these unless explicitly instructed:
- upload pipeline
- Cloudflare R2 storage
- Supabase job logic
- Railway worker
- FastAPI preflight engine
- payment/credit system
- PDF annotation engine

## Safe Areas
These may be changed when scoped:
- UI copy
- styling
- tracking scripts
- landing pages
- non-critical components

## Change Rules
- Preserve working functionality.
- Do not refactor without instruction.
- Do not modify unrelated files.
- Do not add dependencies unless approved.
- Always show changed files before commit.
- Commit only after approval.
