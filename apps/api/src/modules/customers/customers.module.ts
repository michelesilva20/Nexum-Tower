import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { CustomersController } from "./customers.controller";
import { CustomersService } from "./customers.service";

@Module({
  imports: [AuditModule, AuthorizationModule],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
