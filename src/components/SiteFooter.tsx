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
        className="w-full py-4 px-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm border-t border-white/10"
        aria-label="Footer"
      >
        <Link href="/legal" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Legal</Link>
        <Link href="/terms" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Terms &amp; Conditions</Link>
        <Link href="/privacy" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Privacy Policy</Link>
        <Link href="/blog" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Blog</Link>
        <Link href="/blog" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Blog</Link>
        <Link href="/founders" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Founders</Link>
        <Link href="/partners/apply" className="text-m2p-orange font-semibold hover:opacity-80 transition-opacity">Partner Program</Link>
        <Link href="/partners" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">My Partner Dashboard</Link>
        <Link href="/faq" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">FAQ</Link>
        <Link href="/contact" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Contact</Link>
        <Link href="/refunds" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Refund Policy</Link>
        <Link href="/cookies" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors">Cookies</Link>
        <Link href="/platform/kdp" className="text-m2p-ivory/70 hover:text-m2p-orange transition-colors font-medium">Tools</Link>
      </nav>
      <div className="px-6 py-4 text-center text-xs text-m2p-ivory/50">
        <p>Your files are processed securely and never stored permanently.</p>
        <p className="mt-2">© 2026 manu2print. KDP &amp; Kindle tools for indie authors.</p>
      </div>
    </footer>
  );
}
