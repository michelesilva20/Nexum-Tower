import { NexumButton } from "@/components/ui/nexum/nexum-button";
import { NexumCard } from "@/components/ui/nexum/nexum-card";
import { cn } from "@nexum-tower/ui";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type NexumEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  children?: ReactNode;
};

export function NexumEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  children,
}: NexumEmptyStateProps) {
  return (
    <NexumCard
      variant="glass"
      className={cn(
        "relative overflow-hidden px-6 py-12 text-center",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 grid-pattern opacity-20"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-nexum-border/50 bg-nexum-surface/50 text-nexum-text-soft">
          <Icon className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-nexum-text">{title}</h3>
        <p className="mt-2 text-sm text-nexum-text-muted">{description}</p>
        {actionLabel && onAction && (
          <NexumButton className="mt-6" onClick={onAction}>
            {actionLabel}
          </NexumButton>
        )}
        {children}
      </div>
    </NexumCard>
  );
}
