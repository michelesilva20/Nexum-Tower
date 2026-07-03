import { badgeVariantClasses, type NexumBadgeVariant } from "@/lib/status-styles";
import { cn } from "@nexum-tower/ui";
import type { ReactNode } from "react";

type NexumBadgeProps = {
  children: ReactNode;
  variant?: NexumBadgeVariant;
  className?: string;
  dot?: boolean;
};

export function NexumBadge({ children, variant = "neutral", className, dot }: NexumBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badgeVariantClasses[variant],
        className,
      )}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export { NexumStatusBadge } from "./nexum-status-badge";
export { NexumRiskBadge } from "./nexum-risk-badge";
