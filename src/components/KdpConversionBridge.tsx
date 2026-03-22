import Link from "next/link";
import Image from "next/image";

export default function KdpConversionBridge() {
  return (
    <section className="mt-8 rounded-2xl bg-m2p-ink p-7 text-center">
      {/* Manny */}
      <div className="flex justify-center mb-4">
        <Image
          src="/MANNY AVATAR.png"
          alt="Manny"
          width={56}
          height={56}
          className="rounded-full opacity-90"
        />
      </div>
      <p className="font-bebas text-m2p-orange uppercase tracking-widest text-xs mb-2">
        Before You Upload to KDP
      </p>
      <h3 className="font-bebas text-m2p-ivory text-xl md:text-2xl leading-tight mb-3">
        This tool doesn&apos;t check if your PDF<br />will pass Amazon&apos;s review.
      </h3>
      <p className="text-m2p-ivory/60 text-sm max-w-md mx-auto mb-4 leading-relaxed">
        Most KDP rejections come from issues this tool doesn&apos;t detect:
      </p>
      <ul className="text-left max-w-xs mx-auto mb-6 space-y-1.5">
        {[
          "Margin violations",
          "Trim size mismatch",
          "Bleed errors",
          "Missing or unembedded fonts",
        ].map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm text-m2p-ivory/80">
            <span className="w-1.5 h-1.5 rounded-full bg-m2p-orange flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
      <Link
        href="/kdp-pdf-checker"
        className="inline-block bg-m2p-orange hover:bg-m2p-orange-hover text-white font-bold px-7 py-3.5 rounded-xl text-sm transition-colors shadow-[0_4px_20px_rgba(240,90,40,0.35)]"
      >
        Check My PDF — $9
      </Link>
      <p className="text-m2p-ivory/35 text-xs mt-3 max-w-xs mx-auto">
        Full KDP compliance report · exact page-level issues · before you submit
      </p>
    </section>
  );
}
