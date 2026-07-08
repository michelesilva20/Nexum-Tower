"use client";

import { NexumBadge } from "@/components/ui/nexum/nexum-badge";
import { NexumButton } from "@/components/ui/nexum/nexum-button";
import { NexumTooltip } from "@/components/ui/nexum/nexum-breadcrumb";
import type { NexumDropdownItem } from "@/components/ui/nexum/nexum-dropdown";
import { NexumEmptyState } from "@/components/ui/nexum/nexum-empty-state";
import { NexumTableSkeleton } from "@/components/ui/nexum/nexum-skeleton";
import { cn } from "@nexum-tower/ui";
import {
  Ban,
  Building2,
  Eye,
  Inbox,
  MapPin,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { NexumPagination } from "./nexum-pagination";

export type NexumTableActionItem = NexumDropdownItem;

const DEFAULT_ACTION_ICONS: Record<string, LucideIcon> = {
  view: Eye,
  edit: Pencil,
  branches: Building2,
  points: MapPin,
  disable: Ban,
  enable: RotateCcw,
  delete: Trash2,
  users: UserPlus,
};

function resolveActionIcon(item: NexumTableActionItem) {
  if (item.icon) return item.icon;
  const Icon = DEFAULT_ACTION_ICONS[item.key];
  if (!Icon) return <Pencil className="h-3.5 w-3.5" aria-hidden="true" />;
  return <Icon className="h-3.5 w-3.5" aria-hidden="true" />;
}

/** Código operacional compacto (listagens). */
export function NexumTableCode({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        "block max-w-[96px] truncate font-mono text-[11px] leading-tight text-nexum-text-muted",
        className,
      )}
      title={value}
    >
      {value}
    </span>
  );
}

/** Texto truncado para células densas. */
export function NexumTableText({
  children,
  title,
  className,
  maxWidth = "140px",
}: {
  children: ReactNode;
  title?: string;
  className?: string;
  maxWidth?: string;
}) {
  return (
    <span
      className={cn("block truncate text-xs leading-tight", className)}
      style={{ maxWidth }}
      title={title ?? (typeof children === "string" ? children : undefined)}
    >
      {children}
    </span>
  );
}

export function NexumTableRowActions({ items }: { items: NexumTableActionItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-nowrap items-center justify-end gap-0.5">
      {items.map((item) => (
        <NexumTooltip key={item.key} content={item.label}>
          <NexumButton
            size="sm"
            variant="ghost"
            className={cn(
              "h-7 w-7 shrink-0 p-0",
              item.danger && "text-nexum-danger hover:bg-nexum-danger/10 hover:text-nexum-danger",
            )}
            aria-label={item.label}
            onClick={() => item.onSelect?.()}
          >
            {resolveActionIcon(item)}
          </NexumButton>
        </NexumTooltip>
      ))}
    </div>
  );
}

export type NexumDataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
};

type NexumDataTableProps<T extends { id: string }> = {
  title?: string;
  description?: string;
  toolbar?: ReactNode;
  columns: NexumDataTableColumn<T>[];
  rows: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  selectedIds?: string[];
  showCount?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  className?: string;
};

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function NexumDataTable<T extends { id: string }>({
  title,
  description,
  toolbar,
  columns,
  rows,
  isLoading,
  emptyTitle = "Nenhum registro encontrado",
  emptyDescription = "Não há dados para exibir no momento.",
  emptyActionLabel,
  onEmptyAction,
  selectedIds = [],
  showCount = true,
  pagination,
  className,
}: NexumDataTableProps<T>) {
  if (isLoading) {
    return <NexumTableSkeleton columns={columns.length} />;
  }

  const hasHeader = title || description || toolbar;

  return (
    <div
      className={cn(
        "nexum-table overflow-hidden rounded-[20px] border border-nexum-border/70 bg-nexum-surface/30 shadow-[var(--nexum-card-shadow)]",
        className,
      )}
    >
      {hasHeader && (
        <div className="flex flex-col gap-4 border-b border-nexum-border/60 bg-nexum-bg-soft/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && (
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-nexum-text">{title}</h3>
                {showCount && pagination && (
                  <NexumBadge variant="neutral">{pagination.total}</NexumBadge>
                )}
              </div>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-nexum-text-muted">{description}</p>
            )}
          </div>
          {toolbar && (
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">{toolbar}</div>
          )}
        </div>
      )}

      {!rows.length ? (
        <div className="p-6">
          <NexumEmptyState
            icon={Inbox}
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="nexum-table-grid min-w-full border-collapse">
              <thead>
                <tr className="border-b border-nexum-border/70 bg-nexum-bg-soft/90">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className={cn(
                        "px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-nexum-text-muted",
                        alignClass[col.align ?? "left"],
                        col.className,
                      )}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const selected = selectedIds.includes(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "group border-b border-nexum-border/35 transition-colors duration-150 last:border-b-0",
                        index % 2 === 1 && "bg-nexum-bg-soft/25",
                        "hover:bg-nexum-primary/[0.045]",
                        selected &&
                          "border-l-2 border-l-nexum-primary bg-nexum-primary/[0.08] hover:bg-nexum-primary/[0.1]",
                      )}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "px-2 py-1.5 text-xs leading-tight text-nexum-text align-middle",
                            col.key === "code" && "w-[1%] max-w-[96px] whitespace-nowrap",
                            col.key === "actions" && "w-[1%] whitespace-nowrap",
                            "[&_.rounded-full]:px-1.5 [&_.rounded-full]:py-0 [&_.rounded-full]:text-[10px]",
                            alignClass[col.align ?? "left"],
                            col.className,
                          )}
                        >
                          {col.render(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination && pagination.total > 0 && (
            <div className="border-t border-nexum-border/60 bg-nexum-bg-soft/50 px-3 py-2.5">
              <NexumPagination {...pagination} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function NexumTableToolbar({
  search,
  actions,
}: {
  search?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      {search}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function NexumTableSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:w-72">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexum-text-soft"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-nexum-border bg-nexum-bg-soft pl-10 pr-3 text-sm text-nexum-text placeholder:text-nexum-text-soft transition-colors focus:border-nexum-primary focus:outline-none focus:ring-2 focus:ring-nexum-primary/20"
      />
    </div>
  );
}

export function NexumTableExportButton({ label = "Exportar" }: { label?: string }) {
  return (
    <NexumButton variant="secondary" className="h-10 px-4 text-xs">
      {label}
    </NexumButton>
  );
}
