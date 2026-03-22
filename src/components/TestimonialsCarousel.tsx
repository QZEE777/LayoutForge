"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

interface Testimonial {
  name: string;
  title: string;
  photo: string;
  text: string;
  stars: number;
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah M.",
    title: "Self-published author, 3 books",
    photo: "/testimonials/sarah.jpg",
    text: "I uploaded my manuscript and within minutes knew exactly why KDP kept rejecting it. Fixed the margin issue, re-uploaded, approved first time. Worth every cent.",
    stars: 5,
  },
  {
    name: "James R.",
    title: "Indie author, non-fiction",
    photo: "/testimonials/james.jpg",
    text: "I wasted two weeks going back and forth with KDP. One scan on manu2print showed me the trim size was wrong. Fixed in 10 minutes. Should have used this first.",
    stars: 5,
  },
  {
    name: "Linda K.",
    title: "Children's book author",
    photo: "/testimonials/linda.jpg",
    text: "The annotated PDF is brilliant — seeing the exact pages highlighted made fixing the issues so easy. No more guessing.",
    stars: 5,
  },
  {
    name: "David T.",
    title: "Publisher, 12+ titles",
    photo: "/testimonials/david.jpg",
    text: "I run multiple titles and this has become part of every pre-upload checklist. Saves hours of back-and-forth with KDP every month.",
    stars: 5,
  },
];

function InitialAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: 64,
        height: 64,
        backgroundColor: "#1A1208",
        border: "2px solid rgba(240,90,40,0.3)",
      }}
    >
      <span
        className="font-bebas text-2xl"
        style={{ color: "#F05A28", lineHeight: 1 }}
      >
        {initial}
      </span>
    </div>
  );
}

function AuthorPhoto({ photo, name }: { photo: string; name: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <InitialAvatar name={name} />;
  }

  return (
    <div className="flex-shrink-0" style={{ width: 64, height: 64 }}>
      <Image
        src={photo}
        alt={name}
        width={64}
        height={64}
        className="rounded-full object-cover"
        onError={() => setFailed(true)}
        unoptimized
      />
    </div>
  );
}

export default function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = testimonials.length;

  const goTo = useCallback(
    (index: number, dir: "next" | "prev") => {
      if (animating) return;
      setDirection(dir);
      setAnimating(true);
      setTimeout(() => {
        setCurrent(index);
        setAnimating(false);
      }, 280);
    },
    [animating]
  );

  const next = useCallback(() => {
    goTo((current + 1) % total, "next");
  }, [current, total, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + total) % total, "prev");
  }, [current, total, goTo]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    autoRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 5000);
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [total]);

  // Reset timer on manual navigation
  const handleNav = useCallback(
    (fn: () => void) => {
      if (autoRef.current) clearInterval(autoRef.current);
      fn();
      autoRef.current = setInterval(() => {
        setCurrent((c) => (c + 1) % total);
      }, 5000);
    },
    [total]
  );

  const t = testimonials[current];

  const slideStyle: React.CSSProperties = {
    transition: animating ? "opacity 0.28s ease, transform 0.28s ease" : "none",
    opacity: animating ? 0 : 1,
    transform: animating
      ? direction === "next"
        ? "translateX(18px)"
        : "translateX(-18px)"
      : "translateX(0)",
  };

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      {/* Card */}
      <div
        className="relative w-full max-w-[600px] mx-auto bg-white rounded-2xl shadow-md px-8 py-8"
        style={{ minHeight: 220 }}
      >
        {/* Decorative opening quote */}
        <span
          className="absolute top-4 left-6 font-bebas leading-none pointer-events-none"
          style={{ fontSize: "4rem", color: "#F05A28", opacity: 0.18, lineHeight: 1 }}
          aria-hidden
        >
          &ldquo;
        </span>

        <div style={slideStyle}>
          {/* Stars */}
          <div className="flex justify-center gap-0.5 mb-4">
            {Array.from({ length: t.stars }).map((_, i) => (
              <span key={i} style={{ color: "#F05A28", fontSize: "1.1rem" }}>
                ★
              </span>
            ))}
          </div>

          {/* Quote text */}
          <p
            className="italic text-m2p-ink leading-relaxed mb-6 text-center"
            style={{ fontSize: "0.9375rem" }}
          >
            &ldquo;{t.text}&rdquo;
          </p>

          {/* Author row */}
          <div className="flex items-center justify-center gap-4">
            <AuthorPhoto photo={t.photo} name={t.name} />
            <div className="text-left">
              <p
                className="font-bebas text-m2p-ink"
                style={{ fontSize: "1.125rem", lineHeight: 1.2 }}
              >
                {t.name}
              </p>
              <p className="text-m2p-muted text-xs mt-0.5">{t.title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls row — prev · dots · next */}
      <div className="flex items-center gap-5">
        {/* Prev */}
        <button
          type="button"
          onClick={() => handleNav(prev)}
          aria-label="Previous testimonial"
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: "#1A1208", color: "#FAF7EE" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F05A28")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1A1208")
          }
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Dots */}
        <div className="flex gap-2 items-center">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleNav(() => goTo(i, i > current ? "next" : "prev"))}
              aria-label={`Go to testimonial ${i + 1}`}
              className="rounded-full transition-all"
              style={{
                width: i === current ? 20 : 8,
                height: 8,
                backgroundColor: i === current ? "#F05A28" : "#6B6151",
                opacity: i === current ? 1 : 0.4,
                border: "none",
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={() => handleNav(next)}
          aria-label="Next testimonial"
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: "#1A1208", color: "#FAF7EE" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F05A28")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1A1208")
          }
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
