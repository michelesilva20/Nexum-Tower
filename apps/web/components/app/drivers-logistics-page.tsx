"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PermissionGate, useAnyPermission, usePermission } from "@/components/app/permission-gate";
import {
  NexumBadge,
  NexumButton,
  NexumCard,
  NexumCheckbox,
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
  assignDriverBranches,
  createDriver,
  deleteDriver,
  disableDriver,
  enableDriver,
  listDriverBranches,
  listDrivers,
  removeDriverBranch,
  setDriverPrimaryBranch,
  updateDriver,
  type DriverAvailabilityStatus,
  type DriverDocumentType,
  type DriverRow,
  type DriverStatus,
  type DriverType,
  type EmploymentType,
  type LicenseCategory,
} from "@/lib/logistics-api";
import { Building2, Eye, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const GLOBAL_DRIVER_SCOPE = [
  "drivers.manage",
  "logistics.manage",
  "organization.manage",
  "*",
] as const;

const STATUS_LABELS: Record<DriverStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  ON_LEAVE: "Afastado",
  SUSPENDED: "Suspenso",
  DISABLED: "Desativado",
};

const STATUS_VARIANT: Record<DriverStatus, "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  ON_LEAVE: "warning",
  SUSPENDED: "danger",
  DISABLED: "danger",
};

const DRIVER_TYPE_LABELS: Record<DriverType, string> = {
  INTERNAL: "Interno",
  THIRD_PARTY: "Terceiro",
  OWNER_OPERATOR: "Proprietário",
  AGGREGATED: "Agregado",
  TEMPORARY: "Temporário",
  OTHER: "Outro",
};

const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  EMPLOYEE: "CLT",
  CONTRACTOR: "Contratado",
  FREELANCER: "Autônomo",
  AGGREGATED: "Agregado",
  OUTSOURCED: "Terceirizado",
  OTHER: "Outro",
};

const AVAILABILITY_LABELS: Record<DriverAvailabilityStatus, string> = {
  AVAILABLE: "Disponível",
  UNAVAILABLE: "Indisponível",
  ON_TRIP: "Em viagem",
  OFF_DUTY: "Fora de expediente",
  ON_VACATION: "Férias",
  ON_LEAVE: "Afastado",
};

const AVAILABILITY_VARIANT: Record<
  DriverAvailabilityStatus,
  "success" | "warning" | "danger" | "info"
> = {
  AVAILABLE: "success",
  UNAVAILABLE: "danger",
  ON_TRIP: "info",
  OFF_DUTY: "warning",
  ON_VACATION: "warning",
  ON_LEAVE: "warning",
};

const DOCUMENT_TYPE_LABELS: Record<DriverDocumentType, string> = {
  CPF: "CPF",
  RG: "RG",
  CNH: "CNH",
  PASSPORT: "Passaporte",
  RNE: "RNE",
  OTHER: "Outro",
};

type DriverForm = {
  code: string;
  fullName: string;
  preferredName: string;
  driverType: DriverType;
  employmentType: EmploymentType;
  documentType: DriverDocumentType | "";
  documentNumber: string;
  licenseNumber: string;
  licenseCategory: LicenseCategory | "";
  licenseState: string;
  licenseCountry: string;
  licenseIssuedAt: string;
  licenseExpiresAt: string;
  hasEar: boolean;
  moppCertified: boolean;
  moppExpiresAt: string;
  birthDate: string;
  email: string;
  phone: string;
  whatsapp: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  addressLine1: string;
  addressLine2: string;
  district: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  admissionDate: string;
  terminationDate: string;
  contractorCompanyName: string;
  availabilityStatus: DriverAvailabilityStatus;
  status: DriverStatus;
  notes: string;
  branchIds: string[];
  primaryBranchId: string;
};

