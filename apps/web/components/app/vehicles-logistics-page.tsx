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
  assignVehicleBranches,
  createVehicle,
  deleteVehicle,
  disableVehicle,
  enableVehicle,
  listVehicleBranches,
  listVehicles,
  removeVehicleBranch,
  setVehiclePrimaryBranch,
  updateVehicle,
  type BodyType,
  type FuelType,
  type OwnershipType,
  type VehicleAvailabilityStatus,
  type VehicleCategory,
  type VehicleRow,
  type VehicleStatus,
  type VehicleType,
} from "@/lib/logistics-api";
import { Building2, Eye, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const GLOBAL_VEHICLE_SCOPE = [
  "vehicles.manage",
  "logistics.manage",
  "organization.manage",
  "*",
] as const;

const STATUS_LABELS: Record<VehicleStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  MAINTENANCE: "Em manutenção",
  SUSPENDED: "Suspenso",
  DISABLED: "Desativado",
};

const STATUS_VARIANT: Record<VehicleStatus, "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  MAINTENANCE: "warning",
  SUSPENDED: "danger",
  DISABLED: "danger",
};

const AVAILABILITY_LABELS: Record<VehicleAvailabilityStatus, string> = {
  AVAILABLE: "Disponível",
  UNAVAILABLE: "Indisponível",
  ON_TRIP: "Em viagem",
  IN_MAINTENANCE: "Em manutenção",
  RESERVED: "Reservado",
  OUT_OF_SERVICE: "Fora de operação",
};

const AVAILABILITY_VARIANT: Record<
  VehicleAvailabilityStatus,
  "success" | "warning" | "danger" | "info"
> = {
  AVAILABLE: "success",
  UNAVAILABLE: "danger",
  ON_TRIP: "info",
  IN_MAINTENANCE: "warning",
  RESERVED: "warning",
  OUT_OF_SERVICE: "danger",
};

const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  TRUCK: "Caminhão",
  TRACTOR_TRUCK: "Cavalo mecânico",
  TRAILER: "Carreta",
  SEMI_TRAILER: "Semi-reboque",
  VAN: "Van",
  PICKUP: "Picape",
  CAR: "Automóvel",
  MOTORCYCLE: "Motocicleta",
  BUS: "Ônibus",
  EQUIPMENT: "Equipamento",
  OTHER: "Outro",
};

const VEHICLE_CATEGORY_LABELS: Record<VehicleCategory, string> = {
  CARGO: "Carga",
  PASSENGER: "Passageiros",
  SUPPORT: "Apoio",
  MAINTENANCE: "Manutenção",
  ADMINISTRATIVE: "Administrativo",
  EQUIPMENT: "Equipamento",
  OTHER: "Outro",
};

const OWNERSHIP_TYPE_LABELS: Record<OwnershipType, string> = {
  OWNED: "Próprio",
  LEASED: "Leasing",
  RENTED: "Alugado",
  THIRD_PARTY: "Terceiro",
  AGGREGATED: "Agregado",
  CUSTOMER_OWNED: "Cliente",
  OTHER: "Outro",
};

const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  DIESEL: "Diesel",
  GASOLINE: "Gasolina",
  ETHANOL: "Etanol",
  FLEX: "Flex",
  CNG: "GNV",
  LNG: "GNL",
  ELECTRIC: "Elétrico",
  HYBRID: "Híbrido",
  OTHER: "Outro",
};

const BODY_TYPE_LABELS: Record<BodyType, string> = {
  DRY_VAN: "Baú seco",
  REFRIGERATED: "Refrigerado",
  FLATBED: "Prancha",
  TANK: "Tanque",
  BULK: "Graneleiro",
  CONTAINER_CARRIER: "Porta-container",
  DUMP: "Basculante",
  SIDER: "Sider",
  CURTAIN_SIDER: "Sider lonado",
  CAR_CARRIER: "Cegonha",
  CHASSIS: "Chassi",
  NONE: "Nenhum",
  OTHER: "Outro",
};

