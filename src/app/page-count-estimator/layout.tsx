import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KDP Page Count Estimator — Estimate Book Pages Before Formatting",
  description:
    "Free KDP page count estimator. Enter your word count, trim size, and font size to estimate how many pages your paperback will have before you design your cover or set your price on Amazon.",
};

export default function PageCountEstimatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
