export type CustomerSeedDef = {
  code: string;
  legalName: string;
  tradeName?: string;
  customerType:
    | "CONTRACTING_CUSTOMER"
    | "SHIPPER"
    | "CONSIGNEE"
    | "SHIPPER_AND_CONSIGNEE"
    | "BROKER"
    | "PARTNER"
    | "OTHER";
  documentType?: "CNPJ" | "CPF" | "NIF" | "EIN" | "VAT" | "OTHER";
  documentNumber?: string;
  mainContactName?: string;
  email?: string;
  phone?: string;
  billingCity?: string;
  billingState?: string;
  branchCodes: string[];
  primaryBranchCode: string;
};

/** Clientes demo do tenant nexum-demo — dados fictícios para desenvolvimento. */
export const CUSTOMER_DEFINITIONS: CustomerSeedDef[] = [
  {
    code: "VALE",
    legalName: "Vale S.A. Demo",
    tradeName: "Vale",
    customerType: "CONTRACTING_CUSTOMER",
    documentType: "CNPJ",
    documentNumber: "33.592.510/0001-54",
    mainContactName: "Contato Logística Vale",
    email: "logistica.vale@demo.nexum.local",
    phone: "+55 21 4000-0001",
    billingCity: "Rio de Janeiro",
    billingState: "RJ",
    branchCodes: ["MATRIZ", "SANTOS", "PARANAGUA"],
    primaryBranchCode: "MATRIZ",
  },
  {
    code: "CITROSUCO",
    legalName: "Citrosuco Demo Ltda",
    tradeName: "Citrosuco",
    customerType: "SHIPPER",
    documentType: "CNPJ",
    documentNumber: "45.997.418/0001-53",
    mainContactName: "Operações Citrosuco",
    email: "ops@citrosuco.demo.nexum.local",
    billingCity: "Matão",
    billingState: "SP",
    branchCodes: ["BOTUCATU", "SANTOS"],
    primaryBranchCode: "BOTUCATU",
  },
  {
    code: "SUZANO",
    legalName: "Suzano Papel e Celulose Demo",
    tradeName: "Suzano",
    customerType: "SHIPPER_AND_CONSIGNEE",
    documentType: "CNPJ",
    documentNumber: "16.404.287/0001-55",
    mainContactName: "Supply Chain Suzano",
    email: "supply@suzano.demo.nexum.local",
    billingCity: "São Paulo",
    billingState: "SP",
    branchCodes: ["MATRIZ", "PARANAGUA"],
    primaryBranchCode: "MATRIZ",
  },
  {
    code: "AMBEV",
    legalName: "Ambev Demo Logística",
    tradeName: "Ambev",
    customerType: "CONSIGNEE",
    documentType: "CNPJ",
    documentNumber: "07.526.557/0001-00",
    mainContactName: "Recebimento Ambev",
    email: "recebimento@ambev.demo.nexum.local",
    billingCity: "Jaguariúna",
    billingState: "SP",
    branchCodes: ["MATRIZ", "RONDONOPOLIS"],
    primaryBranchCode: "MATRIZ",
  },
  {
    code: "BRF",
    legalName: "BRF S.A. Demo",
    tradeName: "BRF",
    customerType: "PARTNER",
    documentType: "CNPJ",
    documentNumber: "01.838.723/0001-27",
    mainContactName: "Parcerias BRF",
    email: "parcerias@brf.demo.nexum.local",
    billingCity: "Itajaí",
    billingState: "SC",
    branchCodes: ["SANTOS", "PARANAGUA"],
    primaryBranchCode: "SANTOS",
  },
];
