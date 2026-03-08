import Link from "next/link";

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div className="border-b border-soft-border pb-4 mb-4 last:border-0 last:mb-0">
      <h3 className="text-amazon-navy font-semibold mb-2">{q}</h3>
      <div className="text-soft-muted text-sm [&_a]:text-brave [&_a]:hover:underline">{a}</div>
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-ivory px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-brave hover:underline text-sm font-medium mb-6 inline-block">
          ← manu2print
        </Link>
        <h1 className="font-bebas text-3xl text-amazon-navy mb-2">FAQ</h1>
        <p className="text-soft-muted text-sm mb-10">
          Frequently asked questions about our tools, files, payment, and KDP. Our assistant <strong className="text-amazon-navy">Manny</strong> uses this same info — you can ask in chat when the widget is available.
        </p>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-amazon-navy mb-4">General</h2>
          <FaqItem
            q="What is manu2print?"
            a="manu2print is a set of tools for indie authors and publishers. We focus on Amazon KDP and Kindle: formatting manuscripts, checking PDFs, keyword research, description generation, calculators, and guides."
          />
          <FaqItem
            q="Do I need an account?"
            a="Most free tools work without signing in. Paid tools and some flows use your email. You can create an account to save your profile (e.g. first name). Sign-in is via magic link (email)."
          />
          <FaqItem
            q="Where do I find all the tools?"
            a={<>Go to the <Link href="/">homepage</Link> or <strong>Tools</strong> in the footer — that&apos;s the KDP &amp; Kindle hub. You&apos;ll see free and paid tools listed there.</>}
          />
          <FaqItem
            q="What file formats do you accept?"
            a="PDF tools accept PDF only, up to 50 MB (Print Ready Check up to 100 MB). DOCX tools accept DOCX only, up to 50 MB. Export from Word as DOCX or Save as PDF; re-export if you get a wrong-format error."
          />
          <FaqItem
            q="My file won't upload. What do I do?"
            a="Usually the file is too large (over 50 MB for most tools, or 100 MB for Print Ready Check) or the wrong format. Use a standard PDF or DOCX; keep images around 300 DPI for print. Try exporting again and re-uploading."
          />
          <FaqItem
            q="Do you store my manuscript?"
            a={<>We process files to run the tool. We do not store your manuscript permanently. See our <Link href="/privacy">Privacy Policy</Link> for details.</>}
          />
          <FaqItem
            q="Does using your tools guarantee my book will be approved by KDP?"
            a="No. Our tools help you prepare content to KDP's specs. Final approval is always up to Amazon."
          />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-amazon-navy mb-4">Free tools</h2>
          <FaqItem
            q="What free tools do you have?"
            a={<>PDF Compressor, PDF Print Optimizer, KDP Royalty Calculator, Page Count Estimator, Trim Size Comparison, Spine calculator, Full-wrap cover calculator, KDP interior template, Banned keyword checker, Kids book trim guide, Journals &amp; coloring guide. All on the <Link href="/">homepage</Link> and <Link href="/platform/kdp">Tools</Link>.</>}
          />
          <FaqItem
            q="Is the PDF Compressor really free?"
            a="Yes. We ask for your email; compression runs in your browser. Your file never uploads to our server."
          />
          <FaqItem
            q="What is the PDF Print Optimizer for?"
            a={<>It shrinks and print-optimizes a PDF in your browser. For your actual KDP interior upload, use your original high-res file or our <Link href="/kdp-formatter">KDP Formatter (DOCX)</Link>. Don't replace your final interior with the optimizer output.</>}
          />
          <FaqItem
            q="What is the banned keyword checker?"
            a="You paste title, subtitle, or description. We check against words and phrases that often cause issues on KDP. It's a sanity check — Amazon doesn't publish a full list."
          />
          <FaqItem
            q="What does the spine calculator do?"
            a="You enter page count, paper type, and trim size; it gives spine width and full-wrap cover dimensions for KDP paperbacks. Use it with the cover calculator for Canva or other design tools."
          />
          <FaqItem
            q="What is the interior template?"
            a="You pick trim size and we give you a PDF with the exact trim and safe zone (margins and gutter). Use it in Canva or similar so nothing gets cut off."
          />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-amazon-navy mb-4">Paid tools</h2>
          <FaqItem
            q="How much do paid tools cost?"
            a="$7 per use or $27 for 6 months (unlimited use of paid tools in that period). Price is on each paid tool page."
          />
          <FaqItem
            q="What is the KDP Formatter (DOCX)?"
            a={<>You upload a DOCX manuscript. We format it for KDP print (trim, margins, bleed) and give you a <Link href="/kdp-formatter">print-ready PDF</Link>.</>}
          />
          <FaqItem
            q="What is Print Ready Check (KDP PDF Checker)?"
            a={<>You upload your interior PDF. We run it against KDP's rules and give a pass/fail report with highlights. Use it before you upload to KDP. <Link href="/kdp-pdf-checker">Print Ready Check</Link> accepts PDFs up to 100 MB.</>}
          />
          <FaqItem
            q="What is 7 Keyword Research?"
            a="We extract text from your manuscript (DOCX or PDF) and use AI to suggest 7 KDP keyword phrases. Use the DOCX version for DOCX, PDF version for PDF."
          />
          <FaqItem
            q="What is the Description Generator?"
            a="We generate an Amazon listing package: book description (KDP-ready HTML), author bio template, SEO keywords, BISAC suggestions. DOCX version takes DOCX; PDF version takes PDF."
          />
          <FaqItem
            q="What is KDP Format Review?"
            a="You paste or upload your manuscript (DOCX or PDF). We give an AI format review: KDP readiness and top fixes. It doesn't change your file."
          />
          <FaqItem
            q="What is the Kindle EPUB Maker?"
            a="You provide your manuscript and we output a Kindle-ready EPUB for eBook publishing."
          />
          <FaqItem
            q="I paid but can't download. What do I do?"
            a="After payment you're redirected to a success page that unlocks the download. If still locked, wait a moment and refresh — the webhook can be a few seconds behind. If it's still locked, use the Contact page; we can verify your payment and unlock if needed."
          />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-amazon-navy mb-4">File &amp; upload</h2>
          <FaqItem
            q="What is the maximum file size?"
            a="Most tools: 50 MB for PDF or DOCX. Print Ready Check: up to 100 MB PDF."
          />
          <FaqItem
            q="Why do I get 'wrong format' or 'invalid file'?"
            a="DOCX tools accept only .docx; PDF tools accept only .pdf. Export from Word as Word Document (.docx) or Save As PDF. Don't rename a different file type."
          />
          <FaqItem
            q="Can I use a PDF with the Description Generator or Keyword Research?"
            a="Yes, if you use the PDF version of that tool. The DOCX versions accept only DOCX."
          />
          <FaqItem
            q="My PDF is from a scan. Will it work?"
            a="Keyword and description tools work best with text-based PDFs. Scanned or image-only PDFs may not extract text well."
          />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-amazon-navy mb-4">Payment &amp; refunds</h2>
          <FaqItem
            q="How do I pay?"
            a={<>Payment is through Lemon Squeezy. You can pay $7 per use or $27 for 6 months. You're redirected to their checkout; after payment you return to our site to download.</>}
          />
          <FaqItem
            q="What if I want a refund?"
            a={<>Refunds are handled per our <Link href="/refunds">Refund Policy</Link> and Lemon Squeezy's policy. Use <Link href="/contact">Contact</Link> to request.</>}
          />
          <FaqItem
            q="Does the 6-month pass cover all paid tools?"
            a="Yes. The 6-month option gives access to all paid tools for that period, subject to our current terms."
          />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-amazon-navy mb-4">KDP basics</h2>
          <FaqItem
            q="What trim sizes does KDP support?"
            a={<>KDP supports many trim sizes. Use our <Link href="/trim-size-comparison">Trim Size Comparison</Link> and <Link href="/kids-trim-guide">Kids book trim guide</Link>.</>}
          />
          <FaqItem
            q="What is bleed?"
            a="Bleed is extra area beyond the trim so full-bleed images don't show white edges when the book is cut. Our KDP Formatter and interior template help you set it up."
          />
          <FaqItem
            q="What DPI should my interior be?"
            a="KDP recommends 300 DPI for interior images. Keep your source images at good resolution."
          />
          <FaqItem
            q="Where do I get my cover dimensions?"
            a={<>Use our <Link href="/spine-calculator">Spine width calculator</Link> and <Link href="/cover-calculator">Full-wrap cover calculator</Link> (inches and 300 DPI pixels for Canva).</>}
          />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-amazon-navy mb-4">Support &amp; Manny</h2>
          <FaqItem
            q="Who do I contact for help?"
            a={<>Use the <Link href="/contact">Contact</Link> page. For payment or access issues, include the email you used to pay and what happened.</>}
          />
          <FaqItem
            q="What is Manny?"
            a="Manny is our in-product AI assistant. It can answer questions about our tools, file limits, pricing, and how to use the site. When the chat widget is available, you can ask Manny instead of reading this FAQ. For issues it can't resolve, it will direct you to support."
          />
        </section>

        <p className="text-sm text-soft-muted mt-8">
          Something missing? <Link href="/contact" className="text-brave hover:underline">Contact us</Link>. For legal and policies, see <Link href="/legal" className="text-brave hover:underline">Legal</Link>.
        </p>
      </div>
    </div>
  );
}
