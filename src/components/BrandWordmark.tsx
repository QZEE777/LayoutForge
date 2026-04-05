import { cn } from "@/lib/utils";

const COLORS = {
  /** Cream / light backgrounds — manu coral, 2 ink black, print green */
  onLight: { manu: "#F05A28", two: "#1A1208", print: "#4cd964" },
  /** Dark backgrounds (footer, dark sections) — readable contrast */
  onDark: { manu: "#FF7A45", two: "#FAF7EE", print: "#4CE87A" },
} as const;

export interface BrandWordmarkProps {
  variant?: keyof typeof COLORS;
  className?: string;
}

/**
 * Canonical manu2print wordmark: manu · 2 · print (three colors).
 * Use onLight on ivory/cream/white; use onDark on near-black or saturated dark bands.
 */
export function BrandWordmark({ variant = "onLight", className }: BrandWordmarkProps) {
  const c = COLORS[variant];
  return (
    <span
      className={cn("inline-flex items-baseline tracking-tight font-black", className)}
      aria-label="manu2print"
    >
      <span style={{ color: c.manu }}>manu</span>
      <span style={{ color: c.two }}>2</span>
      <span style={{ color: c.print }}>print</span>
    </span>
  );
}
