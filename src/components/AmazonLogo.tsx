/**
 * Amazon name logo (wordmark + smile) for KDP platform branding. Nominative use.
 * Fits square viewBox for use inside PlatformLogoBadge circle.
 */
export default function AmazonLogo({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Amazon"
    >
      {/* Wordmark "amazon" — bold, lowercase, fits in top half */}
      <text
        x="22"
        y="18"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="10"
        fontWeight="700"
        fill="currentColor"
      >
        amazon
      </text>
      {/* Smile curve + arrow — bottom half */}
      <path
        d="M4 34 Q22 22 40 34"
        stroke="#FF9900"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M34 28 L40 34 L37 36 L31 30 Z"
        fill="#FF9900"
      />
    </svg>
  );
}
