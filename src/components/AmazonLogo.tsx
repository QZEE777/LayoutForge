/**
 * Amazon wordmark + arrow. For use in squircle badge. Nominative use.
 */
export default function AmazonLogo({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 90 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Amazon"
    >
      <text
        x="45"
        y="20"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="18"
        fontWeight="700"
        fill="#232F3E"
        style={{ letterSpacing: "-0.02em" }}
      >
        amazon
      </text>
      <path
        d="M 12 26 Q 45 6 78 26"
        stroke="#FF9900"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 68 20 L 78 26 L 74 28 L 64 22 Z"
        fill="#FF9900"
      />
    </svg>
  );
}
