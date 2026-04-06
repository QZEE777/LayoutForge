"use client";

const styles = {
  live: {
    background: "#E6F9E9",
    color: "#4cd964",
    border: "1px solid #4cd964",
    text: "● LIVE",
  },
  free: {
    background: "linear-gradient(135deg, rgba(45,106,45,0.16) 0%, rgba(76,217,100,0.24) 100%)",
    color: "#1A6B2A",
    border: "1px solid rgba(45,106,45,0.45)",
    text: "FREE",
  },
  "coming-soon": {
    background: "#F0EDE6",
    color: "#7A6E5F",
    border: "1px solid #7A6E5F",
    text: "◌ COMING SOON",
  },
} as const;

export default function ToolBadge({ status }: { status: "live" | "free" | "coming-soon" }) {
  const s = styles[status];
  return (
    <span
      className="shadow-sm"
      style={{
        fontFamily: "Inter, sans-serif",
        fontWeight: 800,
        fontSize: "10px",
        letterSpacing: "0.11em",
        textTransform: "uppercase",
        borderRadius: "20px",
        padding: "4px 11px",
        background: s.background,
        color: s.color,
        border: s.border,
        boxShadow: status === "free" ? "0 3px 12px rgba(45,106,45,0.18), inset 0 1px 0 rgba(255,255,255,0.35)" : undefined,
      }}
    >
      {s.text}
    </span>
  );
}
