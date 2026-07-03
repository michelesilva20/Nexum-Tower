"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PermissionGate } from "@/components/app/permission-gate";
import {
  NexumBadge,
  NexumButton,
  NexumCard,
  NexumDataTable,
  NexumDrawer,
  NexumInput,
  NexumSelect,
  NexumTableSearch,
  NexumTableToolbar,
  NexumToastProvider,
} from "@/components/ui/nexum";
import { useTablePagination } from "@/hooks/use-table-pagination";
import { fetchAuditLogs, type AuditLogRow } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

const ACTION_COLOR: Record<string, "info" | "success" | "warning" | "danger" | "neutral"> = {
  LOGIN_SUCCESS: "success",
  LOGIN_FAILED: "danger",
  LOGOUT: "neutral",
  SESSION_REVOKED: "warning",
  USER_CREATED: "info",
  USER_UPDATED: "info",
  USER_DISABLED: "warning",
  USER_DELETED: "danger",
  ROLE_CREATED: "info",
  ROLE_UPDATED: "info",
  ROLE_DELETED: "danger",
  PERMISSION_OVERRIDE_ADDED: "warning",
  PERMISSION_OVERRIDE_REMOVED: "neutral",
  SETTING_UPDATED: "warning",
  FEATURE_UPDATED: "info",
};

function AuditAdminPageInner() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    void fetchAuditLogs({ limit: 200 })
      .then(setRows)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Erro ao carregar auditoria."))
      .finally(() => setLoading(false));
  }, []);

  const actions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.action))).sort(),
    [rows],
  );

  const entities = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.entity).filter(Boolean) as string[])).sort(),
    [rows],
  );

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const matchAction = !actionFilter || r.action === actionFilter;
        const matchEntity = !entityFilter || r.entity === entityFilter;
        const matchSearch =
          !search ||
          r.action.toLowerCase().includes(search.toLowerCase()) ||
          (r.user?.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (r.entity ?? "").toLowerCase().includes(search.toLowerCase());
        return matchAction && matchEntity && matchSearch;
      }),
    [rows, search, actionFilter, entityFilter],
  );

  const { paginatedItems, pagination } = useTablePagination(filtered, { initialPageSize: 15 });

  function openDetail(log: AuditLogRow) {
    setSelectedLog(log);
    setDrawerOpen(true);
  }

  return (
    <PermissionGate permission="audit.read">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          breadcrumb={[{ label: "Admin", href: "/app" }, { label: "Auditoria" }]}
          title="Auditoria"
          description="Log de eventos de segurança e acesso do tenant."
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
          emptyTitle="Nenhum registro encontrado."
          emptyDescription="Eventos de auditoria serão listados aqui."
          toolbar={
            <NexumTableToolbar
              search={
                <NexumTableSearch
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar por ação, usuário ou entidade..."
                />
              }
              actions={
                <div className="flex gap-2">
                  <NexumSelect
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="w-52"
                  >
                    <option value="">Todas as ações</option>
                    {actions.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </NexumSelect>
                  <NexumSelect
                    value={entityFilter}
                    onChange={(e) => setEntityFilter(e.target.value)}
                    className="w-40"
                  >
                    <option value="">Todas as entidades</option>
                    {entities.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </NexumSelect>
                </div>
              }
            />
          }
          columns={[
            {
              key: "when",
              header: "Data/hora",
              render: (r) => (
                <span className="whitespace-nowrap text-sm text-nexum-text-muted">
                  {new Date(r.createdAt).toLocaleString("pt-BR")}
                </span>
              ),
            },
            {
              key: "action",
              header: "Ação",
              render: (r) => (
                <NexumBadge variant={ACTION_COLOR[r.action] ?? "neutral"}>
                  {r.action}
                </NexumBadge>
              ),
            },
            {
              key: "user",
              header: "Usuário",
              render: (r) => (
                <div>
                  {r.user ? (
                    <>
                      <p className="text-sm text-nexum-text">{r.user.name}</p>
                      <p className="text-xs text-nexum-text-muted">{r.user.email}</p>
                    </>
                  ) : (
                    <span className="text-sm text-nexum-text-muted">—</span>
                  )}
                </div>
              ),
            },
            {
              key: "entity",
              header: "Entidade",
              render: (r) => (
                <span className="text-sm text-nexum-text-muted">{r.entity ?? "—"}</span>
              ),
            },
            {
              key: "ip",
              header: "IP",
              render: (r) => (
                <code className="text-xs text-nexum-text-soft">{r.ipAddress ?? "—"}</code>
              ),
            },
            {
              key: "actions",
              header: "",
              align: "right",
              render: (r) => (
                <NexumButton size="sm" variant="ghost" onClick={() => openDetail(r)}>
                  Detalhes
                </NexumButton>
              ),
            },
          ]}
        />

        {/* Drawer de detalhes */}
        <NexumDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Detalhes do evento"
          description={selectedLog?.action}
          width="md"
          footer={
            <NexumButton variant="ghost" size="sm" onClick={() => setDrawerOpen(false)}>
              Fechar
            </NexumButton>
          }
        >
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <DetailField label="Ação" value={selectedLog.action} />
                <DetailField
                  label="Data"
                  value={new Date(selectedLog.createdAt).toLocaleString("pt-BR")}
                />
                <DetailField label="Usuário" value={selectedLog.user?.name ?? "—"} />
                <DetailField label="E-mail" value={selectedLog.user?.email ?? "—"} />
                <DetailField label="Entidade" value={selectedLog.entity ?? "—"} />
                <DetailField label="Entity ID" value={selectedLog.entityId ?? "—"} mono />
                <DetailField label="IP" value={selectedLog.ipAddress ?? "—"} mono />
                <DetailField label="Request ID" value={selectedLog.requestId ?? "—"} mono />
              </div>
              {selectedLog.userAgent && (
                <DetailField label="User Agent" value={selectedLog.userAgent} mono />
              )}
              {selectedLog.oldValue != null && (
                <div>
                  <p className="mb-1 text-xs text-nexum-text-soft">Valor anterior</p>
                  <pre className="overflow-auto rounded-xl bg-nexum-surface p-3 text-xs text-nexum-text-muted">
                    {JSON.stringify(selectedLog.oldValue, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.newValue != null && (
                <div>
                  <p className="mb-1 text-xs text-nexum-text-soft">Novo valor</p>
                  <pre className="overflow-auto rounded-xl bg-nexum-surface p-3 text-xs text-nexum-text-muted">
                    {JSON.stringify(selectedLog.newValue, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.metadata != null && (
                <div>
                  <p className="mb-1 text-xs text-nexum-text-soft">Metadata</p>
                  <pre className="overflow-auto rounded-xl bg-nexum-surface p-3 text-xs text-nexum-text-muted">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </NexumDrawer>
      </div>
    </PermissionGate>
  );
}

function DetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-nexum-text-soft">{label}</p>
      {mono ? (
        <code className="text-xs text-nexum-text">{value}</code>
      ) : (
        <p className="text-sm text-nexum-text">{value}</p>
      )}
    </div>
  );
}

export function AuditAdminPage() {
  return (
    <NexumToastProvider>
      <AuditAdminPageInner />
    </NexumToastProvider>
  );
}
