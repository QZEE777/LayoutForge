import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "LayoutForge — KDP Manuscript Formatting",
  description: "Professional manuscript formatting for Amazon KDP. Upload PDF, DOCX, or EPUB. Get print-ready PDF with KDP specifications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased bg-slate-50 text-slate-900">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
