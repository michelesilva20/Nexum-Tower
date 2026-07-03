"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PermissionGate } from "@/components/app/permission-gate";
import {
  NexumBadge,
  NexumCard,
  NexumDataTable,
  NexumSelect,
  NexumTableSearch,
  NexumTableToolbar,
} from "@/components/ui/nexum";
import { useTablePagination } from "@/hooks/use-table-pagination";
import { fetchPermissions, type PermissionRow } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Usuários",
  groups: "Grupos",
  roles: "Papéis",
  permissions: "Permissões",
  sessions: "Sessões",
  settings: "Configurações",
  features: "Feature Flags",
  audit: "Auditoria",
  security: "Segurança",
  rls: "RLS",
};

const MODULE_BADGE_VARIANTS: Record<string, "info" | "success" | "warning" | "neutral"> = {
  users: "info",
  groups: "info",
  roles: "success",
  settings: "warning",
  security: "warning",
  audit: "neutral",
};

export function PermissionsAdminPage() {
  const [rows, setRows] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");

  useEffect(() => {
    void fetchPermissions()
      .then(setRows)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Erro ao carregar permissões."))
      .finally(() => setLoading(false));
  }, []);

  const modules = useMemo(
    () => Array.from(new Set(rows.map((r) => r.module))).sort(),
    [rows],
  );

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const matchModule = !moduleFilter || r.module === moduleFilter;
        const matchSearch =
          !search ||
          r.key.toLowerCase().includes(search.toLowerCase()) ||
          (r.description ?? "").toLowerCase().includes(search.toLowerCase());
        return matchModule && matchSearch;
      }),
    [rows, search, moduleFilter],
  );

  const grouped = useMemo(() => {
    const map: Record<string, PermissionRow[]> = {};
    for (const p of filtered) {
      map[p.module] = map[p.module] ?? [];
      map[p.module].push(p);
    }
    return map;
  }, [filtered]);

  const { paginatedItems, pagination } = useTablePagination(filtered, { initialPageSize: 20 });

  return (
    <PermissionGate permission="permissions.read">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          breadcrumb={[{ label: "Admin", href: "/app" }, { label: "Permissões" }]}
          title="Permissões"
          description="Catálogo global de permissões resource.action. Permissões são criadas por seed."
        />

        {error && (
          <NexumCard variant="danger" padding="sm">
            <p className="text-sm text-nexum-danger">{error}</p>
          </NexumCard>
        )}

        <NexumDataTable
          isLoading={loading}
          rows={paginatedItems}
          pagination={pagination}
          emptyTitle="Nenhuma permissão encontrada."
          emptyDescription="O catálogo de permissões aparecerá aqui."
          toolbar={
            <NexumTableToolbar
              search={
                <NexumTableSearch
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar por chave ou descrição..."
                />
              }
              actions={
                <NexumSelect
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="w-44"
                >
                  <option value="">Todos os módulos</option>
                  {modules.map((m) => (
                    <option key={m} value={m}>
                      {MODULE_LABELS[m] ?? m} ({grouped[m]?.length ?? 0})
                    </option>
                  ))}
                </NexumSelect>
              }
            />
          }
          columns={[
            {
              key: "key",
              header: "Chave",
              render: (r) => (
                <code className="rounded-md bg-nexum-bg-soft px-2 py-0.5 font-mono text-xs text-nexum-primary">
                  {r.key}
                </code>
              ),
            },
            {
              key: "module",
              header: "Módulo",
              render: (r) => (
                <NexumBadge variant={MODULE_BADGE_VARIANTS[r.module] ?? "outline"}>
                  {MODULE_LABELS[r.module] ?? r.module}
                </NexumBadge>
              ),
            },
            {
              key: "resource",
              header: "Recurso",
              render: (r) => (
                <span className="text-sm text-nexum-text-muted">{r.resource}</span>
              ),
            },
            {
              key: "action",
              header: "Ação",
              render: (r) => (
                <span className="text-sm text-nexum-text-muted">{r.action}</span>
              ),
            },
            {
              key: "description",
              header: "Descrição",
              render: (r) => (
                <span className="text-nexum-text-muted">{r.description ?? "—"}</span>
              ),
            },
          ]}
        />
      </div>
    </PermissionGate>
  );
}
