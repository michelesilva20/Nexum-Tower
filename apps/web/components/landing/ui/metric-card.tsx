import { cn } from "@nexum-tower/ui";
import type { LucideIcon } from "lucide-react";
import { GlassCard } from "./glass-card";

type MetricCardProps = {
  label: string;
  value: string;
  change?: string;
  icon?: LucideIcon;
  status?: "success" | "warning" | "risk" | "neutral";
  className?: string;
  demo?: boolean;
};

const statusColors = {
  success: "text-nexum-success",
  warning: "text-nexum-warning",
  risk: "text-nexum-risk",
  neutral: "text-nexum-text-muted",
};

export function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  status = "neutral",
  className,
  demo,
}: MetricCardProps) {
  return (
    <GlassCard className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-2">
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-nexum-bg-soft">
            <Icon className={cn("h-4 w-4", statusColors[status])} strokeWidth={1.75} />
          </div>
        )}
        {change && (
          <span className={cn("font-mono text-xs", statusColors[status])}>{change}</span>
        )}
      </div>
      <p className="mt-3 font-mono text-2xl font-bold text-nexum-text">{value}</p>
      <p className="mt-1 text-xs text-nexum-text-muted">{label}</p>
      {demo && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-nexum-text-soft">
          demo
        </p>
      )}
    </GlassCard>
  );
}
