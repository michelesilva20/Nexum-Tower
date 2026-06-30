import { cn } from "@nexum-tower/ui";

type SectionBadgeProps = {
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
};

export function SectionBadge({ children, className, pulse = false }: SectionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-nexum-border bg-nexum-surface/60 px-4 py-1.5 text-xs font-semibold tracking-wide text-nexum-primary backdrop-blur-sm",
        className,
      )}
    >
      {pulse && <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-nexum-secondary" />}
      {children}
    </span>
  );
}
