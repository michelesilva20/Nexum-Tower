import { NexumBadge } from "@/components/ui/nexum/nexum-badge";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/layout/breadcrumbs";
import { cn } from "@nexum-tower/ui";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: ReactNode;
  badge?: { label: string; variant?: "success" | "warning" | "primary" | "neutral" };
  className?: string;
};

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  badge,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {breadcrumb && breadcrumb.length > 0 && <Breadcrumbs items={breadcrumb} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-nexum-text sm:text-3xl">
              {title}
            </h1>
            {badge && (
              <NexumBadge variant={badge.variant ?? "primary"}>{badge.label}</NexumBadge>
            )}
          </div>
          {description && (
            <p className="max-w-2xl text-sm text-nexum-text-muted sm:text-base">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
