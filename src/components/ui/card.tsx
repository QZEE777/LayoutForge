import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-xl border border-[var(--d-border)] bg-[var(--d-card)] shadow-sm", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";
export { Card };
