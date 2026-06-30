import { cn } from "@nexum-tower/ui";
import type { LucideIcon } from "lucide-react";
import { GlassCard } from "./glass-card";

type FeatureCardProps = {
  number?: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  className?: string;
};

export function FeatureCard({
  number,
  title,
  description,
  icon: Icon,
  className,
}: FeatureCardProps) {
  return (
    <GlassCard className={cn("group p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-nexum-border bg-nexum-bg-soft transition-colors group-hover:border-nexum-primary/40">
          <Icon className="h-5 w-5 text-nexum-primary" strokeWidth={1.75} />
        </div>
        {number && (
          <span className="font-mono text-xs text-nexum-text-soft">{number}</span>
        )}
      </div>
      <h3 className="mt-5 text-base font-semibold text-nexum-text">{title}</h3>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-nexum-text-muted">{description}</p>
      )}
    </GlassCard>
  );
}
