import type { Metadata } from "next";
import type { ReactNode } from "react";

const OG_IMAGE = "https://www.manu2print.com/api/og";

export const metadata: Metadata = {
  title: "Partner Program — Earn 40% Commission Promoting KDP Tools | manu2print",
  description:
    "Join the manu2print partner program. Earn 30–40% commission on every sale. Promote the KDP PDF Checker to your audience of indie authors and self-publishers. Free to join. Monthly payouts via LemonSqueezy.",
  keywords: [
    "KDP affiliate program",
    "self-publishing affiliate",
    "manu2print partners",
    "author tools affiliate",
    "KDP tools commission",
  ],
  openGraph: {
    title: "Partner Program — Earn 40% Promoting KDP Tools",
    description:
      "Refer indie authors to manu2print and earn up to $31.60 per sale. 12-month attribution cookie, no minimums, automatic payouts.",
    url: "https://www.manu2print.com/partners",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "manu2print Partner Program" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Partner Program — Earn 40% Commission | manu2print",
    description: "Free to join. 40% commission. 12-month cookie. Promote to indie authors.",
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: "https://www.manu2print.com/partners",
  },
};

export default function PartnersLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
