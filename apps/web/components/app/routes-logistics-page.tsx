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
  NexumTableCode,
  NexumTableRowActions,
  NexumTableSearch,
  NexumTableText,
  NexumTableToolbar,
  NexumTextarea,
  NexumToastProvider,
  useNexumToast,
  type NexumDropdownItem,
} from "@/components/ui/nexum";
import { fetchBranches, type BranchRow } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import {
  assignRouteBranches,
  createRoute,
  deleteRoute,
  disableRoute,
  enableRoute,
  getRoute,
  listCustomers,
  listLocations,
  listRouteBranches,
  listRoutePoints,
  listRoutes,
  removeRouteBranch,
  replaceRoutePoints,
  setRoutePrimaryBranch,
  updateRoute,
  type CustomerRow,
  type LocationRow,
  type OperationType,
  type RoutePoint,
  type RoutePointInput,
  type RoutePointOperationRole,
  type RoutePointType,
  type RouteRiskLevel,
  type RouteRow,
  type RouteStatus,
  type RouteType,
} from "@/lib/logistics-api";
import { ArrowDown, ArrowUp, Building2, Eye, MapPin, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const GLOBAL_ROUTE_SCOPE = [
  "routes.manage",
  "logistics.manage",
  "organization.manage",
  "*",
] as const;

const STATUS_LABELS: Record<RouteStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  DISABLED: "Desativado",
};

const STATUS_VARIANT: Record<RouteStatus, "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  DISABLED: "danger",
};

const ROUTE_TYPE_LABELS: Record<RouteType, string> = {
  STANDARD: "Padrão",
  DEDICATED: "Dedicada",
  SPOT: "Spot",
  MILK_RUN: "Milk run",
  ROUND_TRIP: "Ida e volta",
  TRANSFER: "Transferência",
  DISTRIBUTION: "Distribuição",
  COLLECTION: "Coleta",
  LINE_HAUL: "Line haul",
  PORT: "Portuária",
  CUSTOMER: "Cliente",
  OTHER: "Outro",
};

const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  INBOUND: "Entrada",
  OUTBOUND: "Saída",
  TRANSFER: "Transferência",
  DISTRIBUTION: "Distribuição",
  COLLECTION: "Coleta",
  RETURN: "Retorno",
  EXPORT: "Exportação",
  IMPORT: "Importação",
  OTHER: "Outro",
};

const RISK_LABELS: Record<RouteRiskLevel, string> = {
  LOW: "Baixo",
  MEDIUM: "Médio",
  HIGH: "Alto",
  CRITICAL: "Crítico",
};

const RISK_VARIANT: Record<RouteRiskLevel, "success" | "warning" | "danger" | "info"> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "danger",
  CRITICAL: "danger",
};

const POINT_TYPE_LABELS: Record<RoutePointType, string> = {
  ORIGIN: "Origem",
  DESTINATION: "Destino",
  STOP: "Parada",
  WAYPOINT: "Waypoint",
  PICKUP: "Coleta",
  DELIVERY: "Entrega",
  CHECKPOINT: "Checkpoint",
  REST_POINT: "Descanso",
  FUEL_STOP: "Abastecimento",
  OTHER: "Outro",
};

const OPERATION_ROLE_LABELS: Record<RoutePointOperationRole, string> = {
  LOAD: "Carga",
  UNLOAD: "Descarga",
  LOAD_UNLOAD: "Carga/Descarga",
  CHECK_IN: "Check-in",
  CHECK_OUT: "Check-out",
  CUSTOMS: "Alfândega",
  FUEL: "Combustível",
  REST: "Descanso",
  MAINTENANCE: "Manutenção",
  PASS_THROUGH: "Passagem",
  OTHER: "Outro",
};

type RoutePointFormRow = {
  key: string;
  locationId: string;
  pointType: RoutePointType;
  operationRole: RoutePointOperationRole;
  distanceFromPreviousKm: string;
  durationFromPreviousMinutes: string;
  instructions: string;
  notes: string;
};

type RouteForm = {
  code: string;
  name: string;
  description: string;
  routeType: RouteType;
  operationType: OperationType;
  customerId: string;
  originLocationId: string;
  destinationLocationId: string;
  plannedDistanceKm: string;
  plannedDurationMinutes: string;
  requiresMopp: boolean;
  requiresRefrigeration: boolean;
  requiresTracking: boolean;
  requiresEscort: boolean;
  riskLevel: RouteRiskLevel;
  status: RouteStatus;
  notes: string;
  branchIds: string[];
  primaryBranchId: string;
  points: RoutePointFormRow[];
};

const emptyPoint = (): RoutePointFormRow => ({
  key: crypto.randomUUID(),
  locationId: "",
  pointType: "STOP",
  operationRole: "PASS_THROUGH",
  distanceFromPreviousKm: "",
  durationFromPreviousMinutes: "",
  instructions: "",
  notes: "",
});

