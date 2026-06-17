import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KDP Spine Width Calculator — Get the Exact Spine for Your Paperback Cover",
  description:
    "Free KDP spine width calculator. Enter your page count and paper type to get the exact spine width for your Amazon paperback cover template — no guesswork, no rejected covers.",
};

export default function SpineCalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
