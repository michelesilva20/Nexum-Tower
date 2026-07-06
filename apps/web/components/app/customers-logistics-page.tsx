"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PermissionGate, useAnyPermission, usePermission } from "@/components/app/permission-gate";
import {
  NexumBadge,
  NexumButton,
  NexumCard,
  NexumConfirmModal,
  NexumDataTable,
  NexumDrawer,
  NexumFormField,
  NexumInput,
  NexumSelect,
  NexumTableSearch,
  NexumTableToolbar,
  NexumTextarea,
  NexumToastProvider,
  useNexumToast,
} from "@/components/ui/nexum";
import { fetchBranches, type BranchRow } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import {
  assignCustomerBranches,
  createCustomer,
  deleteCustomer,
  disableCustomer,
  enableCustomer,
  listCustomerBranches,
  listCustomers,
  removeCustomerBranch,
  setCustomerPrimaryBranch,
  updateCustomer,
  type CustomerDocumentType,
  type CustomerRow,
  type CustomerStatus,
  type CustomerType,
} from "@/lib/logistics-api";
import { Building2, Eye, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const GLOBAL_CUSTOMER_SCOPE = [
  "customers.manage",
  "logistics.manage",
  "organization.manage",
  "*",
] as const;

const STATUS_LABELS: Record<CustomerStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  DISABLED: "Desativado",
};

const STATUS_VARIANT: Record<CustomerStatus, "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  DISABLED: "danger",
};

const TYPE_LABELS: Record<CustomerType, string> = {
  CONTRACTING_CUSTOMER: "Contratante",
  SHIPPER: "Embarcador",
  CONSIGNEE: "Destinatário",
  SHIPPER_AND_CONSIGNEE: "Emb./Dest.",
  BROKER: "Corretor",
  PARTNER: "Parceiro",
  OTHER: "Outro",
};

type CustomerForm = {
  code: string;
  legalName: string;
  tradeName: string;
  customerType: CustomerType;
  documentType: CustomerDocumentType | "";
  documentNumber: string;
  stateRegistration: string;
  municipalRegistration: string;
  mainContactName: string;
  mainContactRole: string;
  email: string;
  billingEmail: string;
  phone: string;
  whatsapp: string;
  website: string;
  billingAddressLine1: string;
  billingAddressLine2: string;
  billingDistrict: string;
  billingCity: string;
  billingState: string;
  billingCountry: string;
  billingZipCode: string;
  status: CustomerStatus;
  notes: string;
  branchIds: string[];
  primaryBranchId: string;
};

const emptyForm: CustomerForm = {
  code: "",
  legalName: "",
  tradeName: "",
  customerType: "CONTRACTING_CUSTOMER",
  documentType: "",
  documentNumber: "",
  stateRegistration: "",
  municipalRegistration: "",
  mainContactName: "",
  mainContactRole: "",
  email: "",
  billingEmail: "",
  phone: "",
  whatsapp: "",
  website: "",
  billingAddressLine1: "",
  billingAddressLine2: "",
  billingDistrict: "",
  billingCity: "",
  billingState: "",
  billingCountry: "BR",
  billingZipCode: "",
  status: "ACTIVE",
  notes: "",
  branchIds: [],
  primaryBranchId: "",
};

function formatBranches(row: CustomerRow) {
  const links = row.branches ?? [];
  if (links.length === 0) return "—";
  if (links.length <= 2) {
    return links.map((l) => l.branch.name).join(", ");
  }
  const [first, second, ...rest] = links;
  return `${first.branch.name}, ${second.branch.name} +${rest.length}`;
}

function primaryBranchLabel(row: CustomerRow) {
  const primary = row.branches?.find((b) => b.isPrimary);
  if (!primary) return "Não definida";
  return primary.branch.name;
}

