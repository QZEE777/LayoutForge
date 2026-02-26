"use client";

import { usePathname } from "next/navigation";
import UsageBanner from "./UsageBanner";

const TOOL_PATHS = [
  "/kdp-formatter",
  "/kdp-formatter-pdf",
  "/keyword-research",
  "/keyword-research-pdf",
  "/description-generator",
  "/description-generator-pdf",
  "/pdf-compress",
  "/tools/pdf-compress",
  "/epub-maker",
  "/royalty-calculator",
  "/upload",
];

export default function ToolPagesBanner() {
  const pathname = usePathname();
  const isToolPage = TOOL_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isToolPage) return null;
  return <UsageBanner />;
}
