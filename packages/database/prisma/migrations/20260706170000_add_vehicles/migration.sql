-- Nexum Tower — Fase 1.4: Vehicles + VehicleBranch

CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'SUSPENDED', 'DISABLED');
CREATE TYPE "VehicleAvailabilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'ON_TRIP', 'IN_MAINTENANCE', 'RESERVED', 'OUT_OF_SERVICE');
CREATE TYPE "VehicleType" AS ENUM ('TRUCK', 'TRACTOR_TRUCK', 'TRAILER', 'SEMI_TRAILER', 'VAN', 'PICKUP', 'CAR', 'MOTORCYCLE', 'BUS', 'EQUIPMENT', 'OTHER');
CREATE TYPE "VehicleCategory" AS ENUM ('CARGO', 'PASSENGER', 'SUPPORT', 'MAINTENANCE', 'ADMINISTRATIVE', 'EQUIPMENT', 'OTHER');
CREATE TYPE "OwnershipType" AS ENUM ('OWNED', 'LEASED', 'RENTED', 'THIRD_PARTY', 'AGGREGATED', 'CUSTOMER_OWNED', 'OTHER');
CREATE TYPE "FuelType" AS ENUM ('DIESEL', 'GASOLINE', 'ETHANOL', 'FLEX', 'CNG', 'LNG', 'ELECTRIC', 'HYBRID', 'OTHER');
CREATE TYPE "BodyType" AS ENUM ('DRY_VAN', 'REFRIGERATED', 'FLATBED', 'TANK', 'BULK', 'CONTAINER_CARRIER', 'DUMP', 'SIDER', 'CURTAIN_SIDER', 'CAR_CARRIER', 'CHASSIS', 'NONE', 'OTHER');
CREATE TYPE "VehicleBranchStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISABLED');

CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "fleetNumber" TEXT,
    "vehicleType" "VehicleType" NOT NULL,
    "vehicleCategory" "VehicleCategory" NOT NULL,
    "ownershipType" "OwnershipType" NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "version" TEXT,
    "manufactureYear" INTEGER,
    "modelYear" INTEGER,
    "color" TEXT,
    "renavam" TEXT,
    "chassisNumber" TEXT,
    "engineNumber" TEXT,
    "licensePlateState" TEXT,
    "licensePlateCountry" TEXT DEFAULT 'BR',
    "fuelType" "FuelType",
    "emissionStandard" TEXT,
    "axleCount" INTEGER,
    "tireCount" INTEGER,
    "tareWeightKg" DECIMAL(12,2),
    "grossWeightKg" DECIMAL(12,2),
    "payloadCapacityKg" DECIMAL(12,2),
    "volumeCapacityM3" DECIMAL(12,3),
    "bodyType" "BodyType",
    "bodyDescription" TEXT,
    "trackerProvider" TEXT,
    "trackerDeviceId" TEXT,
    "trackerImei" TEXT,
    "odometerKm" DECIMAL(12,2),
    "hourMeter" DECIMAL(12,2),
    "licensingExpiresAt" TIMESTAMP(3),
    "insuranceExpiresAt" TIMESTAMP(3),
    "inspectionExpiresAt" TIMESTAMP(3),
    "tachographExpiresAt" TIMESTAMP(3),
    "anttExpiresAt" TIMESTAMP(3),
    "availabilityStatus" "VehicleAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disabledAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleBranch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" "VehicleBranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disabledAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VehicleBranch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Vehicle_tenantId_code_key" ON "Vehicle"("tenantId", "code");
