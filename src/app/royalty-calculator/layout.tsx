import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KDP Royalty Calculator — See Your Actual Profit Per Book Before Publishing",
  description:
    "Free KDP royalty calculator. Enter your trim size, page count, and list price to see exactly what Amazon pays you per sale — and what print cost eats into your margin.",
};

export default function RoyaltyCalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
