-- Nexum Tower — Fase 1.3: Drivers + DriverBranch

CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'DISABLED');
CREATE TYPE "DriverType" AS ENUM ('INTERNAL', 'THIRD_PARTY', 'OWNER_OPERATOR', 'AGGREGATED', 'TEMPORARY', 'OTHER');
CREATE TYPE "EmploymentType" AS ENUM ('EMPLOYEE', 'CONTRACTOR', 'FREELANCER', 'AGGREGATED', 'OUTSOURCED', 'OTHER');
CREATE TYPE "DriverAvailabilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'ON_VACATION', 'ON_LEAVE');
CREATE TYPE "DriverDocumentType" AS ENUM ('CPF', 'RG', 'CNH', 'PASSPORT', 'RNE', 'OTHER');
CREATE TYPE "LicenseCategory" AS ENUM ('A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE', 'OTHER');
CREATE TYPE "DriverBranchStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISABLED');

CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "preferredName" TEXT,
    "driverType" "DriverType" NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "documentType" "DriverDocumentType",
    "documentNumber" TEXT,
    "licenseNumber" TEXT,
    "licenseCategory" "LicenseCategory",
    "licenseState" TEXT,
    "licenseCountry" TEXT DEFAULT 'BR',
    "licenseIssuedAt" TIMESTAMP(3),
    "licenseExpiresAt" TIMESTAMP(3),
    "hasEar" BOOLEAN NOT NULL DEFAULT false,
    "moppCertified" BOOLEAN NOT NULL DEFAULT false,
    "moppExpiresAt" TIMESTAMP(3),
    "birthDate" TIMESTAMP(3),
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "district" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT DEFAULT 'BR',
    "zipCode" TEXT,
    "admissionDate" TIMESTAMP(3),
    "terminationDate" TIMESTAMP(3),
    "contractorCompanyName" TEXT,
    "availabilityStatus" "DriverAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "status" "DriverStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disabledAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DriverBranch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" "DriverBranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disabledAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DriverBranch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Driver_tenantId_code_key" ON "Driver"("tenantId", "code");
CREATE INDEX "Driver_tenantId_idx" ON "Driver"("tenantId");
CREATE INDEX "Driver_tenantId_documentNumber_idx" ON "Driver"("tenantId", "documentNumber");
CREATE INDEX "Driver_tenantId_licenseNumber_idx" ON "Driver"("tenantId", "licenseNumber");
CREATE INDEX "Driver_tenantId_status_idx" ON "Driver"("tenantId", "status");
CREATE INDEX "Driver_tenantId_availabilityStatus_idx" ON "Driver"("tenantId", "availabilityStatus");
CREATE INDEX "Driver_tenantId_driverType_idx" ON "Driver"("tenantId", "driverType");
CREATE INDEX "Driver_tenantId_employmentType_idx" ON "Driver"("tenantId", "employmentType");
CREATE INDEX "Driver_tenantId_licenseExpiresAt_idx" ON "Driver"("tenantId", "licenseExpiresAt");
CREATE INDEX "Driver_tenantId_moppExpiresAt_idx" ON "Driver"("tenantId", "moppExpiresAt");
CREATE INDEX "Driver_tenantId_deletedAt_idx" ON "Driver"("tenantId", "deletedAt");
CREATE INDEX "Driver_tenantId_fullName_idx" ON "Driver"("tenantId", "fullName");

CREATE UNIQUE INDEX "Driver_tenantId_documentNumber_active_key"
  ON "Driver"("tenantId", "documentNumber")
  WHERE "documentNumber" IS NOT NULL AND "deletedAt" IS NULL;

CREATE UNIQUE INDEX "Driver_tenantId_licenseNumber_active_key"
  ON "Driver"("tenantId", "licenseNumber")
  WHERE "licenseNumber" IS NOT NULL AND "deletedAt" IS NULL;

CREATE UNIQUE INDEX "DriverBranch_tenantId_driverId_branchId_key" ON "DriverBranch"("tenantId", "driverId", "branchId");
CREATE INDEX "DriverBranch_tenantId_idx" ON "DriverBranch"("tenantId");
CREATE INDEX "DriverBranch_tenantId_driverId_idx" ON "DriverBranch"("tenantId", "driverId");
CREATE INDEX "DriverBranch_tenantId_branchId_idx" ON "DriverBranch"("tenantId", "branchId");
CREATE INDEX "DriverBranch_tenantId_deletedAt_idx" ON "DriverBranch"("tenantId", "deletedAt");

CREATE UNIQUE INDEX "DriverBranch_tenantId_driverId_primary_key"
  ON "DriverBranch"("tenantId", "driverId")
  WHERE "isPrimary" = true AND "deletedAt" IS NULL;

ALTER TABLE "Driver" ADD CONSTRAINT "Driver_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DriverBranch" ADD CONSTRAINT "DriverBranch_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DriverBranch" ADD CONSTRAINT "DriverBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
