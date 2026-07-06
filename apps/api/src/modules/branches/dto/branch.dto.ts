import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { BranchStatus, UserBranchAccessScope } from "@prisma/client";

export class ListBranchesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(BranchStatus)
  status?: BranchStatus;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isHeadquarters?: boolean;

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
  @IsIn(["code", "name", "city", "state", "status", "updatedAt", "createdAt"])
  sortBy?: string;

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortDirection?: "asc" | "desc";
}

export class CreateBranchDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  code!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  documentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  documentNumber?: string;

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
  @MaxLength(200)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

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
  @IsEnum(BranchStatus)
  status?: BranchStatus;

  @IsOptional()
  @IsBoolean()
  isHeadquarters?: boolean;
}

export class UpdateBranchDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  documentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  documentNumber?: string;

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
  @MaxLength(200)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

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
  @IsEnum(BranchStatus)
  status?: BranchStatus;

  @IsOptional()
  @IsBoolean()
  isHeadquarters?: boolean;
}

export class AssignUserBranchDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsEnum(UserBranchAccessScope)
  scope?: UserBranchAccessScope;
}
