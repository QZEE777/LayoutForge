import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KDP Page Number Formatter — Add and Style Page Numbers for Your Paperback",
  description:
    "Free KDP page number formatter. Choose your style, position, and starting page — get properly formatted page numbers that meet KDP interior requirements.",
};

export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
