import Link from "next/link";
import Image from "next/image";
import { BrandWordmark } from "@/components/BrandWordmark";
import SocialLinks from "@/components/SocialLinks";

export default function SiteFooter() {
  return (
    <footer className="bg-m2p-ink">
      <div className="max-w-6xl mx-auto px-6 py-10 text-center">
        {/* Logo — matches navbar: Manny avatar + wordmark */}
        <Link href="/" className="inline-flex items-center gap-2 justify-center">
          <Image
            src="/manny-avatar.png"
            alt="Manny"
            width={48}
            height={48}
            className="rounded-full"
          />
          <BrandWordmark variant="onDark" className="text-xl" />
        </Link>
        <p className="text-sm text-m2p-ivory mt-3">
          Precision KDP compliance tools. Browser-based. Built by authors.
        </p>
        <p className="text-xs text-m2p-ivory/70 mt-1 italic max-w-md mx-auto">
          Always exploring new ways to help authors launch more and stress less.
        </p>
        <div className="mt-5 flex flex-col items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-m2p-ivory/40">Follow Us</p>
          <SocialLinks variant="dark" size="md" />
        </div>
      </div>
      <nav
        className="w-full py-5 px-6 border-t border-white/10"
        aria-label="Footer"
      >
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-x-10 gap-y-6 text-sm">

          {/* Tools */}
          <div className="flex flex-col gap-2 items-center sm:items-start">
            <p className="text-[10px] font-bold uppercase tracking-widest text-m2p-ivory/40 mb-1">Tools</p>
            <Link href="/kdp-pdf-checker" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">KDP PDF Checker</Link>
            <Link href="/spine-calculator" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Spine Calculator</Link>
            <Link href="/royalty-calculator" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Royalty Calculator</Link>
            <Link href="/page-count-estimator" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Page Count Estimator</Link>
            <Link href="/title-metadata-check" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Title &amp; Metadata Check</Link>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-2 items-center sm:items-start">
            <p className="text-[10px] font-bold uppercase tracking-widest text-m2p-ivory/40 mb-1">Legal</p>
            <Link href="/privacy" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Terms &amp; Conditions</Link>
            <Link href="/refunds" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Refund Policy</Link>
            <Link href="/cookies" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Cookies</Link>
          </div>

          {/* Support */}
          <div className="flex flex-col gap-2 items-center sm:items-start">
            <p className="text-[10px] font-bold uppercase tracking-widest text-m2p-ivory/40 mb-1">Support</p>
            <Link href="/blog" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Blog</Link>
            <Link href="/contact" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Contact</Link>
          </div>

        </div>
      </nav>
      <div className="px-6 py-4 text-center text-xs text-m2p-ivory/50">
        <p>Your files are processed securely and never stored permanently.</p>
        <p className="mt-2">© 2026 manu2print. KDP &amp; Kindle tools for indie authors.</p>
      </div>
    </footer>
  );
}