const emptyForm: RouteForm = {
  code: "",
  name: "",
  description: "",
  routeType: "STANDARD",
  operationType: "TRANSFER",
  customerId: "",
  originLocationId: "",
  destinationLocationId: "",
  plannedDistanceKm: "",
  plannedDurationMinutes: "",
  requiresMopp: false,
  requiresRefrigeration: false,
  requiresTracking: false,
  requiresEscort: false,
  riskLevel: "LOW",
  status: "ACTIVE",
  notes: "",
  branchIds: [],
  primaryBranchId: "",
  points: [
    { ...emptyPoint(), pointType: "ORIGIN", operationRole: "LOAD" },
    { ...emptyPoint(), pointType: "DESTINATION", operationRole: "UNLOAD" },
  ],
};

function formatBranches(row: RouteRow) {
  const links = row.branches ?? [];
  if (links.length === 0) return "—";
  const label = (l: (typeof links)[number]) =>
    l.isPrimary ? `${l.branch.name}★` : l.branch.name;
  if (links.length <= 2) {
    return links.map(label).join(", ");
  }
  const [first, second, ...rest] = links;
  return `${label(first)}, ${label(second)} +${rest.length}`;
}

function primaryBranchLabel(row: RouteRow) {
  const primary = row.branches?.find((b) => b.isPrimary);
  if (!primary) return "Não definida";
  return primary.branch.name;
}

function customerLabel(row: RouteRow) {
  if (!row.customer) return "—";
  return row.customer.tradeName ?? row.customer.legalName;
}

function originDestinationLabel(row: RouteRow) {
  const origin = row.originLocation?.name ?? "—";
  const dest = row.destinationLocation?.name ?? "—";
  return `${origin} → ${dest}`;
}

function requirementsBadges(row: RouteRow) {
  const badges: { label: string; variant: "info" | "warning" | "success" }[] = [];
  if (row.requiresMopp) badges.push({ label: "MOPP", variant: "warning" });
  if (row.requiresRefrigeration) badges.push({ label: "Refrig.", variant: "info" });
  if (row.requiresTracking) badges.push({ label: "Rastream.", variant: "success" });
  if (row.requiresEscort) badges.push({ label: "Escolta", variant: "warning" });
  if (badges.length === 0) return <span className="text-nexum-text-muted">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((b) => (
        <NexumBadge key={b.label} variant={b.variant}>
          {b.label}
        </NexumBadge>
      ))}
    </div>
  );
}

function optionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function resequencePoints(points: RoutePointFormRow[]): RoutePointFormRow[] {
  return points.map((p, index) => {
    let pointType = p.pointType;
    if (index === 0) pointType = "ORIGIN";
    else if (index === points.length - 1) pointType = "DESTINATION";
    else if (pointType === "ORIGIN" || pointType === "DESTINATION") pointType = "STOP";
    return { ...p, pointType };
  });
}

function pointsToInput(points: RoutePointFormRow[]): RoutePointInput[] {
  return resequencePoints(points).map((p, index) => ({
    locationId: p.locationId,
    sequence: index + 1,
    pointType: p.pointType,
    operationRole: p.operationRole,
    distanceFromPreviousKm: optionalNumber(p.distanceFromPreviousKm),
    durationFromPreviousMinutes: optionalNumber(p.durationFromPreviousMinutes),
    instructions: p.instructions.trim() || undefined,
    notes: p.notes.trim() || undefined,
  }));
}

function validatePoints(points: RoutePointFormRow[]): string | null {
  if (points.length < 2) return "Informe ao menos 2 pontos na rota.";
  if (points.some((p) => !p.locationId)) return "Selecione o local de cada ponto.";
  const sequenced = resequencePoints(points);
  if (sequenced[0]?.pointType !== "ORIGIN") return "O primeiro ponto deve ser do tipo Origem.";
  if (sequenced[sequenced.length - 1]?.pointType !== "DESTINATION") {
    return "O último ponto deve ser do tipo Destino.";
  }
  return null;
}

