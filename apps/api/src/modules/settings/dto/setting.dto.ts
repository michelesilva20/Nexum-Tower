import { IsDefined } from "class-validator";

export class UpdateSettingDto {
  /** Valor JSON do parâmetro (boolean, number, string, array ou objeto). */
  @IsDefined()
  value!: unknown;
}
