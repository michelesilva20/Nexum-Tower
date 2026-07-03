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
  addGroupRole,
  createGroup,
  deleteGroup,
  fetchGroupById,
  fetchGroupMembers,
  fetchGroups,
  fetchRoles,
  removeGroupRole,
  updateGroup,
  type GroupMember,
  type GroupRow,
  type RoleRow,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Plus, UsersRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function GroupsAdminPageInner() {
  const { toast } = useNexumToast();
  const [rows, setRows] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [drawerGroup, setDrawerGroup] = useState<GroupRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<GroupRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<GroupRow | null>(null);

  const canCreate = usePermission("groups.create");
  const canUpdate = usePermission("groups.update");
  const canDelete = usePermission("groups.delete");
  const canManageRoles = usePermission("groups.manage_roles");

  const load = useCallback(() => {
    setLoading(true);
    void fetchGroups({ search: search || undefined })
      .then(setRows)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Erro ao carregar grupos."))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  async function openDrawer(group: GroupRow) {
    setDrawerOpen(true);
    try {
      const detail = await fetchGroupById(group.id);
      setDrawerGroup(detail);
    } catch {
      toast({ type: "error", title: "Erro ao carregar grupo." });
      setDrawerOpen(false);
    }
  }

  async function handleDelete(group: GroupRow) {
    try {
      await deleteGroup(group.id);
      toast({ type: "success", title: "Grupo excluído." });
      load();
      setDrawerOpen(false);
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro ao excluir." });
    }
    setConfirmDelete(null);
  }

  const { paginatedItems, pagination } = useTablePagination(rows, { initialPageSize: 10 });

  return (
    <PermissionGate permission="groups.read">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          breadcrumb={[{ label: "Admin", href: "/app" }, { label: "Grupos" }]}
          title="Grupos"
          description="Agrupe usuários e vincule papéis por área ou função."
          actions={
            canCreate ? (
              <NexumButton onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Novo grupo
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
          emptyTitle="Nenhum grupo encontrado."
          emptyDescription="Crie grupos para organizar usuários por área ou função."
          toolbar={
            <NexumTableToolbar
              search={
                <NexumTableSearch
                  value={search}
                  onChange={setSearch}
                  placeholder="Buscar grupo..."
                />
              }
            />
          }
          columns={[
            {
              key: "name",
              header: "Nome",
              render: (r) => (
                <div>
                  <p className="font-medium text-nexum-text">{r.name}</p>
                  {r.description && (
                    <p className="text-xs text-nexum-text-muted">{r.description}</p>
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
              key: "roles",
              header: "Roles",
              render: (r) => (
                <div className="flex flex-wrap gap-1">
                  {r.roles.length === 0 ? (
                    <span className="text-sm text-nexum-text-muted">—</span>
                  ) : (
                    r.roles.slice(0, 3).map((gr) => (
                      <NexumBadge key={gr.role.id} variant="info">
                        {gr.role.name}
                      </NexumBadge>
                    ))
                  )}
                  {r.roles.length > 3 && (
                    <NexumBadge variant="neutral">+{r.roles.length - 3}</NexumBadge>
                  )}
                </div>
              ),
            },
            {
              key: "members",
              header: "Membros",
              align: "center",
              render: (r) => (
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-nexum-primary/10 px-2 text-xs font-semibold text-nexum-primary">
                  {r._count?.members ?? "—"}
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
                  {canUpdate && (
                    <NexumButton size="sm" variant="ghost" onClick={() => setEditGroup(r)}>
                      Editar
                    </NexumButton>
                  )}
                  {canDelete && (
                    <NexumButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmDelete(r)}
                    >
                      Excluir
                    </NexumButton>
                  )}
                </div>
              ),
            },
          ]}
        />

        {/* Drawer detalhes */}
        <GroupDetailDrawer
          open={drawerOpen}
          group={drawerGroup}
          onClose={() => setDrawerOpen(false)}
          onRefresh={async () => {
            if (drawerGroup) {
              const updated = await fetchGroupById(drawerGroup.id);
              setDrawerGroup(updated);
              load();
            }
          }}
          canManageRoles={canManageRoles}
        />

        {/* Modal criar */}
        <GroupFormModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSaved={() => { setCreateOpen(false); load(); }}
        />

        {/* Modal editar */}
        <GroupFormModal
          open={!!editGroup}
          group={editGroup ?? undefined}
          onClose={() => setEditGroup(null)}
          onSaved={() => { setEditGroup(null); load(); }}
        />

        {/* Confirmar exclusão */}
        <NexumConfirmModal
          open={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
          title="Excluir grupo"
          description={`Excluir o grupo "${confirmDelete?.name}"? Usuários membros perderão as roles herdadas.`}
          confirmLabel="Excluir"
          danger
        />
      </div>
    </PermissionGate>
  );
}

// ─── Group Detail Drawer ─────────────────────────────────────────────────────

function GroupDetailDrawer({
  open,
  group,
  onClose,
  onRefresh,
  canManageRoles,
}: {
  open: boolean;
  group: GroupRow | null;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  canManageRoles: boolean;
}) {
  const { toast } = useNexumToast();
  const [tab, setTab] = useState("info");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addRoleOpen, setAddRoleOpen] = useState(false);

  const tabs: NexumTab[] = [
    { key: "info", label: "Dados" },
    { key: "roles", label: "Roles" },
    { key: "members", label: "Membros" },
  ];

  useEffect(() => {
    if (tab === "members" && group) {
      setMembersLoading(true);
      void fetchGroupMembers(group.id)
        .then(setMembers)
        .catch(() => toast({ type: "error", title: "Erro ao carregar membros." }))
        .finally(() => setMembersLoading(false));
    }
  }, [tab, group, toast]);

  async function handleRemoveRole(roleId: string) {
    if (!group) return;
    try {
      await removeGroupRole(group.id, roleId);
      toast({ type: "success", title: "Role removida do grupo." });
      await onRefresh();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro." });
    }
  }

  return (
    <NexumDrawer
      open={open}
      onClose={onClose}
      title={group?.name ?? "Detalhes do grupo"}
      description={group?.slug}
      width="md"
      footer={<NexumButton variant="ghost" size="sm" onClick={onClose}>Fechar</NexumButton>}
    >
      {group && (
        <div className="space-y-4">
          <NexumTabs tabs={tabs} activeKey={tab} onChange={setTab} />

          {tab === "info" && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-nexum-text-soft">Nome</p>
                <p className="text-sm font-medium text-nexum-text">{group.name}</p>
              </div>
              <div>
                <p className="text-xs text-nexum-text-soft">Slug</p>
                <code className="text-sm text-nexum-primary">{group.slug}</code>
              </div>
              {group.description && (
                <div>
                  <p className="text-xs text-nexum-text-soft">Descrição</p>
                  <p className="text-sm text-nexum-text">{group.description}</p>
                </div>
              )}
            </div>
          )}

          {tab === "roles" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-nexum-text">Roles vinculadas</p>
                {canManageRoles && (
                  <NexumButton size="sm" onClick={() => setAddRoleOpen(true)}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Vincular role
                  </NexumButton>
                )}
              </div>
              {group.roles.length === 0 ? (
                <p className="text-sm text-nexum-text-muted">Nenhuma role vinculada.</p>
              ) : (
                <ul className="space-y-2">
                  {group.roles.map((gr) => (
                    <li
                      key={gr.role.id}
                      className="flex items-center justify-between rounded-xl border border-nexum-border bg-nexum-surface px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-nexum-text">{gr.role.name}</p>
                        <code className="text-xs text-nexum-primary">{gr.role.slug}</code>
                      </div>
                      {canManageRoles && (
                        <NexumButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRole(gr.role.id)}
                        >
                          Remover
                        </NexumButton>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {canManageRoles && (
                <AddRoleToGroupModal
                  groupId={group.id}
                  open={addRoleOpen}
                  onClose={() => setAddRoleOpen(false)}
                  onAdded={async () => { setAddRoleOpen(false); await onRefresh(); }}
                />
              )}
            </div>
          )}

          {tab === "members" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-nexum-text">Membros</p>
              {membersLoading ? (
                <div className="flex items-center gap-2 text-sm text-nexum-text-muted">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-nexum-primary border-t-transparent" />
                  Carregando...
                </div>
              ) : members.length === 0 ? (
                <p className="text-sm text-nexum-text-muted">Nenhum membro neste grupo.</p>
              ) : (
                <ul className="space-y-2">
                  {members.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center gap-3 rounded-xl border border-nexum-border bg-nexum-surface px-3 py-2"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nexum-primary/10">
                        <UsersRound className="h-4 w-4 text-nexum-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-nexum-text">
                          {m.user.name}
                        </p>
                        <p className="truncate text-xs text-nexum-text-muted">{m.user.email}</p>
                      </div>
                      <NexumBadge
                        variant={m.user.status === "ACTIVE" ? "success" : "neutral"}
                        dot
                        className="ml-auto shrink-0"
                      >
                        {m.user.status}
                      </NexumBadge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </NexumDrawer>
  );
}

// ─── Modal: Criar/editar grupo ────────────────────────────────────────────────

function GroupFormModal({
  open,
  group,
  onClose,
  onSaved,
}: {
  open: boolean;
  group?: GroupRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useNexumToast();
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(group?.name ?? "");
    setDescription(group?.description ?? "");
  }, [group, open]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (group) {
        await updateGroup(group.id, { name: name.trim(), description: description.trim() || undefined });
        toast({ type: "success", title: "Grupo atualizado." });
      } else {
        await createGroup({ name: name.trim(), description: description.trim() || undefined });
        toast({ type: "success", title: "Grupo criado." });
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
      title={group ? "Editar grupo" : "Novo grupo"}
      footer={
        <>
          <NexumButton variant="ghost" onClick={onClose}>Cancelar</NexumButton>
          <NexumButton onClick={() => void handleSave()} disabled={!name.trim() || saving}>
            {saving ? "Salvando..." : group ? "Salvar" : "Criar grupo"}
          </NexumButton>
        </>
      }
    >
      <div className="space-y-4">
        <NexumFormField label="Nome" htmlFor="group-name" required>
          <NexumInput
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Operadores de Rota"
          />
        </NexumFormField>
        <NexumFormField label="Descrição" htmlFor="group-desc">
          <NexumTextarea
            id="group-desc"
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

// ─── Modal: Vincular role ao grupo ───────────────────────────────────────────

function AddRoleToGroupModal({
  groupId,
  open,
  onClose,
  onAdded,
}: {
  groupId: string;
  open: boolean;
  onClose: () => void;
  onAdded: () => Promise<void>;
}) {
  const { toast } = useNexumToast();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      void fetchRoles().then(setRoles);
    }
  }, [open]);

  async function handleAdd() {
    if (!selected) return;
    setSaving(true);
    try {
      await addGroupRole(groupId, selected);
      toast({ type: "success", title: "Role vinculada ao grupo." });
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
      title="Vincular role ao grupo"
      footer={
        <>
          <NexumButton variant="ghost" onClick={onClose}>Cancelar</NexumButton>
          <NexumButton onClick={() => void handleAdd()} disabled={!selected || saving}>
            Vincular
          </NexumButton>
        </>
      }
    >
      <NexumFormField label="Role" htmlFor="group-role">
        <NexumSelect
          id="group-role"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Selecione uma role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </NexumSelect>
      </NexumFormField>
    </NexumModal>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function GroupsAdminPage() {
  return (
    <NexumToastProvider>
      <GroupsAdminPageInner />
    </NexumToastProvider>
  );
}
