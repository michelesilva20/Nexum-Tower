export type VehicleSeedDef = {
  code: string;
  plate: string;
  fleetNumber?: string;
  vehicleType:
    | "TRUCK"
    | "TRACTOR_TRUCK"
    | "TRAILER"
    | "SEMI_TRAILER"
    | "VAN"
    | "PICKUP"
    | "CAR"
    | "MOTORCYCLE"
    | "BUS"
    | "EQUIPMENT"
    | "OTHER";
  vehicleCategory:
    | "CARGO"
    | "PASSENGER"
    | "SUPPORT"
    | "MAINTENANCE"
    | "ADMINISTRATIVE"
    | "EQUIPMENT"
    | "OTHER";
  ownershipType: "OWNED" | "LEASED" | "RENTED" | "THIRD_PARTY" | "AGGREGATED" | "CUSTOMER_OWNED" | "OTHER";
  brand: string;
  model: string;
  version?: string;
  manufactureYear?: number;
  modelYear?: number;
  fuelType?: "DIESEL" | "GASOLINE" | "ETHANOL" | "FLEX" | "CNG" | "LNG" | "ELECTRIC" | "HYBRID" | "OTHER";
  bodyType?:
    | "DRY_VAN"
    | "REFRIGERATED"
    | "FLATBED"
    | "TANK"
    | "BULK"
    | "CONTAINER_CARRIER"
    | "DUMP"
    | "SIDER"
    | "CURTAIN_SIDER"
    | "CAR_CARRIER"
    | "CHASSIS"
    | "NONE"
    | "OTHER";
  licensePlateState?: string;
  licensingExpiresAt?: string;
  insuranceExpiresAt?: string;
  inspectionExpiresAt?: string;
  tachographExpiresAt?: string;
  anttExpiresAt?: string;
  branchCodes: string[];
  primaryBranchCode: string;
};

/** Veículos demo do tenant nexum-demo — dados fictícios para desenvolvimento. */
export const VEHICLE_DEFINITIONS: VehicleSeedDef[] = [
  {
    code: "VEI_CAVALO_SANTOS_001",
    plate: "ABC1D23",
    fleetNumber: "FROTA-S-001",
    vehicleType: "TRACTOR_TRUCK",
    vehicleCategory: "CARGO",
    ownershipType: "OWNED",
    brand: "Volkswagen",
    model: "29.520",
    version: "Constellation",
    manufactureYear: 2022,
    modelYear: 2023,
    fuelType: "DIESEL",
    bodyType: "NONE",
    licensePlateState: "SP",
    licensingExpiresAt: "2027-08-15",
    insuranceExpiresAt: "2026-12-01",
    tachographExpiresAt: "2027-02-28",
    anttExpiresAt: "2028-01-10",
    branchCodes: ["SANTOS", "MATRIZ"],
    primaryBranchCode: "SANTOS",
  },
  {
    code: "VEI_CARRETA_SANTOS_001",
    plate: "XYZ9A88",
    fleetNumber: "FROTA-S-002",
    vehicleType: "SEMI_TRAILER",
    vehicleCategory: "CARGO",
    ownershipType: "OWNED",
    brand: "Randon",
    model: "Graneleira",
    version: "30 m³",
    fuelType: "OTHER",
    bodyType: "BULK",
    licensePlateState: "SP",
    licensingExpiresAt: "2027-05-20",
    insuranceExpiresAt: "2026-11-15",
    branchCodes: ["SANTOS", "MATRIZ"],
    primaryBranchCode: "SANTOS",
  },
  {
    code: "VEI_TRUCK_BOTUCATU_001",
    plate: "DEF4G56",
    fleetNumber: "FROTA-B-001",
    vehicleType: "TRUCK",
    vehicleCategory: "CARGO",
    ownershipType: "OWNED",
    brand: "Mercedes-Benz",
    model: "Accelo 1016",
    manufactureYear: 2021,
    modelYear: 2021,
    fuelType: "DIESEL",
    bodyType: "DRY_VAN",
    licensePlateState: "SP",
    licensingExpiresAt: "2026-09-30",
    insuranceExpiresAt: "2026-08-01",
    branchCodes: ["BOTUCATU"],
    primaryBranchCode: "BOTUCATU",
  },
  {
    code: "VEI_VAN_MATRIZ_001",
    plate: "GHI7J89",
    fleetNumber: "FROTA-M-001",
    vehicleType: "VAN",
    vehicleCategory: "SUPPORT",
    ownershipType: "OWNED",
    brand: "Fiat",
    model: "Ducato",
    version: "Cargo",
    fuelType: "DIESEL",
    bodyType: "DRY_VAN",
    licensePlateState: "SP",
    licensingExpiresAt: "2028-03-10",
    insuranceExpiresAt: "2027-01-15",
    branchCodes: ["MATRIZ"],
    primaryBranchCode: "MATRIZ",
  },
  {
    code: "VEI_CARRETA_PARANAGUA_001",
    plate: "JKL0M12",
    fleetNumber: "FROTA-P-001",
    vehicleType: "SEMI_TRAILER",
    vehicleCategory: "CARGO",
    ownershipType: "OWNED",
    brand: "Librelato",
    model: "Sider",
    bodyType: "SIDER",
    licensePlateState: "PR",
    licensingExpiresAt: "2027-11-01",
    insuranceExpiresAt: "2026-10-20",
    branchCodes: ["PARANAGUA"],
    primaryBranchCode: "PARANAGUA",
  },
  {
    code: "VEI_CAVALO_RONDONOPOLIS_001",
    plate: "MNO3P45",
    fleetNumber: "FROTA-R-001",
    vehicleType: "TRACTOR_TRUCK",
    vehicleCategory: "CARGO",
    ownershipType: "AGGREGATED",
    brand: "Scania",
    model: "R450",
    fuelType: "DIESEL",
    bodyType: "NONE",
    licensePlateState: "MT",
    licensingExpiresAt: "2027-07-22",
    insuranceExpiresAt: "2026-12-30",
    anttExpiresAt: "2027-06-01",
    branchCodes: ["RONDONOPOLIS"],
    primaryBranchCode: "RONDONOPOLIS",
  },
];
