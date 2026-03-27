import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[var(--d-primary)] text-white hover:opacity-90": variant === "default",
            "border border-[var(--d-border)] bg-transparent text-[var(--d-fg)] hover:bg-[var(--d-muted)]": variant === "outline",
            "bg-transparent text-[var(--d-fg-muted)] hover:bg-[var(--d-muted)] hover:text-[var(--d-fg)]": variant === "ghost",
          },
          {
            "h-9 px-4 py-2 text-sm": size === "default",
            "h-8 px-3 text-xs": size === "sm",
            "h-11 px-8 text-base": size === "lg",
            "h-9 w-9": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
export { Button };
