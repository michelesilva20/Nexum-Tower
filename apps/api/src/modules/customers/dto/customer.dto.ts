import { ArrayMinSize, IsArray, IsEmail, IsEnum, IsIn, IsOptional, IsString, IsUrl, MaxLength, MinLength } from "class-validator";
import { Type } from "class-transformer";
import { CustomerDocumentType, CustomerStatus, CustomerType } from "@prisma/client";

export class ListCustomersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @IsOptional()
  @IsEnum(CustomerDocumentType)
  documentType?: CustomerDocumentType;

  @IsOptional()
  @IsString()
  branchId?: string;

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
  @IsIn(["code", "legalName", "tradeName", "customerType", "status", "billingCity", "billingState", "createdAt", "updatedAt"])
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortDirection?: "asc" | "desc";
}

export class CreateCustomerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  code!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  legalName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tradeName?: string;

  @IsEnum(CustomerType)
  customerType!: CustomerType;

  @IsOptional()
  @IsEnum(CustomerDocumentType)
  documentType?: CustomerDocumentType;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  documentNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  stateRegistration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  municipalRegistration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mainContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  mainContactRole?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  billingEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  whatsapp?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: "Website inválido." })
  @MaxLength(200)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  billingAddressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  billingAddressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  billingDistrict?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  billingCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  billingState?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  billingCountry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  billingZipCode?: string;

  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

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
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tradeName?: string;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @IsOptional()
  @IsEnum(CustomerDocumentType)
  documentType?: CustomerDocumentType;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  documentNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  stateRegistration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  municipalRegistration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mainContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  mainContactRole?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  billingEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  whatsapp?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: "Website inválido." })
  @MaxLength(200)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  billingAddressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  billingAddressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  billingDistrict?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  billingCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  billingState?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  billingCountry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  billingZipCode?: string;

  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class AssignCustomerBranchesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  branchIds!: string[];

  @IsOptional()
  @IsString()
  primaryBranchId?: string;
}

export class SetPrimaryBranchDto {
  @IsString()
  branchId!: string;
}
