import { Module } from "@nestjs/common";
import { FeaturesController } from "./features.controller";
import { FeaturesService } from "./features.service";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [AuditModule],
  controllers: [FeaturesController],
  providers: [FeaturesService],
  exports: [FeaturesService],
})
export class FeaturesModule {}
