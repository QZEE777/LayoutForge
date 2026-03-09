"use client";

import { useState } from "react";

type Item = { question: string; answer: string };

export default function FAQAccordion({ items }: { items: Item[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-[720px]">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "18px",
                color: "#1A1208",
                cursor: "pointer",
                borderBottom: "1px solid #E0D8C4",
                padding: "18px 0",
                width: "100%",
                textAlign: "left",
                background: "none",
              }}
            >
              {item.question}
            </button>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "15px",
                color: "#6B6151",
                padding: "12px 0 18px",
                overflow: "hidden",
                transition: "max-height 0.3s ease",
                maxHeight: isOpen ? "400px" : "0",
              }}
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
