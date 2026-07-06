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
  assignLocationBranches,
  createLocation,
  deleteLocation,
  disableLocation,
  enableLocation,
  listCustomers,
  listLocationBranches,
  listLocations,
  removeLocationBranch,
  setLocationPrimaryBranch,
  updateLocation,
  type CustomerRow,
  type LocationRow,
  type LocationStatus,
  type LocationType,
} from "@/lib/logistics-api";
import { Building2, Eye, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const GLOBAL_LOCATION_SCOPE = [
  "locations.manage",
  "logistics.manage",
  "organization.manage",
  "*",
] as const;

const STATUS_LABELS: Record<LocationStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  DISABLED: "Desativado",
};

const STATUS_VARIANT: Record<LocationStatus, "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  DISABLED: "danger",
};

const TYPE_LABELS: Record<LocationType, string> = {
  CUSTOMER_SITE: "Unidade do cliente",
  BRANCH_BASE: "Base da filial",
  PORT: "Porto",
  TERMINAL: "Terminal",
  WAREHOUSE: "Armazém",
  DISTRIBUTION_CENTER: "Centro de distribuição",
  DEPOT: "Depósito",
  YARD: "Pátio",
  CROSS_DOCKING: "Cross-docking",
  BORDER_CROSSING: "Fronteira",
  FUEL_STATION: "Posto de combustível",
  MAINTENANCE_SITE: "Manutenção",
  SUPPLIER_SITE: "Fornecedor",
  PARKING_AREA: "Estacionamento",
  OTHER: "Outro",
};

type LocationForm = {
  code: string;
  name: string;
  locationType: LocationType;
  status: LocationStatus;
  customerId: string;
  addressLine1: string;
  addressLine2: string;
  district: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  referencePoint: string;
  latitude: string;
  longitude: string;
  timezone: string;
  geofenceRadiusMeters: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  whatsapp: string;
  operatingHours: string;
  accessInstructions: string;
  dockInfo: string;
  notes: string;
  branchIds: string[];
  primaryBranchId: string;
};

const emptyForm: LocationForm = {
  code: "",
  name: "",
  locationType: "CUSTOMER_SITE",
  status: "ACTIVE",
  customerId: "",
  addressLine1: "",
  addressLine2: "",
  district: "",
  city: "",
  state: "",
  country: "BR",
  zipCode: "",
  referencePoint: "",
  latitude: "",
  longitude: "",
  timezone: "",
  geofenceRadiusMeters: "",
  contactName: "",
  contactRole: "",
  email: "",
  phone: "",
  whatsapp: "",
  operatingHours: "",
  accessInstructions: "",
  dockInfo: "",
  notes: "",
  branchIds: [],
  primaryBranchId: "",
};

function formatBranches(row: LocationRow) {
  const links = row.branches ?? [];
  if (links.length === 0) return "—";
  if (links.length <= 2) {
    return links.map((l) => l.branch.name).join(", ");
  }
  const [first, second, ...rest] = links;
  return `${first.branch.name}, ${second.branch.name} +${rest.length}`;
}

function primaryBranchLabel(row: LocationRow) {
  const primary = row.branches?.find((b) => b.isPrimary);
  if (!primary) return "Não definida";
  return primary.branch.name;
}

function customerLabel(row: LocationRow) {
  if (!row.customer) return "—";
  return row.customer.tradeName ?? row.customer.legalName;
}

