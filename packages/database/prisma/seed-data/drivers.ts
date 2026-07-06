export type DriverSeedDef = {
  code: string;
  fullName: string;
  preferredName?: string;
  driverType: "INTERNAL" | "THIRD_PARTY" | "OWNER_OPERATOR" | "AGGREGATED" | "TEMPORARY" | "OTHER";
  employmentType: "EMPLOYEE" | "CONTRACTOR" | "FREELANCER" | "AGGREGATED" | "OUTSOURCED" | "OTHER";
  documentType?: "CPF" | "RG" | "CNH" | "PASSPORT" | "RNE" | "OTHER";
  documentNumber?: string;
  licenseNumber?: string;
  licenseCategory?: "A" | "B" | "C" | "D" | "E" | "AB" | "AC" | "AD" | "AE" | "OTHER";
  licenseState?: string;
  licenseExpiresAt?: string;
  moppCertified?: boolean;
  moppExpiresAt?: string;
  city?: string;
  state?: string;
  phone?: string;
  branchCodes: string[];
  primaryBranchCode: string;
};

/** Motoristas demo do tenant nexum-demo — dados fictícios para desenvolvimento. */
export const DRIVER_DEFINITIONS: DriverSeedDef[] = [
  {
    code: "MOT_JOAO_SANTOS",
    fullName: "João Carlos Santos",
    preferredName: "João",
    driverType: "INTERNAL",
    employmentType: "EMPLOYEE",
    documentType: "CPF",
    documentNumber: "12345678901",
    licenseNumber: "12345678900",
    licenseCategory: "E",
    licenseState: "SP",
    licenseExpiresAt: "2028-06-15",
    moppCertified: true,
    moppExpiresAt: "2027-03-20",
    city: "Santos",
    state: "SP",
    phone: "13999990001",
    branchCodes: ["SANTOS", "MATRIZ"],
    primaryBranchCode: "SANTOS",
  },
  {
    code: "MOT_CARLOS_BOTUCATU",
    fullName: "Carlos Eduardo Lima",
    preferredName: "Carlos",
    driverType: "INTERNAL",
    employmentType: "EMPLOYEE",
    documentType: "CPF",
    documentNumber: "23456789012",
    licenseNumber: "23456789011",
    licenseCategory: "E",
    licenseState: "SP",
    licenseExpiresAt: "2029-01-10",
    city: "Botucatu",
    state: "SP",
    phone: "14999990002",
    branchCodes: ["BOTUCATU"],
    primaryBranchCode: "BOTUCATU",
  },
  {
    code: "MOT_MARCOS_PARANAGUA",
    fullName: "Marcos Antônio Pereira",
    preferredName: "Marcos",
    driverType: "INTERNAL",
    employmentType: "EMPLOYEE",
    documentType: "CPF",
    documentNumber: "34567890123",
    licenseNumber: "34567890122",
    licenseCategory: "E",
    licenseState: "PR",
    licenseExpiresAt: "2027-11-30",
    moppCertified: true,
    moppExpiresAt: "2026-08-15",
    city: "Paranaguá",
    state: "PR",
    phone: "41999990003",
    branchCodes: ["PARANAGUA"],
    primaryBranchCode: "PARANAGUA",
  },
  {
    code: "MOT_ROBERTO_MATRIZ",
    fullName: "Roberto Silva Almeida",
    preferredName: "Roberto",
    driverType: "INTERNAL",
    employmentType: "EMPLOYEE",
    documentType: "CPF",
    documentNumber: "45678901234",
    licenseNumber: "45678901233",
    licenseCategory: "D",
    licenseState: "SP",
    licenseExpiresAt: "2030-05-01",
    city: "São Paulo",
    state: "SP",
    phone: "11999990004",
    branchCodes: ["MATRIZ", "SANTOS"],
    primaryBranchCode: "MATRIZ",
  },
  {
    code: "MOT_FERNANDO_RONDONOPOLIS",
    fullName: "Fernando Gomes Ribeiro",
    preferredName: "Fernando",
    driverType: "THIRD_PARTY",
    employmentType: "CONTRACTOR",
    documentType: "CPF",
    documentNumber: "56789012345",
    licenseNumber: "56789012344",
    licenseCategory: "E",
    licenseState: "MT",
    licenseExpiresAt: "2028-09-20",
    city: "Rondonópolis",
    state: "MT",
    phone: "66999990005",
    branchCodes: ["RONDONOPOLIS"],
    primaryBranchCode: "RONDONOPOLIS",
  },
];
