"use client";

/** Pure SVG + center button overlay. size = viewBox width/height, default 420. */
export default function TargetGraphic({ size = 420 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const pageW = size * 0.75;
  const pageH = size * 0.95;
  const pageX = (size - pageW) / 2;
  const pageY = (size - pageH) / 2;
  const safeInset = size * 0.06;
  const innerInset = size * 0.08;
  const centerR = size * 0.12;

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
        aria-hidden
      >
        <defs>
          <filter id="page-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.15" />
          </filter>
        </defs>
        {/* White rounded rect = book page */}
        <rect
          x={pageX}
          y={pageY}
          width={pageW}
          height={pageH}
          rx={size * 0.012}
          fill="#FFFFFF"
          stroke="#E8E4DC"
          strokeWidth="2"
          filter="url(#page-shadow)"
        />
        {/* Outer dashed = KDP safe zone green */}
        <rect
          x={pageX + safeInset}
          y={pageY + safeInset}
          width={pageW - safeInset * 2}
          height={pageH - safeInset * 2}
          rx={size * 0.008}
          fill="none"
          stroke="#4cd964"
          strokeWidth="2"
          strokeDasharray="8 6"
        />
        {/* Inner dashed = content area orange/gold */}
        <rect
          x={pageX + innerInset}
          y={pageY + innerInset}
          width={pageW - innerInset * 2}
          height={pageH - innerInset * 2}
          rx={size * 0.006}
          fill="none"
          stroke="#F0C040"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
        {/* Three-line caption below orange dashed line, in white space above target */}
        <g fontFamily="Inter, sans-serif" fontSize={Math.max(9, size * 0.024)} fill="#4cd964" fontWeight="600" textAnchor="middle">
          <text x={pageX + pageW / 2} y={pageY + innerInset + size * 0.068}>Upload Your PDF</text>
          <text x={pageX + pageW / 2} y={pageY + innerInset + size * 0.098}>See Every KDP Error</text>
          <text x={pageX + pageW / 2} y={pageY + innerInset + size * 0.128}>Download The Fix</text>
        </g>
        {/* Red crosshair horizontal */}
        <line
          x1={pageX}
          y1={cy}
          x2={pageX + pageW}
          y2={cy}
          stroke="#E74C3C"
          strokeWidth="2"
        />
        <circle cx={pageX + size * 0.08} cy={cy} r="5" fill="#E74C3C" />
        <circle cx={pageX + pageW - size * 0.08} cy={cy} r="5" fill="#E74C3C" />
        {/* Four concentric circles: alternating gray and orange tint */}
        <circle cx={cx} cy={cy} r={centerR * 2.2} fill="none" stroke="#E0E0E0" strokeWidth="2" opacity="0.6" />
        <circle cx={cx} cy={cy} r={centerR * 1.7} fill="none" stroke="rgba(240,90,40,0.15)" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={centerR * 1.3} fill="none" stroke="#E0E0E0" strokeWidth="2" opacity="0.5" />
        <circle cx={cx} cy={cy} r={centerR * 0.95} fill="none" stroke="rgba(240,90,40,0.15)" strokeWidth="2" />
        {/* Faint gray crosshairs through target circle — rifle-scope style */}
        <line x1={cx} y1={cy - centerR * 2.2} x2={cx} y2={cy + centerR * 2.2} stroke="rgba(100,100,100,0.25)" strokeWidth="1.5" />
        <line x1={cx - centerR * 2.2} y1={cy} x2={cx + centerR * 2.2} y2={cy} stroke="rgba(100,100,100,0.25)" strokeWidth="1.5" />
      </svg>
      {/* Center button: live link with pulse animation and hover */}
      <a
        href="/formatter"
        className="m2p-pulse-ring absolute left-1/2 top-1/2 flex items-center justify-center rounded-full text-white bg-[#F05A28] hover:bg-[#D94E20] transition-colors shadow-[0_4px_20px_rgba(240,90,40,0.45)] hover:shadow-[0_6px_24px_rgba(240,90,40,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F05A28] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        style={{
          width: centerR * 1.9,
          height: centerR * 1.9,
          marginLeft: -centerR * 0.95,
          marginTop: -centerR * 0.95,
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: Math.max(12, size * 0.032),
          cursor: "pointer",
        }}
        title="Scan My PDF — Go to Formatter"
      >
        Scan My PDF
      </a>
    </div>
  );
}
