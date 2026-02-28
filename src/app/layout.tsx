import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="manu2print"
                width={150}
                height={60}
                className="h-auto max-w-[150px] object-contain"
              />
            </Link>
          </div>
        </header>
        <ToolPagesBanner />
        {children}
      </body>
    </html>
  );
}
