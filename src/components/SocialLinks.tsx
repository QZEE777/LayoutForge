"use client";

// ─── Update href values as each account goes live ──────────────────────────
const SOCIALS = [
  {
    id: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/manu2print",
    path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
  },
  {
    id: "x",
    label: "X",
    href: "", // TODO: add URL when live
    // X (Twitter) logo path
    path: "M4 4l16 16M4 20L20 4",
    isX: true,
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "", // TODO: add URL when live
    path: "M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "", // TODO: add URL when live
    path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  },
] as const;

interface SocialLinksProps {
  variant?: "dark" | "light";
  size?: "sm" | "md";
}

export default function SocialLinks({ variant = "dark", size = "md" }: SocialLinksProps) {
  const iconSize   = size === "sm" ? 16 : 18;
  const buttonSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const base       = variant === "dark"
    ? "text-white/70 border-white/20 hover:bg-m2p-orange hover:border-m2p-orange hover:text-white"
    : "text-m2p-ink/60 border-m2p-border hover:bg-m2p-orange hover:border-m2p-orange hover:text-white";

  const liveSocials = SOCIALS.filter((s) => s.href);
  if (!liveSocials.length) return null;

  return (
    <div className="flex items-center gap-2">
      {liveSocials.map(({ id, label, href, path, ...rest }) => {
        const isX = "isX" in rest && rest.isX;
        return (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Follow us on ${label}`}
            title={`Follow us on ${label}`}
            className={`${buttonSize} inline-flex shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${base}`}
          >
            <svg
              width={iconSize}
              height={iconSize}
              viewBox="0 0 24 24"
              fill={isX ? "none" : "currentColor"}
              stroke={isX ? "currentColor" : "none"}
              strokeWidth={isX ? 2.5 : 0}
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d={path} />
            </svg>
          </a>
        );
      })}
    </div>
  );
}
