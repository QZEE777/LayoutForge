/**
 * Amazon-style smile (curved arrow) for KDP platform branding. Nominative use.
 */
export default function AmazonLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Amazon"
    >
      <path
        d="M5 32 C5 32 25 6 50 18 C75 6 95 32 95 32"
        stroke="#FF9900"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M82 22 L95 32 L90 35 L77 25 Z"
        fill="#FF9900"
      />
    </svg>
  );
}
