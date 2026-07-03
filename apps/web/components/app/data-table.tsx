"use client";

import { cn } from "@nexum-tower/ui";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  emptyMessage: string;
  isLoading?: boolean;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyMessage,
  isLoading,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-nexum-border bg-nexum-surface/30 px-4 py-10 text-center text-sm text-nexum-text-muted">
        Carregando...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-nexum-border bg-nexum-surface/30 px-4 py-10 text-center text-sm text-nexum-text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-nexum-border">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-nexum-border text-sm">
          <thead className="bg-nexum-surface/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-nexum-text-muted",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-nexum-border/70 bg-nexum-bg/40">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-nexum-surface/30">
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3 text-nexum-text", col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
