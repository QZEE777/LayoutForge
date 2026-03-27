import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-[var(--d-border)] bg-[var(--d-muted)] px-3 py-2 text-sm text-[var(--d-fg)] placeholder:text-[var(--d-fg-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--d-primary)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
export { Input };