type VehicleForm = {
  code: string;
  plate: string;
  fleetNumber: string;
  vehicleType: VehicleType;
  vehicleCategory: VehicleCategory;
  ownershipType: OwnershipType;
  brand: string;
  model: string;
  version: string;
  manufactureYear: string;
  modelYear: string;
  color: string;
  renavam: string;
  chassisNumber: string;
  engineNumber: string;
  licensePlateState: string;
  licensePlateCountry: string;
  fuelType: FuelType | "";
  emissionStandard: string;
  axleCount: string;
  tireCount: string;
  tareWeightKg: string;
  grossWeightKg: string;
  payloadCapacityKg: string;
  volumeCapacityM3: string;
  bodyType: BodyType | "";
  bodyDescription: string;
  trackerProvider: string;
  trackerDeviceId: string;
  trackerImei: string;
  odometerKm: string;
  hourMeter: string;
  licensingExpiresAt: string;
  insuranceExpiresAt: string;
  inspectionExpiresAt: string;
  tachographExpiresAt: string;
  anttExpiresAt: string;
  availabilityStatus: VehicleAvailabilityStatus;
  status: VehicleStatus;
  notes: string;
  branchIds: string[];
  primaryBranchId: string;
};

const emptyForm: VehicleForm = {
  code: "",
  plate: "",
  fleetNumber: "",
  vehicleType: "TRUCK",
  vehicleCategory: "CARGO",
  ownershipType: "OWNED",
  brand: "",
  model: "",
  version: "",
  manufactureYear: "",
  modelYear: "",
  color: "",
  renavam: "",
  chassisNumber: "",
  engineNumber: "",
  licensePlateState: "",
  licensePlateCountry: "BR",
  fuelType: "DIESEL",
  emissionStandard: "",
  axleCount: "",
  tireCount: "",
  tareWeightKg: "",
  grossWeightKg: "",
  payloadCapacityKg: "",
  volumeCapacityM3: "",
  bodyType: "",
  bodyDescription: "",
  trackerProvider: "",
  trackerDeviceId: "",
  trackerImei: "",
  odometerKm: "",
  hourMeter: "",
  licensingExpiresAt: "",
  insuranceExpiresAt: "",
  inspectionExpiresAt: "",
  tachographExpiresAt: "",
  anttExpiresAt: "",
  availabilityStatus: "AVAILABLE",
  status: "ACTIVE",
  notes: "",
  branchIds: [],
  primaryBranchId: "",
};

function formatBranches(row: VehicleRow) {
  const links = row.branches ?? [];
  if (links.length === 0) return "—";
  if (links.length <= 2) {
    return links.map((l) => l.branch.name).join(", ");
  }
  const [first, second, ...rest] = links;
  return `${first.branch.name}, ${second.branch.name} +${rest.length}`;
}

