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
  NexumTableCode,
  NexumTableRowActions,
  NexumTableSearch,
  NexumTableText,
  NexumTableToolbar,
  NexumToastProvider,
  useNexumToast,
  type NexumTableActionItem,
} from "@/components/ui/nexum";
import {
  assignBranchUser,
  createBranch,
  deleteBranch,
  disableBranch,
  enableBranch,
  fetchBranchUsers,
  fetchBranches,
  fetchUsers,
  removeBranchUser,
  updateBranch,
  type BranchRow,
  type BranchStatus,
  type BranchUserAccess,
  type UserRow,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const STATUS_LABELS: Record<BranchStatus, string> = {
  ACTIVE: "Ativa",
  INACTIVE: "Inativa",
  DISABLED: "Desativada",
};

const STATUS_VARIANT: Record<BranchStatus, "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  DISABLED: "danger",
};

type BranchForm = {
  code: string;
  name: string;
  legalName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  status: BranchStatus;
  isHeadquarters: boolean;
};

const emptyForm: BranchForm = {
  code: "",
  name: "",
  legalName: "",
  documentType: "",
  documentNumber: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  country: "BR",
  zipCode: "",
  status: "ACTIVE",
  isHeadquarters: false,
};

function BranchesAdminPageInner() {
  const { toast } = useNexumToast();
  const [rows, setRows] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [hqFilter, setHqFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<BranchRow | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [confirmAction, setConfirmAction] = useState<
    { type: "disable" | "enable" | "delete"; branch: BranchRow } | null
  >(null);

  const [usersDrawer, setUsersDrawer] = useState<BranchRow | null>(null);
  const [branchUsers, setBranchUsers] = useState<BranchUserAccess[]>([]);
  const [allUsers, setAllUsers] = useState<UserRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const canCreate = usePermission("branches.create");
  const canUpdate = usePermission("branches.update");
  const canDisable = usePermission("branches.disable");
  const canDelete = usePermission("branches.delete");
  const canAssignUsers = usePermission("branches.assign_users");

  const load = useCallback(() => {
    setLoading(true);
    void fetchBranches({
      search: search || undefined,
      status: (statusFilter as BranchStatus) || undefined,
      isHeadquarters: hqFilter === "true" ? true : hqFilter === "false" ? false : undefined,
      page,
      perPage: 10,
      sortBy: "name",
      sortDirection: "asc",
    })
      .then(({ items, pagination }) => {
        setRows(items);
        setTotal(pagination.total);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Erro ao carregar filiais."))
      .finally(() => setLoading(false));
  }, [search, statusFilter, hqFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditBranch(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(branch: BranchRow) {
    setEditBranch(branch);
    setForm({
      code: branch.code,
      name: branch.name,
      legalName: branch.legalName ?? "",
      documentType: branch.documentType ?? "",
      documentNumber: branch.documentNumber ?? "",
      email: branch.email ?? "",
      phone: branch.phone ?? "",
      city: branch.city ?? "",
      state: branch.state ?? "",
      country: branch.country ?? "BR",
      zipCode: branch.zipCode ?? "",
      status: branch.status,
      isHeadquarters: branch.isHeadquarters,
    });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.code.trim() || !form.name.trim()) {
      toast({ type: "error", title: "Código e nome são obrigatórios." });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        legalName: form.legalName || undefined,
        documentType: form.documentType || undefined,
        documentNumber: form.documentNumber || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country || undefined,
        zipCode: form.zipCode || undefined,
        status: form.status,
        isHeadquarters: form.isHeadquarters,
      };

      if (editBranch) {
        await updateBranch(editBranch.id, payload);
        toast({ type: "success", title: "Filial atualizada." });
      } else {
        await createBranch(payload);
        toast({ type: "success", title: "Filial criada." });
      }
      setFormOpen(false);
      load();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro ao salvar." });
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;
    const { type, branch } = confirmAction;
    try {
      if (type === "disable") await disableBranch(branch.id);
      if (type === "enable") await enableBranch(branch.id);
      if (type === "delete") await deleteBranch(branch.id);
      toast({ type: "success", title: "Operação concluída." });
      load();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro na operação." });
    }
    setConfirmAction(null);
  }

  async function openUsersDrawer(branch: BranchRow) {
    setUsersDrawer(branch);
    try {
      const [users, tenantUsers] = await Promise.all([
        fetchBranchUsers(branch.id),
        fetchUsers(),
      ]);
      setBranchUsers(users);
      setAllUsers(tenantUsers);
      setSelectedUserId("");
    } catch {
      toast({ type: "error", title: "Erro ao carregar usuários da filial." });
      setUsersDrawer(null);
    }
  }

  async function handleAssignUser() {
    if (!usersDrawer || !selectedUserId) return;
    try {
      await assignBranchUser(usersDrawer.id, selectedUserId);
      const users = await fetchBranchUsers(usersDrawer.id);
      setBranchUsers(users);
      setSelectedUserId("");
      toast({ type: "success", title: "Usuário vinculado." });
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro ao vincular." });
    }
  }

  async function handleRemoveUser(userId: string) {
    if (!usersDrawer) return;
    try {
      await removeBranchUser(usersDrawer.id, userId);
      setBranchUsers((prev) => prev.filter((u) => u.user.id !== userId));
      toast({ type: "success", title: "Vínculo removido." });
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro ao remover." });
    }
  }

  return (
    <PermissionGate permission="branches.read">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          breadcrumb={[{ label: "Admin", href: "/app" }, { label: "Filiais" }]}
          title="Filiais"
          description="Gerencie unidades operacionais do tenant — matriz, filiais e escopo por unidade."
          actions={
            canCreate ? (
              <NexumButton onClick={openCreate}>
                <Plus className="mr-1.5 h-4 w-4" />
                Nova filial
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
          emptyTitle="Nenhuma filial encontrada"
          emptyDescription="Cadastre a primeira unidade operacional do tenant."
          rows={rows}
          toolbar={
            <NexumTableToolbar
              search={
                <NexumTableSearch
                  value={search}
                  onChange={(v) => {
                    setSearch(v);
                    setPage(1);
                  }}
                  placeholder="Buscar por código, nome, documento, cidade..."
                />
              }
              actions={
                <>
                  <NexumSelect
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-40"
                  >
                    <option value="">Todos os status</option>
                    <option value="ACTIVE">Ativa</option>
                    <option value="INACTIVE">Inativa</option>
                    <option value="DISABLED">Desativada</option>
                  </NexumSelect>
                  <NexumSelect
                    value={hqFilter}
                    onChange={(e) => {
                      setHqFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-36"
                  >
                    <option value="">Matriz / Filial</option>
                    <option value="true">Somente matriz</option>
                    <option value="false">Somente filiais</option>
                  </NexumSelect>
                </>
              }
            />
          }
          pagination={{
            page,
            pageSize: 10,
            total,
            onPageChange: setPage,
          }}
          columns={[
            {
              key: "code",
              header: "Código",
              render: (r) => <NexumTableCode value={r.code} />,
            },
            { key: "name", header: "Nome", render: (r) => r.name },
            { key: "legalName", header: "Razão social", render: (r) => r.legalName ?? "—" },
            {
              key: "document",
              header: "Documento",
              render: (r) =>
                r.documentNumber ? `${r.documentType ?? ""} ${r.documentNumber}`.trim() : "—",
            },
            {
              key: "location",
              header: "Cidade/UF",
              render: (r) => (r.city ? `${r.city}${r.state ? ` / ${r.state}` : ""}` : "—"),
            },
            {
              key: "hq",
              header: "Matriz",
              render: (r) =>
                r.isHeadquarters ? (
                  <NexumBadge variant="info">Matriz</NexumBadge>
                ) : (
                  <span className="text-nexum-text-muted">—</span>
                ),
            },
            {
              key: "status",
              header: "Status",
              render: (r) => (
                <NexumBadge variant={STATUS_VARIANT[r.status]}>{STATUS_LABELS[r.status]}</NexumBadge>
              ),
            },
            {
              key: "updatedAt",
              header: "Atualizado",
              render: (r) => new Date(r.updatedAt).toLocaleDateString("pt-BR"),
            },
            {
              key: "actions",
              header: "Ações",
              align: "right",
              render: (r) => {
                const items: NexumTableActionItem[] = [
                  ...(canUpdate
                    ? [{ key: "edit", label: "Editar", onSelect: () => openEdit(r) }]
                    : []),
                  ...(canDisable && r.status !== "DISABLED"
                    ? [
                        {
                          key: "disable",
                          label: "Desativar",
                          onSelect: () => setConfirmAction({ type: "disable", branch: r }),
                        },
                      ]
                    : []),
                  ...(canDisable && r.status === "DISABLED"
                    ? [
                        {
                          key: "enable",
                          label: "Reativar",
                          onSelect: () => setConfirmAction({ type: "enable", branch: r }),
                        },
                      ]
                    : []),
                  ...(canDelete
                    ? [
                        {
                          key: "delete",
                          label: "Excluir",
                          danger: true,
                          onSelect: () => setConfirmAction({ type: "delete", branch: r }),
                        },
                      ]
                    : []),
                  ...(canAssignUsers
                    ? [
                        {
                          key: "users",
                          label: "Usuários",
                          onSelect: () => void openUsersDrawer(r),
                        },
                      ]
                    : []),
                ];
                return <NexumTableRowActions items={items} />;
              },
            },
          ]}
        />

        <NexumModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title={editBranch ? "Editar filial" : "Nova filial"}
          size="lg"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <NexumFormField label="Código *">
              <NexumInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            </NexumFormField>
            <NexumFormField label="Nome *">
              <NexumInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </NexumFormField>
            <NexumFormField label="Razão social" className="sm:col-span-2">
              <NexumInput value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} />
            </NexumFormField>
            <NexumFormField label="Tipo documento">
              <NexumInput value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })} />
            </NexumFormField>
            <NexumFormField label="Número documento">
              <NexumInput
                value={form.documentNumber}
                onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
              />
            </NexumFormField>
            <NexumFormField label="E-mail">
              <NexumInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </NexumFormField>
            <NexumFormField label="Telefone">
              <NexumInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </NexumFormField>
            <NexumFormField label="Cidade">
              <NexumInput value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </NexumFormField>
            <NexumFormField label="UF">
              <NexumInput value={form.state} maxLength={2} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} />
            </NexumFormField>
            <NexumFormField label="Status">
              <NexumSelect value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as BranchStatus })}>
                <option value="ACTIVE">Ativa</option>
                <option value="INACTIVE">Inativa</option>
                <option value="DISABLED">Desativada</option>
              </NexumSelect>
            </NexumFormField>
            <NexumFormField label="Matriz">
              <label className="flex items-center gap-2 text-sm text-nexum-text">
                <input
                  type="checkbox"
                  checked={form.isHeadquarters}
                  onChange={(e) => setForm({ ...form, isHeadquarters: e.target.checked })}
                />
                Unidade matriz do tenant
              </label>
            </NexumFormField>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <NexumButton variant="secondary" onClick={() => setFormOpen(false)}>
              Cancelar
            </NexumButton>
            <NexumButton loading={saving} onClick={() => void handleSave()}>
              Salvar
            </NexumButton>
          </div>
        </NexumModal>

        <NexumConfirmModal
          open={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => void handleConfirmAction()}
          title={
            confirmAction?.type === "delete"
              ? "Excluir filial"
              : confirmAction?.type === "enable"
                ? "Reativar filial"
                : "Desativar filial"
          }
          description={`Confirma a operação para ${confirmAction?.branch.name ?? ""}?`}
          confirmLabel="Confirmar"
          danger={confirmAction?.type === "delete"}
        />

        <NexumDrawer
          open={!!usersDrawer}
          onClose={() => setUsersDrawer(null)}
          title={`Usuários — ${usersDrawer?.name ?? ""}`}
        >
          {canAssignUsers && (
            <div className="mb-4 flex gap-2">
              <NexumSelect
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex-1"
              >
                <option value="">Selecionar usuário...</option>
                {allUsers
                  .filter((u) => !branchUsers.some((b) => b.user.id === u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
              </NexumSelect>
              <NexumButton disabled={!selectedUserId} onClick={() => void handleAssignUser()}>
                Vincular
              </NexumButton>
            </div>
          )}
          <ul className="space-y-2">
            {branchUsers.length === 0 && (
              <p className="text-sm text-nexum-text-muted">Nenhum usuário vinculado a esta filial.</p>
            )}
            {branchUsers.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between rounded-xl border border-nexum-border/50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-nexum-text">{row.user.name}</p>
                  <p className="text-xs text-nexum-text-muted">{row.user.email}</p>
                </div>
                {canAssignUsers && (
                  <NexumButton size="sm" variant="ghost" onClick={() => void handleRemoveUser(row.user.id)}>
                    Remover
                  </NexumButton>
                )}
              </li>
            ))}
          </ul>
        </NexumDrawer>
      </div>
    </PermissionGate>
  );
}

export function BranchesAdminPage() {
  return (
    <NexumToastProvider>
      <BranchesAdminPageInner />
    </NexumToastProvider>
  );
}
