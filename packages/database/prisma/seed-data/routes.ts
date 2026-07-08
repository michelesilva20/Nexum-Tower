export type RoutePointSeedDef = {
  locationCode: string;
  sequence: number;
  pointType: "ORIGIN" | "DESTINATION" | "STOP" | "WAYPOINT" | "PICKUP" | "DELIVERY" | "CHECKPOINT" | "REST_POINT" | "FUEL_STOP" | "OTHER";
  operationRole: "LOAD" | "UNLOAD" | "LOAD_UNLOAD" | "CHECK_IN" | "CHECK_OUT" | "CUSTOMS" | "FUEL" | "REST" | "MAINTENANCE" | "PASS_THROUGH" | "OTHER";
  distanceFromPreviousKm?: number;
  durationFromPreviousMinutes?: number;
};

export type RouteSeedDef = {
  code: string;
  name: string;
  description?: string;
  routeType: "STANDARD" | "DEDICATED" | "SPOT" | "MILK_RUN" | "ROUND_TRIP" | "TRANSFER" | "DISTRIBUTION" | "COLLECTION" | "LINE_HAUL" | "PORT" | "CUSTOMER" | "OTHER";
  operationType: "INBOUND" | "OUTBOUND" | "TRANSFER" | "DISTRIBUTION" | "COLLECTION" | "RETURN" | "EXPORT" | "IMPORT" | "OTHER";
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  customerCode?: string;
  requiresMopp?: boolean;
  requiresRefrigeration?: boolean;
  requiresTracking?: boolean;
  requiresEscort?: boolean;
  plannedDistanceKm?: number;
  plannedDurationMinutes?: number;
  branchCodes: string[];
  primaryBranchCode: string;
  points: RoutePointSeedDef[];
};

/** Rotas demo do tenant nexum-demo — dados fictícios para desenvolvimento. */
export const ROUTE_DEFINITIONS: RouteSeedDef[] = [
  {
    code: "ROT_SANTOS_CUBATAO",
    name: "Santos ↔ Cubatão (Vale)",
    description: "Rota round-trip porto — CD Vale Cubatão — porto",
    routeType: "ROUND_TRIP",
    operationType: "TRANSFER",
    riskLevel: "MEDIUM",
    customerCode: "VALE",
    requiresMopp: true,
    plannedDistanceKm: 85,
    plannedDurationMinutes: 180,
    branchCodes: ["SANTOS", "MATRIZ"],
    primaryBranchCode: "SANTOS",
    points: [
      { locationCode: "PORTO_SANTOS", sequence: 1, pointType: "ORIGIN", operationRole: "LOAD" },
      { locationCode: "CD_VALE_CUBATAO", sequence: 2, pointType: "STOP", operationRole: "LOAD_UNLOAD", distanceFromPreviousKm: 42, durationFromPreviousMinutes: 60 },
      { locationCode: "PORTO_SANTOS", sequence: 3, pointType: "DESTINATION", operationRole: "UNLOAD", distanceFromPreviousKm: 43, durationFromPreviousMinutes: 65 },
    ],
  },
  {
    code: "ROT_PARANAGUA_TERMINAL",
    name: "Paranaguá Terminal — Distribuição",
    description: "Terminal portuário para fábrica Suzano",
    routeType: "DISTRIBUTION",
    operationType: "OUTBOUND",
    riskLevel: "LOW",
    branchCodes: ["PARANAGUA"],
    primaryBranchCode: "PARANAGUA",
    points: [
      { locationCode: "TERMINAL_PARANAGUA", sequence: 1, pointType: "ORIGIN", operationRole: "LOAD" },
      { locationCode: "FABRICA_SUZANO_LIMEIRA", sequence: 2, pointType: "DELIVERY", operationRole: "UNLOAD", distanceFromPreviousKm: 320, durationFromPreviousMinutes: 300 },
    ],
  },
  {
    code: "ROT_BOTUCATU_BASE",
    name: "Base Botucatu — Apoio local",
    description: "Rota local de apoio na base operacional",
    routeType: "STANDARD",
    operationType: "TRANSFER",
    riskLevel: "LOW",
    branchCodes: ["BOTUCATU"],
    primaryBranchCode: "BOTUCATU",
    points: [
      { locationCode: "BASE_BOTUCATU", sequence: 1, pointType: "ORIGIN", operationRole: "CHECK_IN" },
      { locationCode: "BASE_BOTUCATU", sequence: 2, pointType: "DESTINATION", operationRole: "CHECK_OUT" },
    ],
  },
  {
    code: "ROT_MATRIZ_SANTOS",
    name: "Matriz → Santos (Line Haul)",
    description: "Trecho porto Santos para CD Cubatão via matriz",
    routeType: "LINE_HAUL",
    operationType: "TRANSFER",
    riskLevel: "MEDIUM",
    branchCodes: ["MATRIZ", "SANTOS"],
    primaryBranchCode: "MATRIZ",
    points: [
      { locationCode: "PORTO_SANTOS", sequence: 1, pointType: "ORIGIN", operationRole: "LOAD" },
      { locationCode: "CD_VALE_CUBATAO", sequence: 2, pointType: "DESTINATION", operationRole: "UNLOAD", distanceFromPreviousKm: 42, durationFromPreviousMinutes: 55 },
    ],
  },
  {
    code: "ROT_RONDONOPOLIS_PATIO",
    name: "Pátio Rondonópolis — Transferência",
    description: "Operação de pátio e transferência regional",
    routeType: "TRANSFER",
    operationType: "TRANSFER",
    riskLevel: "LOW",
    branchCodes: ["RONDONOPOLIS"],
    primaryBranchCode: "RONDONOPOLIS",
    points: [
      { locationCode: "PATIO_RONDONOPOLIS", sequence: 1, pointType: "ORIGIN", operationRole: "LOAD" },
      { locationCode: "PATIO_RONDONOPOLIS", sequence: 2, pointType: "DESTINATION", operationRole: "UNLOAD" },
    ],
  },
];