CREATE INDEX "Vehicle_tenantId_idx" ON "Vehicle"("tenantId");
CREATE INDEX "Vehicle_tenantId_plate_idx" ON "Vehicle"("tenantId", "plate");
CREATE INDEX "Vehicle_tenantId_renavam_idx" ON "Vehicle"("tenantId", "renavam");
CREATE INDEX "Vehicle_tenantId_chassisNumber_idx" ON "Vehicle"("tenantId", "chassisNumber");
CREATE INDEX "Vehicle_tenantId_fleetNumber_idx" ON "Vehicle"("tenantId", "fleetNumber");
CREATE INDEX "Vehicle_tenantId_status_idx" ON "Vehicle"("tenantId", "status");
CREATE INDEX "Vehicle_tenantId_availabilityStatus_idx" ON "Vehicle"("tenantId", "availabilityStatus");
CREATE INDEX "Vehicle_tenantId_vehicleType_idx" ON "Vehicle"("tenantId", "vehicleType");
CREATE INDEX "Vehicle_tenantId_vehicleCategory_idx" ON "Vehicle"("tenantId", "vehicleCategory");
CREATE INDEX "Vehicle_tenantId_ownershipType_idx" ON "Vehicle"("tenantId", "ownershipType");
CREATE INDEX "Vehicle_tenantId_licensingExpiresAt_idx" ON "Vehicle"("tenantId", "licensingExpiresAt");
CREATE INDEX "Vehicle_tenantId_insuranceExpiresAt_idx" ON "Vehicle"("tenantId", "insuranceExpiresAt");
CREATE INDEX "Vehicle_tenantId_inspectionExpiresAt_idx" ON "Vehicle"("tenantId", "inspectionExpiresAt");
CREATE INDEX "Vehicle_tenantId_tachographExpiresAt_idx" ON "Vehicle"("tenantId", "tachographExpiresAt");
CREATE INDEX "Vehicle_tenantId_anttExpiresAt_idx" ON "Vehicle"("tenantId", "anttExpiresAt");
CREATE INDEX "Vehicle_tenantId_deletedAt_idx" ON "Vehicle"("tenantId", "deletedAt");
CREATE INDEX "Vehicle_tenantId_brand_idx" ON "Vehicle"("tenantId", "brand");
CREATE INDEX "Vehicle_tenantId_model_idx" ON "Vehicle"("tenantId", "model");

CREATE UNIQUE INDEX "Vehicle_tenantId_plate_active_key"
  ON "Vehicle"("tenantId", "plate")
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "Vehicle_tenantId_renavam_active_key"
  ON "Vehicle"("tenantId", "renavam")
  WHERE "renavam" IS NOT NULL AND "deletedAt" IS NULL;

CREATE UNIQUE INDEX "Vehicle_tenantId_chassisNumber_active_key"
  ON "Vehicle"("tenantId", "chassisNumber")
  WHERE "chassisNumber" IS NOT NULL AND "deletedAt" IS NULL;

CREATE UNIQUE INDEX "Vehicle_tenantId_fleetNumber_active_key"
  ON "Vehicle"("tenantId", "fleetNumber")
  WHERE "fleetNumber" IS NOT NULL AND "deletedAt" IS NULL;

CREATE UNIQUE INDEX "VehicleBranch_tenantId_vehicleId_branchId_key" ON "VehicleBranch"("tenantId", "vehicleId", "branchId");
CREATE INDEX "VehicleBranch_tenantId_idx" ON "VehicleBranch"("tenantId");
CREATE INDEX "VehicleBranch_tenantId_vehicleId_idx" ON "VehicleBranch"("tenantId", "vehicleId");
CREATE INDEX "VehicleBranch_tenantId_branchId_idx" ON "VehicleBranch"("tenantId", "branchId");
CREATE INDEX "VehicleBranch_tenantId_deletedAt_idx" ON "VehicleBranch"("tenantId", "deletedAt");

CREATE UNIQUE INDEX "VehicleBranch_tenantId_vehicleId_primary_key"
  ON "VehicleBranch"("tenantId", "vehicleId")
  WHERE "isPrimary" = true AND "deletedAt" IS NULL;

ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VehicleBranch" ADD CONSTRAINT "VehicleBranch_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VehicleBranch" ADD CONSTRAINT "VehicleBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
