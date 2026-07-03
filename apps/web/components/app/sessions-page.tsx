"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PermissionGate, usePermission } from "@/components/app/permission-gate";
import {
  NexumBadge,
  NexumButton,
  NexumCard,
  NexumConfirmModal,
  NexumDataTable,
  NexumMetricCard,
  NexumToastProvider,
  useNexumToast,
} from "@/components/ui/nexum";
import { useTablePagination } from "@/hooks/use-table-pagination";
import { fetchSessions, revokeAllSessions, revokeSession, type SessionRow } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Monitor, ShieldX } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

function SessionsPageInner() {
  const { toast } = useNexumToast();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmRevoke, setConfirmRevoke] = useState<SessionRow | null>(null);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

  const canRevoke = usePermission("sessions.revoke");

  const load = useCallback(() => {
    setLoading(true);
    void fetchSessions()
      .then(setSessions)
      .catch(() => toast({ type: "error", title: "Erro ao carregar sessões." }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function handleRevoke(session: SessionRow) {
    try {
      await revokeSession(session.id);
      toast({ type: "success", title: "Sessão revogada." });
      load();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro." });
    }
    setConfirmRevoke(null);
  }

  async function handleRevokeAll() {
    try {
      const result = await revokeAllSessions();
      toast({
        type: "success",
        title: "Todas as sessões revogadas.",
        description: `${result.revoked ?? 0} sessão(ões) encerrada(s).`,
      });
      load();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro." });
    }
    setConfirmRevokeAll(false);
  }

  const activeSessions = useMemo(
    () => sessions.filter((s) => !s.revokedAt),
    [sessions],
  );

  const { paginatedItems, pagination } = useTablePagination(activeSessions, {
    initialPageSize: 10,
  });

  function parseUA(ua: string | null) {
    if (!ua) return "—";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return ua.slice(0, 30);
  }

  return (
    <PermissionGate permission="sessions.read">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          breadcrumb={[{ label: "Segurança", href: "/app/settings" }, { label: "Sessões" }]}
          title="Sessões Ativas"
          description="Visualize e revogue sessões de usuários autenticados."
          actions={
            canRevoke ? (
              <NexumButton variant="danger" onClick={() => setConfirmRevokeAll(true)}>
                <ShieldX className="mr-1.5 h-4 w-4" />
                Revogar todas
              </NexumButton>
            ) : undefined
          }
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NexumMetricCard
            label="Sessões ativas"
            value={activeSessions.length}
            icon={<Monitor className="h-5 w-5" />}
          />
          <NexumMetricCard
            label="Total histórico"
            value={sessions.length}
            icon={<Monitor className="h-5 w-5" />}
          />
        </div>

        <NexumDataTable
          isLoading={loading}
          rows={paginatedItems}
          pagination={pagination}
          emptyTitle="Nenhuma sessão ativa."
          emptyDescription="As sessões ativas de usuários aparecem aqui."
          columns={[
            {
              key: "user",
              header: "Usuário",
              render: (r) => (
                <div>
                  {r.user ? (
                    <>
                      <p className="text-sm font-medium text-nexum-text">{r.user.name}</p>
                      <p className="text-xs text-nexum-text-muted">{r.user.email}</p>
                    </>
                  ) : (
                    <span className="text-sm text-nexum-text-muted">—</span>
                  )}
                </div>
              ),
            },
            {
              key: "device",
              header: "Dispositivo",
              render: (r) => (
                <div className="flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5 text-nexum-text-muted" />
                  <span className="text-sm text-nexum-text-muted">{parseUA(r.userAgent)}</span>
                  {r.isCurrent && (
                    <NexumBadge variant="success">Atual</NexumBadge>
                  )}
                </div>
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
              key: "createdAt",
              header: "Iniciada em",
              render: (r) => (
                <span className="text-sm text-nexum-text-muted">
                  {new Date(r.createdAt).toLocaleString("pt-BR")}
                </span>
              ),
            },
            {
              key: "expiresAt",
              header: "Expira em",
              render: (r) => {
                const expires = new Date(r.expiresAt);
                const isExpired = expires < new Date();
                return (
                  <span className={`text-sm ${isExpired ? "text-nexum-danger" : "text-nexum-text-muted"}`}>
                    {expires.toLocaleString("pt-BR")}
                  </span>
                );
              },
            },
            {
              key: "status",
              header: "Status",
              render: (r) => (
                <NexumBadge variant={r.revokedAt ? "neutral" : "success"} dot>
                  {r.revokedAt ? "Revogada" : "Ativa"}
                </NexumBadge>
              ),
            },
            {
              key: "actions",
              header: "",
              align: "right",
              render: (r) =>
                canRevoke && !r.revokedAt && !r.isCurrent ? (
                  <NexumButton size="sm" variant="ghost" onClick={() => setConfirmRevoke(r)}>
                    Revogar
                  </NexumButton>
                ) : r.isCurrent ? (
                  <NexumBadge variant="info">Sessão atual</NexumBadge>
                ) : null,
            },
          ]}
        />

        {/* Confirmar revogar sessão */}
        <NexumConfirmModal
          open={!!confirmRevoke}
          onClose={() => setConfirmRevoke(null)}
          onConfirm={() => confirmRevoke && handleRevoke(confirmRevoke)}
          title="Revogar sessão"
          description="O usuário será desconectado neste dispositivo. Confirmar?"
          confirmLabel="Revogar"
          danger
        />

        {/* Confirmar revogar todas */}
        <NexumConfirmModal
          open={confirmRevokeAll}
          onClose={() => setConfirmRevokeAll(false)}
          onConfirm={() => void handleRevokeAll()}
          title="Revogar todas as sessões"
          description="Todos os usuários serão desconectados. Esta ação não pode ser desfeita. Confirmar?"
          confirmLabel="Revogar todas"
          danger
        />
      </div>
    </PermissionGate>
  );
}

export function SessionsPage() {
  return (
    <NexumToastProvider>
      <SessionsPageInner />
    </NexumToastProvider>
  );
}
