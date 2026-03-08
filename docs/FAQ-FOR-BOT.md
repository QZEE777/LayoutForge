# FAQ — Knowledge base for AI assistant (Manny)

**Purpose:** This file is the canonical FAQ for the in-product AI assistant. Integrate this content (and `PRODUCT-FACTS.md`) into the bot’s context so it can answer with minimal human support. Keep answers concise and accurate; do not invent features or URLs.

**Bot name:** **Manny** — the manu2print in-product assistant. (See `docs/AI-ASSISTANT-NAME-AND-SETUP.md`.)

---

## General

**Q: What is manu2print?**  
manu2print is a set of tools for indie authors and publishers. We focus on Amazon KDP and Kindle: formatting manuscripts, checking PDFs, keyword research, description generation, calculators, and guides. Site: https://www.manu2print.com (or your deployment URL).

**Q: Do I need an account?**  
Most free tools work without signing in. Paid tools and some flows (e.g. download after payment) use your email. You can create an account to save your profile (e.g. first name for emails). Sign-in is via magic link (email).

**Q: Where do I find all the tools?**  
Go to the homepage or **Tools** in the footer — that’s the KDP & Kindle hub. You’ll see free tools (e.g. PDF Compressor, calculators, banned keyword checker) and paid tools (KDP Formatter, Print Ready Check, Keyword Research, Description Generator, etc.).

**Q: What file formats do you accept?**  
PDF tools accept **PDF only**, up to **50 MB** (Print Ready Check up to 100 MB). DOCX tools accept **DOCX only**, up to **50 MB**. Export from Word as DOCX or “Save as PDF” from your app; re-export if you get a wrong-format error.

**Q: My file won’t upload. What do I do?**  
Usually the file is too large (over 50 MB for most tools, or over 100 MB for Print Ready Check) or the wrong format. Use a standard PDF or DOCX; keep images around 300 DPI for print. Try exporting again and re-uploading.

**Q: Do you store my manuscript?**  
We process files to run the tool (e.g. format, check, extract text). We do not store your manuscript permanently. See our Privacy Policy for details.

**Q: Does using your tools guarantee my book will be approved by KDP?**  
No. Our tools help you prepare content to KDP’s specs. Final approval is always up to Amazon. We don’t guarantee KDP acceptance.

---

## Tools — Free

**Q: What free tools do you have?**  
PDF Compressor (shrink PDFs, no account); PDF Print Optimizer (shrink/optimize PDF in browser); KDP Royalty Calculator; Page Count Estimator; Trim Size Comparison; Spine width calculator; Full-wrap cover calculator; KDP interior template (PDF with trim + safe zone for Canva); Banned keyword checker (title/subtitle/description); Kids book trim guide; Journals, coloring & puzzle guide. All linked from the homepage and Tools.

**Q: Is the PDF Compressor really free?**  
Yes. We ask for your email; compression runs in your browser. Your file never uploads to our server. No payment required.

**Q: What is the PDF Print Optimizer for?**  
It shrinks and print-optimizes a PDF in your browser. It’s for getting a smaller or crisper copy. For your actual KDP interior upload, use your original high-resolution file or create a print-ready PDF with our KDP Formatter (DOCX). Don’t replace your final interior with the optimizer output.

**Q: What is the banned keyword checker?**  
You paste your title, subtitle, or book description. We check against a list of words and phrases that often cause issues on KDP. It’s a sanity check — Amazon doesn’t publish a full list, so we can’t guarantee approval.

**Q: What does the spine calculator do?**  
You enter page count, paper type, and trim size; it gives you spine width and full-wrap cover dimensions for KDP paperbacks. Use it with the cover calculator for Canva or other design tools.

**Q: What is the interior template?**  
You pick trim size and we give you a PDF with the exact trim and safe zone (margins and gutter). Use it in Canva or similar to design your interior so nothing gets cut off.

---

## Tools — Paid

**Q: How much do paid tools cost?**  
Paid tools are **$7 per use** or **$27 for 6 months** (unlimited use of paid tools during that period). Price is shown on each paid tool page before you start.

**Q: What is the KDP Formatter (DOCX)?**  
You upload a DOCX manuscript. We format it for KDP print (trim size, margins, bleed, etc.) and give you a print-ready PDF. Use it if you write in Word and want a PDF that meets KDP’s interior specs.

**Q: What is Print Ready Check (KDP PDF Checker)?**  
You upload your interior PDF. We run it against KDP’s rules (trim, margins, bleed, resolution, page count, etc.) and give you a pass/fail report with on-page highlights. Use it before you upload to KDP. Accepts PDFs up to 100 MB.

**Q: What is 7 Keyword Research?**  
We extract text from your manuscript (DOCX or PDF, depending on which tool you use) and use AI to suggest 7 KDP keyword phrases. There’s a DOCX version and a PDF version — use the one that matches your file type.

**Q: What is the Description Generator?**  
We generate an Amazon listing package from your manuscript: book description (KDP-ready HTML), author bio template, SEO keywords, BISAC suggestions. DOCX version takes DOCX; PDF version takes PDF. Check the tool page for which input it expects.

