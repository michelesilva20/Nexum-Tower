import { Link } from "@/i18n/navigation";
import { cn } from "@nexum-tower/ui";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type NexumBreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function NexumBreadcrumb({ items, className }: NexumBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-wrap items-center gap-1 text-xs", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-nexum-text-soft" aria-hidden="true" />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-nexum-text-muted transition-colors hover:text-nexum-text"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? "font-medium text-nexum-text" : "text-nexum-text-muted")}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function NexumPageError({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <div className="nexum-card max-w-md space-y-4 p-6 text-center">
        <h2 className="text-lg font-semibold text-nexum-text">{title}</h2>
        <p className="text-sm text-nexum-text-muted">{description}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="text-sm font-semibold text-nexum-primary hover:underline"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function NexumTooltip({
  content,
  children,
}: {
  content: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-nexum-border bg-nexum-surface px-2.5 py-1.5 text-xs text-nexum-text opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {content}
      </span>
    </span>
  );
}
