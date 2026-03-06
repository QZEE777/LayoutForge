# Market Analysis tool — product spec

## Goal
AI analyzes competitor books so authors can see **key selling points and differentiation** for their own book in that market.

---

## How it would work

### 1. Scope: BSR-based market set
- User picks **genre/category** (or we derive it from their book/keywords).
- We define the “market” as **top books in that genre** — e.g. **top 3 subcategories ⇒ up to 6 books** (2 per subcategory, or configurable).
- So: “BSR market analysis” = we use **Best Seller Rank / category** to choose a small, curated set of **competitor titles** (e.g. 6 books) that represent the space.

### 2. Curated info per book
For each of those ~6 books we’d use **curated listing data** (from our own data pipeline or a compliant data source), e.g.:
- **Title, subtitle, author**
- **Product description / blurb**
- **BISAC / category**
- **BSR** (current or snapshot) and **category**
- **Keywords** (if available from the listing or our research)
- Optionally: **cover / positioning** notes (we don’t need to store images; we can describe “positioning” in the advisory).

So the “curated info” = **whatever we can reliably and compliantly get** (no scraping; use APIs or licensed/curated datasets) to feed the AI.

### 3. Outputs
- **Advisory report per book**  
  For each of the ~6 books: short AI summary — positioning, strengths, who it’s for, gaps. So the user sees “what’s already winning” and where the white space is.
- **Overall market summary**  
  Common themes, crowded angles, underserved angles, suggested differentiators.
- **Your differentiation**  
  A short, actionable “how to position your book” given the user’s input (title/blurb/niche) and the competitor set.

### 4. “Go to Clarify”
- After the report we offer a **“Go to Clarify”** (or “Continue in Clarify”) CTA.
- That would **open Clarify** (or your chosen AI chat product) with **context pre-loaded** (e.g. the advisory report + market summary) so the user can:
  - Ask follow-up questions
  - Refine positioning
  - Get copy suggestions
  - Drill into specific competitors
- Implementation: deep link or launch URL to Clarify with a prompt/fragment that references “this market analysis” or pastes a short summary so the conversation continues in context.

---

## Implementation notes
- **Data source**: Need a compliant way to get BSR/category + listing copy (e.g. Rainforest API, Keepa, or a curated snapshot). No direct Amazon scraping.
- **Genres**: Start with a fixed list of KDP genres/subcategories we support; later allow “paste ASINs” to define the competitor set.
- **Advisory tone**: Clear, actionable, “here’s what’s working and where you can stand out,” not generic fluff.

---

## Summary
| Piece | Intent |
|-------|--------|
| **BSR market** | Top of genre → e.g. top 3 subcats, ~6 books. |
| **Curated info** | Title, subtitle, description, category, BSR, keywords (from API/curated data). |
| **Per-book advisory** | Short report per competitor: positioning, strengths, gaps. |
| **Go to Clarify** | CTA that opens Clarify with report context for follow-up Q&A. |
