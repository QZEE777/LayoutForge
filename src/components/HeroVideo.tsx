"use client";

import { useRef, useState } from "react";

const VIDEO_SRC = "/hero-demo.mp4.mp4";
const END_CTA_SECONDS = 6;

export default function HeroVideo() {
  const [activated, setActivated] = useState(false);
  const [showEndCta, setShowEndCta] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const updateEndCtaVisibility = () => {
    const video = videoRef.current;
    if (!video || !activated) {
      setShowEndCta(false);
      return;
    }
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      setShowEndCta(false);
      return;
    }
    const remaining = duration - video.currentTime;
    setShowEndCta(remaining <= END_CTA_SECONDS && remaining > 0.25);
  };

  const handleActivate = async () => {
    setActivated(true);
    setShowEndCta(false);
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
        {!activated && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
            <p className="font-bebas text-2xl uppercase tracking-[0.08em] text-m2p-orange sm:text-3xl">
              HOW IT WORKS
            </p>
          </div>
        )}
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          controls
          playsInline
          preload={activated ? "metadata" : "none"}
          onTimeUpdate={updateEndCtaVisibility}
          onSeeked={updateEndCtaVisibility}
          onPlay={updateEndCtaVisibility}
          onEnded={() => setShowEndCta(false)}
          className="h-full w-full object-contain"
        />
        {activated && showEndCta && (
          <a
            href="/kdp-pdf-checker"
            className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-xl bg-black/90 px-5 py-2.5 text-center font-bebas text-xl uppercase tracking-[0.06em] text-m2p-orange shadow-[0_6px_20px_rgba(0,0,0,0.45)] ring-1 ring-m2p-orange/70 transition hover:brightness-110"
          >
            Check my PDF
          </a>
        )}
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
