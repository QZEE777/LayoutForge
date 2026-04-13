"use client";

import { useRef, useState } from "react";

const VIDEO_SRC = "/hero-demo.mp4.mp4";

export default function HeroVideo() {
  const [activated, setActivated] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleActivate = async () => {
    setActivated(true);
    // Start playback immediately after explicit user click.
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => {
        // If browser blocks first play attempt, controls still allow manual play.
      });
    });
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.5)] bg-black">
      <div className="relative w-full min-h-[300px] sm:min-h-[340px] lg:min-h-[380px]">
        <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
          <p className="font-bebas text-2xl uppercase tracking-[0.08em] text-m2p-orange sm:text-3xl">
            HOW IT WORKS
          </p>
        </div>
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          controls
          playsInline
          preload={activated ? "metadata" : "none"}
          className="h-full w-full object-contain"
        />
        {!activated && (
          <button
            type="button"
            onClick={handleActivate}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/55 text-white transition hover:bg-black/45"
            aria-label="Play PDF checker demo video"
          >
            <span
              className="flex items-center justify-center rounded-full border-2 border-m2p-orange"
              style={{ width: 88, height: 88, background: "rgba(240,90,40,0.12)" }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <polygon points="6,4 20,12 6,20" fill="#F05A28" />
              </svg>
            </span>
            <span className="text-center px-8">
              <span className="block text-m2p-ivory font-bebas text-3xl tracking-wide">Play demo video</span>
              <span className="block text-m2p-ivory/70 text-sm mt-1">Click to start with audio</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