function coordinatesLabel(row: LocationRow) {
  if (row.latitude != null && row.longitude != null) {
    return "Lat/Lng cadastrado";
  }
  return "Sem coordenadas";
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function LocationsLogisticsPageInner() {
  const { toast } = useNexumToast();
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [hasCoordinatesFilter, setHasCoordinatesFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editLocation, setEditLocation] = useState<LocationRow | null>(null);
  const [form, setForm] = useState<LocationForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [detailLocation, setDetailLocation] = useState<LocationRow | null>(null);
  const [branchesDrawer, setBranchesDrawer] = useState<LocationRow | null>(null);
  const [branchLinks, setBranchLinks] = useState<LocationRow["branches"]>([]);
  const [addBranchId, setAddBranchId] = useState("");

  const [confirmAction, setConfirmAction] = useState<
    { type: "disable" | "enable" | "delete"; location: LocationRow } | null
  >(null);

  const hasGlobalScope = useAnyPermission([...GLOBAL_LOCATION_SCOPE]);
  const canCreate = usePermission("locations.create") && hasGlobalScope;
  const canUpdate = usePermission("locations.update") && hasGlobalScope;
  const canDisable = usePermission("locations.disable") && hasGlobalScope;
  const canDelete = usePermission("locations.delete") && hasGlobalScope;
  const canAssignBranches = usePermission("locations.assign_branches") && hasGlobalScope;

  const branchOptions = useMemo(
    () => branches.filter((b) => b.status === "ACTIVE"),
    [branches],
  );

  const load = useCallback(() => {
    setLoading(true);
    void listLocations({
      search: search || undefined,
      status: (statusFilter as LocationStatus) || undefined,
      locationType: (typeFilter as LocationType) || undefined,
      branchId: branchFilter || undefined,
      customerId: customerFilter || undefined,
      city: cityFilter || undefined,
      state: stateFilter || undefined,
      country: countryFilter || undefined,
      hasCoordinates: hasCoordinatesFilter || undefined,
      page,
      perPage: 10,
      sortBy: "name",
      sortDirection: "asc",
    })
      .then(({ items, pagination }) => {
        setRows(items);
        setTotal(pagination.total);
        setError(null);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Erro ao carregar locais."))
      .finally(() => setLoading(false));
  }, [
    search,
    statusFilter,
    typeFilter,
    branchFilter,
    customerFilter,
    cityFilter,
    stateFilter,
    countryFilter,
    hasCoordinatesFilter,
    page,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    void fetchBranches({ perPage: 100, sortBy: "name", sortDirection: "asc" })
      .then(({ items }) => setBranches(items))
      .catch(() => undefined);
    void listCustomers({ perPage: 100, sortBy: "legalName", sortDirection: "asc", status: "ACTIVE" })
      .then(({ items }) => setCustomers(items))
      .catch(() => undefined);
  }, []);

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
    setBranchFilter("");
    setCustomerFilter("");
    setCityFilter("");
    setStateFilter("");
    setCountryFilter("");
    setHasCoordinatesFilter("");
    setPage(1);
  }

  function openCreate() {
    setEditLocation(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(location: LocationRow) {
    setEditLocation(location);
    setForm({
      code: location.code,
      name: location.name,
      locationType: location.locationType,
      status: location.status,
      customerId: location.customerId ?? "",
      addressLine1: location.addressLine1,
      addressLine2: location.addressLine2 ?? "",
      district: location.district ?? "",
      city: location.city,
      state: location.state,
      country: location.country ?? "BR",
      zipCode: location.zipCode ?? "",
      referencePoint: location.referencePoint ?? "",
      latitude: location.latitude != null ? String(location.latitude) : "",
      longitude: location.longitude != null ? String(location.longitude) : "",
      timezone: location.timezone ?? "",
      geofenceRadiusMeters:
        location.geofenceRadiusMeters != null ? String(location.geofenceRadiusMeters) : "",
      contactName: location.contactName ?? "",
      contactRole: location.contactRole ?? "",
      email: location.email ?? "",
      phone: location.phone ?? "",
      whatsapp: location.whatsapp ?? "",
      operatingHours: location.operatingHours ?? "",
      accessInstructions: location.accessInstructions ?? "",
      dockInfo: location.dockInfo ?? "",
      notes: location.notes ?? "",
      branchIds: [],
      primaryBranchId: "",
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
    if (!form.code.trim() && !editLocation) {
      toast({ type: "error", title: "Código interno é obrigatório." });
      return;
    }
    if (!form.name.trim()) {
      toast({ type: "error", title: "Nome do local é obrigatório." });
      return;
    }
    if (!form.addressLine1.trim()) {
      toast({ type: "error", title: "Endereço é obrigatório." });
      return;
    }
    if (!form.city.trim()) {
      toast({ type: "error", title: "Cidade é obrigatória." });
      return;
    }
    if (!form.state.trim()) {
      toast({ type: "error", title: "Estado/UF é obrigatório." });
      return;
    }
    if (form.locationType === "CUSTOMER_SITE" && !form.customerId) {
      toast({ type: "error", title: "Cliente é obrigatório para unidade do cliente." });
      return;
    }
    if (!editLocation && form.branchIds.length === 0) {
      toast({ type: "error", title: "Selecione ao menos uma filial de atendimento." });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        locationType: form.locationType,
        customerId: form.customerId || null,
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2 || undefined,
        district: form.district || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country || undefined,
        zipCode: form.zipCode || undefined,
        referencePoint: form.referencePoint || undefined,
        latitude: parseOptionalNumber(form.latitude) ?? null,
        longitude: parseOptionalNumber(form.longitude) ?? null,
        timezone: form.timezone || undefined,
        geofenceRadiusMeters: parseOptionalNumber(form.geofenceRadiusMeters) ?? null,
        contactName: form.contactName || undefined,
        contactRole: form.contactRole || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        whatsapp: form.whatsapp || undefined,
        operatingHours: form.operatingHours || undefined,
        accessInstructions: form.accessInstructions || undefined,
        dockInfo: form.dockInfo || undefined,
        status: form.status,
        notes: form.notes || undefined,
      };

      if (editLocation) {
        await updateLocation(editLocation.id, payload);
        toast({ type: "success", title: "Local atualizado." });
      } else {
        await createLocation({
          ...payload,
          code: form.code.trim(),
          branchIds: form.branchIds,
          primaryBranchId: form.primaryBranchId || form.branchIds[0],
        });
        toast({ type: "success", title: "Local criado." });
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
    const { type, location } = confirmAction;
    try {
      if (type === "disable") await disableLocation(location.id);
      if (type === "enable") await enableLocation(location.id);
      if (type === "delete") await deleteLocation(location.id);
      toast({ type: "success", title: "Operação concluída." });
      load();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro na operação." });
    }
    setConfirmAction(null);
  }

  async function openBranchesDrawer(location: LocationRow) {
    setBranchesDrawer(location);
    try {
      const links = await listLocationBranches(location.id);
      setBranchLinks(links);
      setAddBranchId("");
    } catch {
      toast({ type: "error", title: "Erro ao carregar filiais do local." });
      setBranchesDrawer(null);
    }
  }

  async function handleAddBranch() {
    if (!branchesDrawer || !addBranchId) return;
    try {
      const links = await assignLocationBranches(branchesDrawer.id, { branchIds: [addBranchId] });
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
      const links = await setLocationPrimaryBranch(branchesDrawer.id, branchId);
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
      const links = await removeLocationBranch(branchesDrawer.id, branchId);
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
              disabled={!!editLocation}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </NexumFormField>
          <NexumFormField label="Status">
            <NexumSelect
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as LocationStatus })}
            >
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="DISABLED">Desativado</option>
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="Nome do local *" className="sm:col-span-2">
            <NexumInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </NexumFormField>
          <NexumFormField label="Tipo de local *">
            <NexumSelect
              value={form.locationType}
              onChange={(e) => setForm({ ...form, locationType: e.target.value as LocationType })}
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
          <NexumFormField
            label={form.locationType === "CUSTOMER_SITE" ? "Cliente *" : "Cliente"}
          >
            <NexumSelect
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            >
              <option value="">—</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tradeName ?? c.legalName} ({c.code})
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Endereço</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Endereço *" className="sm:col-span-2">
            <NexumInput
              value={form.addressLine1}
              onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Complemento" className="sm:col-span-2">
            <NexumInput
              value={form.addressLine2}
              onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Bairro">
            <NexumInput
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Cidade *">
            <NexumInput value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </NexumFormField>
          <NexumFormField label="Estado/UF *">
            <NexumInput
              maxLength={2}
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
            />
          </NexumFormField>
          <NexumFormField label="País">
            <NexumInput
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })}
            />
          </NexumFormField>
          <NexumFormField label="CEP/Código postal">
            <NexumInput
              value={form.zipCode}
              onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Ponto de referência" className="sm:col-span-2">
            <NexumInput
              value={form.referencePoint}
              onChange={(e) => setForm({ ...form, referencePoint: e.target.value })}
            />
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-sm font-semibold text-nexum-accent">Coordenadas</h3>
        <p className="mb-3 text-xs text-nexum-text-muted">
          Latitude e longitude serão usadas no mapa operacional em versões futuras. Informe quando disponível.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Latitude">
            <NexumInput
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              placeholder="-23.550520"
            />
          </NexumFormField>
          <NexumFormField label="Longitude">
            <NexumInput
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              placeholder="-46.633308"
            />
          </NexumFormField>
          <NexumFormField label="Fuso horário">
            <NexumInput
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              placeholder="America/Sao_Paulo"
            />
          </NexumFormField>
          <NexumFormField label="Raio de geofence (m)">
            <NexumInput
              value={form.geofenceRadiusMeters}
              onChange={(e) => setForm({ ...form, geofenceRadiusMeters: e.target.value })}
              placeholder="500"
            />
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Contato</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Nome do contato">
            <NexumInput
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Cargo/função">
            <NexumInput
              value={form.contactRole}
              onChange={(e) => setForm({ ...form, contactRole: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="E-mail">
            <NexumInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </NexumFormField>
          <NexumFormField label="Telefone">
            <NexumInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </NexumFormField>
          <NexumFormField label="WhatsApp">
            <NexumInput value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Operação</h3>
        <div className="grid gap-4">
          <NexumFormField label="Horário de funcionamento">
            <NexumTextarea
              value={form.operatingHours}
              onChange={(e) => setForm({ ...form, operatingHours: e.target.value })}
              rows={2}
              placeholder="Ex.: Seg–Sex 08:00–18:00"
            />
          </NexumFormField>
          <NexumFormField label="Instruções de acesso">
            <NexumTextarea
              value={form.accessInstructions}
              onChange={(e) => setForm({ ...form, accessInstructions: e.target.value })}
              rows={2}
            />
          </NexumFormField>
          <NexumFormField label="Informações de doca">
            <NexumTextarea
              value={form.dockInfo}
              onChange={(e) => setForm({ ...form, dockInfo: e.target.value })}
              rows={2}
            />
          </NexumFormField>
        </div>
      </section>

      {!editLocation && (
        <section>
          <h3 className="mb-1 text-sm font-semibold text-nexum-accent">Filiais de atendimento</h3>
          <p className="mb-3 text-xs text-nexum-text-muted">
            As filiais definem quais unidades operacionais podem visualizar e operar este local.
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
    <PermissionGate permission={["locations.read", "logistics.read"]} mode="any">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          breadcrumb={[{ label: "Logística", href: "/app" }, { label: "Locais" }]}
          title="Locais"
          description="Cadastre e gerencie pontos operacionais, endereços, coordenadas, contatos e filiais atendidas."
          actions={
            canCreate ? (
              <NexumButton onClick={openCreate}>
                <Plus className="mr-1.5 h-4 w-4" />
                Novo local
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
          emptyTitle="Nenhum local cadastrado ainda."
          emptyDescription="Cadastre o primeiro ponto operacional para iniciar a base logística."
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
                  placeholder="Buscar código, nome, endereço, contato..."
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
                    className="w-44"
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
                  <NexumSelect
                    value={customerFilter}
                    onChange={(e) => {
                      setCustomerFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-44"
                  >
                    <option value="">Cliente</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.tradeName ?? c.legalName}
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
                  <NexumInput
                    placeholder="País"
                    maxLength={2}
                    value={countryFilter}
                    onChange={(e) => {
                      setCountryFilter(e.target.value.toUpperCase());
                      setPage(1);
                    }}
                    className="w-16"
                  />
                  <NexumSelect
                    value={hasCoordinatesFilter}
                    onChange={(e) => {
                      setHasCoordinatesFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-40"
                  >
                    <option value="">Coordenadas</option>
                    <option value="true">Com coordenadas</option>
                    <option value="false">Sem coordenadas</option>
                  </NexumSelect>
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
              header: "Local",
              render: (r) => (
                <div>
                  <p className="font-medium text-nexum-text">{r.name}</p>
                  {r.addressLine1 && <p className="text-xs text-nexum-text-muted">{r.addressLine1}</p>}
                </div>
              ),
            },
            {
              key: "type",
              header: "Tipo",
              render: (r) => <NexumBadge variant="info">{TYPE_LABELS[r.locationType]}</NexumBadge>,
            },
            {
              key: "customer",
              header: "Cliente",
              render: (r) => <span className="text-sm">{customerLabel(r)}</span>,
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
              key: "location",
              header: "Cidade/UF",
              render: (r) => (r.city ? `${r.city}${r.state ? ` / ${r.state}` : ""}` : "—"),
            },
            {
              key: "coordinates",
              header: "Coordenadas",
              render: (r) => {
                const label = coordinatesLabel(r);
                return label === "Sem coordenadas" ? (
                  <span className="text-nexum-text-muted">{label}</span>
                ) : (
                  <NexumBadge variant="success">{label}</NexumBadge>
                );
              },
            },
            {
              key: "status",
              header: "Status",
              render: (r) => (
                <NexumBadge variant={STATUS_VARIANT[r.status]}>{STATUS_LABELS[r.status]}</NexumBadge>
              ),
            },
            {
              key: "actions",
              header: "Ações",
              align: "right",
              render: (r) => (
                <div className="flex flex-wrap justify-end gap-1">
                  <NexumButton size="sm" variant="ghost" onClick={() => setDetailLocation(r)}>
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
                      onClick={() => setConfirmAction({ type: "disable", location: r })}
                    >
                      Desativar
                    </NexumButton>
                  )}
                  {canDisable && r.status === "DISABLED" && (
                    <NexumButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmAction({ type: "enable", location: r })}
                    >
                      Reativar
                    </NexumButton>
                  )}
                  {canDelete && (
                    <NexumButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmAction({ type: "delete", location: r })}
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
          title={editLocation ? "Editar local" : "Novo local"}
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
          open={!!detailLocation}
          onClose={() => setDetailLocation(null)}
          title={detailLocation?.name ?? "Local"}
        >
          {detailLocation && (
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Resumo</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">Código</dt>
                    <dd className="font-mono">{detailLocation.code}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Tipo</dt>
                    <dd>{TYPE_LABELS[detailLocation.locationType]}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Nome</dt>
                    <dd>{detailLocation.name}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Cliente</dt>
                    <dd>{customerLabel(detailLocation)}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Status</dt>
                    <dd>{STATUS_LABELS[detailLocation.status]}</dd>
                  </div>
                </dl>
              </section>
              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Endereço</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-nexum-text-muted">Endereço</dt>
                    <dd>{detailLocation.addressLine1}</dd>
                  </div>
                  {detailLocation.addressLine2 && (
                    <div className="sm:col-span-2">
                      <dt className="text-nexum-text-muted">Complemento</dt>
                      <dd>{detailLocation.addressLine2}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-nexum-text-muted">Cidade/UF</dt>
                    <dd>
                      {detailLocation.city}
                      {detailLocation.state ? ` / ${detailLocation.state}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">País</dt>
                    <dd>{detailLocation.country}</dd>
                  </div>
                </dl>
              </section>
              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Coordenadas</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">Latitude</dt>
                    <dd>{detailLocation.latitude ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Longitude</dt>
                    <dd>{detailLocation.longitude ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Fuso horário</dt>
                    <dd>{detailLocation.timezone ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Geofence (m)</dt>
                    <dd>{detailLocation.geofenceRadiusMeters ?? "—"}</dd>
                  </div>
                </dl>
              </section>
              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Filiais vinculadas</h3>
                <ul className="space-y-2">
                  {(detailLocation.branches ?? []).length === 0 && (
                    <li className="text-nexum-text-muted">Nenhuma filial vinculada.</li>
                  )}
                  {(detailLocation.branches ?? []).map((link) => (
                    <li
                      key={link.id}
                      className="flex items-center justify-between rounded-lg border border-nexum-border/40 px-3 py-2"
                    >
                      <span>
                        {link.branch.name}{" "}
                        <span className="font-mono text-xs text-nexum-text-muted">({link.branch.code})</span>
                      </span>
                      {link.isPrimary && <NexumBadge variant="success">Principal</NexumBadge>}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Metadados</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">Criado em</dt>
                    <dd>{new Date(detailLocation.createdAt).toLocaleString("pt-BR")}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Atualizado em</dt>
                    <dd>{new Date(detailLocation.updatedAt).toLocaleString("pt-BR")}</dd>
                  </div>
                  {detailLocation.disabledAt && (
                    <div>
                      <dt className="text-nexum-text-muted">Desativado em</dt>
                      <dd>{new Date(detailLocation.disabledAt).toLocaleString("pt-BR")}</dd>
                    </div>
                  )}
                </dl>
              </section>
            </div>
          )}
        </NexumDrawer>

        <NexumDrawer
          open={!!branchesDrawer}
          onClose={() => setBranchesDrawer(null)}
          title={`Filiais — ${branchesDrawer?.name ?? ""}`}
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
              ? "Excluir local"
              : confirmAction?.type === "enable"
                ? "Reativar local"
                : "Desativar local"
          }
          description={`Confirma a operação para ${confirmAction?.location.name ?? ""}?`}
          confirmLabel="Confirmar"
          danger={confirmAction?.type === "delete"}
        />
      </div>
    </PermissionGate>
  );
}

export function LocationsLogisticsPage() {
  return (
    <NexumToastProvider>
      <LocationsLogisticsPageInner />
    </NexumToastProvider>
  );
}
