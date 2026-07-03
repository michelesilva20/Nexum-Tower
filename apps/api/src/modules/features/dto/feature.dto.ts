import { IsBoolean, IsObject, IsOptional } from "class-validator";

export class UpdateTenantFeatureDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