**Q: What is KDP Format Review?**  
You paste or upload your manuscript (DOCX or PDF). We give you an AI format review: KDP readiness and top fixes. It doesn’t change your file; it tells you what to fix.

**Q: What is the Kindle EPUB Maker?**  
You provide your manuscript and we output a Kindle-ready EPUB. For publishing to Kindle (eBook). Coming soon or available depending on release.

**Q: What is Market Analysis?**  
AI analyzes competitor books to help you see positioning and differentiation. May include a “Go to Clarify” style follow-up. Check the product page for current status (coming soon or live).

**Q: I paid but can’t download. What do I do?**  
After payment you’re redirected to a success page that unlocks the download. If the download is still locked, wait a moment and refresh — sometimes the webhook is a few seconds behind. If it’s still locked after a short wait, use the Contact page or support email; we can verify your payment and unlock manually if needed.

**Q: Do you have a beta or discount?**  
We sometimes offer beta codes or promotions. Check the tool page or payment step for a “Beta code” or discount field. No guarantee of future pricing.

---

## File & upload

**Q: What is the maximum file size?**  
Most tools: **50 MB** for PDF or DOCX. **Print Ready Check (KDP PDF Checker):** up to **100 MB** PDF. KDP itself allows larger interiors; we cap uploads for stability.

**Q: Why do I get “wrong format” or “invalid file”?**  
DOCX tools accept only .docx; PDF tools accept only .pdf. Export from Word as “Word Document (.docx)” or “Save As” PDF. Don’t rename a different file type to .pdf or .docx.

**Q: Can I use a PDF with the Description Generator or Keyword Research?**  
Yes, if you use the **PDF** version of that tool (Description Generator PDF, 7 Keyword Research PDF). The DOCX versions accept only DOCX.

**Q: My PDF is from a scan / image-based. Will it work?**  
Keyword and description tools work best with text-based PDFs. Scanned or image-only PDFs may not extract text well. Use a text-based export when you can.

---

## Payment & refunds

**Q: How do I pay?**  
Payment is through Lemon Squeezy (our payment provider). You can pay **$7 per use** or **$27 for 6 months**. You’ll be redirected to their checkout; after payment you return to our site to download.

**Q: What if I want a refund?**  
Refunds are handled according to our Refund Policy and Lemon Squeezy’s policy. See the Refund Policy page and Contact for how to request.

**Q: Does the 6-month pass cover all paid tools?**  
Yes. The 6-month option gives you access to all paid tools for that period (e.g. Formatter, Print Ready Check, Keyword Research, Description Generator, Format Review, etc.), subject to our current terms.

---

## KDP basics (helpful context for users)

**Q: What trim sizes does KDP support?**  
KDP supports many trim sizes. We have a Trim Size Comparison tool and a Kids book trim guide. Use our calculators to see print cost and royalty by trim.

**Q: What is bleed?**  
Bleed is extra area beyond the trim so that full-bleed images don’t show white edges when the book is cut. Our KDP Formatter and interior template help you set up bleed correctly.

**Q: What DPI should my interior be?**  
KDP recommends 300 DPI for interior images. Our tools assume standard KDP specs; keep your source images at good resolution.

**Q: Where do I get my cover dimensions?**  
Use our **Spine width calculator** (page count + paper + trim → spine width) and **Full-wrap cover calculator** (front + spine + back in inches and 300 DPI pixels). Designed for Canva and similar tools.

---

## Support & assistant

**Q: Who do I contact for help?**  
Use the **Contact** page on the site. For payment or access issues, include the email you used to pay and what happened. We don’t promise a human reply for every message; our AI assistant (Manny) can answer most product and how-to questions.

**Q: What is Manny?**  
Manny is our in-product AI assistant. It can answer questions about our tools, file limits, pricing, and how to use the site. It uses this FAQ and product facts. For legal, threats, or issues it can’t resolve, it will direct you to support.

**Q: Does Manny have access to my files or account?**  
Manny only has the information you provide in the chat and the public product/FAQ knowledge. It does not see your uploaded files or password. Don’t send sensitive data in chat.

---

## Escalation (for the bot)

- **Legal, threats, or abuse:** Do not engage. Direct the user to official support (e.g. support@ or Contact page). Use the LEGAL_OR_THREAT template from `docs/UI-AND-BACK-OFFICE.md` §6.5.
- **Bug or persistent failure:** Acknowledge, give troubleshooting steps from this FAQ. If the user has already tried those, suggest Contact with details (tool, what they did, what they saw).
- **Feature request:** Thank them; do not promise any feature or roadmap. Keep the reply short.
- **Pricing or roadmap:** Do not speculate. Point to the tool page or say “I don’t have that information yet” if needed.

---

*Update this file when you add tools, change limits, pricing, or support channels. The bot should use this plus PRODUCT-FACTS.md and the persona in UI-AND-BACK-OFFICE.md §6.4–6.6.*
