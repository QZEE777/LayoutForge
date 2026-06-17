import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KDP Cover Size Calculator — Get Your Exact Paperback Cover Dimensions",
  description:
    "Free KDP cover size calculator. Enter your trim size and page count to get the exact full-cover dimensions including spine width and bleed — ready to hand to your designer or template.",
};

export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
