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
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-m2p-orange focus-visible:ring-offset-2 font-bebas text-lg text-m2p-ink cursor-pointer border-b border-m2p-border"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "18px",
                cursor: "pointer",
                padding: "18px 0",
                width: "100%",
                textAlign: "left",
                background: "none",
              }}
            >
              {item.question}
            </button>
            <div
              className="text-m2p-muted"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "15px",
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
