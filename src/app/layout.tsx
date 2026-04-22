import type { Metadata } from "next";
import { Bebas_Neue, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
export const dynamic = "force-dynamic";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const OG_IMAGE = "https://www.manu2print.com/api/og";
const OG_TITLE = "KDP PDF Checker — Find Formatting Errors Before Amazon Rejects Your Book | manu2print";
const OG_DESC  = "Upload your PDF manuscript and get a full KDP compliance report in minutes. Check margins, trim size, bleed, and fonts before Amazon rejects your self-publishing PDF. $9, no subscription.";

export const metadata: Metadata = {
  title: OG_TITLE,
  description: OG_DESC,
  openGraph: {
    title: OG_TITLE,
    description: OG_DESC,
    url: "https://www.manu2print.com",
    siteName: "manu2print",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Would your PDF pass KDP? — manu2print" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: "Would your PDF pass KDP? Most don't. Check yours in 90 seconds.",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${playfair.variable} ${inter.variable}`}>
      <head>
        {/* Block AI training crawlers from indexing content for model training */}
        <meta name="robots" content="noai, noimageai" />
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        {/* LemonSqueezy affiliate tracking — attributes sales to affiliates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.lemonSqueezyAffiliateConfig = { store: "manu2print" };`,
          }}
        />
        <script src="https://lmsqueezy.com/affiliate.js" defer />
      </head>
      <body className="antialiased bg-m2p-ivory text-m2p-ink font-sans">
        {children}
        {/* Crisp chat widget — disabled until Manny AI backend is ready */}
        {/* <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `window.$crisp=[];window.CRISP_WEBSITE_ID="bf52e45d-8fda-489e-92da-395a9d08ae72";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`,
          }}
        /> */}
      </body>
    </html>
  );
}
