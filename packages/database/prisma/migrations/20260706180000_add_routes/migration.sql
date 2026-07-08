-- Nexum Tower — Fase 1.5: Routes + RouteBranch + RoutePoint

CREATE TYPE "RouteStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISABLED');
CREATE TYPE "RouteType" AS ENUM (
  'STANDARD', 'DEDICATED', 'SPOT', 'MILK_RUN', 'ROUND_TRIP', 'TRANSFER',
  'DISTRIBUTION', 'COLLECTION', 'LINE_HAUL', 'PORT', 'CUSTOMER', 'OTHER'
);
CREATE TYPE "OperationType" AS ENUM (
  'INBOUND', 'OUTBOUND', 'TRANSFER', 'DISTRIBUTION', 'COLLECTION',
  'RETURN', 'EXPORT', 'IMPORT', 'OTHER'
);
CREATE TYPE "RoutePointType" AS ENUM (
  'ORIGIN', 'DESTINATION', 'STOP', 'WAYPOINT', 'PICKUP', 'DELIVERY',
  'CHECKPOINT', 'REST_POINT', 'FUEL_STOP', 'OTHER'
);
CREATE TYPE "RoutePointOperationRole" AS ENUM (
  'LOAD', 'UNLOAD', 'LOAD_UNLOAD', 'CHECK_IN', 'CHECK_OUT', 'CUSTOMS',
  'FUEL', 'REST', 'MAINTENANCE', 'PASS_THROUGH', 'OTHER'
);
CREATE TYPE "RouteRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RouteBranchStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISABLED');

CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "routeType" "RouteType" NOT NULL,
    "operationType" "OperationType" NOT NULL,
    "customerId" TEXT,
    "originLocationId" TEXT,
    "destinationLocationId" TEXT,
    "plannedDistanceKm" DECIMAL(12,2),
    "plannedDurationMinutes" INTEGER,
    "estimatedTollCost" DECIMAL(12,2),
    "estimatedFuelCost" DECIMAL(12,2),
    "estimatedTotalCost" DECIMAL(12,2),
    "requiresMopp" BOOLEAN NOT NULL DEFAULT false,
    "requiresRefrigeration" BOOLEAN NOT NULL DEFAULT false,
    "requiresTracking" BOOLEAN NOT NULL DEFAULT false,
    "requiresEscort" BOOLEAN NOT NULL DEFAULT false,
    "riskLevel" "RouteRiskLevel" NOT NULL DEFAULT 'LOW',
    "status" "RouteStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disabledAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RouteBranch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" "RouteBranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disabledAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RouteBranch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoutePoint" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "pointType" "RoutePointType" NOT NULL,
    "operationRole" "RoutePointOperationRole" NOT NULL,
    "plannedArrivalOffsetMinutes" INTEGER,
    "plannedDepartureOffsetMinutes" INTEGER,
    "plannedServiceTimeMinutes" INTEGER,
    "distanceFromPreviousKm" DECIMAL(12,2),
    "durationFromPreviousMinutes" INTEGER,
    "instructions" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RoutePoint_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Route_tenantId_code_key" ON "Route"("tenantId", "code");
CREATE INDEX "Route_tenantId_idx" ON "Route"("tenantId");
CREATE INDEX "Route_tenantId_customerId_idx" ON "Route"("tenantId", "customerId");
CREATE INDEX "Route_tenantId_originLocationId_idx" ON "Route"("tenantId", "originLocationId");
CREATE INDEX "Route_tenantId_destinationLocationId_idx" ON "Route"("tenantId", "destinationLocationId");
CREATE INDEX "Route_tenantId_routeType_idx" ON "Route"("tenantId", "routeType");
CREATE INDEX "Route_tenantId_operationType_idx" ON "Route"("tenantId", "operationType");
CREATE INDEX "Route_tenantId_riskLevel_idx" ON "Route"("tenantId", "riskLevel");
CREATE INDEX "Route_tenantId_status_idx" ON "Route"("tenantId", "status");
CREATE INDEX "Route_tenantId_deletedAt_idx" ON "Route"("tenantId", "deletedAt");
CREATE INDEX "Route_tenantId_createdAt_idx" ON "Route"("tenantId", "createdAt");
CREATE INDEX "Route_tenantId_updatedAt_idx" ON "Route"("tenantId", "updatedAt");

CREATE UNIQUE INDEX "RouteBranch_tenantId_routeId_branchId_key" ON "RouteBranch"("tenantId", "routeId", "branchId");
CREATE INDEX "RouteBranch_tenantId_idx" ON "RouteBranch"("tenantId");
CREATE INDEX "RouteBranch_tenantId_routeId_idx" ON "RouteBranch"("tenantId", "routeId");
CREATE INDEX "RouteBranch_tenantId_branchId_idx" ON "RouteBranch"("tenantId", "branchId");
CREATE INDEX "RouteBranch_tenantId_routeId_isPrimary_idx" ON "RouteBranch"("tenantId", "routeId", "isPrimary");
CREATE INDEX "RouteBranch_tenantId_deletedAt_idx" ON "RouteBranch"("tenantId", "deletedAt");

CREATE UNIQUE INDEX "RouteBranch_tenantId_routeId_primary_key"
  ON "RouteBranch"("tenantId", "routeId")
  WHERE "isPrimary" = true AND "deletedAt" IS NULL;

CREATE UNIQUE INDEX "RoutePoint_tenantId_routeId_sequence_key" ON "RoutePoint"("tenantId", "routeId", "sequence");
CREATE INDEX "RoutePoint_tenantId_idx" ON "RoutePoint"("tenantId");
CREATE INDEX "RoutePoint_tenantId_routeId_idx" ON "RoutePoint"("tenantId", "routeId");
CREATE INDEX "RoutePoint_tenantId_locationId_idx" ON "RoutePoint"("tenantId", "locationId");
CREATE INDEX "RoutePoint_tenantId_routeId_pointType_idx" ON "RoutePoint"("tenantId", "routeId", "pointType");

ALTER TABLE "Route" ADD CONSTRAINT "Route_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Route" ADD CONSTRAINT "Route_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Route" ADD CONSTRAINT "Route_originLocationId_fkey" FOREIGN KEY ("originLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Route" ADD CONSTRAINT "Route_destinationLocationId_fkey" FOREIGN KEY ("destinationLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RouteBranch" ADD CONSTRAINT "RouteBranch_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RouteBranch" ADD CONSTRAINT "RouteBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RoutePoint" ADD CONSTRAINT "RoutePoint_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoutePoint" ADD CONSTRAINT "RoutePoint_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
