# Smart Format — AI-Assisted Manuscript Formatting

**Memory deposit / fast-access spec.** One upload → AI reads the book → returns a formatting plan → app renders KDP/EPUB-ready output. Premium tier ($15–20). Standard format ($7) stays rules-based.

---

## Phase 1 rules (do not regress)

- **Colon-labels never headings:** Any line ending with `:` (e.g. "Primal Insight:") is never classified as a chapter/section heading; it stays as a body label so the label + following content stay in flow and can be kept together (keepNext).
- **Sentences never headings:** Lines that end with . ! ? (or ." .') or start with "I/My/We " (narrative) or contain em dash and end with period are never promoted to headings — e.g. "I grabbed an energy drink — my 'quick fix.'" stays body text.
- **Keep-together:** Colon label has keepNext; paragraph before a list has keepNext; **every list item has keepNext** (last bullet never alone at page bottom); list items have keepLines. Subheading-like (bold, <120 chars) has keepNext so no orphaned subhead at page bottom.
- **Widow/orphan:** Body paragraphs use `widowControl: true` so Word keeps lines together across page breaks where possible.
- **Spacing:** Body line 240 twips. Paragraph after: 96 (normal), 64 (short/list before), 32 (list), 72 (subheading-like), 12 (colon label). H2 sections: before 96, after 72. Two subheading-likes in a row: second gets before 48. Colon label: before 160, after 12.
- **List markers:** Bullet lists include • - * ▲ and U+2022 so triangular and other common bullets are treated as lists.

### Layout / pagination (memory — do not regress)

- **No orphaned subheads:** Subheading-like paragraphs (bold, short) get keepNext so they stay with the following block.
- **No last bullet alone:** Every list item gets keepNext so the final bullet in a group is never left at the bottom of a page with the rest on the next page, and bullets don't truncate at page edge.
- **Colon labels:** Keep with next; minimal gap after (12 twips) before following line.

---

## 1. Formatting plan (JSON schema)

The AI returns a single JSON object. The app uses this to drive the existing generator (no guessing; execute the plan).

```json
{
  "meta": {
    "detectedGenre": "nonfiction",
    "detectedLanguage": "en",
    "wordCount": 45000,
    "confidence": 0.92
  },
  "frontMatter": {
    "title": "From manuscript or user",
    "author": "From manuscript or user",
    "copyrightYear": 2025,
    "dedication": null,
    "epigraph": null
  },
  "chapters": [
    {
      "id": "ch1",
      "level": 1,
      "title": "CHAPTER ONE — The Awakening",
      "subtitle": null,
      "subSubtitle": null,
      "paragraphs": [
        {
          "type": "body",
          "text": "Full paragraph text.",
          "bold": false,
          "italic": false
        },
        {
          "type": "label",
          "text": "Primal Insight:"
        },
        {
          "type": "body",
          "text": "Italic quote content.",
          "italic": true
        },
        {
          "type": "list",
          "bullet": "•",
          "items": ["Item one.", "Item two."]
        },
        {
          "type": "callout",
          "text": "Short punchy callout.",
          "italic": true
        }
      ]
    }
  ]
}
```

**Paragraph types:** `body` | `label` (ends with `:`) | `list` | `callout` | `heading` (standalone H2/H3 in flow).  
**Chapter level:** `1` = chapter, `2` = section, `3` = subsection.  
App maps this 1:1 to existing `ParsedChapter` / `ParsedParagraph` and runs current DOCX/PDF generator.

---

## 2. API flow (single pipeline)

```
1. User uploads DOCX (or raw text) → stored, id returned.

2. Extract content for AI:
   - If DOCX: run existing parseDocxForKdp(buffer) → get raw structure + full text.
   - Or: mammoth → plain text + minimal structure; send text + optional hints to AI.

3. Call AI (provider-agnostic):
   - Input: full manuscript text (or chunks + summary), optional “hints” (e.g. “has numbered chapters”).
   - Prompt: “You are an expert book formatter. Given this manuscript, return a JSON formatting plan. Schema: …”
   - Output: JSON matching schema above (strict mode / response_format).

4. Validate & map:
   - Validate plan against schema; if invalid, retry or fall back to rules-based parse.
   - Map plan.chapters → ParsedContent.chapters (same shape as current parser output).

5. Generate:
   - content = { frontMatter: plan.frontMatter, chapters: mappedChapters, ... }
   - generateKdpDocx(content, config) or generateKdpPdf(content, config) — existing code.

6. Return: download link (DOCX or PDF) as today.
```

**Critical:** AI only produces the *plan*. All rendering (DOCX/PDF, spacing, margins, fonts) stays in the current app code.

---

## 3. AI provider strategy (Claude shutdown / alternatives)

**Design: provider-agnostic.** One interface: `getFormattingPlan(manuscriptText, options) → Promise<FormattingPlan>`. Implement for each provider; choose via env (e.g. `SMART_FORMAT_AI=claude|gemini|openai`).

| Provider   | Role      | Context / fit | Fallback |
|-----------|-----------|----------------|----------|
| **Claude** (Anthropic) | Primary   | Strong long-doc quality, good instruction-following. | If shutdown or quota: switch to Gemini or OpenAI. |
| **Gemini** (Google)    | Primary or fallback | 2M token context, cheap, fast; native doc APIs. Best cost/speed for very long books. | Ideal backup; can be primary. |
| **OpenAI** (GPT-4o)    | Fallback | 128K context, structured output, reliable. | Use if Claude + Gemini unavailable. |

**Recommendation:**  
- **Primary:** Claude (best perceived quality for “professional formatter” feel).  
- **Fallback:** Gemini (huge context, low cost; good for long manuscripts).  
- **Second fallback:** OpenAI (stable, good JSON mode).  

**Implementation:**  
- Env: `SMART_FORMAT_AI=claude`, `SMART_FORMAT_FALLBACK=gemini`, plus API keys per provider.  
- On failure/timeout: retry with fallback provider; if all fail, fall back to **rules-based** parse (current formatter) and optionally show “Smart Format unavailable; used standard format.”

---

## 4. Prompt (stub — use with any provider)

```
You are an expert book formatter for print and ebook. Given the following manuscript text, produce a JSON formatting plan.

RULES:
- Identify chapter titles (level 1), section headings (level 2), subsection headings (level 3).
- Detect labels (lines ending with ":") and keep them as type "label".
- Detect bullet/numbered lists; output as type "list" with items array.
- Short italic-only paragraphs after a label = callout (type "callout").
- Normal paragraphs = type "body"; preserve bold/italic where obvious.
- Output valid JSON only, matching the schema provided.

MANUSCRIPT:
---
{manuscriptText}
---

Return the JSON object and nothing else.
```

Use each provider’s **structured output** (e.g. JSON mode / response schema) so the response is always valid JSON.

---

## 5. Implementation checklist

- [ ] Define `FormattingPlan` TypeScript type from schema (in codebase).
- [ ] Add env: `SMART_FORMAT_AI`, `SMART_FORMAT_FALLBACK`, API keys (Claude, Gemini, OpenAI).
- [ ] Implement `getFormattingPlan()` for Claude (e.g. Messages API, structured output).
- [ ] Implement same for Gemini (and optionally OpenAI) as fallback.
- [ ] Add route: e.g. `POST /api/kdp-smart-format` (upload id + config); runs extract → AI plan → map → generate; returns same download flow as today.
- [ ] On AI failure: fall back to existing `parseDocxForKdp` and respond with “Standard format applied.”
- [ ] Pricing: Smart Format as premium option ($15–20); keep Standard at $7.

---

## 6. Where this lives in the repo

- **Spec / memory deposit:** `docs/SMART-FORMAT-SPEC.md` (this file).
- **Types:** e.g. `src/lib/smartFormatTypes.ts` (FormattingPlan, etc.).
- **AI adapters:** e.g. `src/lib/smartFormat/claude.ts`, `src/lib/smartFormat/gemini.ts`, `src/lib/smartFormat/openai.ts`, plus `src/lib/smartFormat/index.ts` (getFormattingPlan with fallback).
- **Mapping:** plan → ParsedContent in `src/lib/smartFormat/mapPlanToContent.ts`.
- **Route:** `src/app/api/kdp-smart-format/route.ts` (or similar).

---

*Retain this doc for fast access. Ship current formatter first; add Smart Format as Phase 2 premium.*
