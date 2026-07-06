import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import {
  BodyType,
  FuelType,
  OwnershipType,
  VehicleAvailabilityStatus,
  VehicleCategory,
  VehicleStatus,
  VehicleType,
} from "@prisma/client";

export class ListVehiclesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @IsOptional()
  @IsEnum(VehicleAvailabilityStatus)
  availabilityStatus?: VehicleAvailabilityStatus;

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @IsEnum(VehicleCategory)
  vehicleCategory?: VehicleCategory;

  @IsOptional()
  @IsEnum(OwnershipType)
  ownershipType?: OwnershipType;

  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @IsOptional()
  @IsEnum(BodyType)
  bodyType?: BodyType;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  model?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  plate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  fleetNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  licensePlateState?: string;

  @IsOptional()
  @IsDateString()
  licensingExpiringUntil?: string;

  @IsOptional()
  @IsDateString()
  insuranceExpiringUntil?: string;

  @IsOptional()
  @IsDateString()
  inspectionExpiringUntil?: string;

  @IsOptional()
  @IsDateString()
  tachographExpiringUntil?: string;

  @IsOptional()
  @IsDateString()
  anttExpiringUntil?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  perPage?: number;

  @IsOptional()
  @Type(() => Number)
  pageSize?: number;

  @IsOptional()
  @IsString()
  @IsIn([
    "code",
    "plate",
    "fleetNumber",
    "vehicleType",
    "vehicleCategory",
    "ownershipType",
    "brand",
    "model",
    "status",
    "availabilityStatus",
    "licensingExpiresAt",
    "insuranceExpiresAt",
    "inspectionExpiresAt",
    "tachographExpiresAt",
    "anttExpiresAt",
    "createdAt",
    "updatedAt",
  ])
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortDirection?: "asc" | "desc";
}

export class CreateVehicleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  code!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(16)
  plate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  fleetNumber?: string;

  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @IsEnum(VehicleCategory)
  vehicleCategory!: VehicleCategory;

  @IsEnum(OwnershipType)
  ownershipType!: OwnershipType;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  brand!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  model!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  version?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Type(() => Number)
  manufactureYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Type(() => Number)
  modelYear?: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  renavam?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  chassisNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  engineNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  licensePlateState?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  licensePlateCountry?: string;

  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  emissionStandard?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  axleCount?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  tireCount?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  tareWeightKg?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  grossWeightKg?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  payloadCapacityKg?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  volumeCapacityM3?: number;

  @IsOptional()
  @IsEnum(BodyType)
  bodyType?: BodyType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bodyDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  trackerProvider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  trackerDeviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  trackerImei?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  odometerKm?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  hourMeter?: number;

  @IsOptional()
  @IsDateString()
  licensingExpiresAt?: string;

  @IsOptional()
  @IsDateString()
  insuranceExpiresAt?: string;

  @IsOptional()
  @IsDateString()
  inspectionExpiresAt?: string;

  @IsOptional()
  @IsDateString()
  tachographExpiresAt?: string;

  @IsOptional()
  @IsDateString()
  anttExpiresAt?: string;

  @IsOptional()
  @IsEnum(VehicleAvailabilityStatus)
  availabilityStatus?: VehicleAvailabilityStatus;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  branchIds!: string[];

  @IsOptional()
  @IsString()
  primaryBranchId?: string;
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  plate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  fleetNumber?: string;

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @IsEnum(VehicleCategory)
  vehicleCategory?: VehicleCategory;

  @IsOptional()
  @IsEnum(OwnershipType)
  ownershipType?: OwnershipType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  brand?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  model?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  version?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Type(() => Number)
  manufactureYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Type(() => Number)
  modelYear?: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  renavam?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  chassisNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  engineNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  licensePlateState?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  licensePlateCountry?: string;

  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  emissionStandard?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  axleCount?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  tireCount?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  tareWeightKg?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  grossWeightKg?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  payloadCapacityKg?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  volumeCapacityM3?: number;

  @IsOptional()
  @IsEnum(BodyType)
  bodyType?: BodyType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bodyDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  trackerProvider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  trackerDeviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  trackerImei?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  odometerKm?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  hourMeter?: number;

  @IsOptional()
  @IsDateString()
  licensingExpiresAt?: string;

  @IsOptional()
  @IsDateString()
  insuranceExpiresAt?: string;

  @IsOptional()
  @IsDateString()
  inspectionExpiresAt?: string;

  @IsOptional()
  @IsDateString()
  tachographExpiresAt?: string;

  @IsOptional()
  @IsDateString()
  anttExpiresAt?: string;

  @IsOptional()
  @IsEnum(VehicleAvailabilityStatus)
  availabilityStatus?: VehicleAvailabilityStatus;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}

export class AssignVehicleBranchesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  branchIds!: string[];

  @IsOptional()
  @IsString()
  primaryBranchId?: string;
}
