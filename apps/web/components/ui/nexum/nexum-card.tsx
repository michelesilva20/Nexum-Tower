import { cn } from "@nexum-tower/ui";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type NexumCardVariant =
  | "default"
  | "glass"
  | "metric"
  | "interactive"
  | "danger"
  | "warning"
  | "success";

const variantClasses: Record<NexumCardVariant, string> = {
  default: "nexum-card",
  glass: "glass rounded-[20px]",
  metric: "nexum-card",
  interactive:
    "nexum-card cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-nexum-primary/45 hover:shadow-[0_12px_40px_rgba(34,211,238,0.12)]",
  danger: "nexum-card border-nexum-danger/30 bg-nexum-danger-bg/30",
  warning: "nexum-card border-nexum-warning/30 bg-nexum-warning-bg/30",
  success: "nexum-card border-nexum-success/30 bg-nexum-success-bg/30",
};

type NexumCardProps = ComponentPropsWithoutRef<"div"> & {
  variant?: NexumCardVariant;
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingClasses = {
  none: "p-0",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export function NexumCard({
  variant = "default",
  padding = "md",
  className,
  children,
  ...props
}: NexumCardProps) {
  return (
    <div className={cn(variantClasses[variant], paddingClasses[padding], className)} {...props}>
      {children}
    </div>
  );
}

type NexumMetricCardProps = {
  label: string;
  value: string | number;
  change?: string;
  changePositive?: boolean;
  icon?: ReactNode;
  className?: string;
};

export function NexumMetricCard({
  label,
  value,
  change,
  changePositive,
  icon,
  className,
}: NexumMetricCardProps) {
  return (
    <NexumCard variant="metric" className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-nexum-text-muted">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-nexum-text sm:text-3xl">
            {value}
          </p>
          {change && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                changePositive ? "text-nexum-success" : "text-nexum-risk",
              )}
            >
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-nexum-primary/10 text-nexum-primary">
            {icon}
          </div>
        )}
      </div>
    </NexumCard>
  );
}
