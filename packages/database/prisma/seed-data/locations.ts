export type LocationSeedDef = {
  code: string;
  name: string;
  locationType:
    | "CUSTOMER_SITE"
    | "BRANCH_BASE"
    | "PORT"
    | "TERMINAL"
    | "WAREHOUSE"
    | "DISTRIBUTION_CENTER"
    | "DEPOT"
    | "YARD"
    | "CROSS_DOCKING"
    | "BORDER_CROSSING"
    | "FUEL_STATION"
    | "MAINTENANCE_SITE"
    | "SUPPLIER_SITE"
    | "PARKING_AREA"
    | "OTHER";
  customerCode?: string;
  addressLine1: string;
  city: string;
  state: string;
  country?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  email?: string;
  phone?: string;
  branchCodes: string[];
  primaryBranchCode: string;
};

/** Locais demo do tenant nexum-demo — dados fictícios para desenvolvimento. */
export const LOCATION_DEFINITIONS: LocationSeedDef[] = [
  {
    code: "PORTO_SANTOS",
    name: "Porto de Santos — Terminal Demo",
    locationType: "PORT",
    addressLine1: "Av. Portuária s/n — Área Portuária",
    city: "Santos",
    state: "SP",
    latitude: -23.9675,
    longitude: -46.328,
    branchCodes: ["SANTOS", "MATRIZ"],
    primaryBranchCode: "SANTOS",
  },
  {
    code: "CD_VALE_CUBATAO",
    name: "CD Vale Cubatão Demo",
    locationType: "CUSTOMER_SITE",
    customerCode: "VALE",
    addressLine1: "Rod. Anchieta, km 45 — Distrito Industrial",
    city: "Cubatão",
    state: "SP",
    latitude: -23.895,
    longitude: -46.425,
    contactName: "Recebimento Vale Cubatão",
    email: "recebimento.vale.cubatao@demo.nexum.local",
    branchCodes: ["SANTOS", "PARANAGUA"],
    primaryBranchCode: "SANTOS",
  },
  {
    code: "FABRICA_SUZANO_LIMEIRA",
    name: "Fábrica Suzano Limeira Demo",
    locationType: "CUSTOMER_SITE",
    customerCode: "SUZANO",
    addressLine1: "Rod. Limeira-Mogi, km 12",
    city: "Limeira",
    state: "SP",
    branchCodes: ["MATRIZ", "PARANAGUA"],
    primaryBranchCode: "MATRIZ",
  },
  {
    code: "TERMINAL_PARANAGUA",
    name: "Terminal Portuário Paranaguá Demo",
    locationType: "TERMINAL",
    addressLine1: "Porto de Paranaguá — Píer 201",
    city: "Paranaguá",
    state: "PR",
    latitude: -25.516,
    longitude: -48.522,
    branchCodes: ["PARANAGUA"],
    primaryBranchCode: "PARANAGUA",
  },
  {
    code: "BASE_BOTUCATU",
    name: "Base Operacional Botucatu Demo",
    locationType: "BRANCH_BASE",
    addressLine1: "Rod. Assis Chateaubriand, km 8",
    city: "Botucatu",
    state: "SP",
    branchCodes: ["BOTUCATU"],
    primaryBranchCode: "BOTUCATU",
  },
  {
    code: "PATIO_RONDONOPOLIS",
    name: "Pátio Rondonópolis Demo",
    locationType: "YARD",
    addressLine1: "BR-163, km 210 — Pátio de apoio",
    city: "Rondonópolis",
    state: "MT",
    branchCodes: ["RONDONOPOLIS"],
    primaryBranchCode: "RONDONOPOLIS",
  },
];
