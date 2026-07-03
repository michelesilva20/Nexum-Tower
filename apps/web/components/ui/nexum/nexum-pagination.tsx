"use client";

import { NexumButton } from "@/components/ui/nexum/nexum-button";
import { cn } from "@nexum-tower/ui";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslations } from "next-intl";

type NexumPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
};

function getVisiblePages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("ellipsis");
  if (total > 1) pages.push(total);

  return pages;
}

export function NexumPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50],
}: NexumPaginationProps) {
  const t = useTranslations("admin.table");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = getVisiblePages(page, totalPages);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm text-nexum-text-muted">
        {t("showing", { start, end, total })}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-nexum-text-soft">{t("rowsPerPage")}</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-9 rounded-xl border border-nexum-border bg-nexum-bg-soft px-2.5 text-sm text-nexum-text transition-colors focus:border-nexum-primary focus:outline-none focus:ring-2 focus:ring-nexum-primary/20"
              aria-label={t("rowsPerPage")}
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="flex items-center gap-1" aria-label={t("pagination")}>
          <NexumButton
            variant="ghost"
            className="h-9 w-9 p-0"
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            aria-label={t("first")}
          >
            <ChevronsLeft className="h-4 w-4" />
          </NexumButton>

          <NexumButton
            variant="ghost"
            className="h-9 w-9 p-0"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label={t("previous")}
          >
            <ChevronLeft className="h-4 w-4" />
          </NexumButton>

          <div className="flex items-center gap-0.5 px-1">
            {pages.map((p, i) =>
              p === "ellipsis" ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-1.5 text-xs text-nexum-text-soft"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={cn(
                    "flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-medium transition-all",
                    p === page
                      ? "bg-gradient-to-br from-nexum-primary/20 to-nexum-secondary/10 text-nexum-primary ring-1 ring-nexum-primary/30"
                      : "text-nexum-text-muted hover:bg-nexum-surface hover:text-nexum-text",
                  )}
                >
                  {p}
                </button>
              ),
            )}
          </div>

          <NexumButton
            variant="ghost"
            className="h-9 w-9 p-0"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label={t("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </NexumButton>

          <NexumButton
            variant="ghost"
            className="h-9 w-9 p-0"
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
            aria-label={t("last")}
          >
            <ChevronsRight className="h-4 w-4" />
          </NexumButton>
        </nav>
      </div>
    </div>
  );
}

type NexumFilterBarProps = {
  children: React.ReactNode;
  activeFilters?: { key: string; label: string; onRemove: () => void }[];
  onClearAll?: () => void;
  clearLabel?: string;
  className?: string;
};

export function NexumFilterBar({
  children,
  activeFilters = [],
  onClearAll,
  clearLabel = "Limpar filtros",
  className,
}: NexumFilterBarProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="glass flex flex-wrap items-center gap-2 rounded-2xl p-3">{children}</div>
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={f.onRemove}
              className="inline-flex items-center gap-1.5 rounded-full border border-nexum-primary/30 bg-nexum-primary/10 px-2.5 py-1 text-xs text-nexum-primary"
            >
              {f.label}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-nexum-text-muted hover:text-nexum-text"
            >
              {clearLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
