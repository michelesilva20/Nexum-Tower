import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { BranchesController } from "./branches.controller";
import { BranchesService } from "./branches.service";

@Module({
  imports: [AuditModule, AuthorizationModule],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
