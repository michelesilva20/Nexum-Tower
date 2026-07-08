import {
  ArrayMinSize,
  IsArray,
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
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import {
  OperationType,
  RoutePointOperationRole,
  RoutePointType,
  RouteRiskLevel,
  RouteStatus,
  RouteType,
} from "@prisma/client";

export class ListRoutesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(RouteStatus)
  status?: RouteStatus;

  @IsOptional()
  @IsEnum(RouteType)
  routeType?: RouteType;

  @IsOptional()
  @IsEnum(OperationType)
  operationType?: OperationType;

  @IsOptional()
  @IsEnum(RouteRiskLevel)
  riskLevel?: RouteRiskLevel;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  originLocationId?: string;

  @IsOptional()
  @IsString()
  destinationLocationId?: string;

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
    "name",
    "routeType",
    "operationType",
    "riskLevel",
    "status",
    "plannedDistanceKm",
    "plannedDurationMinutes",
    "createdAt",
    "updatedAt",
  ])
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortDirection?: "asc" | "desc";
}

export class RoutePointInputDto {
  @IsString()
  locationId!: string;

  @IsInt()
  @Min(1)
  sequence!: number;

  @IsEnum(RoutePointType)
  pointType!: RoutePointType;

  @IsEnum(RoutePointOperationRole)
  operationRole!: RoutePointOperationRole;

  @IsOptional()
  @IsInt()
  plannedArrivalOffsetMinutes?: number | null;

  @IsOptional()
  @IsInt()
  plannedDepartureOffsetMinutes?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  plannedServiceTimeMinutes?: number | null;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  distanceFromPreviousKm?: number | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  durationFromPreviousMinutes?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instructions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class ReplaceRoutePointsDto {
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => RoutePointInputDto)
  points!: RoutePointInputDto[];
}

export class CreateRouteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  code!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsEnum(RouteType)
  routeType!: RouteType;

  @IsEnum(OperationType)
  operationType!: OperationType;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  plannedDistanceKm?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  plannedDurationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimatedTollCost?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimatedFuelCost?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimatedTotalCost?: number;

  @IsOptional()
  requiresMopp?: boolean;

  @IsOptional()
  requiresRefrigeration?: boolean;

  @IsOptional()
  requiresTracking?: boolean;

  @IsOptional()
  requiresEscort?: boolean;

  @IsOptional()
  @IsEnum(RouteRiskLevel)
  riskLevel?: RouteRiskLevel;

  @IsOptional()
  @IsEnum(RouteStatus)
  status?: RouteStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  branchIds!: string[];

  @IsOptional()
  @IsString()
  primaryBranchId?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => RoutePointInputDto)
  points!: RoutePointInputDto[];
}

export class UpdateRouteDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsEnum(RouteType)
  routeType?: RouteType;

  @IsOptional()
  @IsEnum(OperationType)
  operationType?: OperationType;

  @IsOptional()
  @IsString()
  customerId?: string | null;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  plannedDistanceKm?: number | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  plannedDurationMinutes?: number | null;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimatedTollCost?: number | null;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimatedFuelCost?: number | null;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimatedTotalCost?: number | null;

  @IsOptional()
  requiresMopp?: boolean;

  @IsOptional()
  requiresRefrigeration?: boolean;

  @IsOptional()
  requiresTracking?: boolean;

  @IsOptional()
  requiresEscort?: boolean;

  @IsOptional()
  @IsEnum(RouteRiskLevel)
  riskLevel?: RouteRiskLevel;

  @IsOptional()
  @IsEnum(RouteStatus)
  status?: RouteStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}

export class AssignRouteBranchesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  branchIds!: string[];

  @IsOptional()
  @IsString()
  primaryBranchId?: string;
}
