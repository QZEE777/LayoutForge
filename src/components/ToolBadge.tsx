"use client";

const styles = {
  live: {
    background: "#EAF7EE",
    color: "#2D8C4E",
    border: "1px solid #2D8C4E",
    text: "● LIVE",
  },
  free: {
    background: "#EAF7EE",
    color: "#2D8C4E",
    border: "1px solid #2D8C4E",
    text: "◆ FREE",
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
        fontWeight: 700,
        fontSize: "10px",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        borderRadius: "20px",
        padding: "3px 10px",
        background: s.background,
        color: s.color,
        border: s.border,
      }}
    >
      {s.text}
    </span>
  );
}
