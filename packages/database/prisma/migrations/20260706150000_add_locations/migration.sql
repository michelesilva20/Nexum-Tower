-- Nexum Tower — Fase 1.2: Locations + LocationBranch

CREATE TYPE "LocationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISABLED');
CREATE TYPE "LocationType" AS ENUM (
  'CUSTOMER_SITE',
  'BRANCH_BASE',
  'PORT',
  'TERMINAL',
  'WAREHOUSE',
  'DISTRIBUTION_CENTER',
  'DEPOT',
  'YARD',
  'CROSS_DOCKING',
  'BORDER_CROSSING',
  'FUEL_STATION',
  'MAINTENANCE_SITE',
  'SUPPLIER_SITE',
  'PARKING_AREA',
  'OTHER'
);
CREATE TYPE "LocationBranchStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISABLED');

CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationType" "LocationType" NOT NULL,
    "customerId" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "district" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'BR',
    "zipCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timezone" TEXT,
    "geofenceRadiusMeters" INTEGER,
    "contactName" TEXT,
    "contactRole" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "operatingHours" TEXT,
    "accessInstructions" TEXT,
    "dockInfo" TEXT,
    "referencePoint" TEXT,
    "status" "LocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disabledAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LocationBranch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" "LocationBranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disabledAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LocationBranch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Location_tenantId_code_key" ON "Location"("tenantId", "code");
CREATE INDEX "Location_tenantId_idx" ON "Location"("tenantId");
CREATE INDEX "Location_tenantId_customerId_idx" ON "Location"("tenantId", "customerId");
CREATE INDEX "Location_tenantId_locationType_idx" ON "Location"("tenantId", "locationType");
CREATE INDEX "Location_tenantId_status_idx" ON "Location"("tenantId", "status");
CREATE INDEX "Location_tenantId_city_idx" ON "Location"("tenantId", "city");
CREATE INDEX "Location_tenantId_state_idx" ON "Location"("tenantId", "state");
CREATE INDEX "Location_tenantId_deletedAt_idx" ON "Location"("tenantId", "deletedAt");
CREATE INDEX "Location_tenantId_name_idx" ON "Location"("tenantId", "name");

CREATE UNIQUE INDEX "LocationBranch_tenantId_locationId_branchId_key"
  ON "LocationBranch"("tenantId", "locationId", "branchId");
CREATE INDEX "LocationBranch_tenantId_idx" ON "LocationBranch"("tenantId");
CREATE INDEX "LocationBranch_tenantId_locationId_idx" ON "LocationBranch"("tenantId", "locationId");
CREATE INDEX "LocationBranch_tenantId_branchId_idx" ON "LocationBranch"("tenantId", "branchId");
CREATE INDEX "LocationBranch_tenantId_deletedAt_idx" ON "LocationBranch"("tenantId", "deletedAt");

CREATE UNIQUE INDEX "LocationBranch_one_primary_per_location_idx"
  ON "LocationBranch"("tenantId", "locationId")
  WHERE "isPrimary" = true AND "deletedAt" IS NULL;

ALTER TABLE "Location" ADD CONSTRAINT "Location_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Location" ADD CONSTRAINT "Location_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LocationBranch" ADD CONSTRAINT "LocationBranch_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LocationBranch" ADD CONSTRAINT "LocationBranch_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Location" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location_tenant_isolation" ON "Location"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "LocationBranch" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "LocationBranch_tenant_isolation" ON "LocationBranch"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));