function PointsEditor({
  points,
  onChange,
  locations,
}: {
  points: RoutePointFormRow[];
  onChange: (points: RoutePointFormRow[]) => void;
  locations: LocationRow[];
}) {
  function movePoint(index: number, direction: -1 | 1) {
    const next = [...points];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(resequencePoints(next));
  }

  function removePoint(index: number) {
    if (points.length <= 2) return;
    onChange(resequencePoints(points.filter((_, i) => i !== index)));
  }

  function updatePoint(index: number, patch: Partial<RoutePointFormRow>) {
    const next = points.map((p, i) => (i === index ? { ...p, ...patch } : p));
    onChange(resequencePoints(next));
  }

  return (
    <div className="space-y-3">
      {points.map((point, index) => (
        <div
          key={point.key}
          className="rounded-lg border border-nexum-border/40 p-3 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-nexum-accent">
              Ponto {index + 1} — {POINT_TYPE_LABELS[point.pointType]}
            </span>
            <div className="flex gap-1">
              <NexumButton
                size="sm"
                variant="ghost"
                disabled={index === 0}
                onClick={() => movePoint(index, -1)}
                aria-label="Mover para cima"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </NexumButton>
              <NexumButton
                size="sm"
                variant="ghost"
                disabled={index === points.length - 1}
                onClick={() => movePoint(index, 1)}
                aria-label="Mover para baixo"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </NexumButton>
              <NexumButton
                size="sm"
                variant="ghost"
                disabled={points.length <= 2}
                onClick={() => removePoint(index)}
                aria-label="Remover ponto"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </NexumButton>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <NexumFormField label="Local *" className="sm:col-span-2">
              <NexumSelect
                value={point.locationId}
                onChange={(e) => updatePoint(index, { locationId: e.target.value })}
              >
                <option value="">Selecione...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code}) — {loc.city}/{loc.state}
                  </option>
                ))}
              </NexumSelect>
            </NexumFormField>
            <NexumFormField label="Tipo">
              <NexumSelect
                value={point.pointType}
                disabled={index === 0 || index === points.length - 1}
                onChange={(e) =>
                  updatePoint(index, { pointType: e.target.value as RoutePointType })
                }
              >
                {Object.entries(POINT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NexumSelect>
            </NexumFormField>
            <NexumFormField label="Papel operacional">
              <NexumSelect
                value={point.operationRole}
                onChange={(e) =>
                  updatePoint(index, { operationRole: e.target.value as RoutePointOperationRole })
                }
              >
                {Object.entries(OPERATION_ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NexumSelect>
            </NexumFormField>
            {index > 0 && (
              <>
                <NexumFormField label="Distância anterior (km)">
                  <NexumInput
                    type="number"
                    value={point.distanceFromPreviousKm}
                    onChange={(e) =>
                      updatePoint(index, { distanceFromPreviousKm: e.target.value })
                    }
                  />
                </NexumFormField>
                <NexumFormField label="Duração anterior (min)">
                  <NexumInput
                    type="number"
                    value={point.durationFromPreviousMinutes}
                    onChange={(e) =>
                      updatePoint(index, { durationFromPreviousMinutes: e.target.value })
                    }
                  />
                </NexumFormField>
              </>
            )}
          </div>
        </div>
      ))}
      <NexumButton
        size="sm"
        variant="secondary"
        onClick={() => onChange(resequencePoints([...points.slice(0, -1), emptyPoint(), points[points.length - 1]!]))}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        Adicionar ponto
      </NexumButton>
    </div>
  );
}

