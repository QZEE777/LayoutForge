import type { Metadata } from "next";
import { Bebas_Neue, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import ToolPagesBanner from "@/components/ToolPagesBanner";

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
  title: "ScribeStack — KDP Manuscript Formatting",
  description: "Professional manuscript formatting for Amazon KDP. Upload DOCX or PDF. Get print-ready PDF with KDP specifications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${playfair.variable} ${inter.variable}`}>
      <body className="antialiased bg-slate-50 text-slate-900 font-sans">
        <ToolPagesBanner />
        {children}
      </body>
    </html>
  );
}
