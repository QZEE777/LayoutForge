# KDP Format Review — rendering with KDP params + what else is possible + OpenClaw/skills

(This doc extends `KDP-FORMAT-REVIEW-APP.md`.)

---

## Actually rendering the manuscript with KDP parameters in place

You **already** render manuscripts with full KDP parameters in this codebase:

- **Flow:** DOCX upload → `parseDocxForKdp()` → `ParsedContent` (chapters, paragraphs, front matter, estimated page count) → `generateKdpPdf(content, config)` → PDF with trim size, gutter (`getGutterInches`), margins, front matter, TOC, running headers, body.
- **Where:** `kdpPdfGenerator.ts` + `kdp-format-docx` (and docx-preview) API routes.

So "render with KDP params" is **already implemented for DOCX**. To support **paste or raw text** you need **text → ParsedContent**:

- **Option A (simple):** Heuristic: split on "Chapter" / "##" / double newlines; first block = title/author, rest = chapters; build minimal `ParsedContent` → `generateKdpPdf`.
- **Option B (AI):** One Claude call: "Return JSON: { frontMatter, chapters: [ { title, paragraphs } ] }" from manuscript text; map to `ParsedContent` → `generateKdpPdf`.

**Doable extension:** After the AI format review, add **"Preview with KDP settings"**: same text → ParsedContent (simple or AI) → `generateKdpPdf` → show or download a **preview PDF** (e.g. first 50 pages) so the user sees the manuscript with real trim, gutter, and margins. Reuses your existing engine; no new renderer.

---

## What else is possible (exploration)

| Idea | Doable? | Notes |
|------|--------|--------|
| **Live preview with KDP params** | Yes | text → ParsedContent → `generateKdpPdf`; show PDF in iframe or link; cap pages. |
| **Multiple trim sizes** | Yes | Run `generateKdpPdf` for 5×8, 6×9; show "How it looks at 6×9 vs 5×8" (page count + sample). |
| **AI review + "Fix and re-export"** | Partial | Changing the user's DOCX is hard; simpler: AI report + "Preview with KDP" so they fix the source themselves. |
| **Paste → AI structure → render** | Yes | Claude returns JSON structure; map to `ParsedContent` → `generateKdpPdf`. |
| **Format review + preview bundle** | Yes | One product: paste/upload → AI report **and** "Preview PDF" (first N pages with KDP params). |
| **Export preview as PDF** | Yes | `generateKdpPdf` returns bytes; offer "Download sample (first 20 pages)". |

---

## OpenClaw / skills bank — access, adopt, adapt?

**What OpenClaw is:** Reusable AI agent skills (SKILL.md, workflows) in registries:

- **ClawHub** (clawhub.ai) — publish, version, search skills; vector search.
- **ClawSkills** (clawskills.me) — 5,524+ skills; install via `npx clawskills@latest install [skill-name]`.
- **OpenClawSkill** (openclawskill.ai) — no-code skill creation from natural language.
- Cursor integration: e.g. `npx playbooks add skill openclaw/skills --skill cursor-agent`.

**Can I (the assistant) access OpenClaw directly?** I can't run `npx clawskills install` or query ClawHub from here. I **can**:

1. **Look up** what a skill does (from the web).
2. **Adopt/adapt** the idea — e.g. read a skill description and rewrite it as your KDP Format Review prompt or flow.
3. **Use your local Cursor skills** — you have `.cursor/skills-cursor/` (create-rule, create-skill, update-cursor-settings, migrate-to-skills, create-subagent). I can read and follow those when you ask to create a rule or skill.

**Practical way to adopt OpenClaw:** Browse ClawHub/ClawSkills for useful skills (e.g. document structuring, format review); install one locally if you want; **adapt** its instructions into your app (e.g. turn a "review document" SKILL.md into the system prompt for your Format Review API). The value is in prompt design and workflow; you don't need a runtime dependency on OpenClaw.

---

## Your local Cursor skills (in this workspace)

Available under `.cursor/skills-cursor/` (and plugins):

- **create-rule** — Create Cursor rules for persistent AI guidance.
- **create-skill** — Guide for creating Agent Skills (SKILL.md format).
- **update-cursor-settings** — Modify Cursor/VSCode user settings (settings.json).
- **migrate-to-skills** — (if present) migration to skills.
- **create-subagent** — (if present) subagent creation.
- Vercel plugin skill (vercel-react-best-practices) in plugins cache.

I can use these when you ask (e.g. "create a rule for KDP formatting" or "create a skill for format review"). OpenClaw's bank is external; you install those yourself and we adapt the ideas into your app.
