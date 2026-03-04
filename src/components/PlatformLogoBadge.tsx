"use client";

import AmazonLogo from "@/components/AmazonLogo";

/**
 * Platform logo badge. Amazon = squircle with wordmark + depth; others = circle with initial.
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
    size === "sm" ? "w-14 h-14" :
    size === "lg" ? "w-20 h-20" :
    size === "xl" ? "w-24 h-24" :
    "w-[72px] h-[72px]"; // md
  // Amazon wordmark is wide (viewBox 90×32); use width + h-auto so it keeps aspect ratio in the square badge.
  const amazonLogoClass =
    size === "sm" ? "w-[52px] h-auto" :
    size === "lg" ? "w-[76px] h-auto" :
    size === "xl" ? "w-[90px] h-auto" :
    "w-[60px] h-auto"; // md
  const logoSize =
    size === "sm" ? "w-[52px] h-[52px]" :
    size === "lg" ? "w-[76px] h-[76px]" :
    size === "xl" ? "w-[90px] h-[90px]" :
    "w-[60px] h-[60px]";

  const badgeClass =
    "rounded-2xl flex items-center justify-center flex-shrink-0 " +
    "shadow-lg ring-1 ring-black/[0.06] " +
    "bg-gradient-to-br from-white via-white to-gray-100 " +
    (isAmazon ? "" : "text-brand-gold font-bebas text-xl tracking-wide");

  return (
    <div
      className={`${sizeClass} ${badgeClass} ${className}`}
      role="img"
      aria-label={platformName}
    >
      {isAmazon ? (
        <AmazonLogo className={amazonLogoClass} />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
