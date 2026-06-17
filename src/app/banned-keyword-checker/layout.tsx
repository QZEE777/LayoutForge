import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KDP Banned Keyword Checker — Find Risky Words Before Amazon Blocks Your Listing",
  description:
    "Free KDP banned keyword checker. Paste your book title, subtitle, or description and instantly flag words Amazon flags as problematic — before they block or suppress your listing.",
};

export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
