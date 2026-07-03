import { cn } from "@nexum-tower/ui";

type OperationStatusProps = {
  label: string;
  detail?: string;
  online?: boolean;
  className?: string;
};

export function OperationStatus({
  label,
  detail,
  online = true,
  className,
}: OperationStatusProps) {
  return (
    <div
      className={cn(
        "hidden items-center gap-2 rounded-xl border border-nexum-border/50 bg-nexum-surface/30 px-3 py-1.5 lg:flex",
        className,
      )}
    >
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          online ? "pulse-dot bg-nexum-success" : "bg-nexum-neutral",
        )}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-nexum-text">{label}</p>
        {detail && <p className="truncate text-[10px] text-nexum-text-soft">{detail}</p>}
      </div>
    </div>
  );
}
