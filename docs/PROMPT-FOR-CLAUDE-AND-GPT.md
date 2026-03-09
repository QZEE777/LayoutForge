# Prompt for Claude and ChatGPT — MVP Analysis & App Foundation Report

**Use this entire block as your prompt.** Optionally paste in or attach the contents of `MVP-TOOL-SUMMARY-AND-QUESTIONS.md` (in the same repo under `docs/`) so the model has full context.

---

## PROMPT START — copy from here

I’m building a web app (manu2print.com) for self-publishing authors. The **MVP** is one main tool: **KDP PDF Checker + Formatter**.

**What we want the MVP to do**

1. **Scan:** Author uploads a PDF of their book. The app runs a full KDP (Amazon Kindle Direct Publishing) compliance check: trim size, page count, margins, bleed, and other print rules. The author gets a clear pass/fail report and a list of issues and recommendations.

2. **Show problems on the PDF:** When possible, the author sees their PDF online with **annotations or highlights** on each page showing exactly where each issue is (e.g. margin too small on page 12, wrong trim on page 1). This only works today for smaller files (under 4 MB) because of how we host the app; larger files get the report but not the visual overlay.

3. **Fix (target state):** We want the app to **fix** the PDF automatically where it can: correct margins, bleed, trim, and common mistakes authors make in tools like Canva — while **keeping their content and design intact**. Author gets a “before vs after” idea (e.g. preview of first 30 pages + a “what we fixed” report), then pays once to download the **full optimized PDF** ready to upload to KDP.

4. **Pay once, get the right downloads:** One payment (e.g. by page count or flat fee) should cover: (a) the annotated “problem” PDF (or report) so they can fix things themselves if needed, and (b) the final, KDP-optimized PDF after they re-upload or we auto-fix. So: 2 scans / 2 downloads, 1 payment is the idea we’re testing.

5. **Pricing we’re considering:** Instead of one flat price for every book, we’re thinking of pricing by **page count** (e.g. 1–100 pages = $10, 101–200 = $15, 201–300 = $20). We need the tool to support its own price points and logic.

**What I need from you**

Please analyze this product and produce a **complete app foundation report** that covers:

1. **MVP scope**  
   What the MVP should do in plain language (user goals, not just features). What’s in scope for a first “beta” vs what should wait.

2. **End-to-end flow**  
   Step-by-step: from the moment the author lands on the site to the moment they have their report, annotated PDF (when available), and/or fixed PDF. Include where payment and any “second upload” fit in.

3. **Components**  
   List every part of the system (frontend pages, APIs, external services, databases, file storage, background jobs) and what each one does. Use simple names and one-line descriptions so a non-technical person can follow.

4. **Software and services we need**  
   What we need to run this reliably: hosting (e.g. Vercel, Render), database, payments, file storage, any queue or worker for long-running checks. For each: why we need it and what happens if it’s missing or misconfigured.

5. **Where AI fits (if at all)**  
   Where we might use AI (e.g. for “format review” suggestions, smart fixes, or explaining issues). What the AI would need (inputs, outputs, safety, cost). What can work without AI for the first version.

6. **Current gaps and risks**  
   What’s missing or fragile today (e.g. file size limits, no visual preview for large files, no real “PDF fix” yet). What could break or confuse users. Prioritized list of fixes for a solid foundation.

7. **Recommendations**  
   Your top 3–5 recommendations for: (a) making the flow clear and reliable, (b) choosing pricing (flat vs page-count vs both), (c) what to build first so the app feels “complete” for beta.

If I’ve provided a separate document (e.g. MVP-TOOL-SUMMARY-AND-QUESTIONS.md) with more technical detail on flow, file size, and preview issues, use it to make your analysis accurate. If not, answer from this prompt alone and note where you’re inferring.

Output the report in clear sections with short paragraphs or bullet lists. Avoid unnecessary jargon; when you use technical terms, define them in one line. The goal is a single document we can use to align the team and decide next steps.

## PROMPT END — copy to here

---

**After you run the prompt:** You can paste the model’s reply into a doc (e.g. `APP-FOUNDATION-REPORT.md`) or share it with your team. Use the same prompt in both Claude and ChatGPT to compare and build consensus.