function OrderedPointsList({ points }: { points: RoutePoint[] }) {
  const sorted = [...points].sort((a, b) => a.sequence - b.sequence);
  if (sorted.length === 0) {
    return <p className="text-nexum-text-muted">Nenhum ponto cadastrado.</p>;
  }
  return (
    <ol className="space-y-2">
      {sorted.map((point) => (
        <li
          key={point.id}
          className="flex items-start gap-3 rounded-lg border border-nexum-border/40 px-3 py-2"
        >
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-nexum-accent/10 text-xs font-semibold text-nexum-accent">
            {point.sequence}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-nexum-text">
              {point.location?.name ?? point.locationId}
              {point.location?.code && (
                <span className="ml-1 font-mono text-xs text-nexum-text-muted">
                  ({point.location.code})
                </span>
              )}
            </p>
            <p className="text-xs text-nexum-text-muted">
              {POINT_TYPE_LABELS[point.pointType]} · {OPERATION_ROLE_LABELS[point.operationRole]}
              {point.distanceFromPreviousKm != null && point.sequence > 1 && (
                <> · {String(point.distanceFromPreviousKm)} km</>
              )}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function RoutesLogisticsPageInner() {
  const { toast } = useNexumToast();
  const [rows, setRows] = useState<RouteRow[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [routeTypeFilter, setRouteTypeFilter] = useState("");
  const [operationTypeFilter, setOperationTypeFilter] = useState("");
  const [riskLevelFilter, setRiskLevelFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [requiresMoppFilter, setRequiresMoppFilter] = useState("");
  const [requiresRefrigerationFilter, setRequiresRefrigerationFilter] = useState("");
  const [requiresTrackingFilter, setRequiresTrackingFilter] = useState("");
  const [requiresEscortFilter, setRequiresEscortFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editRoute, setEditRoute] = useState<RouteRow | null>(null);
  const [form, setForm] = useState<RouteForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [detailRoute, setDetailRoute] = useState<RouteRow | null>(null);
  const [detailPoints, setDetailPoints] = useState<RoutePoint[]>([]);
  const [branchesDrawer, setBranchesDrawer] = useState<RouteRow | null>(null);
  const [branchLinks, setBranchLinks] = useState<RouteRow["branches"]>([]);
  const [addBranchId, setAddBranchId] = useState("");

  const [pointsDrawer, setPointsDrawer] = useState<RouteRow | null>(null);
  const [pointsForm, setPointsForm] = useState<RoutePointFormRow[]>([]);
  const [pointsSaving, setPointsSaving] = useState(false);

  const [confirmAction, setConfirmAction] = useState<
    { type: "disable" | "enable" | "delete"; route: RouteRow } | null
  >(null);

  const hasGlobalScope = useAnyPermission([...GLOBAL_ROUTE_SCOPE]);
  const canCreate = usePermission("routes.create") && hasGlobalScope;
  const canUpdate = usePermission("routes.update") && hasGlobalScope;
  const canDisable = usePermission("routes.disable") && hasGlobalScope;
  const canDelete = usePermission("routes.delete") && hasGlobalScope;
  const canAssignBranches = usePermission("routes.assign_branches") && hasGlobalScope;
  const canManagePoints = usePermission("routes.manage_points") && hasGlobalScope;

  const branchOptions = useMemo(
    () => branches.filter((b) => b.status === "ACTIVE"),
    [branches],
  );

  const load = useCallback(() => {
    setLoading(true);
    void listRoutes({
      search: search || undefined,
      status: (statusFilter as RouteStatus) || undefined,
      routeType: (routeTypeFilter as RouteType) || undefined,
      operationType: (operationTypeFilter as OperationType) || undefined,
      riskLevel: (riskLevelFilter as RouteRiskLevel) || undefined,
      branchId: branchFilter || undefined,
      customerId: customerFilter || undefined,
      originLocationId: originFilter || undefined,
      destinationLocationId: destinationFilter || undefined,
      requiresMopp: requiresMoppFilter || undefined,
      requiresRefrigeration: requiresRefrigerationFilter || undefined,
      requiresTracking: requiresTrackingFilter || undefined,
      requiresEscort: requiresEscortFilter || undefined,
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
      .catch((e) => setError(e instanceof ApiError ? e.message : "Erro ao carregar rotas."))
      .finally(() => setLoading(false));
  }, [
    search,
    statusFilter,
    routeTypeFilter,
    operationTypeFilter,
    riskLevelFilter,
    branchFilter,
    customerFilter,
    originFilter,
    destinationFilter,
    requiresMoppFilter,
    requiresRefrigerationFilter,
    requiresTrackingFilter,
    requiresEscortFilter,
    page,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    void fetchBranches({ perPage: 100, sortBy: "name", sortDirection: "asc" })
      .then(({ items }) => setBranches(items))
      .catch(() => undefined);
    void listCustomers({ perPage: 100, sortBy: "legalName", sortDirection: "asc" })
      .then(({ items }) => setCustomers(items))
      .catch(() => undefined);
    void listLocations({ perPage: 200, sortBy: "name", sortDirection: "asc" })
      .then(({ items }) => setLocations(items))
      .catch(() => undefined);
  }, []);

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setRouteTypeFilter("");
    setOperationTypeFilter("");
    setRiskLevelFilter("");
    setBranchFilter("");
    setCustomerFilter("");
    setOriginFilter("");
    setDestinationFilter("");
    setRequiresMoppFilter("");
    setRequiresRefrigerationFilter("");
    setRequiresTrackingFilter("");
    setRequiresEscortFilter("");
    setPage(1);
  }

  function openCreate() {
    setEditRoute(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(route: RouteRow) {
    setEditRoute(route);
    setForm({
      code: route.code,
      name: route.name,
      description: route.description ?? "",
      routeType: route.routeType,
      operationType: route.operationType,
      customerId: route.customerId ?? "",
      originLocationId: route.originLocationId ?? "",
      destinationLocationId: route.destinationLocationId ?? "",
      plannedDistanceKm: route.plannedDistanceKm?.toString() ?? "",
      plannedDurationMinutes: route.plannedDurationMinutes?.toString() ?? "",
      requiresMopp: route.requiresMopp,
      requiresRefrigeration: route.requiresRefrigeration,
      requiresTracking: route.requiresTracking,
      requiresEscort: route.requiresEscort,
      riskLevel: route.riskLevel,
      status: route.status,
      notes: route.notes ?? "",
      branchIds: [],
      primaryBranchId: "",
      points: [
        { ...emptyPoint(), pointType: "ORIGIN", operationRole: "LOAD" },
        { ...emptyPoint(), pointType: "DESTINATION", operationRole: "UNLOAD" },
      ],
    });
    setFormOpen(true);
  }

  async function openDetail(route: RouteRow) {
    setDetailRoute(route);
    setDetailPoints(route.points ?? []);
    try {
      const full = await getRoute(route.id);
      setDetailRoute(full);
      if (full.points?.length) {
        setDetailPoints(full.points);
      } else {
        const points = await listRoutePoints(route.id);
        setDetailPoints(points);
      }
    } catch {
      toast({ type: "error", title: "Erro ao carregar detalhes da rota." });
    }
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
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      routeType: form.routeType,
      operationType: form.operationType,
      customerId: form.customerId || undefined,
      originLocationId: form.originLocationId || undefined,
      destinationLocationId: form.destinationLocationId || undefined,
      plannedDistanceKm: optionalNumber(form.plannedDistanceKm),
      plannedDurationMinutes: optionalNumber(form.plannedDurationMinutes),
      requiresMopp: form.requiresMopp,
      requiresRefrigeration: form.requiresRefrigeration,
      requiresTracking: form.requiresTracking,
      requiresEscort: form.requiresEscort,
      riskLevel: form.riskLevel,
      status: form.status,
      notes: form.notes.trim() || undefined,
    };
  }

  async function handleSave() {
    if (!form.code.trim() && !editRoute) {
      toast({ type: "error", title: "Código interno é obrigatório." });
      return;
    }
    if (!form.name.trim()) {
      toast({ type: "error", title: "Nome da rota é obrigatório." });
      return;
    }
    if (!editRoute && form.branchIds.length === 0) {
      toast({ type: "error", title: "Selecione ao menos uma filial de atendimento." });
      return;
    }
    if (!editRoute) {
      const pointsError = validatePoints(form.points);
      if (pointsError) {
        toast({ type: "error", title: pointsError });
        return;
      }
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (editRoute) {
        await updateRoute(editRoute.id, payload);
        toast({ type: "success", title: "Rota atualizada." });
      } else {
        await createRoute({
          ...payload,
          code: form.code.trim(),
          branchIds: form.branchIds,
          primaryBranchId: form.primaryBranchId || form.branchIds[0],
          points: pointsToInput(form.points),
        });
        toast({ type: "success", title: "Rota criada." });
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
    const { type, route } = confirmAction;
    try {
      if (type === "disable") await disableRoute(route.id);
      if (type === "enable") await enableRoute(route.id);
      if (type === "delete") await deleteRoute(route.id);
      toast({ type: "success", title: "Operação concluída." });
      load();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro na operação." });
    }
    setConfirmAction(null);
  }

  async function openBranchesDrawer(route: RouteRow) {
    setBranchesDrawer(route);
    try {
      const links = await listRouteBranches(route.id);
      setBranchLinks(links);
      setAddBranchId("");
    } catch {
      toast({ type: "error", title: "Erro ao carregar filiais da rota." });
      setBranchesDrawer(null);
    }
  }

  async function handleAddBranch() {
    if (!branchesDrawer || !addBranchId) return;
    try {
      const links = await assignRouteBranches(branchesDrawer.id, { branchIds: [addBranchId] });
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
      const links = await setRoutePrimaryBranch(branchesDrawer.id, branchId);
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
      const links = await removeRouteBranch(branchesDrawer.id, branchId);
      setBranchLinks(links);
      toast({ type: "success", title: "Filial removida." });
      load();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro ao remover filial." });
    }
  }

  async function openPointsDrawer(route: RouteRow) {
    setPointsDrawer(route);
    try {
      const points = await listRoutePoints(route.id);
      setPointsForm(
        points.length >= 2
          ? points
              .sort((a, b) => a.sequence - b.sequence)
              .map((p) => ({
                key: p.id,
                locationId: p.locationId,
                pointType: p.pointType,
                operationRole: p.operationRole,
                distanceFromPreviousKm: p.distanceFromPreviousKm?.toString() ?? "",
                durationFromPreviousMinutes: p.durationFromPreviousMinutes?.toString() ?? "",
                instructions: p.instructions ?? "",
                notes: p.notes ?? "",
              }))
          : emptyForm.points,
      );
    } catch {
      toast({ type: "error", title: "Erro ao carregar pontos da rota." });
      setPointsDrawer(null);
    }
  }

  async function handleSavePoints() {
    if (!pointsDrawer) return;
    const pointsError = validatePoints(pointsForm);
    if (pointsError) {
      toast({ type: "error", title: pointsError });
      return;
    }
    setPointsSaving(true);
    try {
      await replaceRoutePoints(pointsDrawer.id, { points: pointsToInput(pointsForm) });
      toast({ type: "success", title: "Pontos da rota atualizados." });
      setPointsDrawer(null);
      load();
    } catch (e) {
      toast({ type: "error", title: e instanceof ApiError ? e.message : "Erro ao salvar pontos." });
    } finally {
      setPointsSaving(false);
    }
  }

  const booleanFilterSelect = (
    value: string,
    onChange: (v: string) => void,
    label: string,
    className = "w-32",
  ) => (
    <NexumSelect
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        setPage(1);
      }}
      className={className}
      title={label}
    >
      <option value="">{label}</option>
      <option value="true">Sim</option>
      <option value="false">Não</option>
    </NexumSelect>
  );

  const formSections = (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Identificação</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Código interno *">
            <NexumInput
              value={form.code}
              disabled={!!editRoute}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </NexumFormField>
          <NexumFormField label="Nome da rota *">
            <NexumInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Status">
            <NexumSelect
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as RouteStatus })}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="Descrição" className="sm:col-span-2">
            <NexumTextarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Planejamento</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NexumFormField label="Tipo de rota *">
            <NexumSelect
              value={form.routeType}
              onChange={(e) => setForm({ ...form, routeType: e.target.value as RouteType })}
            >
              {Object.entries(ROUTE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="Tipo de operação *">
            <NexumSelect
              value={form.operationType}
              onChange={(e) =>
                setForm({ ...form, operationType: e.target.value as OperationType })
              }
            >
              {Object.entries(OPERATION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="Cliente">
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
          <NexumFormField label="Nível de risco">
            <NexumSelect
              value={form.riskLevel}
              onChange={(e) =>
                setForm({ ...form, riskLevel: e.target.value as RouteRiskLevel })
              }
            >
              {Object.entries(RISK_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="Origem (referência)">
            <NexumSelect
              value={form.originLocationId}
              onChange={(e) => setForm({ ...form, originLocationId: e.target.value })}
            >
              <option value="">—</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="Destino (referência)">
            <NexumSelect
              value={form.destinationLocationId}
              onChange={(e) => setForm({ ...form, destinationLocationId: e.target.value })}
            >
              <option value="">—</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </NexumSelect>
          </NexumFormField>
          <NexumFormField label="Distância planejada (km)">
            <NexumInput
              type="number"
              value={form.plannedDistanceKm}
              onChange={(e) => setForm({ ...form, plannedDistanceKm: e.target.value })}
            />
          </NexumFormField>
          <NexumFormField label="Duração planejada (min)">
            <NexumInput
              type="number"
              value={form.plannedDurationMinutes}
              onChange={(e) => setForm({ ...form, plannedDurationMinutes: e.target.value })}
            />
          </NexumFormField>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-nexum-accent">Requisitos</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <NexumCheckbox
            label="Exige MOPP"
            checked={form.requiresMopp}
            onChange={(e) => setForm({ ...form, requiresMopp: e.target.checked })}
          />
          <NexumCheckbox
            label="Exige refrigeração"
            checked={form.requiresRefrigeration}
            onChange={(e) => setForm({ ...form, requiresRefrigeration: e.target.checked })}
          />
          <NexumCheckbox
            label="Exige rastreamento"
            checked={form.requiresTracking}
            onChange={(e) => setForm({ ...form, requiresTracking: e.target.checked })}
          />
          <NexumCheckbox
            label="Exige escolta"
            checked={form.requiresEscort}
            onChange={(e) => setForm({ ...form, requiresEscort: e.target.checked })}
          />
        </div>
      </section>

      {!editRoute && (
        <section>
          <h3 className="mb-1 text-sm font-semibold text-nexum-accent">Filiais</h3>
          <p className="mb-3 text-xs text-nexum-text-muted">
            As filiais definem quais unidades operacionais podem visualizar e operar esta rota.
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

      {!editRoute && (
        <section>
          <h3 className="mb-1 text-sm font-semibold text-nexum-accent">Pontos da rota</h3>
          <p className="mb-3 text-xs text-nexum-text-muted">
            Mínimo 2 pontos. O primeiro deve ser Origem e o último Destino.
          </p>
          <PointsEditor
            points={form.points}
            onChange={(points) => setForm({ ...form, points })}
            locations={locations}
          />
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
    <PermissionGate permission={["routes.read", "logistics.read"]} mode="any">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          breadcrumb={[{ label: "Logística", href: "/app" }, { label: "Rotas" }]}
          title="Rotas"
          description="Cadastre e gerencie rotas operacionais, sequência de pontos, requisitos de transporte e filiais atendidas."
          actions={
            canCreate ? (
              <NexumButton onClick={openCreate}>
                <Plus className="mr-1.5 h-4 w-4" />
                Nova rota
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
          emptyTitle="Nenhuma rota cadastrada ainda."
          emptyDescription="Cadastre a primeira rota para iniciar o planejamento logístico."
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
                  placeholder="Buscar código, nome, descrição..."
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
                    value={routeTypeFilter}
                    onChange={(e) => {
                      setRouteTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-36"
                  >
                    <option value="">Tipo rota</option>
                    {Object.entries(ROUTE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NexumSelect>
                  <NexumSelect
                    value={operationTypeFilter}
                    onChange={(e) => {
                      setOperationTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-36"
                  >
                    <option value="">Operação</option>
                    {Object.entries(OPERATION_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NexumSelect>
                  <NexumSelect
                    value={riskLevelFilter}
                    onChange={(e) => {
                      setRiskLevelFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-32"
                  >
                    <option value="">Risco</option>
                    {Object.entries(RISK_LABELS).map(([value, label]) => (
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
                    className="w-40"
                  >
                    <option value="">Cliente</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.tradeName ?? c.legalName}
                      </option>
                    ))}
                  </NexumSelect>
                  <NexumSelect
                    value={originFilter}
                    onChange={(e) => {
                      setOriginFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-40"
                  >
                    <option value="">Origem</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </NexumSelect>
                  <NexumSelect
                    value={destinationFilter}
                    onChange={(e) => {
                      setDestinationFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-40"
                  >
                    <option value="">Destino</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </NexumSelect>
                  {booleanFilterSelect(requiresMoppFilter, setRequiresMoppFilter, "MOPP")}
                  {booleanFilterSelect(
                    requiresRefrigerationFilter,
                    setRequiresRefrigerationFilter,
                    "Refrig.",
                  )}
                  {booleanFilterSelect(
                    requiresTrackingFilter,
                    setRequiresTrackingFilter,
                    "Rastream.",
                  )}
                  {booleanFilterSelect(requiresEscortFilter, setRequiresEscortFilter, "Escolta")}
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
              render: (r) => <NexumTableCode value={r.code} />,
            },
            {
              key: "route",
              header: "Rota",
              render: (r) => (
                <div className="max-w-[180px]">
                  <p className="truncate font-medium leading-tight">{r.name}</p>
                  <p className="truncate text-[11px] leading-tight text-nexum-text-muted">
                    {ROUTE_TYPE_LABELS[r.routeType]} · {OPERATION_TYPE_LABELS[r.operationType]}
                  </p>
                </div>
              ),
            },
            {
              key: "originDest",
              header: "Origem→Destino",
              render: (r) => (
                <NexumTableText maxWidth="180px" title={originDestinationLabel(r)}>
                  {originDestinationLabel(r)}
                </NexumTableText>
              ),
            },
            {
              key: "customer",
              header: "Cliente",
              render: (r) => (
                <NexumTableText maxWidth="120px">{customerLabel(r)}</NexumTableText>
              ),
            },
            {
              key: "branches",
              header: "Filiais",
              render: (r) => (
                <NexumTableText maxWidth="130px" title={formatBranches(r)}>
                  {formatBranches(r)}
                </NexumTableText>
              ),
            },
            {
              key: "risk",
              header: "Risco",
              render: (r) => (
                <NexumBadge variant={RISK_VARIANT[r.riskLevel]}>
                  {RISK_LABELS[r.riskLevel]}
                </NexumBadge>
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
              key: "actions",
              header: "Ações",
              align: "right",
              render: (r) => {
                const items: NexumDropdownItem[] = [
                  {
                    key: "view",
                    label: "Visualizar",
                    icon: <Eye className="h-3.5 w-3.5" />,
                    onSelect: () => void openDetail(r),
                  },
                  ...(canUpdate
                    ? [{ key: "edit", label: "Editar", onSelect: () => openEdit(r) }]
                    : []),
                  ...(canAssignBranches
                    ? [
                        {
                          key: "branches",
                          label: "Filiais",
                          icon: <Building2 className="h-3.5 w-3.5" />,
                          onSelect: () => void openBranchesDrawer(r),
                        },
                      ]
                    : []),
                  ...(canManagePoints
                    ? [
                        {
                          key: "points",
                          label: "Pontos",
                          icon: <MapPin className="h-3.5 w-3.5" />,
                          onSelect: () => void openPointsDrawer(r),
                        },
                      ]
                    : []),
                  ...(canDisable && r.status !== "DISABLED"
                    ? [
                        {
                          key: "disable",
                          label: "Desativar",
                          onSelect: () => setConfirmAction({ type: "disable", route: r }),
                        },
                      ]
                    : []),
                  ...(canDisable && r.status === "DISABLED"
                    ? [
                        {
                          key: "enable",
                          label: "Reativar",
                          onSelect: () => setConfirmAction({ type: "enable", route: r }),
                        },
                      ]
                    : []),
                  ...(canDelete
                    ? [
                        {
                          key: "delete",
                          label: "Excluir",
                          danger: true,
                          onSelect: () => setConfirmAction({ type: "delete", route: r }),
                        },
                      ]
                    : []),
                ];
                return <NexumTableRowActions items={items} />;
              },
            },
          ]}
        />

        <NexumDrawer
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title={editRoute ? "Editar rota" : "Nova rota"}
          width="lg"
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
          open={!!detailRoute}
          onClose={() => {
            setDetailRoute(null);
            setDetailPoints([]);
          }}
          title={detailRoute ? `${detailRoute.code} — ${detailRoute.name}` : "Rota"}
        >
          {detailRoute && (
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Identificação</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">Código</dt>
                    <dd className="font-mono">{detailRoute.code}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Status</dt>
                    <dd>{STATUS_LABELS[detailRoute.status]}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-nexum-text-muted">Nome</dt>
                    <dd>{detailRoute.name}</dd>
                  </div>
                  {detailRoute.description && (
                    <div className="sm:col-span-2">
                      <dt className="text-nexum-text-muted">Descrição</dt>
                      <dd>{detailRoute.description}</dd>
                    </div>
                  )}
                </dl>
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Planejamento</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">Tipo de rota</dt>
                    <dd>{ROUTE_TYPE_LABELS[detailRoute.routeType]}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Operação</dt>
                    <dd>{OPERATION_TYPE_LABELS[detailRoute.operationType]}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Cliente</dt>
                    <dd>{customerLabel(detailRoute)}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Risco</dt>
                    <dd>{RISK_LABELS[detailRoute.riskLevel]}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Origem</dt>
                    <dd>{detailRoute.originLocation?.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Destino</dt>
                    <dd>{detailRoute.destinationLocation?.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Distância planejada</dt>
                    <dd>
                      {detailRoute.plannedDistanceKm != null
                        ? `${detailRoute.plannedDistanceKm} km`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Duração planejada</dt>
                    <dd>
                      {detailRoute.plannedDurationMinutes != null
                        ? `${detailRoute.plannedDurationMinutes} min`
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Requisitos</h3>
                <div className="flex flex-wrap gap-2">{requirementsBadges(detailRoute)}</div>
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Filiais vinculadas</h3>
                <ul className="space-y-2">
                  {(detailRoute.branches ?? []).length === 0 && (
                    <li className="text-nexum-text-muted">Nenhuma filial vinculada.</li>
                  )}
                  {(detailRoute.branches ?? []).map((link) => (
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

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Pontos da rota</h3>
                <OrderedPointsList points={detailPoints} />
              </section>

              {detailRoute.notes && (
                <section>
                  <h3 className="mb-2 font-semibold text-nexum-accent">Observações</h3>
                  <p className="whitespace-pre-wrap text-nexum-text">{detailRoute.notes}</p>
                </section>
              )}

              <section>
                <h3 className="mb-2 font-semibold text-nexum-accent">Metadados</h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-nexum-text-muted">Criado em</dt>
                    <dd>{new Date(detailRoute.createdAt).toLocaleString("pt-BR")}</dd>
                  </div>
                  <div>
                    <dt className="text-nexum-text-muted">Atualizado em</dt>
                    <dd>{new Date(detailRoute.updatedAt).toLocaleString("pt-BR")}</dd>
                  </div>
                </dl>
              </section>
            </div>
          )}
        </NexumDrawer>

        <NexumDrawer
          open={!!branchesDrawer}
          onClose={() => setBranchesDrawer(null)}
          title={`Gerenciar filiais — ${branchesDrawer?.code ?? ""}`}
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
            {(branchLinks ?? []).map((link) => (
              <li
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-nexum-border/40 px-3 py-2"
              >
                <span>
                  {link.branch.name}{" "}
                  <span className="font-mono text-xs text-nexum-text-muted">({link.branch.code})</span>
                </span>
                <div className="flex gap-1">
                  {link.isPrimary ? (
                    <NexumBadge variant="success">Principal</NexumBadge>
                  ) : (
                    canAssignBranches && (
                      <NexumButton size="sm" variant="ghost" onClick={() => void handleSetPrimary(link.branchId)}>
                        Definir principal
                      </NexumButton>
                    )
                  )}
                  {canAssignBranches && (
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

        <NexumDrawer
          open={!!pointsDrawer}
          onClose={() => setPointsDrawer(null)}
          title={`Gerenciar pontos — ${pointsDrawer?.code ?? ""}`}
          width="lg"
        >
          <p className="mb-4 text-xs text-nexum-text-muted">
            Altere a sequência de pontos da rota. Mínimo 2 pontos; primeiro Origem, último Destino.
          </p>
          <PointsEditor
            points={pointsForm}
            onChange={setPointsForm}
            locations={locations}
          />
          <div className="mt-6 flex justify-end gap-2 border-t border-nexum-border/40 pt-4">
            <NexumButton variant="secondary" onClick={() => setPointsDrawer(null)}>
              Cancelar
            </NexumButton>
            <NexumButton loading={pointsSaving} onClick={() => void handleSavePoints()}>
              Salvar pontos
            </NexumButton>
          </div>
        </NexumDrawer>

        <NexumConfirmModal
          open={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => void handleConfirmAction()}
          title={
            confirmAction?.type === "delete"
              ? "Excluir rota"
              : confirmAction?.type === "enable"
                ? "Reativar rota"
                : "Desativar rota"
          }
          description={`Confirma a operação para ${confirmAction?.route.code ?? ""}?`}
          confirmLabel="Confirmar"
          danger={confirmAction?.type === "delete"}
        />
      </div>
    </PermissionGate>
  );
}

export function RoutesLogisticsPage() {
  return (
    <NexumToastProvider>
      <RoutesLogisticsPageInner />
    </NexumToastProvider>
  );
}
