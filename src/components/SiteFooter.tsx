import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="bg-[#1A1208]">
      <div className="max-w-6xl mx-auto px-6 py-8 text-center">
        <Link href="/" className="inline-block">
          <span className="text-2xl text-[#F05A28]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>manu2print</span>
        </Link>
        <p className="text-sm text-[#6B6151] mt-2" style={{ fontFamily: "Inter, sans-serif" }}>Precision KDP formatting. Browser-based. Built by authors.</p>
        <p className="text-xs text-[#6B6151]/90 mt-1 italic max-w-md mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>Always exploring new ways to help authors launch more and stress less.</p>
      </div>
      <nav className="w-full py-4 px-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm" aria-label="Footer" style={{ fontFamily: "Inter, sans-serif" }}>
        <Link href="/legal" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">Legal</Link>
        <Link href="/terms" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">Terms &amp; Conditions</Link>
        <Link href="/privacy" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">Privacy Policy</Link>
        <Link href="/about" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">About</Link>
        <Link href="/founders" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">Founders</Link>
        <Link href="/affiliate" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">Affiliate</Link>
        <Link href="/faq" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">FAQ</Link>
        <Link href="/contact" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">Contact</Link>
        <Link href="/refunds" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">Refund Policy</Link>
        <Link href="/cookies" className="text-[#6B6151] hover:text-[#F05A28] transition-colors">Cookies</Link>
        <Link href="/platform/kdp" className="text-[#6B6151] hover:text-[#F05A28] transition-colors font-medium">Tools</Link>
      </nav>
      <div className="px-6 py-4 text-center text-xs text-[#6B6151]" style={{ fontFamily: "Inter, sans-serif" }}>
        <p>Your files are processed securely and never stored permanently.</p>
        <p className="mt-2">© 2026 manu2print. KDP &amp; Kindle tools for indie authors.</p>
      </div>
    </footer>
  );
}
