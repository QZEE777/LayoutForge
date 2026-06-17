import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KDP Banned Keyword Checker — Spot Risky Words in Your Title Before Publishing",
  description:
    "Free KDP banned keyword checker. Paste your book title, subtitle, or description and instantly flag words Amazon flags as problematic — before they block your listing.",
};

export default function TitleMetadataCheckLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
