import { UserStatus, PermissionEffect } from "@prisma/client";
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  email!: string;

  /** Opcional: sem senha o usuário é criado como INVITED. */
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  roleIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  groupIds?: string[];
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;
}

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}

export class AssignRoleDto {
  @IsString()
  roleId!: string;
}

export class AssignGroupDto {
  @IsString()
  groupId!: string;
}

export class CreateOverrideDto {
  @IsString()
  permissionId!: string;

  @IsEnum(PermissionEffect)
  effect!: PermissionEffect;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
