import type { ReactNode } from "react";
import "./dashboard.css";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="m2p-dash fixed inset-0 z-50 overflow-hidden">
      {children}
    </div>
  );
}
