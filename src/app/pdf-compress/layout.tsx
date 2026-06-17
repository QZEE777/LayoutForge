import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free PDF Compressor for KDP — Reduce File Size Without Losing Quality",
  description:
    "Free online PDF compressor built for KDP uploads. Shrink your manuscript file size without degrading image quality or text sharpness — no account required.",
};

export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
