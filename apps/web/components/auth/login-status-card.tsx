import { cn } from "@nexum-tower/ui";
import { GlassCard } from "@/components/landing/ui/glass-card";

type LoginStatusCardProps = {
  label: string;
  value: string;
  change: string;
  status?: "success" | "warning" | "neutral" | "primary";
  className?: string;
};

const statusColors = {
  success: "text-nexum-success",
  warning: "text-nexum-warning",
  neutral: "text-nexum-text-muted",
  primary: "text-nexum-primary",
};

export function LoginStatusCard({
  label,
  value,
  change,
  status = "neutral",
  className,
}: LoginStatusCardProps) {
  return (
    <GlassCard hover={false} className={cn("p-4", className)}>
      <p className="text-xs text-nexum-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-nexum-text">{value}</p>
      <p className={cn("mt-1 text-[11px]", statusColors[status])}>{change}</p>
    </GlassCard>
  );
}