function primaryBranchLabel(row: VehicleRow) {
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

function optionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
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

function vehicleDisplayName(row: VehicleRow) {
  const parts = [row.brand, row.model].filter(Boolean);
  if (row.version) parts.push(row.version);
  return parts.join(" ") || "—";
}

function VehiclesLogisticsPageInner() {
  const { toast } = useNexumToast();
  const [rows, setRows] = useState<VehicleRow[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("");
  const [vehicleCategoryFilter, setVehicleCategoryFilter] = useState("");
  const [ownershipTypeFilter, setOwnershipTypeFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [licensingExpiringFilter, setLicensingExpiringFilter] = useState("");
  const [insuranceExpiringFilter, setInsuranceExpiringFilter] = useState("");
  const [inspectionExpiringFilter, setInspectionExpiringFilter] = useState("");
  const [tachographExpiringFilter, setTachographExpiringFilter] = useState("");
  const [anttExpiringFilter, setAnttExpiringFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<VehicleRow | null>(null);
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [detailVehicle, setDetailVehicle] = useState<VehicleRow | null>(null);
  const [branchesDrawer, setBranchesDrawer] = useState<VehicleRow | null>(null);
  const [branchLinks, setBranchLinks] = useState<VehicleRow["branches"]>([]);
  const [addBranchId, setAddBranchId] = useState("");

  const [confirmAction, setConfirmAction] = useState<
    { type: "disable" | "enable" | "delete"; vehicle: VehicleRow } | null
  >(null);

  const hasGlobalScope = useAnyPermission([...GLOBAL_VEHICLE_SCOPE]);
  const canCreate = usePermission("vehicles.create") && hasGlobalScope;
  const canUpdate = usePermission("vehicles.update") && hasGlobalScope;
  const canDisable = usePermission("vehicles.disable") && hasGlobalScope;
  const canDelete = usePermission("vehicles.delete") && hasGlobalScope;
  const canAssignBranches = usePermission("vehicles.assign_branches") && hasGlobalScope;

  const branchOptions = useMemo(
    () => branches.filter((b) => b.status === "ACTIVE"),
    [branches],
  );

  const load = useCallback(() => {
    setLoading(true);
    void listVehicles({
      search: search || undefined,
      status: (statusFilter as VehicleStatus) || undefined,
      availabilityStatus: (availabilityFilter as VehicleAvailabilityStatus) || undefined,
      vehicleType: (vehicleTypeFilter as VehicleType) || undefined,
      vehicleCategory: (vehicleCategoryFilter as VehicleCategory) || undefined,
      ownershipType: (ownershipTypeFilter as OwnershipType) || undefined,
      branchId: branchFilter || undefined,
      brand: brandFilter || undefined,
      model: modelFilter || undefined,
      licensingExpiringUntil: licensingExpiringFilter || undefined,
      insuranceExpiringUntil: insuranceExpiringFilter || undefined,
      inspectionExpiringUntil: inspectionExpiringFilter || undefined,
      tachographExpiringUntil: tachographExpiringFilter || undefined,
      anttExpiringUntil: anttExpiringFilter || undefined,
      page,
      perPage: 10,
      sortBy: "code",
      sortDirection: "asc",
    })
      .then(({ items, pagination }) => {
        setRows(items);
        setTotal(pagination.total);
        setError(null);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Erro ao carregar veículos."))
      .finally(() => setLoading(false));
  }, [
    search,
    statusFilter,
    availabilityFilter,
    vehicleTypeFilter,
    vehicleCategoryFilter,
    ownershipTypeFilter,
    branchFilter,
    brandFilter,
    modelFilter,
    licensingExpiringFilter,
    insuranceExpiringFilter,
    inspectionExpiringFilter,
    tachographExpiringFilter,
    anttExpiringFilter,
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
    setVehicleTypeFilter("");
    setVehicleCategoryFilter("");
    setOwnershipTypeFilter("");
    setBranchFilter("");
    setBrandFilter("");
    setModelFilter("");
    setLicensingExpiringFilter("");
    setInsuranceExpiringFilter("");
    setInspectionExpiringFilter("");
    setTachographExpiringFilter("");
    setAnttExpiringFilter("");
    setPage(1);
  }

  function openCreate() {
    setEditVehicle(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(vehicle: VehicleRow) {
    setEditVehicle(vehicle);
    setForm({
      code: vehicle.code,
      plate: vehicle.plate,
      fleetNumber: vehicle.fleetNumber ?? "",
      vehicleType: vehicle.vehicleType,
      vehicleCategory: vehicle.vehicleCategory,
      ownershipType: vehicle.ownershipType,
      brand: vehicle.brand,
      model: vehicle.model,
      version: vehicle.version ?? "",
      manufactureYear: vehicle.manufactureYear?.toString() ?? "",
      modelYear: vehicle.modelYear?.toString() ?? "",
      color: vehicle.color ?? "",
      renavam: vehicle.renavam ?? "",
      chassisNumber: vehicle.chassisNumber ?? "",
      engineNumber: vehicle.engineNumber ?? "",
      licensePlateState: vehicle.licensePlateState ?? "",
      licensePlateCountry: vehicle.licensePlateCountry ?? "BR",
      fuelType: vehicle.fuelType ?? "",
      emissionStandard: vehicle.emissionStandard ?? "",
      axleCount: vehicle.axleCount?.toString() ?? "",
      tireCount: vehicle.tireCount?.toString() ?? "",
      tareWeightKg: vehicle.tareWeightKg?.toString() ?? "",
      grossWeightKg: vehicle.grossWeightKg?.toString() ?? "",
      payloadCapacityKg: vehicle.payloadCapacityKg?.toString() ?? "",
      volumeCapacityM3: vehicle.volumeCapacityM3?.toString() ?? "",
      bodyType: vehicle.bodyType ?? "",
      bodyDescription: vehicle.bodyDescription ?? "",
      trackerProvider: vehicle.trackerProvider ?? "",
      trackerDeviceId: vehicle.trackerDeviceId ?? "",
      trackerImei: vehicle.trackerImei ?? "",
      odometerKm: vehicle.odometerKm?.toString() ?? "",
      hourMeter: vehicle.hourMeter?.toString() ?? "",
      licensingExpiresAt: toDateInputValue(vehicle.licensingExpiresAt),
      insuranceExpiresAt: toDateInputValue(vehicle.insuranceExpiresAt),
      inspectionExpiresAt: toDateInputValue(vehicle.inspectionExpiresAt),
      tachographExpiresAt: toDateInputValue(vehicle.tachographExpiresAt),
      anttExpiresAt: toDateInputValue(vehicle.anttExpiresAt),
      availabilityStatus: vehicle.availabilityStatus,
      status: vehicle.status,
      notes: vehicle.notes ?? "",
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
      plate: form.plate.trim().toUpperCase(),
      fleetNumber: form.fleetNumber || undefined,
      vehicleType: form.vehicleType,
      vehicleCategory: form.vehicleCategory,
      ownershipType: form.ownershipType,
      brand: form.brand.trim(),
      model: form.model.trim(),
      version: form.version || undefined,
      manufactureYear: optionalNumber(form.manufactureYear),
      modelYear: optionalNumber(form.modelYear),
      color: form.color || undefined,
      renavam: form.renavam || undefined,
      chassisNumber: form.chassisNumber || undefined,
      engineNumber: form.engineNumber || undefined,
      licensePlateState: form.licensePlateState || undefined,
      licensePlateCountry: form.licensePlateCountry || undefined,
      fuelType: form.fuelType || undefined,
      emissionStandard: form.emissionStandard || undefined,
      axleCount: optionalNumber(form.axleCount),
      tireCount: optionalNumber(form.tireCount),
      tareWeightKg: optionalNumber(form.tareWeightKg),
      grossWeightKg: optionalNumber(form.grossWeightKg),
      payloadCapacityKg: optionalNumber(form.payloadCapacityKg),
      volumeCapacityM3: optionalNumber(form.volumeCapacityM3),
      bodyType: form.bodyType || undefined,
      bodyDescription: form.bodyDescription || undefined,
      trackerProvider: form.trackerProvider || undefined,
      trackerDeviceId: form.trackerDeviceId || undefined,
      trackerImei: form.trackerImei || undefined,
      odometerKm: optionalNumber(form.odometerKm),
      hourMeter: optionalNumber(form.hourMeter),
      licensingExpiresAt: optionalDate(form.licensingExpiresAt),
      insuranceExpiresAt: optionalDate(form.insuranceExpiresAt),
      inspectionExpiresAt: optionalDate(form.inspectionExpiresAt),
      tachographExpiresAt: optionalDate(form.tachographExpiresAt),
      anttExpiresAt: optionalDate(form.anttExpiresAt),
      availabilityStatus: form.availabilityStatus,
      status: form.status,
      notes: form.notes || undefined,
    };
  }

  async function handleSave() {
    if (!form.code.trim() && !editVehicle) {
      toast({ type: "error", title: "Código interno é obrigatório." });
      return;
    }
    if (!form.plate.trim()) {
      toast({ type: "error", title: "Placa é obrigatória." });
      return;
    }
    if (!form.brand.trim()) {
      toast({ type: "error", title: "Marca é obrigatória." });
      return;
    }
    if (!form.model.trim()) {
      toast({ type: "error", title: "Modelo é obrigatório." });
      return;
    }
    if (!editVehicle && form.branchIds.length === 0) {
      toast({ type: "error", title: "Selecione ao menos uma filial de atendimento." });
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (editVehicle) {
        await updateVehicle(editVehicle.id, payload);
        toast({ type: "success", title: "Veículo atualizado." });
      } else {
        await createVehicle({
          ...payload,
          code: form.code.trim(),
          branchIds: form.branchIds,
          primaryBranchId: form.primaryBranchId || form.branchIds[0],
        });
        toast({ type: "success", title: "Veículo criado." });
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
    const { type, vehicle } = confirmAction;
    try {
      if (type === "disable") await disableVehicle(vehicle.id);
      if (type === "enable") await enableVehicle(vehicle.id);
      if (type === "delete") await deleteVehicle(vehicle.id);
      toast({ type: "success", title: "Operação concluída." });
      load();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro na operação." });
    }
    setConfirmAction(null);
  }

  async function openBranchesDrawer(vehicle: VehicleRow) {
    setBranchesDrawer(vehicle);
    try {
      const links = await listVehicleBranches(vehicle.id);
      setBranchLinks(links);
      setAddBranchId("");
    } catch {
      toast({ type: "error", title: "Erro ao carregar filiais do veículo." });
      setBranchesDrawer(null);
    }
  }

  async function handleAddBranch() {
    if (!branchesDrawer || !addBranchId) return;
    try {
      const links = await assignVehicleBranches(branchesDrawer.id, { branchIds: [addBranchId] });
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
      const links = await setVehiclePrimaryBranch(branchesDrawer.id, branchId);
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
      const links = await removeVehicleBranch(branchesDrawer.id, branchId);
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
              disabled={!!editVehicle}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </NexumFormField>
          <NexumFormField label="Status">
            <NexumSelect
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="Disponibilidade">
            <NexumSelect
              value={form.availabilityStatus}
              onChange={(e) =>
                setForm({ ...form, availabilityStatus: e.target.value as VehicleAvailabilityStatus })
              }
            >
              {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Placa e frota</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Placa *">
            <NexumInput
              value={form.plate}
              onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
            />
          </NexumFormField>
          <NexumFormField label="Número de frota">
            <NexumInput
              value={form.fleetNumber}
              onChange={(e) => setForm({ ...form, fleetNumber: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="UF da placa">
            <NexumInput
              maxLength={2}
              value={form.licensePlateState}
              onChange={(e) =>
                setForm({ ...form, licensePlateState: e.target.value.toUpperCase() })
              }
            />
          </NexumFormField>
          <NexumFormField label="País da placa">
            <NexumInput
              maxLength={2}
              value={form.licensePlateCountry}
              onChange={(e) =>
                setForm({ ...form, licensePlateCountry: e.target.value.toUpperCase() })
              }
            />
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Classificação</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Tipo de veículo *">
            <NexumSelect
              value={form.vehicleType}
              onChange={(e) => setForm({ ...form, vehicleType: e.target.value as VehicleType })}
            >
              {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="Categoria *">
            <NexumSelect
              value={form.vehicleCategory}
              onChange={(e) =>
                setForm({ ...form, vehicleCategory: e.target.value as VehicleCategory })
              }
            >
              {Object.entries(VEHICLE_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="Tipo de propriedade *">
            <NexumSelect
              value={form.ownershipType}
              onChange={(e) =>
                setForm({ ...form, ownershipType: e.target.value as OwnershipType })
              }
            >
              {Object.entries(OWNERSHIP_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Fabricante e modelo</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Marca *">
            <NexumInput
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Modelo *">
            <NexumInput
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Versão">
            <NexumInput
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Cor">
            <NexumInput
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Ano de fabricação">
            <NexumInput
              type="number"
              value={form.manufactureYear}
              onChange={(e) => setForm({ ...form, manufactureYear: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Ano modelo">
            <NexumInput
              type="number"
              value={form.modelYear}
              onChange={(e) => setForm({ ...form, modelYear: e.target.value })}
            />
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Documentação legal</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="RENAVAM">
            <NexumInput
              value={form.renavam}
              onChange={(e) => setForm({ ...form, renavam: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Chassi">
            <NexumInput
              value={form.chassisNumber}
              onChange={(e) => setForm({ ...form, chassisNumber: e.target.value.toUpperCase() })}
            />
          </NexumFormField>
          <NexumFormField label="Número do motor" className="sm:col-span-2">
            <NexumInput
              value={form.engineNumber}
              onChange={(e) => setForm({ ...form, engineNumber: e.target.value.toUpperCase() })}
            />
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Capacidades e carroceria</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Combustível">
            <NexumSelect
              value={form.fuelType}
              onChange={(e) => setForm({ ...form, fuelType: e.target.value as FuelType })}
            >
              <option value="">—</option>
              {Object.entries(FUEL_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="Padrão de emissão">
            <NexumInput
              value={form.emissionStandard}
              onChange={(e) => setForm({ ...form, emissionStandard: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Eixos">
            <NexumInput
              type="number"
              value={form.axleCount}
              onChange={(e) => setForm({ ...form, axleCount: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Pneus">
            <NexumInput
              type="number"
              value={form.tireCount}
              onChange={(e) => setForm({ ...form, tireCount: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Tara (kg)">
            <NexumInput
              type="number"
              value={form.tareWeightKg}
              onChange={(e) => setForm({ ...form, tareWeightKg: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="PBT (kg)">
            <NexumInput
              type="number"
              value={form.grossWeightKg}
              onChange={(e) => setForm({ ...form, grossWeightKg: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Capacidade de carga (kg)">
            <NexumInput
              type="number"
              value={form.payloadCapacityKg}
              onChange={(e) => setForm({ ...form, payloadCapacityKg: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Capacidade volumétrica (m³)">
            <NexumInput
              type="number"
              value={form.volumeCapacityM3}
              onChange={(e) => setForm({ ...form, volumeCapacityM3: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Tipo de carroceria">
            <NexumSelect
              value={form.bodyType}
              onChange={(e) => setForm({ ...form, bodyType: e.target.value as BodyType })}
            >
              <option value="">—</option>
              {Object.entries(BODY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="Descrição da carroceria" className="sm:col-span-2">
            <NexumInput
              value={form.bodyDescription}
              onChange={(e) => setForm({ ...form, bodyDescription: e.target.value })}
            />
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Rastreamento e telemetria</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Provedor de rastreamento">
            <NexumInput
              value={form.trackerProvider}
              onChange={(e) => setForm({ ...form, trackerProvider: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="ID do dispositivo">
            <NexumInput
              value={form.trackerDeviceId}
              onChange={(e) => setForm({ ...form, trackerDeviceId: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="IMEI">
            <NexumInput
              value={form.trackerImei}
              onChange={(e) => setForm({ ...form, trackerImei: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Odômetro (km)">
            <NexumInput
              type="number"
              value={form.odometerKm}
              onChange={(e) => setForm({ ...form, odometerKm: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Horímetro">
            <NexumInput
              type="number"
              value={form.hourMeter}
              onChange={(e) => setForm({ ...form, hourMeter: e.target.value })}
            />
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Vencimentos e compliance</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Licenciamento">
            <NexumInput
              type="date"
              value={form.licensingExpiresAt}
              onChange={(e) => setForm({ ...form, licensingExpiresAt: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Seguro">
            <NexumInput
              type="date"
              value={form.insuranceExpiresAt}
              onChange={(e) => setForm({ ...form, insuranceExpiresAt: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Inspeção veicular">
            <NexumInput
              type="date"
              value={form.inspectionExpiresAt}
              onChange={(e) => setForm({ ...form, inspectionExpiresAt: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Tacógrafo">
            <NexumInput
              type="date"
              value={form.tachographExpiresAt}
              onChange={(e) => setForm({ ...form, tachographExpiresAt: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="ANTT">
            <NexumInput
              type="date"
              value={form.anttExpiresAt}
              onChange={(e) => setForm({ ...form, anttExpiresAt: e.target.value })}
            />
          </NexumFormField>
        </div>
      </section>

      {!editVehicle && (
        <section>
          <h3 className="mb-1 text-sm font-semibold text-nexum-accent">Filiais</h3>
          <p className="mb-3 text-xs text-nexum-text-muted">
            As filiais definem quais unidades operacionais podem visualizar e operar este veículo.
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
    <PermissionGate permission={["vehicles.read", "logistics.read"]} mode="any">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          breadcrumb={[{ label: "Logística", href: "/app" }, { label: "Veículos" }]}
          title="Veículos"
          description="Cadastre e gerencie veículos, documentação, vencimentos regulatórios, rastreamento e filiais atendidas."
          actions={
            canCreate ? (
              <NexumButton onClick={openCreate}>
                <Plus className="mr-1.5 h-4 w-4" />
                Novo veículo
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
          emptyTitle="Nenhum veículo cadastrado ainda."
          emptyDescription="Cadastre o primeiro veículo para iniciar a gestão de frota."
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
                  placeholder="Buscar código, placa, frota, marca, modelo..."
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
                    value={vehicleTypeFilter}
                    onChange={(e) => {
                      setVehicleTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-40"
                  >
                    <option value="">Tipo</option>
                    {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NexumSelect>
                  <NexumSelect
                    value={vehicleCategoryFilter}
                    onChange={(e) => {
                      setVehicleCategoryFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-36"
                  >
                    <option value="">Categoria</option>
                    {Object.entries(VEHICLE_CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NexumSelect>
                  <NexumSelect
                    value={ownershipTypeFilter}
                    onChange={(e) => {
                      setOwnershipTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-36"
                  >
                    <option value="">Propriedade</option>
                    {Object.entries(OWNERSHIP_TYPE_LABELS).map(([value, label]) => (
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
                    placeholder="Marca"
                    value={brandFilter}
                    onChange={(e) => {
                      setBrandFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-28"
                  />
                  <NexumInput
                    placeholder="Modelo"
                    value={modelFilter}
                    onChange={(e) => {
                      setModelFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-28"
                  />
                  <NexumInput
                    type="date"
                    title="Licenciamento vence até"
                    value={licensingExpiringFilter}
                    onChange={(e) => {
                      setLicensingExpiringFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-36"
                  />
                  <NexumInput
                    type="date"
                    title="Seguro vence até"
                    value={insuranceExpiringFilter}
                    onChange={(e) => {
                      setInsuranceExpiringFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-36"
                  />
                  <NexumInput
                    type="date"
                    title="Inspeção vence até"
                    value={inspectionExpiringFilter}
                    onChange={(e) => {
                      setInspectionExpiringFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-36"
                  />
                  <NexumInput
                    type="date"
                    title="Tacógrafo vence até"
                    value={tachographExpiringFilter}
                    onChange={(e) => {
                      setTachographExpiringFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-36"
                  />
                  <NexumInput
                    type="date"
                    title="ANTT vence até"
                    value={anttExpiringFilter}
                    onChange={(e) => {
                      setAnttExpiringFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-36"
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
              key: "vehicle",
              header: "Veículo",
              render: (r) => (
                <div>
                  <p className="font-medium text-nexum-text">{vehicleDisplayName(r)}</p>
                  <p className="text-xs text-nexum-text-muted">
                    {VEHICLE_CATEGORY_LABELS[r.vehicleCategory]}
                  </p>
                </div>
              ),
            },
            {
              key: "plateFleet",
              header: "Placa/Frota",
              render: (r) => (
                <div className="text-sm">
                  <p className="font-mono font-medium">{r.plate}</p>
                  {r.fleetNumber && (
                    <p className="text-xs text-nexum-text-muted">{r.fleetNumber}</p>
                  )}
                </div>
              ),
            },
            {
              key: "vehicleType",
              header: "Tipo",
              render: (r) => (
                <NexumBadge variant="info">{VEHICLE_TYPE_LABELS[r.vehicleType]}</NexumBadge>
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
                  <ExpiryIndicator label="Lic." date={r.licensingExpiresAt} />
                  <ExpiryIndicator label="Seg." date={r.insuranceExpiresAt} />
                  <ExpiryIndicator label="Insp." date={r.inspectionExpiresAt} />
                  <ExpiryIndicator label="Tac." date={r.tachographExpiresAt} />
                  <ExpiryIndicator label="ANTT" date={r.anttExpiresAt} />
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
                  <NexumButton size="sm" variant="ghost" onClick={() => setDetailVehicle(r)}>
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
                      onClick={() => setConfirmAction({ type: "disable", vehicle: r })}
                    >
                      Desativar
                    </NexumButton>
                  )}
                  {canDisable && r.status === "DISABLED" && (
                    <NexumButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmAction({ type: "enable", vehicle: r })}
                    >
                      Reativar
                    </NexumButton>
                  )}
                  {canDelete && (
                    <NexumButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmAction({ type: "delete", vehicle: r })}
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
          title={editVehicle ? "Editar veículo" : "Novo veículo"}
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
          open={!!detailVehicle}
          onClose={() => setDetailVehicle(null)}
          title={detailVehicle ? `${detailVehicle.plate} — ${vehicleDisplayName(detailVehicle)}` : "Veículo"}
        >
          {detailVehicle && (
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Identificação</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">Código</dt>
                    <dd className="font-mono">{detailVehicle.code}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Status</dt>
                    <dd>{STATUS_LABELS[detailVehicle.status]}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Disponibilidade</dt>
                    <dd>{AVAILABILITY_LABELS[detailVehicle.availabilityStatus]}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Placa</dt>
                    <dd className="font-mono">{detailVehicle.plate}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Frota</dt>
                    <dd>{detailVehicle.fleetNumber ?? "—"}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Classificação</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">Tipo</dt>
                    <dd>{VEHICLE_TYPE_LABELS[detailVehicle.vehicleType]}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Categoria</dt>
                    <dd>{VEHICLE_CATEGORY_LABELS[detailVehicle.vehicleCategory]}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Propriedade</dt>
                    <dd>{OWNERSHIP_TYPE_LABELS[detailVehicle.ownershipType]}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Fabricante e modelo</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">Marca / Modelo</dt>
                    <dd>{vehicleDisplayName(detailVehicle)}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Anos</dt>
                    <dd>
                      {detailVehicle.manufactureYear ?? "—"}
                      {detailVehicle.modelYear ? ` / ${detailVehicle.modelYear}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Cor</dt>
                    <dd>{detailVehicle.color ?? "—"}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Documentação legal</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">RENAVAM</dt>
                    <dd className="font-mono">{maskSensitive(detailVehicle.renavam)}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Chassi</dt>
                    <dd className="font-mono">{maskSensitive(detailVehicle.chassisNumber)}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Motor</dt>
                    <dd className="font-mono">{maskSensitive(detailVehicle.engineNumber)}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Rastreamento</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">Provedor</dt>
                    <dd>{detailVehicle.trackerProvider ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">ID dispositivo</dt>
                    <dd className="font-mono">{maskSensitive(detailVehicle.trackerDeviceId)}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">IMEI</dt>
                    <dd className="font-mono">{maskSensitive(detailVehicle.trackerImei)}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Vencimentos</h3>
                <div className="space-y-2">
                  <ExpiryIndicator label="Licenciamento" date={detailVehicle.licensingExpiresAt} />
                  <ExpiryIndicator label="Seguro" date={detailVehicle.insuranceExpiresAt} />
                  <ExpiryIndicator label="Inspeção" date={detailVehicle.inspectionExpiresAt} />
                  <ExpiryIndicator label="Tacógrafo" date={detailVehicle.tachographExpiresAt} />
                  <ExpiryIndicator label="ANTT" date={detailVehicle.anttExpiresAt} />
                </div>
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Filiais vinculadas</h3>
                <ul className="space-y-2">
                  {(detailVehicle.branches ?? []).length === 0 && (
                    <li className="text-nexum-text-muted">Nenhuma filial vinculada.</li>
                  )}
                  {(detailVehicle.branches ?? []).map((link) => (
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

              {detailVehicle.notes && (
                <section>
                  <h3 className="mb-2 font-semibold text-nexum-accent">Observações</h3>
                  <p className="whitespace-pre-wrap text-nexum-text">{detailVehicle.notes}</p>
                </section>
              )}

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Metadados</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">Criado em</dt>
                    <dd>{new Date(detailVehicle.createdAt).toLocaleString("pt-BR")}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Atualizado em</dt>
                    <dd>{new Date(detailVehicle.updatedAt).toLocaleString("pt-BR")}</dd>
                  </div>
                  {detailVehicle.disabledAt && (
                    <div>
                      <dt className="text-nexum-text-muted">Desativado em</dt>
                      <dd>{new Date(detailVehicle.disabledAt).toLocaleString("pt-BR")}</dd>
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
          title={`Gerenciar filiais — ${branchesDrawer?.plate ?? ""}`}
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
              ? "Excluir veículo"
              : confirmAction?.type === "enable"
                ? "Reativar veículo"
                : "Desativar veículo"
          }
          description={`Confirma a operação para ${confirmAction?.vehicle.plate ?? ""}?`}
          confirmLabel="Confirmar"
          danger={confirmAction?.type === "delete"}
        />
      </div>
    </PermissionGate>
  );
}

export function VehiclesLogisticsPage() {
  return (
    <NexumToastProvider>
      <VehiclesLogisticsPageInner />
    </NexumToastProvider>
  );
}
