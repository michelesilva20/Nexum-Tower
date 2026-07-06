import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { RequirePermissions } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthUserPayload } from "../auth/types/auth-user.type";
import { CustomersService } from "./customers.service";
import {
  AssignCustomerBranchesDto,
  CreateCustomerDto,
  ListCustomersQueryDto,
  UpdateCustomerDto,
} from "./dto/customer.dto";

function meta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.headers["user-agent"] };
}

@Controller("logistics/customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions("customers.read")
  list(@CurrentUser() user: AuthUserPayload, @Query() query: ListCustomersQueryDto) {
    return this.customersService.list(user.tenantId, user, query);
  }

  @Get(":id")
  @RequirePermissions("customers.read")
  getById(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    return this.customersService.getById(id, user.tenantId, user);
  }

  @Post()
  @RequirePermissions("customers.create")
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreateCustomerDto, @Req() req: Request) {
    return this.customersService.create(user.tenantId, dto, user, meta(req));
  }

  @Patch(":id")
  @RequirePermissions("customers.update")
  update(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: UpdateCustomerDto,
    @Req() req: Request,
  ) {
    return this.customersService.update(id, user.tenantId, dto, user, meta(req));
  }

  @Patch(":id/disable")
  @RequirePermissions("customers.disable")
  disable(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.customersService.disable(id, user.tenantId, user, meta(req));
  }

  @Patch(":id/enable")
  @RequirePermissions("customers.disable")
  enable(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.customersService.enable(id, user.tenantId, user, meta(req));
  }

  @Delete(":id")
  @RequirePermissions("customers.delete")
  remove(@CurrentUser() user: AuthUserPayload, @Param("id") id: string, @Req() req: Request) {
    return this.customersService.remove(id, user.tenantId, user, meta(req));
  }

  @Get(":id/branches")
  @RequirePermissions("customers.read")
  listBranches(@CurrentUser() user: AuthUserPayload, @Param("id") id: string) {
    return this.customersService.listBranches(id, user.tenantId, user);
  }

  @Post(":id/branches")
  @RequirePermissions("customers.assign_branches")
  assignBranches(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Body() dto: AssignCustomerBranchesDto,
    @Req() req: Request,
  ) {
    return this.customersService.assignBranches(id, user.tenantId, dto, user, meta(req));
  }

  @Patch(":id/branches/:branchId/primary")
  @RequirePermissions("customers.assign_branches")
  setPrimary(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Param("branchId") branchId: string,
    @Req() req: Request,
  ) {
    return this.customersService.setPrimaryBranch(id, user.tenantId, { branchId }, user, meta(req));
  }

  @Delete(":id/branches/:branchId")
  @RequirePermissions("customers.assign_branches")
  removeBranch(
    @CurrentUser() user: AuthUserPayload,
    @Param("id") id: string,
    @Param("branchId") branchId: string,
    @Req() req: Request,
  ) {
    return this.customersService.removeBranch(id, user.tenantId, branchId, user, meta(req));
  }
}
