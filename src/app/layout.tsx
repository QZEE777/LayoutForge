import type { Metadata } from "next";
import { Bebas_Neue, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import ToolPagesBanner from "@/components/ToolPagesBanner";

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

export const metadata: Metadata = {
  title: "KDP PDF Checker — Find Formatting Errors Before Amazon Rejects Your Book | manu2print",
  description:
    "Upload your PDF manuscript and get a full KDP compliance report in minutes. Check margins, trim size, bleed, and fonts before Amazon rejects your self-publishing PDF. $9, no subscription.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${playfair.variable} ${inter.variable}`}>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router: layout wraps all pages; next/font vars also used. */}
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-ivory text-amazon-navy font-sans">
        <ToolPagesBanner />
        {children}
      </body>
    </html>
  );
}
