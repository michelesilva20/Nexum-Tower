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
  NexumMetricCard,
  NexumModal,
  NexumSelect,
  NexumTableSearch,
  NexumTableToolbar,
  NexumToastProvider,
  NexumTabs,
  useNexumToast,
  type NexumTab,
} from "@/components/ui/nexum";
import { useTablePagination } from "@/hooks/use-table-pagination";
import {
  activateUser,
  addUserGroup,
  addUserOverride,
  addUserRole,
  createUser,
  deleteUser,
  disableUser,
  fetchGroups,
  fetchPermissions,
  fetchRoles,
  fetchUserById,
  fetchUserEffectivePermissions,
  fetchUsers,
  removeUserGroup,
  removeUserOverride,
  removeUserRole,
  type GroupRow,
  type PermissionOverride,
  type PermissionRow,
  type RoleRow,
  type UserDetail,
  type UserRow,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { AlertTriangle, Plus, ShieldAlert, UserCheck, UserX, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

// ─── Inner components (need toast ctx) ──────────────────────────────────────

function UsersAdminPageInner() {
  const t = useTranslations("admin.users");
  const { toast } = useNexumToast();

  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [drawerUser, setDrawerUser] = useState<UserDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState<UserRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);

  const canCreate = usePermission("users.create");
  const canUpdate = usePermission("users.update");
  const canDisable = usePermission("users.disable");
  const canManageRoles = usePermission("users.manage_roles");
  const canManageGroups = usePermission("users.manage_groups");
  const canManageOverrides = usePermission("users.manage_overrides");

  const load = useCallback(() => {
    setLoading(true);
    void fetchUsers()
      .then(setRows)
      .catch((e) => setError(e instanceof ApiError ? e.message : t("error")))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const matchSearch =
          !search ||
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.email.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || r.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [rows, search, statusFilter],
  );

  const { paginatedItems, pagination, resetPage } = useTablePagination(filtered, {
    initialPageSize: 10,
  });

  useEffect(() => { resetPage(); }, [search, statusFilter, resetPage]);

  const stats = useMemo(
    () => ({
      active: rows.filter((r) => r.status === "ACTIVE").length,
      invited: rows.filter((r) => r.status === "INVITED").length,
      disabled: rows.filter((r) => r.status === "DISABLED").length,
      total: rows.length,
    }),
    [rows],
  );

  async function openDrawer(row: UserRow) {
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const detail = await fetchUserById(row.id);
      setDrawerUser(detail);
    } catch {
      toast({ type: "error", title: "Não foi possível carregar detalhes do usuário." });
      setDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  }

  async function handleDisable(user: UserRow) {
    try {
      await disableUser(user.id);
      toast({ type: "success", title: "Usuário desativado." });
      load();
      if (drawerUser?.id === user.id) setDrawerOpen(false);
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro ao desativar." });
    }
    setConfirmDisable(null);
  }

  async function handleActivate(user: UserRow) {
    try {
      await activateUser(user.id);
      toast({ type: "success", title: "Usuário reativado." });
      load();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro ao reativar." });
    }
  }

  async function handleDelete(user: UserRow) {
    try {
      await deleteUser(user.id);
      toast({ type: "success", title: "Usuário removido." });
      load();
      setDrawerOpen(false);
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro ao remover." });
    }
    setConfirmDelete(null);
  }

  const statusVariant = (s: string) =>
    s === "ACTIVE" ? "success" : s === "INVITED" ? "warning" : "neutral";

  const statusLabel = (s: string) =>
    s === "ACTIVE" ? "Ativo" : s === "INVITED" ? "Convidado" : "Desativado";

  return (
    <PermissionGate permission="users.read">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          breadcrumb={[
            { label: "Admin", href: "/app" },
            { label: t("title") },
          ]}
          title={t("title")}
          description={t("subtitle")}
          actions={
            canCreate ? (
              <NexumButton onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                {t("actions.invite")}
              </NexumButton>
            ) : undefined
          }
        />

        {error && (
          <NexumCard variant="danger" padding="sm">
            <p className="text-sm text-nexum-danger">{error}</p>
          </NexumCard>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NexumMetricCard
            label="Ativos"
            value={stats.active}
            icon={<UserCheck className="h-5 w-5" />}
          />
          <NexumMetricCard
            label="Convidados"
            value={stats.invited}
            icon={<Users className="h-5 w-5" />}
          />
          <NexumMetricCard
            label="Desativados"
            value={stats.disabled}
            icon={<UserX className="h-5 w-5" />}
          />
          <NexumMetricCard
            label="Total"
            value={stats.total}
            icon={<Users className="h-5 w-5" />}
          />
        </div>

        <NexumDataTable
          isLoading={loading}
          rows={paginatedItems}
          pagination={pagination}
          emptyTitle={t("empty")}
          emptyDescription={t("emptyDescription")}
          toolbar={
            <NexumTableToolbar
              search={
                <NexumTableSearch
                  value={search}
                  onChange={setSearch}
                  placeholder={t("searchPlaceholder")}
                />
              }
              actions={
                <NexumSelect
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-44"
                >
                  <option value="">Todos os status</option>
                  <option value="ACTIVE">Ativos</option>
                  <option value="INVITED">Convidados</option>
                  <option value="DISABLED">Desativados</option>
                </NexumSelect>
              }
            />
          }
          columns={[
            {
              key: "name",
              header: t("columns.name"),
              render: (r) => (
                <div>
                  <p className="font-medium text-nexum-text">{r.name}</p>
                  <p className="text-xs text-nexum-text-muted">{r.email}</p>
                </div>
              ),
            },
            {
              key: "status",
              header: t("columns.status"),
              render: (r) => (
                <NexumBadge variant={statusVariant(r.status)} dot>
                  {statusLabel(r.status)}
                </NexumBadge>
              ),
            },
            {
              key: "lastLogin",
              header: t("columns.lastLogin"),
              render: (r) => (
                <span className="text-sm text-nexum-text-muted">
                  {r.lastLoginAt ? new Date(r.lastLoginAt).toLocaleString("pt-BR") : "—"}
                </span>
              ),
            },
            {
              key: "createdAt",
              header: "Criado em",
              render: (r) => (
                <span className="text-sm text-nexum-text-muted">
                  {new Date(r.createdAt).toLocaleDateString("pt-BR")}
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
                  {canDisable && r.status !== "DISABLED" && (
                    <NexumButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmDisable(r)}
                    >
                      Desativar
                    </NexumButton>
                  )}
                  {canUpdate && r.status === "DISABLED" && (
                    <NexumButton size="sm" variant="ghost" onClick={() => handleActivate(r)}>
                      Reativar
                    </NexumButton>
                  )}
                </div>
              ),
            },
          ]}
        />

        {/* Drawer de detalhes */}
        <UserDetailDrawer
          open={drawerOpen}
          loading={drawerLoading}
          user={drawerUser}
          onClose={() => setDrawerOpen(false)}
          onRefresh={async () => {
            if (drawerUser) {
              const updated = await fetchUserById(drawerUser.id);
              setDrawerUser(updated);
              load();
            }
          }}
          canManageRoles={canManageRoles}
          canManageGroups={canManageGroups}
          canManageOverrides={canManageOverrides}
          canDisable={canDisable}
          onDisable={() => drawerUser && setConfirmDisable(drawerUser)}
          onDelete={() => drawerUser && setConfirmDelete(drawerUser)}
        />

        {/* Modal criar usuário */}
        {canCreate && (
          <CreateUserModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onCreated={() => { setCreateOpen(false); load(); }}
          />
        )}

        {/* Confirmação desativar */}
        <NexumConfirmModal
          open={!!confirmDisable}
          onClose={() => setConfirmDisable(null)}
          onConfirm={() => confirmDisable && handleDisable(confirmDisable)}
          title="Desativar usuário"
          description={`Deseja desativar ${confirmDisable?.name}? O usuário perderá acesso à plataforma.`}
          confirmLabel="Desativar"
          danger
        />

        {/* Confirmação excluir */}
        <NexumConfirmModal
          open={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
          title="Remover usuário"
          description={`Esta ação desativa o usuário ${confirmDelete?.name} permanentemente. Confirmar?`}
          confirmLabel="Remover"
          danger
        />
      </div>
    </PermissionGate>
  );
}

// ─── User Detail Drawer ──────────────────────────────────────────────────────

function UserDetailDrawer({
  open,
  loading,
  user,
  onClose,
  onRefresh,
  canManageRoles,
  canManageGroups,
  canManageOverrides,
  canDisable,
  onDisable,
  onDelete,
}: {
  open: boolean;
  loading: boolean;
  user: UserDetail | null;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  canManageRoles: boolean;
  canManageGroups: boolean;
  canManageOverrides: boolean;
  canDisable: boolean;
  onDisable: () => void;
  onDelete: () => void;
}) {
  const { toast } = useNexumToast();
  const [tab, setTab] = useState<string>("info");
  const [effectivePerms, setEffectivePerms] = useState<string[]>([]);
  const [permsLoading, setPermsLoading] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);

  const tabs: NexumTab[] = [
    { key: "info", label: "Dados" },
    { key: "roles", label: "Roles" },
    { key: "groups", label: "Grupos" },
    { key: "overrides", label: "Overrides" },
    { key: "permissions", label: "Permissões efetivas" },
  ];

  useEffect(() => {
    if (tab === "permissions" && user) {
      setPermsLoading(true);
      void fetchUserEffectivePermissions(user.id)
        .then((res) => setEffectivePerms(res.permissions))
        .catch(() => toast({ type: "error", title: "Erro ao carregar permissões." }))
        .finally(() => setPermsLoading(false));
    }
  }, [tab, user, toast]);

  async function handleRemoveRole(roleId: string) {
    if (!user) return;
    try {
      await removeUserRole(user.id, roleId);
      toast({ type: "success", title: "Role removida." });
      await onRefresh();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro." });
    }
  }

  async function handleRemoveGroup(groupId: string) {
    if (!user) return;
    try {
      await removeUserGroup(user.id, groupId);
      toast({ type: "success", title: "Grupo removido." });
      await onRefresh();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro." });
    }
  }

  async function handleRemoveOverride(overrideId: string) {
    if (!user) return;
    try {
      await removeUserOverride(user.id, overrideId);
      toast({ type: "success", title: "Override removido." });
      await onRefresh();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro." });
    }
  }

  const statusLabel = (s: string) =>
    s === "ACTIVE" ? "Ativo" : s === "INVITED" ? "Convidado" : "Desativado";

  return (
    <NexumDrawer
      open={open}
      onClose={onClose}
      title={user?.name ?? "Detalhes do usuário"}
      description={user?.email}
      width="lg"
      footer={
        user ? (
          <div className="flex w-full items-center justify-between">
            <div className="flex gap-2">
              {canDisable && user.status !== "DISABLED" && (
                <NexumButton variant="ghost" size="sm" onClick={onDisable}>
                  Desativar
                </NexumButton>
              )}
            </div>
            <NexumButton variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </NexumButton>
          </div>
        ) : undefined
      }
    >
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-nexum-primary border-t-transparent" />
        </div>
      )}

      {!loading && user && (
        <div className="space-y-4">
          <NexumTabs tabs={tabs} activeKey={tab} onChange={setTab} />

          {tab === "info" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-nexum-text-soft">Nome</p>
                  <p className="text-sm font-medium text-nexum-text">{user.name}</p>
                </div>
                <div>
                  <p className="text-xs text-nexum-text-soft">E-mail</p>
                  <p className="text-sm text-nexum-text">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-nexum-text-soft">Status</p>
                  <NexumBadge
                    variant={
                      user.status === "ACTIVE"
                        ? "success"
                        : user.status === "INVITED"
                          ? "warning"
                          : "neutral"
                    }
                    dot
                  >
                    {statusLabel(user.status)}
                  </NexumBadge>
                </div>
                <div>
                  <p className="text-xs text-nexum-text-soft">Criado em</p>
                  <p className="text-sm text-nexum-text">
                    {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {user.lastLoginAt && (
                  <div>
                    <p className="text-xs text-nexum-text-soft">Último acesso</p>
                    <p className="text-sm text-nexum-text">
                      {new Date(user.lastLoginAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                )}
                {user.tenant && (
                  <div>
                    <p className="text-xs text-nexum-text-soft">Tenant</p>
                    <p className="text-sm text-nexum-text">{user.tenant.name}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "roles" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-nexum-text">Roles diretas</p>
                {canManageRoles && (
                  <AddRoleToUserModal userId={user.id} onAdded={onRefresh} />
                )}
              </div>
              {user.roles.length === 0 ? (
                <p className="text-sm text-nexum-text-muted">Nenhuma role atribuída diretamente.</p>
              ) : (
                <ul className="space-y-2">
                  {user.roles.map((ur) => (
                    <li
                      key={ur.role.id}
                      className="flex items-center justify-between rounded-xl border border-nexum-border bg-nexum-surface px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-nexum-text">{ur.role.name}</p>
                        <code className="text-xs text-nexum-primary">{ur.role.slug}</code>
                      </div>
                      {canManageRoles && (
                        <NexumButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRole(ur.role.id)}
                        >
                          Remover
                        </NexumButton>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "groups" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-nexum-text">Grupos</p>
                {canManageGroups && (
                  <AddGroupToUserModal userId={user.id} onAdded={onRefresh} />
                )}
              </div>
              {user.groups.length === 0 ? (
                <p className="text-sm text-nexum-text-muted">Nenhum grupo atribuído.</p>
              ) : (
                <ul className="space-y-2">
                  {user.groups.map((ug) => (
                    <li
                      key={ug.group.id}
                      className="flex items-center justify-between rounded-xl border border-nexum-border bg-nexum-surface px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-nexum-text">{ug.group.name}</p>
                        <code className="text-xs text-nexum-primary">{ug.group.slug}</code>
                      </div>
                      {canManageGroups && (
                        <NexumButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveGroup(ug.group.id)}
                        >
                          Remover
                        </NexumButton>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "overrides" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-nexum-text">Overrides de permissão</p>
                {canManageOverrides && (
                  <NexumButton size="sm" onClick={() => setOverrideOpen(true)}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Adicionar
                  </NexumButton>
                )}
              </div>
              {user.overrides.length === 0 ? (
                <p className="text-sm text-nexum-text-muted">Nenhum override configurado.</p>
              ) : (
                <ul className="space-y-2">
                  {user.overrides.map((ov) => (
                    <OverrideItem
                      key={ov.id}
                      override={ov}
                      canRemove={canManageOverrides}
                      onRemove={() => handleRemoveOverride(ov.id)}
                    />
                  ))}
                </ul>
              )}
              {canManageOverrides && (
                <AddOverrideModal
                  userId={user.id}
                  open={overrideOpen}
                  onClose={() => setOverrideOpen(false)}
                  onAdded={async () => { setOverrideOpen(false); await onRefresh(); }}
                />
              )}
            </div>
          )}

          {tab === "permissions" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-nexum-text">Permissões efetivas</p>
              {permsLoading ? (
                <div className="flex items-center gap-2 text-sm text-nexum-text-muted">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-nexum-primary border-t-transparent" />
                  Carregando...
                </div>
              ) : effectivePerms.length === 0 ? (
                <p className="text-sm text-nexum-text-muted">Nenhuma permissão efetiva.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {effectivePerms.map((p) => (
                    <code
                      key={p}
                      className="rounded-lg bg-nexum-primary/10 px-2 py-0.5 text-xs text-nexum-primary"
                    >
                      {p}
                    </code>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </NexumDrawer>
  );
}

function OverrideItem({
  override,
  canRemove,
  onRemove,
}: {
  override: PermissionOverride;
  canRemove: boolean;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-start justify-between rounded-xl border border-nexum-border bg-nexum-surface px-3 py-2">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <code className="text-xs font-medium text-nexum-text">{override.permission.key}</code>
          <NexumBadge variant={override.effect === "ALLOW" ? "success" : "danger"}>
            {override.effect}
          </NexumBadge>
        </div>
        {override.reason && (
          <p className="text-xs text-nexum-text-muted">{override.reason}</p>
        )}
      </div>
      {canRemove && (
        <NexumButton variant="ghost" size="sm" onClick={onRemove}>
          Remover
        </NexumButton>
      )}
    </li>
  );
}

// ─── Modal: Criar usuário ────────────────────────────────────────────────────

function CreateUserModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { toast } = useNexumToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  function validate() {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Nome é obrigatório.";
    if (!email.trim() || !email.includes("@")) errs.email = "E-mail inválido.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      await createUser({ name: name.trim(), email: email.trim() });
      toast({ type: "success", title: "Usuário criado.", description: "Status: Convidado." });
      setName("");
      setEmail("");
      onCreated();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro ao criar." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <NexumModal
      open={open}
      onClose={onClose}
      title="Novo usuário"
      description="O usuário receberá status 'Convidado' até definir senha."
      footer={
        <>
          <NexumButton variant="ghost" onClick={onClose}>Cancelar</NexumButton>
          <NexumButton onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? "Criando..." : "Criar usuário"}
          </NexumButton>
        </>
      }
    >
      <div className="space-y-4">
        <NexumFormField label="Nome" htmlFor="new-name" required error={errors.name}>
          <NexumInput
            id="new-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo"
            error={!!errors.name}
          />
        </NexumFormField>
        <NexumFormField label="E-mail" htmlFor="new-email" required error={errors.email}>
          <NexumInput
            id="new-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@empresa.com"
            error={!!errors.email}
          />
        </NexumFormField>
      </div>
    </NexumModal>
  );
}

// ─── Modal: Adicionar role ao usuário ────────────────────────────────────────

function AddRoleToUserModal({
  userId,
  onAdded,
}: {
  userId: string;
  onAdded: () => Promise<void>;
}) {
  const { toast } = useNexumToast();
  const [open, setOpen] = useState(false);
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
      await addUserRole(userId, selected);
      toast({ type: "success", title: "Role adicionada." });
      await onAdded();
      setOpen(false);
      setSelected("");
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <NexumButton size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        Adicionar role
      </NexumButton>
      <NexumModal
        open={open}
        onClose={() => setOpen(false)}
        title="Adicionar role"
        footer={
          <>
            <NexumButton variant="ghost" onClick={() => setOpen(false)}>Cancelar</NexumButton>
            <NexumButton onClick={() => void handleAdd()} disabled={!selected || saving}>
              Adicionar
            </NexumButton>
          </>
        }
      >
        <NexumFormField label="Role" htmlFor="add-role">
          <NexumSelect
            id="add-role"
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
    </>
  );
}

// ─── Modal: Adicionar grupo ao usuário ───────────────────────────────────────

function AddGroupToUserModal({
  userId,
  onAdded,
}: {
  userId: string;
  onAdded: () => Promise<void>;
}) {
  const { toast } = useNexumToast();
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      void fetchGroups().then(setGroups);
    }
  }, [open]);

  async function handleAdd() {
    if (!selected) return;
    setSaving(true);
    try {
      await addUserGroup(userId, selected);
      toast({ type: "success", title: "Grupo adicionado." });
      await onAdded();
      setOpen(false);
      setSelected("");
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <NexumButton size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        Adicionar grupo
      </NexumButton>
      <NexumModal
        open={open}
        onClose={() => setOpen(false)}
        title="Adicionar grupo"
        footer={
          <>
            <NexumButton variant="ghost" onClick={() => setOpen(false)}>Cancelar</NexumButton>
            <NexumButton onClick={() => void handleAdd()} disabled={!selected || saving}>
              Adicionar
            </NexumButton>
          </>
        }
      >
        <NexumFormField label="Grupo" htmlFor="add-group">
          <NexumSelect
            id="add-group"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Selecione um grupo</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </NexumSelect>
        </NexumFormField>
      </NexumModal>
    </>
  );
}

// ─── Modal: Adicionar override ────────────────────────────────────────────────

function AddOverrideModal({
  userId,
  open,
  onClose,
  onAdded,
}: {
  userId: string;
  open: boolean;
  onClose: () => void;
  onAdded: () => Promise<void>;
}) {
  const { toast } = useNexumToast();
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [permId, setPermId] = useState("");
  const [effect, setEffect] = useState<"ALLOW" | "DENY">("ALLOW");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      void fetchPermissions().then(setPermissions);
    }
  }, [open]);

  async function handleAdd() {
    if (!permId) return;
    setSaving(true);
    try {
      await addUserOverride(userId, { permissionId: permId, effect, reason: reason || undefined });
      toast({ type: "success", title: "Override adicionado." });
      await onAdded();
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
      title="Adicionar override de permissão"
      footer={
        <>
          <NexumButton variant="ghost" onClick={onClose}>Cancelar</NexumButton>
          <NexumButton
            variant={effect === "DENY" ? "danger" : "primary"}
            onClick={() => void handleAdd()}
            disabled={!permId || saving}
          >
            {saving ? "Salvando..." : "Adicionar override"}
          </NexumButton>
        </>
      }
    >
      <div className="space-y-4">
        <NexumFormField label="Permissão" htmlFor="override-perm">
          <NexumSelect
            id="override-perm"
            value={permId}
            onChange={(e) => setPermId(e.target.value)}
          >
            <option value="">Selecione uma permissão</option>
            {permissions.map((p) => (
              <option key={p.id} value={p.id}>{p.key}</option>
            ))}
          </NexumSelect>
        </NexumFormField>
        <NexumFormField label="Efeito" htmlFor="override-effect">
          <NexumSelect
            id="override-effect"
            value={effect}
            onChange={(e) => setEffect(e.target.value as "ALLOW" | "DENY")}
          >
            <option value="ALLOW">ALLOW — Conceder</option>
            <option value="DENY">DENY — Negar (prioridade sobre ALLOW)</option>
          </NexumSelect>
        </NexumFormField>
        {effect === "DENY" && (
          <div className="flex items-start gap-2 rounded-xl border border-nexum-danger/30 bg-nexum-danger/5 px-3 py-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-nexum-danger" />
            <p className="text-xs text-nexum-danger">
              Esta negação terá prioridade sobre permissões herdadas por grupos ou roles.
            </p>
          </div>
        )}
        <NexumFormField label="Motivo (opcional)" htmlFor="override-reason">
          <NexumInput
            id="override-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Descreva o motivo deste override..."
          />
        </NexumFormField>
      </div>
    </NexumModal>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function UsersAdminPage() {
  return (
    <NexumToastProvider>
      <UsersAdminPageInner />
    </NexumToastProvider>
  );
}
