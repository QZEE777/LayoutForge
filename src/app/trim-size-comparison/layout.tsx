import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KDP Trim Size Comparison — Compare All Standard Paperback Book Sizes",
  description:
    "Compare every KDP-supported trim size side by side. See dimensions, common use cases, and how each size affects your page count, spine width, and royalties.",
};

export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
