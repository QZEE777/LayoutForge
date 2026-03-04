"use client";

import AmazonLogo from "@/components/AmazonLogo";

/**
 * Circular badge for platform logo. Used on homepage platform boxes and platform pages.
 * Amazon KDP = name logo inside circle; other platforms = initial inside circle.
 * Same shape for all brands for consistent design.
 */
export default function PlatformLogoBadge({
  platformId,
  platformName,
  size = "md",
  className = "",
}: {
  platformId: string;
  platformName: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const isAmazon = platformId === "kdp";
  const initial = platformName.charAt(0);

  const sizeClass =
    size === "sm" ? "w-12 h-12" :
    size === "lg" ? "w-20 h-20" :
    size === "xl" ? "w-24 h-24" :
    "w-16 h-16"; // md = larger default for homepage
  const logoSize =
    size === "sm" ? "w-8 h-8" :
    size === "lg" ? "w-12 h-12" :
    size === "xl" ? "w-14 h-14" :
    "w-10 h-10"; // md: logo fills circle well

  const circleClass = isAmazon
    ? "rounded-full bg-white flex items-center justify-center flex-shrink-0 text-black shadow-sm ring-1 ring-black/5"
    : "rounded-full bg-brand-cardHover flex items-center justify-center flex-shrink-0 text-xl font-bebas tracking-wide text-brand-gold border border-brand-cardHover";

  return (
    <div
      className={`${sizeClass} ${circleClass} ${className}`}
      role="img"
      aria-label={platformName}
    >
      {isAmazon ? (
        <AmazonLogo className={logoSize} />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
