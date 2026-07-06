export type BranchSeedDef = {
  code: string;
  name: string;
  legalName?: string;
  city?: string;
  state?: string;
  isHeadquarters?: boolean;
};

/** Filiais demo do tenant nexum-demo — espelham estrutura multi-unidade típica de transportadoras. */
export const BRANCH_DEFINITIONS: BranchSeedDef[] = [
  {
    code: "MATRIZ",
    name: "Matriz",
    legalName: "Nexum Demo Logistics Ltda",
    city: "São Paulo",
    state: "SP",
    isHeadquarters: true,
  },
  {
    code: "SANTOS",
    name: "Santos",
    city: "Santos",
    state: "SP",
  },
  {
    code: "BOTUCATU",
    name: "Botucatu",
    city: "Botucatu",
    state: "SP",
  },
  {
    code: "PARANAGUA",
    name: "Paranaguá",
    city: "Paranaguá",
    state: "PR",
  },
  {
    code: "RONDONOPOLIS",
    name: "Rondonópolis",
    city: "Rondonópolis",
    state: "MT",
  },
];

/** Vínculos demo: e-mail do usuário → códigos de filiais acessíveis. */
export const USER_BRANCH_ACCESS: { email: string; branchCodes: string[]; scope?: "MEMBER" | "MANAGER" | "ADMIN" }[] = [
  {
    email: "operacao@nexumtower.local",
    branchCodes: ["SANTOS", "PARANAGUA"],
    scope: "MANAGER",
  },
  {
    email: "operador@nexumtower.local",
    branchCodes: ["BOTUCATU"],
    scope: "MEMBER",
  },
];
