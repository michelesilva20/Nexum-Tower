import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import {
  DriverAvailabilityStatus,
  DriverDocumentType,
  DriverStatus,
  DriverType,
  EmploymentType,
  LicenseCategory,
} from "@prisma/client";

export class ListDriversQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @IsOptional()
  @IsEnum(DriverAvailabilityStatus)
  availabilityStatus?: DriverAvailabilityStatus;

  @IsOptional()
  @IsEnum(DriverType)
  driverType?: DriverType;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsEnum(LicenseCategory)
  licenseCategory?: LicenseCategory;

  @IsOptional()
  @IsDateString()
  licenseExpiringUntil?: string;

  @IsOptional()
  @IsDateString()
  moppExpiringUntil?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  state?: string;

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
    "fullName",
    "driverType",
    "employmentType",
    "status",
    "availabilityStatus",
    "licenseExpiresAt",
    "moppExpiresAt",
    "city",
    "state",
    "createdAt",
    "updatedAt",
  ])
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortDirection?: "asc" | "desc";
}

export class CreateDriverDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  code!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  preferredName?: string;

  @IsEnum(DriverType)
  driverType!: DriverType;

  @IsEnum(EmploymentType)
  employmentType!: EmploymentType;

  @IsOptional()
  @IsEnum(DriverDocumentType)
  documentType?: DriverDocumentType;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  documentNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  licenseNumber?: string;

  @IsOptional()
  @IsEnum(LicenseCategory)
  licenseCategory?: LicenseCategory;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  licenseState?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  licenseCountry?: string;

  @IsOptional()
  @IsDateString()
  licenseIssuedAt?: string;

  @IsOptional()
  @IsDateString()
  licenseExpiresAt?: string;

  @IsOptional()
  @IsBoolean()
  hasEar?: boolean;

  @IsOptional()
  @IsBoolean()
  moppCertified?: boolean;

  @IsOptional()
  @IsDateString()
  moppExpiresAt?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  emergencyContactRelation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  zipCode?: string;

  @IsOptional()
  @IsDateString()
  admissionDate?: string;

  @IsOptional()
  @IsDateString()
  terminationDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contractorCompanyName?: string;

  @IsOptional()
  @IsEnum(DriverAvailabilityStatus)
  availabilityStatus?: DriverAvailabilityStatus;

  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

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

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  preferredName?: string;

  @IsOptional()
  @IsEnum(DriverType)
  driverType?: DriverType;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsEnum(DriverDocumentType)
  documentType?: DriverDocumentType;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  documentNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  licenseNumber?: string;

  @IsOptional()
  @IsEnum(LicenseCategory)
  licenseCategory?: LicenseCategory;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  licenseState?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  licenseCountry?: string;

  @IsOptional()
  @IsDateString()
  licenseIssuedAt?: string;

  @IsOptional()
  @IsDateString()
  licenseExpiresAt?: string;

  @IsOptional()
  @IsBoolean()
  hasEar?: boolean;

  @IsOptional()
  @IsBoolean()
  moppCertified?: boolean;

  @IsOptional()
  @IsDateString()
  moppExpiresAt?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  emergencyContactRelation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  zipCode?: string;

  @IsOptional()
  @IsDateString()
  admissionDate?: string;

  @IsOptional()
  @IsDateString()
  terminationDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contractorCompanyName?: string;

  @IsOptional()
  @IsEnum(DriverAvailabilityStatus)
  availabilityStatus?: DriverAvailabilityStatus;

  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}

export class AssignDriverBranchesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  branchIds!: string[];

  @IsOptional()
  @IsString()
  primaryBranchId?: string;
}