function CustomersLogisticsPageInner() {
  const { toast } = useNexumToast();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<CustomerRow | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [detailCustomer, setDetailCustomer] = useState<CustomerRow | null>(null);
  const [branchesDrawer, setBranchesDrawer] = useState<CustomerRow | null>(null);
  const [branchLinks, setBranchLinks] = useState<CustomerRow["branches"]>([]);
  const [addBranchId, setAddBranchId] = useState("");

  const [confirmAction, setConfirmAction] = useState<
    { type: "disable" | "enable" | "delete"; customer: CustomerRow } | null
  >(null);

  const hasGlobalScope = useAnyPermission([...GLOBAL_CUSTOMER_SCOPE]);
  const canCreate = usePermission("customers.create") && hasGlobalScope;
  const canUpdate = usePermission("customers.update") && hasGlobalScope;
  const canDisable = usePermission("customers.disable") && hasGlobalScope;
  const canDelete = usePermission("customers.delete") && hasGlobalScope;
  const canAssignBranches = usePermission("customers.assign_branches") && hasGlobalScope;

  const branchOptions = useMemo(
    () => branches.filter((b) => b.status === "ACTIVE"),
    [branches],
  );

  const load = useCallback(() => {
    setLoading(true);
    void listCustomers({
      search: search || undefined,
      status: (statusFilter as CustomerStatus) || undefined,
      customerType: (typeFilter as CustomerType) || undefined,
      documentType: (docTypeFilter as CustomerDocumentType) || undefined,
      branchId: branchFilter || undefined,
      city: cityFilter || undefined,
      state: stateFilter || undefined,
      page,
      perPage: 10,
      sortBy: "legalName",
      sortDirection: "asc",
    })
      .then(({ items, pagination }) => {
        setRows(items);
        setTotal(pagination.total);
        setError(null);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Erro ao carregar clientes."))
      .finally(() => setLoading(false));
  }, [search, statusFilter, typeFilter, docTypeFilter, branchFilter, cityFilter, stateFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    void fetchBranches({ perPage: 100, sortBy: "name", sortDirection: "asc" })
      .then(({ items }) => setBranches(items))
      .catch(() => undefined);
  }, []);

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
    setDocTypeFilter("");
    setBranchFilter("");
    setCityFilter("");
    setStateFilter("");
    setPage(1);
  }

  function openCreate() {
    setEditCustomer(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(customer: CustomerRow) {
    setEditCustomer(customer);
    const branchIds = customer.branches?.map((b) => b.branchId) ?? [];
    const primary = customer.branches?.find((b) => b.isPrimary)?.branchId ?? "";
    setForm({
      code: customer.code,
      legalName: customer.legalName,
      tradeName: customer.tradeName ?? "",
      customerType: customer.customerType,
      documentType: customer.documentType ?? "",
      documentNumber: customer.documentNumber ?? "",
      stateRegistration: customer.stateRegistration ?? "",
      municipalRegistration: customer.municipalRegistration ?? "",
      mainContactName: customer.mainContactName ?? "",
      mainContactRole: customer.mainContactRole ?? "",
      email: customer.email ?? "",
      billingEmail: customer.billingEmail ?? "",
      phone: customer.phone ?? "",
      whatsapp: customer.whatsapp ?? "",
      website: customer.website ?? "",
      billingAddressLine1: customer.billingAddressLine1 ?? "",
      billingAddressLine2: customer.billingAddressLine2 ?? "",
      billingDistrict: customer.billingDistrict ?? "",
      billingCity: customer.billingCity ?? "",
      billingState: customer.billingState ?? "",
      billingCountry: customer.billingCountry ?? "BR",
      billingZipCode: customer.billingZipCode ?? "",
      status: customer.status,
      notes: customer.notes ?? "",
      branchIds,
      primaryBranchId: primary,
    });
    setFormOpen(true);
  }

  function toggleBranch(branchId: string) {
    setForm((prev) => {
      const has = prev.branchIds.includes(branchId);
      const branchIds = has
        ? prev.branchIds.filter((id) => id !== branchId)
        : [...prev.branchIds, branchId];
      const primaryBranchId =
        prev.primaryBranchId && branchIds.includes(prev.primaryBranchId)
          ? prev.primaryBranchId
          : branchIds[0] ?? "";
      return { ...prev, branchIds, primaryBranchId };
    });
  }

  async function handleSave() {
    if (!form.code.trim() && !editCustomer) {
      toast({ type: "error", title: "Código interno é obrigatório." });
      return;
    }
    if (!form.legalName.trim()) {
      toast({ type: "error", title: "Razão social é obrigatória." });
      return;
    }
    if (!editCustomer && form.branchIds.length === 0) {
      toast({ type: "error", title: "Selecione ao menos uma filial de atendimento." });
      return;
    }
    if (form.documentNumber && !form.documentType) {
      toast({ type: "error", title: "Informe o tipo de documento." });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        legalName: form.legalName.trim(),
        tradeName: form.tradeName || undefined,
        customerType: form.customerType,
        documentType: form.documentType || undefined,
        documentNumber: form.documentNumber || undefined,
        stateRegistration: form.stateRegistration || undefined,
        municipalRegistration: form.municipalRegistration || undefined,
        mainContactName: form.mainContactName || undefined,
        mainContactRole: form.mainContactRole || undefined,
        email: form.email || undefined,
        billingEmail: form.billingEmail || undefined,
        phone: form.phone || undefined,
        whatsapp: form.whatsapp || undefined,
        website: form.website || undefined,
        billingAddressLine1: form.billingAddressLine1 || undefined,
        billingAddressLine2: form.billingAddressLine2 || undefined,
        billingDistrict: form.billingDistrict || undefined,
        billingCity: form.billingCity || undefined,
        billingState: form.billingState || undefined,
        billingCountry: form.billingCountry || undefined,
        billingZipCode: form.billingZipCode || undefined,
        status: form.status,
        notes: form.notes || undefined,
      };

      if (editCustomer) {
        await updateCustomer(editCustomer.id, payload);
        toast({ type: "success", title: "Cliente atualizado." });
      } else {
        await createCustomer({
          ...payload,
          code: form.code.trim(),
          branchIds: form.branchIds,
          primaryBranchId: form.primaryBranchId || form.branchIds[0],
        });
        toast({ type: "success", title: "Cliente criado." });
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
    const { type, customer } = confirmAction;
    try {
      if (type === "disable") await disableCustomer(customer.id);
      if (type === "enable") await enableCustomer(customer.id);
      if (type === "delete") await deleteCustomer(customer.id);
      toast({ type: "success", title: "Operação concluída." });
      load();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro na operação." });
    }
    setConfirmAction(null);
  }

  async function openBranchesDrawer(customer: CustomerRow) {
    setBranchesDrawer(customer);
    try {
      const links = await listCustomerBranches(customer.id);
      setBranchLinks(links);
      setAddBranchId("");
    } catch {
      toast({ type: "error", title: "Erro ao carregar filiais do cliente." });
      setBranchesDrawer(null);
    }
  }

  async function handleAddBranch() {
    if (!branchesDrawer || !addBranchId) return;
    try {
      const links = await assignCustomerBranches(branchesDrawer.id, { branchIds: [addBranchId] });
      setBranchLinks(links);
      setAddBranchId("");
      toast({ type: "success", title: "Filial vinculada." });
      load();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro ao vincular filial." });
    }
  }

  async function handleSetPrimary(branchId: string) {
    if (!branchesDrawer) return;
    try {
      const links = await setCustomerPrimaryBranch(branchesDrawer.id, branchId);
      setBranchLinks(links);
      toast({ type: "success", title: "Filial principal atualizada." });
      load();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro ao definir principal." });
    }
  }

  async function handleRemoveBranch(branchId: string) {
    if (!branchesDrawer) return;
    try {
      const links = await removeCustomerBranch(branchesDrawer.id, branchId);
      setBranchLinks(links);
      toast({ type: "success", title: "Filial removida." });
      load();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro ao remover filial." });
    }
  }

  const formSections = (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Identificação</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Código interno *">
            <NexumInput
              value={form.code}
              disabled={!!editCustomer}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </NexumFormField>
          <NexumFormField label="Status">
            <NexumSelect
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as CustomerStatus })}
            >
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="DISABLED">Desativado</option>
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="Razão social / Nome legal *" className="sm:col-span-2">
            <NexumInput value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} />
          </NexumFormField>
          <NexumFormField label="Nome fantasia" className="sm:col-span-2">
            <NexumInput value={form.tradeName} onChange={(e) => setForm({ ...form, tradeName: e.target.value })} />
          </NexumFormField>
          <NexumFormField label="Tipo de cliente *">
            <NexumSelect
              value={form.customerType}
              onChange={(e) => setForm({ ...form, customerType: e.target.value as CustomerType })}
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Documentos fiscais</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Tipo de documento">
            <NexumSelect
              value={form.documentType}
              onChange={(e) =>
                setForm({ ...form, documentType: e.target.value as CustomerDocumentType | "" })
              }
            >
              <option value="">—</option>
              <option value="CNPJ">CNPJ</option>
              <option value="CPF">CPF</option>
              <option value="NIF">NIF</option>
              <option value="EIN">EIN</option>
              <option value="VAT">VAT</option>
              <option value="OTHER">Outro</option>
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="Número do documento">
            <NexumInput
              value={form.documentNumber}
              onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Inscrição estadual">
            <NexumInput
              value={form.stateRegistration}
              onChange={(e) => setForm({ ...form, stateRegistration: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Inscrição municipal">
            <NexumInput
              value={form.municipalRegistration}
              onChange={(e) => setForm({ ...form, municipalRegistration: e.target.value })}
            />
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Contato principal</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Nome do contato">
            <NexumInput
              value={form.mainContactName}
              onChange={(e) => setForm({ ...form, mainContactName: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Cargo/função">
            <NexumInput
              value={form.mainContactRole}
              onChange={(e) => setForm({ ...form, mainContactRole: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="E-mail principal">
            <NexumInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </NexumFormField>
          <NexumFormField label="E-mail de faturamento">
            <NexumInput
              type="email"
              value={form.billingEmail}
              onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Telefone">
            <NexumInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </NexumFormField>
          <NexumFormField label="WhatsApp">
            <NexumInput value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </NexumFormField>
          <NexumFormField label="Website" className="sm:col-span-2">
            <NexumInput value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-sm font-semibold text-nexum-accent">Endereço fiscal / cobrança</h3>
        <p className="mb-3 text-xs text-nexum-text-muted">
          Este endereço é fiscal/cobrança. Locais operacionais serão cadastrados no módulo Locais.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Endereço" className="sm:col-span-2">
            <NexumInput
              value={form.billingAddressLine1}
              onChange={(e) => setForm({ ...form, billingAddressLine1: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Complemento" className="sm:col-span-2">
            <NexumInput
              value={form.billingAddressLine2}
              onChange={(e) => setForm({ ...form, billingAddressLine2: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Bairro">
            <NexumInput
              value={form.billingDistrict}
              onChange={(e) => setForm({ ...form, billingDistrict: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Cidade">
            <NexumInput
              value={form.billingCity}
              onChange={(e) => setForm({ ...form, billingCity: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Estado/UF">
            <NexumInput
              maxLength={2}
              value={form.billingState}
              onChange={(e) => setForm({ ...form, billingState: e.target.value.toUpperCase() })}
            />
          </NexumFormField>
          <NexumFormField label="País">
            <NexumInput
              value={form.billingCountry}
              onChange={(e) => setForm({ ...form, billingCountry: e.target.value.toUpperCase() })}
            />
          </NexumFormField>
          <NexumFormField label="CEP/Código postal">
            <NexumInput
              value={form.billingZipCode}
              onChange={(e) => setForm({ ...form, billingZipCode: e.target.value })}
            />
          </NexumFormField>
        </div>
      </section>

      {!editCustomer && (
        <section>
          <h3 className="mb-1 text-sm font-semibold text-nexum-accent">Filiais de atendimento</h3>
          <p className="mb-3 text-xs text-nexum-text-muted">
            As filiais definem quais unidades operacionais podem visualizar e operar este cliente.
          </p>
          <div className="flex flex-wrap gap-2">
            {branchOptions.map((b) => {
              const selected = form.branchIds.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => toggleBranch(b.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    selected
                      ? "border-nexum-accent bg-nexum-accent/10 text-nexum-accent"
                      : "border-nexum-border text-nexum-text-muted hover:border-nexum-accent/50"
                  }`}
                >
                  {b.name} ({b.code})
                </button>
              );
            })}
          </div>
          {form.branchIds.length > 0 && (
            <NexumFormField label="Filial principal" className="mt-4">
              <NexumSelect
                value={form.primaryBranchId}
                onChange={(e) => setForm({ ...form, primaryBranchId: e.target.value })}
              >
                {form.branchIds.map((id) => {
                  const b = branchOptions.find((x) => x.id === id);
                  return (
                    <option key={id} value={id}>
                      {b?.name ?? id}
                    </option>
                  );
                })}
              </NexumSelect>
            </NexumFormField>
          )}
        </section>
      )}

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Observações internas</h3>
        <NexumTextarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          placeholder="Observações internas visíveis apenas para usuários autorizados."
        />
      </section>
    </div>
  );

  return (
    <PermissionGate permission={["customers.read", "logistics.read"]} mode="any">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          breadcrumb={[{ label: "Logística", href: "/app" }, { label: "Clientes" }]}
          title="Clientes"
          description="Gerencie clientes, documentos, contatos, filiais atendidas e dados fiscais da operação."
          actions={
            canCreate ? (
              <NexumButton onClick={openCreate}>
                <Plus className="mr-1.5 h-4 w-4" />
                Novo cliente
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
          emptyTitle="Nenhum cliente cadastrado ainda."
          emptyDescription="Cadastre o primeiro cliente para iniciar a base operacional logística."
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
                  placeholder="Buscar código, nome, documento, contato..."
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
                    className="w-36"
                  >
                    <option value="">Status</option>
                    <option value="ACTIVE">Ativo</option>
                    <option value="INACTIVE">Inativo</option>
                    <option value="DISABLED">Desativado</option>
                  </NexumSelect>
                  <NexumSelect
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-40"
                  >
                    <option value="">Tipo</option>
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NexumSelect>
                  <NexumSelect
                    value={branchFilter}
                    onChange={(e) => {
                      setBranchFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-40"
                  >
                    <option value="">Filial</option>
                    {branchOptions.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </NexumSelect>
                  <NexumInput
                    placeholder="Cidade"
                    value={cityFilter}
                    onChange={(e) => {
                      setCityFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-32"
                  />
                  <NexumInput
                    placeholder="UF"
                    maxLength={2}
                    value={stateFilter}
                    onChange={(e) => {
                      setStateFilter(e.target.value.toUpperCase());
                      setPage(1);
                    }}
                    className="w-16"
                  />
                  <NexumButton size="sm" variant="ghost" onClick={clearFilters}>
                    Limpar
                  </NexumButton>
                </>
              }
            />
          }
          pagination={{ page, pageSize: 10, total, onPageChange: setPage }}
          columns={[
            {
              key: "code",
              header: "Código",
              render: (r) => <span className="font-mono text-sm">{r.code}</span>,
            },
            {
              key: "name",
              header: "Cliente",
              render: (r) => (
                <div>
                  <p className="font-medium text-nexum-text">{r.legalName}</p>
                  {r.tradeName && <p className="text-xs text-nexum-text-muted">{r.tradeName}</p>}
                </div>
              ),
            },
            {
              key: "document",
              header: "Documento",
              render: (r) =>
                r.documentNumber ? `${r.documentType ?? ""} ${r.documentNumber}`.trim() : "—",
            },
            {
              key: "type",
              header: "Tipo",
              render: (r) => <NexumBadge variant="info">{TYPE_LABELS[r.customerType]}</NexumBadge>,
            },
            {
              key: "branches",
              header: "Filiais",
              render: (r) => <span className="text-sm">{formatBranches(r)}</span>,
            },
            {
              key: "primary",
              header: "Filial principal",
              render: (r) => {
                const label = primaryBranchLabel(r);
                return label === "Não definida" ? (
                  <span className="text-nexum-text-muted">{label}</span>
                ) : (
                  <NexumBadge variant="success">{label}</NexumBadge>
                );
              },
            },
            {
              key: "contact",
              header: "Contato",
              render: (r) => (
                <div className="text-xs">
                  {r.mainContactName && <p>{r.mainContactName}</p>}
                  {r.email && <p className="text-nexum-text-muted">{r.email}</p>}
                  {r.phone && <p className="text-nexum-text-muted">{r.phone}</p>}
                  {!r.mainContactName && !r.email && !r.phone && "—"}
                </div>
              ),
            },
            {
              key: "location",
              header: "Cidade/UF",
              render: (r) =>
                r.billingCity ? `${r.billingCity}${r.billingState ? ` / ${r.billingState}` : ""}` : "—",
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
              header: "Atualizado em",
              render: (r) => new Date(r.updatedAt).toLocaleDateString("pt-BR"),
            },
            {
              key: "actions",
              header: "Ações",
              align: "right",
              render: (r) => (
                <div className="flex flex-wrap justify-end gap-1">
                  <NexumButton size="sm" variant="ghost" onClick={() => setDetailCustomer(r)}>
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    Visualizar
                  </NexumButton>
                  {canUpdate && (
                    <NexumButton size="sm" variant="ghost" onClick={() => openEdit(r)}>
                      Editar
                    </NexumButton>
                  )}
                  {canAssignBranches && (
                    <NexumButton size="sm" variant="ghost" onClick={() => void openBranchesDrawer(r)}>
                      <Building2 className="mr-1 h-3.5 w-3.5" />
                      Filiais
                    </NexumButton>
                  )}
                  {canDisable && r.status !== "DISABLED" && (
                    <NexumButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmAction({ type: "disable", customer: r })}
                    >
                      Desativar
                    </NexumButton>
                  )}
                  {canDisable && r.status === "DISABLED" && (
                    <NexumButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmAction({ type: "enable", customer: r })}
                    >
                      Reativar
                    </NexumButton>
                  )}
                  {canDelete && (
                    <NexumButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmAction({ type: "delete", customer: r })}
                    >
                      Excluir
                    </NexumButton>
                  )}
                </div>
              ),
            },
          ]}
        />

        <NexumDrawer
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title={editCustomer ? "Editar cliente" : "Novo cliente"}
        >
          {formSections}
          <div className="mt-6 flex justify-end gap-2 border-t border-nexum-border/40 pt-4">
            <NexumButton variant="secondary" onClick={() => setFormOpen(false)}>
              Cancelar
            </NexumButton>
            <NexumButton loading={saving} onClick={() => void handleSave()}>
              Salvar
            </NexumButton>
          </div>
        </NexumDrawer>

        <NexumDrawer
          open={!!detailCustomer}
          onClose={() => setDetailCustomer(null)}
          title={detailCustomer?.legalName ?? "Cliente"}
        >
          {detailCustomer && (
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Resumo</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div><dt className="text-nexum-text-muted">Código</dt><dd className="font-mono">{detailCustomer.code}</dd></div>
                  <div><dt className="text-nexum-text-muted">Tipo</dt><dd>{TYPE_LABELS[detailCustomer.customerType]}</dd></div>
                  <div><dt className="text-nexum-text-muted">Razão social</dt><dd>{detailCustomer.legalName}</dd></div>
                  <div><dt className="text-nexum-text-muted">Nome fantasia</dt><dd>{detailCustomer.tradeName ?? "—"}</dd></div>
                  <div><dt className="text-nexum-text-muted">Status</dt><dd>{STATUS_LABELS[detailCustomer.status]}</dd></div>
                </dl>
              </section>
              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Filiais vinculadas</h3>
                <ul className="space-y-2">
                  {(detailCustomer.branches ?? []).map((link) => (
                    <li key={link.id} className="flex items-center justify-between rounded-lg border border-nexum-border/40 px-3 py-2">
                      <span>{link.branch.name} <span className="font-mono text-xs text-nexum-text-muted">({link.branch.code})</span></span>
                      {link.isPrimary && <NexumBadge variant="success">Principal</NexumBadge>}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Metadados</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div><dt className="text-nexum-text-muted">Criado em</dt><dd>{new Date(detailCustomer.createdAt).toLocaleString("pt-BR")}</dd></div>
                  <div><dt className="text-nexum-text-muted">Atualizado em</dt><dd>{new Date(detailCustomer.updatedAt).toLocaleString("pt-BR")}</dd></div>
                  {detailCustomer.disabledAt && (
                    <div><dt className="text-nexum-text-muted">Desativado em</dt><dd>{new Date(detailCustomer.disabledAt).toLocaleString("pt-BR")}</dd></div>
                  )}
                </dl>
              </section>
            </div>
          )}
        </NexumDrawer>

        <NexumDrawer
          open={!!branchesDrawer}
          onClose={() => setBranchesDrawer(null)}
          title={`Filiais — ${branchesDrawer?.legalName ?? ""}`}
        >
          {canAssignBranches && (
            <div className="mb-4 flex gap-2">
              <NexumSelect value={addBranchId} onChange={(e) => setAddBranchId(e.target.value)} className="flex-1">
                <option value="">Adicionar filial...</option>
                {branchOptions
                  .filter((b) => !branchLinks?.some((l) => l.branchId === b.id))
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
              </NexumSelect>
              <NexumButton disabled={!addBranchId} onClick={() => void handleAddBranch()}>
                Vincular
              </NexumButton>
            </div>
          )}
          <ul className="space-y-2">
            {(branchLinks ?? []).length === 0 && (
              <p className="text-sm text-nexum-text-muted">Nenhuma filial vinculada.</p>
            )}
            {(branchLinks ?? []).map((link) => (
              <li
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-nexum-border/50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{link.branch.name}</p>
                  <p className="font-mono text-xs text-nexum-text-muted">{link.branch.code}</p>
                </div>
                <div className="flex gap-1">
                  {link.isPrimary ? (
                    <NexumBadge variant="success">Principal</NexumBadge>
                  ) : canAssignBranches ? (
                    <NexumButton size="sm" variant="ghost" onClick={() => void handleSetPrimary(link.branchId)}>
                      Tornar principal
                    </NexumButton>
                  ) : null}
                  {canAssignBranches && (branchLinks?.length ?? 0) > 1 && (
                    <NexumButton size="sm" variant="ghost" onClick={() => void handleRemoveBranch(link.branchId)}>
                      Remover
                    </NexumButton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </NexumDrawer>

        <NexumConfirmModal
          open={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => void handleConfirmAction()}
          title={
            confirmAction?.type === "delete"
              ? "Excluir cliente"
              : confirmAction?.type === "enable"
                ? "Reativar cliente"
                : "Desativar cliente"
          }
          description={`Confirma a operação para ${confirmAction?.customer.legalName ?? ""}?`}
          confirmLabel="Confirmar"
          danger={confirmAction?.type === "delete"}
        />
      </div>
    </PermissionGate>
  );
}

export function CustomersLogisticsPage() {
  return (
    <NexumToastProvider>
      <CustomersLogisticsPageInner />
    </NexumToastProvider>
  );
}
