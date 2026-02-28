import type { Metadata } from "next";
import Link from "next/link";
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
  title: "manu2print — KDP Manuscript Formatting",
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
        <header className="w-full border-b border-white/10" style={{ backgroundColor: "#111111" }}>
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center">
            <Link
              href="/"
              className="inline-block text-2xl font-bold tracking-tight font-serif"
              style={{
                color: "#FAF7F2",
                textShadow: "0 0 24px rgba(250,247,242,0.2), 0 0 48px rgba(245,166,35,0.08)",
              }}
            >
              manu2print
            </Link>
          </div>
        </header>
        <ToolPagesBanner />
        {children}
      </body>
    </html>
  );
}
