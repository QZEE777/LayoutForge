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
            <Link href="/" className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#F5A623" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="#0F0D0B" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <span
                className="text-lg font-bold tracking-tight"
                style={{
                  color: "#FAF7F2",
                  textShadow: "0 0 24px rgba(250,247,242,0.25), 0 0 48px rgba(245,166,35,0.12)",
                }}
              >
                <span className="font-serif">manu</span>
                <span className="font-sans">2print</span>
              </span>
            </Link>
          </div>
        </header>
        <ToolPagesBanner />
        {children}
      </body>
    </html>
  );
}
