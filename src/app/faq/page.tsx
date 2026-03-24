import React from "react";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div className="border-b border-m2p-border pb-4 mb-4 last:border-0 last:mb-0">
      <h3 className="text-m2p-ink font-semibold mb-2">{q}</h3>
      <div className="text-m2p-muted text-sm [&_a]:text-m2p-orange [&_a]:hover:underline">{a}</div>
    </div>
  );
}

export default function FAQPage() {
  return (
    <SiteShell>
      <section className="bg-m2p-ivory py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-bebas text-m2p-orange mb-2 uppercase tracking-[0.1em] text-sm">
            HELP
          </p>
          <h1 className="font-bebas text-m2p-ink leading-tight mb-2 text-[clamp(2rem,4vw,3rem)]">
            FAQ
          </h1>
          <p className="text-m2p-muted text-sm mb-10 max-w-2xl">
            Everything you need to know about the KDP PDF Checker and how manu2print works. Our assistant <strong className="text-m2p-ink">Manny</strong> uses this same knowledge — ask in chat when the widget is live.
          </p>

          {/* ── GENERAL ─────────────────────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-m2p-ink mb-4">General</h2>
            <FaqItem
              q="What is manu2print?"
              a="manu2print builds tools for indie authors and self-publishers. Our flagship tool is the KDP PDF Checker — it scans your interior PDF against Amazon KDP's exact formatting rules and shows you every issue before Amazon rejects your file."
            />
            <FaqItem
              q="What is Amazon KDP?"
              a="KDP stands for Kindle Direct Publishing. It's Amazon's self-publishing platform where authors upload their book files (interior PDF + cover) to sell paperbacks and Kindle eBooks. KDP has strict formatting rules — if your PDF doesn't meet them, Amazon rejects your upload."
            />
            <FaqItem
              q="Do I need an account to use the tool?"
              a="No account needed to run a check. You upload your PDF, pay $9, and get your report. We use your email to deliver the download link — that's it."
            />
            <FaqItem
              q="Is my manuscript safe? Will you share it or train AI on it?"
              a={<>Your file is processed to run the check and then deleted. We do not store manuscripts, share them, or use them to train AI models. See our <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms</Link> for full details.</>}
            />
            <FaqItem
              q="Does using the checker guarantee Amazon will approve my book?"
              a="No — and we won't lie to you about that. The checker finds the issues that cause the majority of KDP rejections. But Amazon's final review is theirs. Fix what we flag, re-upload, and your odds go up dramatically."
            />
          </section>

          {/* ── THE KDP PDF CHECKER ──────────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-m2p-ink mb-4">The KDP PDF Checker</h2>
            <FaqItem
              q="What does the KDP PDF Checker actually check?"
              a={
                <ul className="list-disc pl-4 space-y-1">
                  <li>Trim size — does your PDF match a KDP-supported size?</li>
                  <li>Margins and gutters — inside margin (gutter) wide enough for the spine?</li>
                  <li>Bleed — do full-bleed images extend the required 0.125″ beyond trim?</li>
                  <li>Font embedding — are all fonts embedded? (Missing fonts = rejection)</li>
                  <li>Image resolution — are interior images at least 300 DPI?</li>
                  <li>Color mode — interior must be RGB or greyscale, not CMYK for digital</li>
                  <li>Page count — odd/even issues, blank pages, chapter structure</li>
                  <li>PDF version and transparency — KDP-compatible PDF spec</li>
                </ul>
              }
            />
            <FaqItem
              q="What is the annotated PDF?"
              a="After the scan, you get a downloadable annotated PDF — your actual book with color-coded highlights on every problem page. Red highlights show critical issues (will cause rejection). Orange shows warnings. Green shows what passed. You see exactly which page has the problem and what it is."
            />
            <FaqItem
              q="What does the grade (A+, B, C, F) mean?"
              a="The grade is your overall KDP readiness score. A+ means your PDF is clean and ready to upload. A/B means minor issues to fix. C means real problems that will likely get flagged. F means critical issues — KDP will reject this file. Fix everything flagged, re-run, and aim for A or higher before uploading."
            />
            <FaqItem
              q="What is the 'creation tool' detection?"
              a="The checker identifies what software created your PDF — Word, Vellum, Canva, InDesign, etc. This matters because each tool has known KDP issues. If it detects you used Canva, for example, it adds Canva-specific fix instructions alongside each issue. You get targeted advice, not generic warnings."
            />
            <FaqItem
              q="How long does the scan take?"
              a="Usually under 2 minutes for most manuscripts. Larger files (300+ pages) may take 3–4 minutes. You'll see a progress indicator and get an email with your download link when it's ready."
            />
            <FaqItem
              q="Can I run the checker on a cover PDF?"
              a="No — the KDP PDF Checker is for interior manuscript PDFs only. Cover dimensions have different rules (spine width, full wrap, DPI). Use our Spine Calculator and Cover Calculator for cover sizing."
            />
            <FaqItem
              q="My PDF looks fine in my PDF viewer. Why is it failing?"
              a="PDF viewers like Preview and Adobe Reader are forgiving — they hide problems that KDP's automated system catches. Missing embedded fonts, wrong color profiles, and bleed issues are invisible to viewers but cause instant rejection on upload. That's exactly why this tool exists."
            />
            <FaqItem
              q="Will the checker fix my PDF for me?"
              a="No. The checker finds and shows you what's wrong. Fixing it means going back to your source file (Word, InDesign, Vellum, etc.) and correcting the issue, then exporting a new PDF. We tell you exactly what to fix and how."
            />
          </section>

          {/* ── FILE & UPLOAD ───────────────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-m2p-ink mb-4">File &amp; upload</h2>
            <FaqItem
              q="What file format do I upload?"
              a="PDF only. The checker does not accept DOCX, Word files, or ePub. Export your manuscript as a PDF from your design software first."
            />
            <FaqItem
              q="What is the maximum file size?"
              a="50 MB. Most manuscript PDFs are well under this. If yours is over 50 MB, try reducing image resolution (300 DPI is enough for KDP print) or compressing images before re-exporting."
            />
            <FaqItem
              q="How do I export a PDF from Word for KDP?"
              a={
                <span>
                  In Word: File → Save As → PDF. In the save dialog, click <em>Options</em> and check &quot;ISO 19005-1 compliant (PDF/A)&quot; — this ensures fonts are embedded. Do not use &quot;Print to PDF&quot; from the system print dialog; it often misses font embedding.
                </span>
              }
            />
            <FaqItem
              q="How do I export a PDF from Vellum?"
              a="In Vellum, choose Print → Generate Print PDF. Use the KDP preset if available. Vellum generally produces clean PDFs, but the checker will flag any issues with your specific file and settings."
            />
            <FaqItem
              q="Can I use a scanned PDF?"
              a="No. A scanned PDF is an image — there's no actual text or layout data to analyze. The checker requires a real text-based PDF exported from your design software."
            />
            <FaqItem
              q="My upload is stuck or shows an error. What do I do?"
              a="Make sure the file is a real PDF (not renamed from another format), under 50 MB, and that your internet connection is stable. Try a different browser if the issue persists. If it still won't upload, contact us."
            />
          </section>

          {/* ── PRICING & PACKS ─────────────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-m2p-ink mb-4">Pricing &amp; packs</h2>
            <FaqItem
              q="How much does it cost?"
              a={
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Single scan — $9.</strong> One PDF, one full report. No subscription.</li>
                  <li><strong>Author Pack — $19.</strong> 3 scans. Good for one book with revision rounds.</li>
                  <li><strong>Indie Pack — $39.</strong> 10 scans. For authors with multiple titles or frequent revisions.</li>
                  <li><strong>Pro Pack — $79.</strong> 30 scans. For publishers, formatters, or high-volume authors.</li>
                </ul>
              }
            />
            <FaqItem
              q="Why should I buy a pack instead of a single scan?"
              a="Most authors go through 2–4 revision rounds before their PDF is clean. You fix issues, re-export, and re-check. A pack costs less per scan and covers the full revision cycle without paying $9 each time."
            />
            <FaqItem
              q="Do packs expire?"
              a="No expiry. Your scans are yours to use whenever you need them."
            />
            <FaqItem
              q="Is there a subscription?"
              a="No. Every option is a one-time purchase. No monthly fees, no auto-renew."
            />
            <FaqItem
              q="How do I pay?"
              a="Payment is processed by Lemon Squeezy (our payment provider). They accept all major credit and debit cards. You're redirected to their checkout and returned to manu2print after payment."
            />
            <FaqItem
              q="I paid but can't download. What do I do?"
              a="After payment you're redirected to a success page that unlocks your download. If it's still locked, wait 30 seconds and refresh — the payment webhook can lag slightly. If it's still not working after a minute, use the Contact page and include the email you used to pay."
            />
            <FaqItem
              q="Can I get a refund?"
              a={<>If the tool failed to deliver a report (technical error on our end), contact us and we'll refund or re-run it. We don't refund because the report found issues — that means it worked. See our <Link href="/refunds">Refund Policy</Link>.</>}
            />
          </section>

          {/* ── KDP BASICS ──────────────────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-m2p-ink mb-4">KDP basics</h2>
            <FaqItem
              q="Why did Amazon reject my PDF?"
              a={
                <span>
                  The most common KDP rejection reasons:
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Fonts not fully embedded in the PDF</li>
                    <li>Margins or gutter (inside margin) too small for your page count</li>
                    <li>Trim size not matching a KDP-supported size</li>
                    <li>Bleed missing or incorrect for full-bleed images</li>
                    <li>Images below 300 DPI (blurry print quality)</li>
                    <li>Wrong PDF color profile for the interior type</li>
                    <li>PDF spec version not compatible with KDP's system</li>
                  </ul>
                  The checker catches all of these.
                </span>
              }
            />
            <FaqItem
              q="What is bleed and do I need it?"
              a="Bleed is an extra 0.125 inches (3.175 mm) of content beyond the trim edge on sides that will be cut. If your design has background colors, images, or graphics that go to the edge of the page, you need bleed. If your interior is standard text on white — no bleed needed. KDP rejects files that have full-bleed graphics without proper bleed set up."
            />
            <FaqItem
              q="What is gutter margin?"
              a="The gutter is the inside margin — the space between your text and the spine. KDP requires a larger gutter for thicker books because pages get harder to read near the binding. The minimum gutter depends on your page count. The checker will flag if yours is too small."
            />
            <FaqItem
              q="What does 'font not embedded' mean?"
              a="Every font used in your PDF needs to be baked in (embedded) so KDP can render it correctly on their system. If a font isn't embedded, KDP either rejects the file outright or substitutes a different font — which changes your layout. Fix: go back to your design software and re-export with font embedding enabled."
            />
            <FaqItem
              q="What trim sizes does KDP support for paperbacks?"
              a="KDP supports standard sizes including 5×8, 5.06×7.81, 5.5×8.5, 6×9, 6.14×9.21, 6.69×9.61, 7×10, 7.44×9.69, 7.5×9.25, 8×10, 8.25×6, 8.25×8.25, 8.5×8.5, 8.5×11. The most common for novels and non-fiction is 6×9. The checker verifies your PDF matches a supported size."
            />
            <FaqItem
              q="What DPI should my interior images be?"
              a="300 DPI minimum for print. KDP will warn or reject files with images below 300 DPI. Your cover needs 300 DPI as well. Screen-resolution images (72–96 DPI) will look blurry in print."
            />
          </section>

          {/* ── SUPPORT & MANNY ─────────────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-m2p-ink mb-4">Support &amp; Manny</h2>
            <FaqItem
              q="What is Manny?"
              a="Manny is our AI assistant built for self-publishing questions. He knows KDP formatting rules, the checker tool, pricing, and common author mistakes. When the chat widget is live on the site, ask him instead of reading this FAQ. He'll also direct you to support if he can't help."
            />
            <FaqItem
              q="How do I contact support?"
              a={<>Use the <Link href="/contact">Contact page</Link>. For payment or access issues, include the email you used at checkout and describe what happened. We'll get back to you fast.</>}
            />
            <FaqItem
              q="I'm not tech-savvy. Can I still use this?"
              a="Yes. Upload your PDF, pay, get your report. The annotated PDF highlights the exact pages with issues. The report tells you what to fix in plain English. If you're stuck, contact us or ask Manny."
            />
            <FaqItem
              q="Do you offer formatting services (done-for-you)?"
              a="Not currently. The tools are self-serve. If there's enough demand, we'll add a formatting service. Use the Contact page to let us know you're interested."
            />
          </section>

          <p className="text-sm text-m2p-muted mt-8">
            Something missing? <Link href="/contact" className="text-m2p-orange hover:underline">Contact us</Link>. For policies, see <Link href="/legal" className="text-m2p-orange hover:underline">Legal</Link>.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