const emptyForm: DriverForm = {
  code: "",
  fullName: "",
  preferredName: "",
  driverType: "INTERNAL",
  employmentType: "EMPLOYEE",
  documentType: "CPF",
  documentNumber: "",
  licenseNumber: "",
  licenseCategory: "E",
  licenseState: "",
  licenseCountry: "BR",
  licenseIssuedAt: "",
  licenseExpiresAt: "",
  hasEar: false,
  moppCertified: false,
  moppExpiresAt: "",
  birthDate: "",
  email: "",
  phone: "",
  whatsapp: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
  addressLine1: "",
  addressLine2: "",
  district: "",
  city: "",
  state: "",
  country: "BR",
  zipCode: "",
  admissionDate: "",
  terminationDate: "",
  contractorCompanyName: "",
  availabilityStatus: "AVAILABLE",
  status: "ACTIVE",
  notes: "",
  branchIds: [],
  primaryBranchId: "",
};

function formatBranches(row: DriverRow) {
  const links = row.branches ?? [];
  if (links.length === 0) return "—";
  if (links.length <= 2) {
    return links.map((l) => l.branch.name).join(", ");
  }
  const [first, second, ...rest] = links;
  return `${first.branch.name}, ${second.branch.name} +${rest.length}`;
}

function primaryBranchLabel(row: DriverRow) {
  const primary = row.branches?.find((b) => b.isPrimary);
  if (!primary) return "Não definida";
  return primary.branch.name;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function optionalDate(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function maskSensitive(value: string | null | undefined): string {
  if (!value) return "—";
  if (value.length <= 4) return "****";
  return `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
}

type ExpiryState = "valid" | "expiring" | "expired" | null;

function getExpiryStatus(dateStr: string | null | undefined): ExpiryState {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(dateStr);
  exp.setHours(0, 0, 0, 0);
  const diffDays = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring";
  return "valid";
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function ExpiryIndicator({
  label,
  date,
}: {
  label: string;
  date: string | null | undefined;
}) {
  const status = getExpiryStatus(date);
  if (!date) {
    return (
      <div className="text-xs text-nexum-text-muted">
        {label}: —
      </div>
    );
  }
  const variant =
    status === "expired" ? "danger" : status === "expiring" ? "warning" : "success";
  const statusLabel =
    status === "expired" ? "Vencido" : status === "expiring" ? "Vence em breve" : "Válido";
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs">
      <span className="text-nexum-text-muted">{label}:</span>
      <NexumBadge variant={variant}>{statusLabel}</NexumBadge>
      <span className="text-nexum-text-muted">{formatDate(date)}</span>
    </div>
  );
}

function DriversLogisticsPageInner() {
  const { toast } = useNexumToast();
  const [rows, setRows] = useState<DriverRow[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [driverTypeFilter, setDriverTypeFilter] = useState("");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [licenseCategoryFilter, setLicenseCategoryFilter] = useState("");
  const [licenseExpiringFilter, setLicenseExpiringFilter] = useState("");
  const [moppExpiringFilter, setMoppExpiringFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<DriverRow | null>(null);
  const [form, setForm] = useState<DriverForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [detailDriver, setDetailDriver] = useState<DriverRow | null>(null);
  const [branchesDrawer, setBranchesDrawer] = useState<DriverRow | null>(null);
  const [branchLinks, setBranchLinks] = useState<DriverRow["branches"]>([]);
  const [addBranchId, setAddBranchId] = useState("");

  const [confirmAction, setConfirmAction] = useState<
    { type: "disable" | "enable" | "delete"; driver: DriverRow } | null
  >(null);

  const hasGlobalScope = useAnyPermission([...GLOBAL_DRIVER_SCOPE]);
  const canCreate = usePermission("drivers.create") && hasGlobalScope;
  const canUpdate = usePermission("drivers.update") && hasGlobalScope;
  const canDisable = usePermission("drivers.disable") && hasGlobalScope;
  const canDelete = usePermission("drivers.delete") && hasGlobalScope;
  const canAssignBranches = usePermission("drivers.assign_branches") && hasGlobalScope;

  const branchOptions = useMemo(
    () => branches.filter((b) => b.status === "ACTIVE"),
    [branches],
  );

  const load = useCallback(() => {
    setLoading(true);
    void listDrivers({
      search: search || undefined,
      status: (statusFilter as DriverStatus) || undefined,
      availabilityStatus: (availabilityFilter as DriverAvailabilityStatus) || undefined,
      driverType: (driverTypeFilter as DriverType) || undefined,
      employmentType: (employmentTypeFilter as EmploymentType) || undefined,
      branchId: branchFilter || undefined,
      licenseCategory: (licenseCategoryFilter as LicenseCategory) || undefined,
      licenseExpiringUntil: licenseExpiringFilter || undefined,
      moppExpiringUntil: moppExpiringFilter || undefined,
      city: cityFilter || undefined,
      state: stateFilter || undefined,
      page,
      perPage: 10,
      sortBy: "fullName",
      sortDirection: "asc",
    })
      .then(({ items, pagination }) => {
        setRows(items);
        setTotal(pagination.total);
        setError(null);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Erro ao carregar motoristas."))
      .finally(() => setLoading(false));
  }, [
    search,
    statusFilter,
    availabilityFilter,
    driverTypeFilter,
    employmentTypeFilter,
    branchFilter,
    licenseCategoryFilter,
    licenseExpiringFilter,
    moppExpiringFilter,
    cityFilter,
    stateFilter,
    page,
  ]);

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
    setAvailabilityFilter("");
    setDriverTypeFilter("");
    setEmploymentTypeFilter("");
    setBranchFilter("");
    setLicenseCategoryFilter("");
    setLicenseExpiringFilter("");
    setMoppExpiringFilter("");
    setCityFilter("");
    setStateFilter("");
    setPage(1);
  }

  function openCreate() {
    setEditDriver(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(driver: DriverRow) {
    setEditDriver(driver);
    setForm({
      code: driver.code,
      fullName: driver.fullName,
      preferredName: driver.preferredName ?? "",
      driverType: driver.driverType,
      employmentType: driver.employmentType,
      documentType: driver.documentType ?? "CPF",
      documentNumber: driver.documentNumber ?? "",
      licenseNumber: driver.licenseNumber ?? "",
      licenseCategory: driver.licenseCategory ?? "",
      licenseState: driver.licenseState ?? "",
      licenseCountry: driver.licenseCountry ?? "BR",
      licenseIssuedAt: toDateInputValue(driver.licenseIssuedAt),
      licenseExpiresAt: toDateInputValue(driver.licenseExpiresAt),
      hasEar: driver.hasEar,
      moppCertified: driver.moppCertified,
      moppExpiresAt: toDateInputValue(driver.moppExpiresAt),
      birthDate: toDateInputValue(driver.birthDate),
      email: driver.email ?? "",
      phone: driver.phone ?? "",
      whatsapp: driver.whatsapp ?? "",
      emergencyContactName: driver.emergencyContactName ?? "",
      emergencyContactPhone: driver.emergencyContactPhone ?? "",
      emergencyContactRelation: driver.emergencyContactRelation ?? "",
      addressLine1: driver.addressLine1 ?? "",
      addressLine2: driver.addressLine2 ?? "",
      district: driver.district ?? "",
      city: driver.city ?? "",
      state: driver.state ?? "",
      country: driver.country ?? "BR",
      zipCode: driver.zipCode ?? "",
      admissionDate: toDateInputValue(driver.admissionDate),
      terminationDate: toDateInputValue(driver.terminationDate),
      contractorCompanyName: driver.contractorCompanyName ?? "",
      availabilityStatus: driver.availabilityStatus,
      status: driver.status,
      notes: driver.notes ?? "",
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
          : (branchIds[0] ?? "");
      return { ...prev, branchIds, primaryBranchId };
    });
  }

  function buildPayload() {
    return {
      fullName: form.fullName.trim(),
      preferredName: form.preferredName || undefined,
      driverType: form.driverType,
      employmentType: form.employmentType,
      documentType: form.documentType || undefined,
      documentNumber: form.documentNumber || undefined,
      licenseNumber: form.licenseNumber || undefined,
      licenseCategory: form.licenseCategory || undefined,
      licenseState: form.licenseState || undefined,
      licenseCountry: form.licenseCountry || undefined,
      licenseIssuedAt: optionalDate(form.licenseIssuedAt),
      licenseExpiresAt: optionalDate(form.licenseExpiresAt),
      hasEar: form.hasEar,
      moppCertified: form.moppCertified,
      moppExpiresAt: optionalDate(form.moppExpiresAt),
      birthDate: optionalDate(form.birthDate),
      email: form.email || undefined,
      phone: form.phone || undefined,
      whatsapp: form.whatsapp || undefined,
      emergencyContactName: form.emergencyContactName || undefined,
      emergencyContactPhone: form.emergencyContactPhone || undefined,
      emergencyContactRelation: form.emergencyContactRelation || undefined,
      addressLine1: form.addressLine1 || undefined,
      addressLine2: form.addressLine2 || undefined,
      district: form.district || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      country: form.country || undefined,
      zipCode: form.zipCode || undefined,
      admissionDate: optionalDate(form.admissionDate),
      terminationDate: optionalDate(form.terminationDate),
      contractorCompanyName: form.contractorCompanyName || undefined,
      availabilityStatus: form.availabilityStatus,
      status: form.status,
      notes: form.notes || undefined,
    };
  }

  async function handleSave() {
    if (!form.code.trim() && !editDriver) {
      toast({ type: "error", title: "Código interno é obrigatório." });
      return;
    }
    if (!form.fullName.trim()) {
      toast({ type: "error", title: "Nome completo é obrigatório." });
      return;
    }
    if (!editDriver && form.branchIds.length === 0) {
      toast({ type: "error", title: "Selecione ao menos uma filial de atendimento." });
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (editDriver) {
        await updateDriver(editDriver.id, payload);
        toast({ type: "success", title: "Motorista atualizado." });
      } else {
        await createDriver({
          ...payload,
          code: form.code.trim(),
          branchIds: form.branchIds,
          primaryBranchId: form.primaryBranchId || form.branchIds[0],
        });
        toast({ type: "success", title: "Motorista criado." });
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
    const { type, driver } = confirmAction;
    try {
      if (type === "disable") await disableDriver(driver.id);
      if (type === "enable") await enableDriver(driver.id);
      if (type === "delete") await deleteDriver(driver.id);
      toast({ type: "success", title: "Operação concluída." });
      load();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro na operação." });
    }
    setConfirmAction(null);
  }

  async function openBranchesDrawer(driver: DriverRow) {
    setBranchesDrawer(driver);
    try {
      const links = await listDriverBranches(driver.id);
      setBranchLinks(links);
      setAddBranchId("");
    } catch {
      toast({ type: "error", title: "Erro ao carregar filiais do motorista." });
      setBranchesDrawer(null);
    }
  }

  async function handleAddBranch() {
    if (!branchesDrawer || !addBranchId) return;
    try {
      const links = await assignDriverBranches(branchesDrawer.id, { branchIds: [addBranchId] });
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
      const links = await setDriverPrimaryBranch(branchesDrawer.id, branchId);
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
      const links = await removeDriverBranch(branchesDrawer.id, branchId);
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
              disabled={!!editDriver}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </NexumFormField>
          <NexumFormField label="Status">
            <NexumSelect
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as DriverStatus })}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="Nome completo *" className="sm:col-span-2">
            <NexumInput
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Nome preferido">
            <NexumInput
              value={form.preferredName}
              onChange={(e) => setForm({ ...form, preferredName: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Disponibilidade">
            <NexumSelect
              value={form.availabilityStatus}
              onChange={(e) =>
                setForm({ ...form, availabilityStatus: e.target.value as DriverAvailabilityStatus })
              }
            >
              {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="Tipo de motorista *">
            <NexumSelect
              value={form.driverType}
              onChange={(e) => setForm({ ...form, driverType: e.target.value as DriverType })}
            >
              {Object.entries(DRIVER_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="Vínculo empregatício *">
            <NexumSelect
              value={form.employmentType}
              onChange={(e) =>
                setForm({ ...form, employmentType: e.target.value as EmploymentType })
              }
            >
              {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Documentos pessoais</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Tipo de documento">
            <NexumSelect
              value={form.documentType}
              onChange={(e) =>
                setForm({ ...form, documentType: e.target.value as DriverDocumentType })
              }
            >
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="Número do documento">
            <NexumInput
              value={form.documentNumber}
              onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Data de nascimento">
            <NexumInput
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
            />
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">CNH</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Número da CNH">
            <NexumInput
              value={form.licenseNumber}
              onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Categoria">
            <NexumSelect
              value={form.licenseCategory}
              onChange={(e) =>
                setForm({ ...form, licenseCategory: e.target.value as LicenseCategory })
              }
            >
              <option value="">—</option>
              {(["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE", "OTHER"] as LicenseCategory[]).map(
                (cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ),
              )}
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="UF emissão">
            <NexumInput
              maxLength={2}
              value={form.licenseState}
              onChange={(e) => setForm({ ...form, licenseState: e.target.value.toUpperCase() })}
            />
          </NexumFormField>
          <NexumFormField label="País emissão">
            <NexumInput
              maxLength={2}
              value={form.licenseCountry}
              onChange={(e) => setForm({ ...form, licenseCountry: e.target.value.toUpperCase() })}
            />
          </NexumFormField>
          <NexumFormField label="Data de emissão">
            <NexumInput
              type="date"
              value={form.licenseIssuedAt}
              onChange={(e) => setForm({ ...form, licenseIssuedAt: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Validade da CNH">
            <NexumInput
              type="date"
              value={form.licenseExpiresAt}
              onChange={(e) => setForm({ ...form, licenseExpiresAt: e.target.value })}
            />
          </NexumFormField>
          <div className="sm:col-span-2">
            <NexumCheckbox
              label="Possui EAR (Exerce Atividade Remunerada)"
              checked={form.hasEar}
              onChange={(e) => setForm({ ...form, hasEar: e.target.checked })}
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Certificações</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <NexumCheckbox
              label="Certificado MOPP"
              checked={form.moppCertified}
              onChange={(e) => setForm({ ...form, moppCertified: e.target.checked })}
            />
          </div>
          <NexumFormField label="Validade MOPP">
            <NexumInput
              type="date"
              value={form.moppExpiresAt}
              disabled={!form.moppCertified}
              onChange={(e) => setForm({ ...form, moppExpiresAt: e.target.value })}
            />
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Contato</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="E-mail">
            <NexumInput
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Telefone">
            <NexumInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </NexumFormField>
          <NexumFormField label="WhatsApp">
            <NexumInput
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Emergência</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Nome do contato">
            <NexumInput
              value={form.emergencyContactName}
              onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Telefone">
            <NexumInput
              value={form.emergencyContactPhone}
              onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Parentesco/relação" className="sm:col-span-2">
            <NexumInput
              value={form.emergencyContactRelation}
              onChange={(e) => setForm({ ...form, emergencyContactRelation: e.target.value })}
            />
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Endereço</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Endereço" className="sm:col-span-2">
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
          <NexumFormField label="Cidade">
            <NexumInput value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </NexumFormField>
          <NexumFormField label="Estado/UF">
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
          <NexumFormField label="CEP">
            <NexumInput
              value={form.zipCode}
              onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
            />
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Contratual</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Data de admissão">
            <NexumInput
              type="date"
              value={form.admissionDate}
              onChange={(e) => setForm({ ...form, admissionDate: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Data de desligamento">
            <NexumInput
              type="date"
              value={form.terminationDate}
              onChange={(e) => setForm({ ...form, terminationDate: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Empresa contratante" className="sm:col-span-2">
            <NexumInput
              value={form.contractorCompanyName}
              onChange={(e) => setForm({ ...form, contractorCompanyName: e.target.value })}
            />
          </NexumFormField>
        </div>
      </section>

      {!editDriver && (
        <section>
          <h3 className="mb-1 text-sm font-semibold text-nexum-accent">Filiais</h3>
          <p className="mb-3 text-xs text-nexum-text-muted">
            As filiais definem quais unidades operacionais podem visualizar e operar este motorista.
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
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Observações</h3>
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
    <PermissionGate permission={["drivers.read", "logistics.read"]} mode="any">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          breadcrumb={[{ label: "Logística", href: "/app" }, { label: "Motoristas" }]}
          title="Motoristas"
          description="Cadastre e gerencie motoristas, documentação, CNH, certificações, contratos e filiais atendidas."
          actions={
            canCreate ? (
              <NexumButton onClick={openCreate}>
                <Plus className="mr-1.5 h-4 w-4" />
                Novo motorista
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
          emptyTitle="Nenhum motorista cadastrado ainda."
          emptyDescription="Cadastre o primeiro motorista para iniciar a base logística."
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
                  placeholder="Buscar código, nome, documento, CNH..."
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
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NexumSelect>
                  <NexumSelect
                    value={availabilityFilter}
                    onChange={(e) => {
                      setAvailabilityFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-40"
                  >
                    <option value="">Disponibilidade</option>
                    {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NexumSelect>
                  <NexumSelect
                    value={driverTypeFilter}
                    onChange={(e) => {
                      setDriverTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-36"
                  >
                    <option value="">Tipo</option>
                    {Object.entries(DRIVER_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NexumSelect>
                  <NexumSelect
                    value={employmentTypeFilter}
                    onChange={(e) => {
                      setEmploymentTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-36"
                  >
                    <option value="">Vínculo</option>
                    {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
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
                    value={licenseCategoryFilter}
                    onChange={(e) => {
                      setLicenseCategoryFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-28"
                  >
                    <option value="">CNH</option>
                    {(["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE", "OTHER"] as LicenseCategory[]).map(
                      (cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ),
                    )}
                  </NexumSelect>
                  <NexumInput
                    type="date"
                    title="CNH vence até"
                    value={licenseExpiringFilter}
                    onChange={(e) => {
                      setLicenseExpiringFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-36"
                  />
                  <NexumInput
                    type="date"
                    title="MOPP vence até"
                    value={moppExpiringFilter}
                    onChange={(e) => {
                      setMoppExpiringFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-36"
                  />
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
              key: "fullName",
              header: "Motorista",
              render: (r) => (
                <div>
                  <p className="font-medium text-nexum-text">{r.fullName}</p>
                  {r.preferredName && (
                    <p className="text-xs text-nexum-text-muted">{r.preferredName}</p>
                  )}
                  {r.city && (
                    <p className="text-xs text-nexum-text-muted">
                      {r.city}
                      {r.state ? ` / ${r.state}` : ""}
                    </p>
                  )}
                </div>
              ),
            },
            {
              key: "driverType",
              header: "Tipo",
              render: (r) => (
                <NexumBadge variant="info">{DRIVER_TYPE_LABELS[r.driverType]}</NexumBadge>
              ),
            },
            {
              key: "license",
              header: "CNH",
              render: (r) => (
                <div className="text-sm">
                  {r.licenseCategory ? (
                    <span className="font-medium">{r.licenseCategory}</span>
                  ) : (
                    <span className="text-nexum-text-muted">—</span>
                  )}
                  {r.licenseExpiresAt && (
                    <p className="text-xs text-nexum-text-muted">{formatDate(r.licenseExpiresAt)}</p>
                  )}
                </div>
              ),
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
              key: "availability",
              header: "Disponibilidade",
              render: (r) => (
                <NexumBadge variant={AVAILABILITY_VARIANT[r.availabilityStatus]}>
                  {AVAILABILITY_LABELS[r.availabilityStatus]}
                </NexumBadge>
              ),
            },
            {
              key: "expiry",
              header: "Vencimentos",
              render: (r) => (
                <div className="space-y-1">
                  <ExpiryIndicator label="CNH" date={r.licenseExpiresAt} />
                  {r.moppCertified && <ExpiryIndicator label="MOPP" date={r.moppExpiresAt} />}
                </div>
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
              header: "Atualizado em",
              render: (r) => (
                <span className="text-sm text-nexum-text-muted">
                  {new Date(r.updatedAt).toLocaleString("pt-BR")}
                </span>
              ),
            },
            {
              key: "actions",
              header: "Ações",
              align: "right",
              render: (r) => (
                <div className="flex flex-wrap justify-end gap-1">
                  <NexumButton size="sm" variant="ghost" onClick={() => setDetailDriver(r)}>
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
                      onClick={() => setConfirmAction({ type: "disable", driver: r })}
                    >
                      Desativar
                    </NexumButton>
                  )}
                  {canDisable && r.status === "DISABLED" && (
                    <NexumButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmAction({ type: "enable", driver: r })}
                    >
                      Reativar
                    </NexumButton>
                  )}
                  {canDelete && (
                    <NexumButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmAction({ type: "delete", driver: r })}
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
          title={editDriver ? "Editar motorista" : "Novo motorista"}
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
          open={!!detailDriver}
          onClose={() => setDetailDriver(null)}
          title={detailDriver?.fullName ?? "Motorista"}
        >
          {detailDriver && (
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Identificação</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">Código</dt>
                    <dd className="font-mono">{detailDriver.code}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Status</dt>
                    <dd>{STATUS_LABELS[detailDriver.status]}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Nome completo</dt>
                    <dd>{detailDriver.fullName}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Nome preferido</dt>
                    <dd>{detailDriver.preferredName ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Tipo</dt>
                    <dd>{DRIVER_TYPE_LABELS[detailDriver.driverType]}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Vínculo</dt>
                    <dd>{EMPLOYMENT_TYPE_LABELS[detailDriver.employmentType]}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Disponibilidade</dt>
                    <dd>{AVAILABILITY_LABELS[detailDriver.availabilityStatus]}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Documentos pessoais</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">Tipo</dt>
                    <dd>
                      {detailDriver.documentType
                        ? DOCUMENT_TYPE_LABELS[detailDriver.documentType]
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Número</dt>
                    <dd className="font-mono">{maskSensitive(detailDriver.documentNumber)}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Data de nascimento</dt>
                    <dd>{formatDate(detailDriver.birthDate)}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">CNH</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">Número</dt>
                    <dd className="font-mono">{maskSensitive(detailDriver.licenseNumber)}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Categoria</dt>
                    <dd>{detailDriver.licenseCategory ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">UF / País</dt>
                    <dd>
                      {detailDriver.licenseState ?? "—"}
                      {detailDriver.licenseCountry ? ` / ${detailDriver.licenseCountry}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Emissão</dt>
                    <dd>{formatDate(detailDriver.licenseIssuedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Validade</dt>
                    <dd>
                      <ExpiryIndicator label="CNH" date={detailDriver.licenseExpiresAt} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">EAR</dt>
                    <dd>{detailDriver.hasEar ? "Sim" : "Não"}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Certificações</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">MOPP</dt>
                    <dd>{detailDriver.moppCertified ? "Certificado" : "Não certificado"}</dd>
                  </div>
                  {detailDriver.moppCertified && (
                    <div>
                      <dt className="text-nexum-text-muted">Validade MOPP</dt>
                      <dd>
                        <ExpiryIndicator label="MOPP" date={detailDriver.moppExpiresAt} />
                      </dd>
                    </div>
                  )}
                </dl>
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Contato</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">E-mail</dt>
                    <dd>{detailDriver.email ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Telefone</dt>
                    <dd>{detailDriver.phone ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">WhatsApp</dt>
                    <dd>{detailDriver.whatsapp ?? "—"}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Emergência</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">Nome</dt>
                    <dd>{detailDriver.emergencyContactName ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Telefone</dt>
                    <dd>{detailDriver.emergencyContactPhone ?? "—"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-nexum-text-muted">Relação</dt>
                    <dd>{detailDriver.emergencyContactRelation ?? "—"}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Endereço</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-nexum-text-muted">Endereço</dt>
                    <dd>{detailDriver.addressLine1 ?? "—"}</dd>
                  </div>
                  {detailDriver.addressLine2 && (
                    <div className="sm:col-span-2">
                      <dt className="text-nexum-text-muted">Complemento</dt>
                      <dd>{detailDriver.addressLine2}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-nexum-text-muted">Cidade/UF</dt>
                    <dd>
                      {detailDriver.city ?? "—"}
                      {detailDriver.state ? ` / ${detailDriver.state}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">CEP</dt>
                    <dd>{detailDriver.zipCode ?? "—"}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Contratual</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">Admissão</dt>
                    <dd>{formatDate(detailDriver.admissionDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Desligamento</dt>
                    <dd>{formatDate(detailDriver.terminationDate)}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-nexum-text-muted">Empresa contratante</dt>
                    <dd>{detailDriver.contractorCompanyName ?? "—"}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Filiais vinculadas</h3>
                <ul className="space-y-2">
                  {(detailDriver.branches ?? []).length === 0 && (
                    <li className="text-nexum-text-muted">Nenhuma filial vinculada.</li>
                  )}
                  {(detailDriver.branches ?? []).map((link) => (
                    <li
                      key={link.id}
                      className="flex items-center justify-between rounded-lg border border-nexum-border/40 px-3 py-2"
                    >
                      <span>
                        {link.branch.name}{" "}
                        <span className="font-mono text-xs text-nexum-text-muted">
                          ({link.branch.code})
                        </span>
                      </span>
                      {link.isPrimary && <NexumBadge variant="success">Principal</NexumBadge>}
                    </li>
                  ))}
                </ul>
              </section>

              {detailDriver.notes && (
                <section>
                  <h3 className="mb-2 font-semibold text-nexum-accent">Observações</h3>
                  <p className="whitespace-pre-wrap text-nexum-text">{detailDriver.notes}</p>
                </section>
              )}

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Metadados</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">Criado em</dt>
                    <dd>{new Date(detailDriver.createdAt).toLocaleString("pt-BR")}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Atualizado em</dt>
                    <dd>{new Date(detailDriver.updatedAt).toLocaleString("pt-BR")}</dd>
                  </div>
                  {detailDriver.disabledAt && (
                    <div>
                      <dt className="text-nexum-text-muted">Desativado em</dt>
                      <dd>{new Date(detailDriver.disabledAt).toLocaleString("pt-BR")}</dd>
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
          title={`Gerenciar filiais — ${branchesDrawer?.fullName ?? ""}`}
        >
          {canAssignBranches && (
            <div className="mb-4 flex gap-2">
              <NexumSelect
                value={addBranchId}
                onChange={(e) => setAddBranchId(e.target.value)}
                className="flex-1"
              >
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
                    <NexumButton
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleSetPrimary(link.branchId)}
                    >
                      Tornar principal
                    </NexumButton>
                  ) : null}
                  {canAssignBranches && (branchLinks?.length ?? 0) > 1 && (
                    <NexumButton
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleRemoveBranch(link.branchId)}
                    >
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
              ? "Excluir motorista"
              : confirmAction?.type === "enable"
                ? "Reativar motorista"
                : "Desativar motorista"
          }
          description={`Confirma a operação para ${confirmAction?.driver.fullName ?? ""}?`}
          confirmLabel="Confirmar"
          danger={confirmAction?.type === "delete"}
        />
      </div>
    </PermissionGate>
  );
}

export function DriversLogisticsPage() {
  return (
    <NexumToastProvider>
      <DriversLogisticsPageInner />
    </NexumToastProvider>
  );
}
