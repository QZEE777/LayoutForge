/**
 * Amazon smile + arrow — scales cleanly in circle, instantly recognizable. Nominative use.
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
      {/* Smile curve — fills the circle, thick stroke */}
      <path
        d="M 6 32 Q 22 8 38 32"
        stroke="#FF9900"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrow head */}
      <path
        d="M 32 24 L 38 32 L 34 34 L 28 26 Z"
        fill="#FF9900"
      />
    </svg>
  );
}
