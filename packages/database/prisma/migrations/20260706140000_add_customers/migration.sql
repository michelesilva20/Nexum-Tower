-- Nexum Tower — Fase 1.1: Customers + CustomerBranch

CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISABLED');
CREATE TYPE "CustomerType" AS ENUM (
  'CONTRACTING_CUSTOMER',
  'SHIPPER',
  'CONSIGNEE',
  'SHIPPER_AND_CONSIGNEE',
  'BROKER',
  'PARTNER',
  'OTHER'
);
CREATE TYPE "CustomerDocumentType" AS ENUM ('CNPJ', 'CPF', 'NIF', 'EIN', 'VAT', 'OTHER');
CREATE TYPE "CustomerBranchStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISABLED');

CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "customerType" "CustomerType" NOT NULL,
    "documentType" "CustomerDocumentType",
    "documentNumber" TEXT,
    "stateRegistration" TEXT,
    "municipalRegistration" TEXT,
    "mainContactName" TEXT,
    "mainContactRole" TEXT,
    "email" TEXT,
    "billingEmail" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "website" TEXT,
    "billingAddressLine1" TEXT,
    "billingAddressLine2" TEXT,
    "billingDistrict" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "billingCountry" TEXT DEFAULT 'BR',
    "billingZipCode" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disabledAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerBranch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" "CustomerBranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disabledAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CustomerBranch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Customer_tenantId_code_key" ON "Customer"("tenantId", "code");
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");
CREATE INDEX "Customer_tenantId_documentNumber_idx" ON "Customer"("tenantId", "documentNumber");
CREATE INDEX "Customer_tenantId_status_idx" ON "Customer"("tenantId", "status");
CREATE INDEX "Customer_tenantId_customerType_idx" ON "Customer"("tenantId", "customerType");
CREATE INDEX "Customer_tenantId_deletedAt_idx" ON "Customer"("tenantId", "deletedAt");
CREATE INDEX "Customer_tenantId_legalName_idx" ON "Customer"("tenantId", "legalName");
CREATE INDEX "Customer_tenantId_tradeName_idx" ON "Customer"("tenantId", "tradeName");

CREATE UNIQUE INDEX "CustomerBranch_tenantId_customerId_branchId_key"
  ON "CustomerBranch"("tenantId", "customerId", "branchId");
CREATE INDEX "CustomerBranch_tenantId_idx" ON "CustomerBranch"("tenantId");
CREATE INDEX "CustomerBranch_tenantId_customerId_idx" ON "CustomerBranch"("tenantId", "customerId");
CREATE INDEX "CustomerBranch_tenantId_branchId_idx" ON "CustomerBranch"("tenantId", "branchId");
CREATE INDEX "CustomerBranch_tenantId_deletedAt_idx" ON "CustomerBranch"("tenantId", "deletedAt");

-- documentNumber único entre clientes ativos quando informado
CREATE UNIQUE INDEX "Customer_tenantId_documentNumber_active_key"
  ON "Customer"("tenantId", "documentNumber")
  WHERE "deletedAt" IS NULL AND "documentNumber" IS NOT NULL;

-- Uma filial principal ativa por cliente
CREATE UNIQUE INDEX "CustomerBranch_one_primary_per_customer_idx"
  ON "CustomerBranch"("tenantId", "customerId")
  WHERE "isPrimary" = true AND "deletedAt" IS NULL;

ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomerBranch" ADD CONSTRAINT "CustomerBranch_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomerBranch" ADD CONSTRAINT "CustomerBranch_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer_tenant_isolation" ON "Customer"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "CustomerBranch" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CustomerBranch_tenant_isolation" ON "CustomerBranch"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));
