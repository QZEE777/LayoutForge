import type { Metadata } from "next";
import type { ReactNode } from "react";

const OG_IMAGE = "https://www.manu2print.com/api/og";

export const metadata: Metadata = {
  title: "KDP PDF Checker — Check Your Book Before Amazon Rejects It | manu2print",
  description:
    "Upload your KDP interior PDF and get a page-by-page compliance report in 90 seconds. Checks margins, trim size, bleed, font embedding, image resolution and 26 more rules. Fix before you upload.",
  keywords: [
    "KDP PDF checker",
    "Amazon KDP formatting",
    "KDP interior checker",
    "self-publishing tools",
    "KDP rejection fix",
    "PDF compliance check",
    "book formatting checker",
  ],
  openGraph: {
    title: "KDP PDF Checker — Does Your Book PDF Pass KDP?",
    description:
      "Get a free readiness score and page-by-page compliance report in 90 seconds. Trusted by indie authors publishing on Amazon KDP.",
    url: "https://www.manu2print.com/kdp-pdf-checker",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "manu2print KDP PDF Checker" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KDP PDF Checker — Does Your Book PDF Pass KDP?",
    description:
      "Free score. $9 for the full annotated report. 26 KDP rules checked in 90 seconds.",
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: "https://www.manu2print.com/kdp-pdf-checker",
  },
};

export default function KdpPdfCheckerLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
