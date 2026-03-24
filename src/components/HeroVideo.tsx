"use client";

/**
 * HeroVideo — right-column hero section video loop.
 *
 * TO ACTIVATE:
 *   1. Record your Loom demo (upload → scan → grade card → annotated PDF)
 *   2. Export as MP4 (no audio needed for loop)
 *   3. Drop file into /public/hero-demo.mp4
 *   4. Set SHOW_PLACEHOLDER = false below
 *
 * The placeholder renders at the same dimensions so layout is preserved.
 */

const SHOW_PLACEHOLDER = true; // ← flip to false when video is ready
const VIDEO_SRC = "/hero-demo.mp4";

export default function HeroVideo() {
  if (!SHOW_PLACEHOLDER) {
    return (
      <div className="w-full max-w-[480px] mx-auto rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)] border border-white/10">
        <video
          src={VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto block"
        />
      </div>
    );
  }

  // ─── PLACEHOLDER ────────────────────────────────────────────────────────────
  return (
    <div
      className="w-full max-w-[480px] mx-auto rounded-2xl border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center gap-4"
      style={{ aspectRatio: "16/10", background: "rgba(255,255,255,0.04)" }}
    >
      {/* Play icon */}
      <div
        className="flex items-center justify-center rounded-full border-2 border-m2p-orange"
        style={{ width: 72, height: 72, background: "rgba(240,90,40,0.12)" }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <polygon points="6,4 20,12 6,20" fill="#F05A28" />
        </svg>
      </div>
      {/* Label */}
      <div className="text-center px-6">
        <p className="text-m2p-ivory font-bebas text-2xl tracking-wide">
          Demo coming soon
        </p>
        <p className="text-m2p-ivory/40 text-sm mt-1">
          Upload → Scan → Grade → Annotated PDF
        </p>
      </div>
      {/* Mock scan lines — visual interest */}
      <div className="w-4/5 space-y-2 px-2">
        {[85, 60, 75, 45, 90].map((w, i) => (
          <div key={i} className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${w}%`,
                background: i === 0 ? "#4cd964" : i === 3 ? "#F05A28" : "rgba(255,255,255,0.2)",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
