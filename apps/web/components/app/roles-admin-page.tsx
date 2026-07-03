"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PermissionGate, usePermission } from "@/components/app/permission-gate";
import {
  NexumBadge,
  NexumButton,
  NexumCard,
  NexumConfirmModal,
  NexumDataTable,
  NexumDrawer,
  NexumFormField,
  NexumInput,
  NexumModal,
  NexumSelect,
  NexumTableSearch,
  NexumTableToolbar,
  NexumTextarea,
  NexumToastProvider,
  NexumTabs,
  useNexumToast,
  type NexumTab,
} from "@/components/ui/nexum";
import { useTablePagination } from "@/hooks/use-table-pagination";
import {
  addRolePermission,
  createRole,
  deleteRole,
  fetchPermissions,
  fetchRoleById,
  fetchRoles,
  removeRolePermission,
  updateRole,
  type PermissionRow,
  type RoleRow,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Lock, Plus, Shield } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function RolesAdminPageInner() {
  const { toast } = useNexumToast();
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [drawerRole, setDrawerRole] = useState<RoleRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<RoleRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RoleRow | null>(null);

  const canCreate = usePermission("roles.create");
  const canUpdate = usePermission("roles.update");
  const canDelete = usePermission("roles.delete");
  const canManagePerms = usePermission("roles.manage_permissions");

  const load = useCallback(() => {
    setLoading(true);
    void fetchRoles()
      .then(setRows)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Erro ao carregar roles."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openDrawer(role: RoleRow) {
    setDrawerOpen(true);
    try {
      const detail = await fetchRoleById(role.id);
      setDrawerRole(detail);
    } catch {
      toast({ type: "error", title: "Erro ao carregar role." });
      setDrawerOpen(false);
    }
  }

  async function handleDelete(role: RoleRow) {
    try {
      await deleteRole(role.id);
      toast({ type: "success", title: "Role excluída." });
      load();
      setDrawerOpen(false);
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro ao excluir." });
    }
    setConfirmDelete(null);
  }

  const filtered = rows.filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.slug.toLowerCase().includes(search.toLowerCase()),
  );

  const { paginatedItems, pagination } = useTablePagination(filtered, { initialPageSize: 10 });

  return (
    <PermissionGate permission="roles.read">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          breadcrumb={[{ label: "Admin", href: "/app" }, { label: "Papéis" }]}
          title="Papéis (Roles)"
          description="Conjuntos de permissões atribuíveis a usuários e grupos."
          actions={
            canCreate ? (
              <NexumButton onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Nova role
              </NexumButton>
            ) : undefined
          }
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
          emptyTitle="Nenhum papel encontrado."
          emptyDescription="Crie papéis para organizar permissões da equipe."
          toolbar={
            <NexumTableToolbar
              search={
                <NexumTableSearch
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar role..."
                />
              }
            />
          }
          columns={[
            {
              key: "name",
              header: "Nome",
              render: (r) => (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-nexum-text">{r.name}</span>
                  {r.isSystem && (
                    <NexumBadge variant="warning">
                      <Lock className="mr-1 h-3 w-3" />
                      Sistema
                    </NexumBadge>
                  )}
                </div>
              ),
            },
            {
              key: "slug",
              header: "Slug",
              render: (r) => (
                <code className="rounded-md bg-nexum-bg-soft px-2 py-0.5 text-xs text-nexum-primary">
                  {r.slug}
                </code>
              ),
            },
            {
              key: "permissions",
              header: "Permissões",
              align: "center",
              render: (r) => (
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-nexum-primary/10 px-2 text-xs font-semibold text-nexum-primary">
                  {r.permissions.length}
                </span>
              ),
            },
            {
              key: "actions",
              header: "",
              align: "right",
              render: (r) => (
                <div className="flex items-center justify-end gap-2">
                  <NexumButton size="sm" variant="ghost" onClick={() => openDrawer(r)}>
                    Detalhes
                  </NexumButton>
                  {canUpdate && !r.isSystem && (
                    <NexumButton size="sm" variant="ghost" onClick={() => setEditRole(r)}>
                      Editar
                    </NexumButton>
                  )}
                  {canDelete && !r.isSystem && (
                    <NexumButton size="sm" variant="ghost" onClick={() => setConfirmDelete(r)}>
                      Excluir
                    </NexumButton>
                  )}
                </div>
              ),
            },
          ]}
        />

        {/* Drawer detalhes */}
        <RoleDetailDrawer
          open={drawerOpen}
          role={drawerRole}
          onClose={() => setDrawerOpen(false)}
          onRefresh={async () => {
            if (drawerRole) {
              const updated = await fetchRoleById(drawerRole.id);
              setDrawerRole(updated);
              load();
            }
          }}
          canManagePerms={canManagePerms}
        />

        {/* Modal criar */}
        <RoleFormModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSaved={() => { setCreateOpen(false); load(); }}
        />

        {/* Modal editar */}
        <RoleFormModal
          open={!!editRole}
          role={editRole ?? undefined}
          onClose={() => setEditRole(null)}
          onSaved={() => { setEditRole(null); load(); }}
        />

        {/* Confirmar exclusão */}
        <NexumConfirmModal
          open={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
          title="Excluir role"
          description={`Excluir a role "${confirmDelete?.name}"? Usuários e grupos com esta role perderão as permissões associadas.`}
          confirmLabel="Excluir"
          danger
        />
      </div>
    </PermissionGate>
  );
}

// ─── Role Detail Drawer ───────────────────────────────────────────────────────

function RoleDetailDrawer({
  open,
  role,
  onClose,
  onRefresh,
  canManagePerms,
}: {
  open: boolean;
  role: RoleRow | null;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  canManagePerms: boolean;
}) {
  const { toast } = useNexumToast();
  const [tab, setTab] = useState("info");
  const [addPermOpen, setAddPermOpen] = useState(false);

  const tabs: NexumTab[] = [
    { key: "info", label: "Dados" },
    { key: "permissions", label: "Permissões" },
  ];

  async function handleRemovePerm(permId: string) {
    if (!role) return;
    try {
      await removeRolePermission(role.id, permId);
      toast({ type: "success", title: "Permissão removida." });
      await onRefresh();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro." });
    }
  }

  return (
    <NexumDrawer
      open={open}
      onClose={onClose}
      title={role?.name ?? "Detalhes da role"}
      description={role?.slug}
      width="md"
      footer={<NexumButton variant="ghost" size="sm" onClick={onClose}>Fechar</NexumButton>}
    >
      {role && (
        <div className="space-y-4">
          <NexumTabs tabs={tabs} activeKey={tab} onChange={setTab} />

          {tab === "info" && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-nexum-text-soft">Nome</p>
                <p className="text-sm font-medium text-nexum-text">{role.name}</p>
              </div>
              <div>
                <p className="text-xs text-nexum-text-soft">Slug</p>
                <code className="text-sm text-nexum-primary">{role.slug}</code>
              </div>
              {role.description && (
                <div>
                  <p className="text-xs text-nexum-text-soft">Descrição</p>
                  <p className="text-sm text-nexum-text">{role.description}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <p className="text-xs text-nexum-text-soft">Tipo:</p>
                {role.isSystem ? (
                  <NexumBadge variant="warning">
                    <Lock className="mr-1 h-3 w-3" />
                    Role de sistema — não pode ser excluída
                  </NexumBadge>
                ) : (
                  <NexumBadge variant="info">Customizada</NexumBadge>
                )}
              </div>
            </div>
          )}

          {tab === "permissions" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-nexum-text">
                  Permissões ({role.permissions.length})
                </p>
                {canManagePerms && (
                  <NexumButton size="sm" onClick={() => setAddPermOpen(true)}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Adicionar
                  </NexumButton>
                )}
              </div>
              {role.permissions.length === 0 ? (
                <p className="text-sm text-nexum-text-muted">Nenhuma permissão atribuída.</p>
              ) : (
                <div className="space-y-1.5">
                  {role.permissions.map((rp) => (
                    <div
                      key={rp.permission.id}
                      className="flex items-center justify-between rounded-xl border border-nexum-border bg-nexum-surface px-3 py-2"
                    >
                      <div>
                        <code className="text-xs font-medium text-nexum-text">
                          {rp.permission.key}
                        </code>
                        {rp.permission.description && (
                          <p className="text-xs text-nexum-text-muted">{rp.permission.description}</p>
                        )}
                      </div>
                      {canManagePerms && (
                        <NexumButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePerm(rp.permission.id)}
                        >
                          Remover
                        </NexumButton>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {canManagePerms && (
                <AddPermissionToRoleModal
                  roleId={role.id}
                  currentPermIds={role.permissions.map((rp) => rp.permission.id)}
                  open={addPermOpen}
                  onClose={() => setAddPermOpen(false)}
                  onAdded={async () => { setAddPermOpen(false); await onRefresh(); }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </NexumDrawer>
  );
}

// ─── Modal: Criar/editar role ─────────────────────────────────────────────────

function RoleFormModal({
  open,
  role,
  onClose,
  onSaved,
}: {
  open: boolean;
  role?: RoleRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useNexumToast();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
  }, [role, open]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (role) {
        await updateRole(role.id, { name: name.trim(), description: description.trim() || undefined });
        toast({ type: "success", title: "Role atualizada." });
      } else {
        await createRole({ name: name.trim(), description: description.trim() || undefined });
        toast({ type: "success", title: "Role criada." });
      }
      onSaved();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro ao salvar." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <NexumModal
      open={open}
      onClose={onClose}
      title={role ? "Editar role" : "Nova role"}
      footer={
        <>
          <NexumButton variant="ghost" onClick={onClose}>Cancelar</NexumButton>
          <NexumButton onClick={() => void handleSave()} disabled={!name.trim() || saving}>
            {saving ? "Salvando..." : role ? "Salvar" : "Criar role"}
          </NexumButton>
        </>
      }
    >
      <div className="space-y-4">
        <NexumFormField label="Nome" htmlFor="role-name" required>
          <NexumInput
            id="role-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Operador de Frota"
          />
        </NexumFormField>
        <NexumFormField label="Descrição" htmlFor="role-desc">
          <NexumTextarea
            id="role-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição opcional..."
            rows={3}
          />
        </NexumFormField>
      </div>
    </NexumModal>
  );
}

// ─── Modal: Adicionar permissão à role ───────────────────────────────────────

function AddPermissionToRoleModal({
  roleId,
  currentPermIds,
  open,
  onClose,
  onAdded,
}: {
  roleId: string;
  currentPermIds: string[];
  open: boolean;
  onClose: () => void;
  onAdded: () => Promise<void>;
}) {
  const { toast } = useNexumToast();
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      void fetchPermissions().then(setPermissions);
    }
  }, [open]);

  const available = permissions.filter((p) => !currentPermIds.includes(p.id));

  async function handleAdd() {
    if (!selected) return;
    setSaving(true);
    try {
      await addRolePermission(roleId, selected);
      toast({ type: "success", title: "Permissão adicionada à role." });
      await onAdded();
      setSelected("");
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <NexumModal
      open={open}
      onClose={onClose}
      title="Adicionar permissão"
      footer={
        <>
          <NexumButton variant="ghost" onClick={onClose}>Cancelar</NexumButton>
          <NexumButton onClick={() => void handleAdd()} disabled={!selected || saving}>
            Adicionar
          </NexumButton>
        </>
      }
    >
      <NexumFormField label="Permissão" htmlFor="role-perm">
        <NexumSelect
          id="role-perm"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Selecione uma permissão</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {p.key} {p.description ? `— ${p.description}` : ""}
            </option>
          ))}
        </NexumSelect>
      </NexumFormField>
    </NexumModal>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function RolesAdminPage() {
  return (
    <NexumToastProvider>
      <RolesAdminPageInner />
    </NexumToastProvider>
  );
}
