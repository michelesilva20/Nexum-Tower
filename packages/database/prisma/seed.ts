import { PrismaClient, Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
import {
  ALL_PERMISSION_KEYS,
  getRolePermissionKeys,
  GROUP_DEFINITIONS,
  PERMISSION_DEFINITIONS,
  ROLE_DEFINITIONS,
} from "./seed-data/permissions";
import { FEATURE_DEFINITIONS, SETTING_DEFINITIONS } from "./seed-data/settings";
import { BRANCH_DEFINITIONS, USER_BRANCH_ACCESS } from "./seed-data/branches";
import { CUSTOMER_DEFINITIONS } from "./seed-data/customers";

const prisma = new PrismaClient();

const DEV_PASSWORD = "test123";
const TENANT_SLUG = "nexum-demo";

/** Usuários de teste local — nunca usar em produção. */
const DEV_USERS = [
  {
    email: "admin@nexumtower.local",
    name: "Admin Nexum",
    password: "admin123",
    roleSlug: "owner",
    groupSlug: "administradores",
  },
  {
    email: "tenantadmin@nexumtower.local",
    name: "Tenant Admin",
    password: DEV_PASSWORD,
    roleSlug: "tenant-admin",
    groupSlug: "administradores",
  },
  {
    email: "operacao@nexumtower.local",
    name: "Gestor Operação",
    password: DEV_PASSWORD,
    roleSlug: "operations-manager",
    groupSlug: "operacao",
  },
  {
    email: "operador@nexumtower.local",
    name: "Operador Logístico",
    password: DEV_PASSWORD,
    roleSlug: "logistics-operator",
  },
  {
    email: "financeiro@nexumtower.local",
    name: "Analista Financeiro",
    password: DEV_PASSWORD,
    roleSlug: "finance-analyst",
    groupSlug: "financeiro",
  },
  {
    email: "visualizador@nexumtower.local",
    name: "Visualizador",
    password: DEV_PASSWORD,
    roleSlug: "viewer",
    groupSlug: "visualizadores",
  },
  {
    email: "cliente@nexumtower.local",
    name: "Cliente Demo",
    password: DEV_PASSWORD,
    roleSlug: "customer-user",
    groupSlug: "clientes",
  },
  {
    email: "motorista@nexumtower.local",
    name: "Motorista Demo",
    password: DEV_PASSWORD,
    roleSlug: "driver",
    groupSlug: "motoristas",
  },
] as const;

type RoleRecord = { id: string; slug: string; name: string };
type GroupRecord = { id: string; slug: string };

async function seedDevUser(
  tenantId: string,
  userDef: (typeof DEV_USERS)[number],
  passwordHash: string,
  roleRecords: Map<string, RoleRecord>,
  groupRecords: Map<string, GroupRecord>,
) {
  const user = await prisma.user.upsert({
    where: { tenantId_email: { tenantId, email: userDef.email } },
    update: {
      name: userDef.name,
      passwordHash,
      status: "ACTIVE",
    },
    create: {
      tenantId,
      name: userDef.name,
      email: userDef.email,
      passwordHash,
      status: "ACTIVE",
    },
  });

  const role = roleRecords.get(userDef.roleSlug);
  if (role) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { tenantId, userId: user.id, roleId: role.id },
    });
  }

  if ("groupSlug" in userDef && userDef.groupSlug) {
    const group = groupRecords.get(userDef.groupSlug);
    if (group) {
      await prisma.groupMember.upsert({
        where: { userId_groupId: { userId: user.id, groupId: group.id } },
        update: {},
        create: { tenantId, userId: user.id, groupId: group.id },
      });
    }
  }

  return user;
}

/** Definições de parâmetros (globais) + valores padrão por tenant. Idempotente. */
async function seedSettings(tenantId: string) {
  for (const def of SETTING_DEFINITIONS) {
    const definition = await prisma.settingDefinition.upsert({
      where: { key: def.key },
      update: {
        module: def.module,
        label: def.label,
        description: def.description,
        valueType: def.valueType,
        defaultValue: def.defaultValue as Prisma.InputJsonValue,
        options: (def.options ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        isSensitive: def.isSensitive ?? false,
      },
      create: {
        key: def.key,
        module: def.module,
        label: def.label,
        description: def.description,
        valueType: def.valueType,
        defaultValue: def.defaultValue as Prisma.InputJsonValue,
        options: (def.options ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        isSensitive: def.isSensitive ?? false,
      },
    });

    // Valor padrão por tenant (não sobrescreve valores já customizados).
    await prisma.tenantSetting.upsert({
      where: { tenantId_definitionId: { tenantId, definitionId: definition.id } },
      update: {},
      create: {
        tenantId,
        definitionId: definition.id,
        value: def.defaultValue as Prisma.InputJsonValue,
      },
    });
  }
}

/** Catálogo de features (global) + estado padrão por tenant. Idempotente. */
async function seedFeatures(tenantId: string) {
  for (const def of FEATURE_DEFINITIONS) {
    const feature = await prisma.feature.upsert({
      where: { key: def.key },
      update: { name: def.name, description: def.description, module: def.module },
      create: { key: def.key, name: def.name, description: def.description, module: def.module },
    });

    await prisma.tenantFeature.upsert({
      where: { tenantId_featureId: { tenantId, featureId: feature.id } },
      update: {},
      create: { tenantId, featureId: feature.id, enabled: def.defaultEnabled ?? false },
    });
  }
}

async function seedCustomers(tenantId: string, branchByCode: Map<string, string>) {
  for (const def of CUSTOMER_DEFINITIONS) {
    const branchIds = def.branchCodes
      .map((code) => branchByCode.get(code))
      .filter((id): id is string => !!id);

    if (branchIds.length === 0) continue;

    const primaryBranchId = branchByCode.get(def.primaryBranchCode) ?? branchIds[0];

    const customer = await prisma.customer.upsert({
      where: { tenantId_code: { tenantId, code: def.code } },
      update: {
        legalName: def.legalName,
        tradeName: def.tradeName,
        customerType: def.customerType,
        documentType: def.documentType,
        documentNumber: def.documentNumber,
        mainContactName: def.mainContactName,
        email: def.email,
        phone: def.phone,
        billingCity: def.billingCity,
        billingState: def.billingState,
        billingCountry: "BR",
        status: "ACTIVE",
      },
      create: {
        tenantId,
        code: def.code,
        legalName: def.legalName,
        tradeName: def.tradeName,
        customerType: def.customerType,
        documentType: def.documentType,
        documentNumber: def.documentNumber,
        mainContactName: def.mainContactName,
        email: def.email,
        phone: def.phone,
        billingCity: def.billingCity,
        billingState: def.billingState,
        billingCountry: "BR",
        status: "ACTIVE",
      },
    });

    for (const branchId of branchIds) {
      await prisma.customerBranch.upsert({
        where: {
          tenantId_customerId_branchId: { tenantId, customerId: customer.id, branchId },
        },
        update: {
          deletedAt: null,
          disabledAt: null,
          status: "ACTIVE",
          isPrimary: branchId === primaryBranchId,
        },
        create: {
          tenantId,
          customerId: customer.id,
          branchId,
          isPrimary: branchId === primaryBranchId,
          status: "ACTIVE",
        },
      });
    }

    await prisma.customerBranch.updateMany({
      where: {
        tenantId,
        customerId: customer.id,
        deletedAt: null,
        NOT: { branchId: { in: branchIds } },
      },
      data: { isPrimary: false },
    });
  }
}

async function seedBranches(tenantId: string) {
  const branchByCode = new Map<string, string>();

  for (const def of BRANCH_DEFINITIONS) {
    const branch = await prisma.branch.upsert({
      where: { tenantId_code: { tenantId, code: def.code } },
      update: {
        name: def.name,
        legalName: def.legalName,
        city: def.city,
        state: def.state,
        isHeadquarters: def.isHeadquarters ?? false,
        status: "ACTIVE",
        deletedAt: null,
        disabledAt: null,
      },
      create: {
        tenantId,
        code: def.code,
        name: def.name,
        legalName: def.legalName,
        city: def.city,
        state: def.state,
        isHeadquarters: def.isHeadquarters ?? false,
        country: "BR",
      },
    });
    branchByCode.set(def.code, branch.id);
  }

  const matrizId = branchByCode.get("MATRIZ");
  if (matrizId) {
    await prisma.branch.updateMany({
      where: { tenantId, isHeadquarters: true, NOT: { id: matrizId } },
      data: { isHeadquarters: false },
    });
    await prisma.branch.update({
      where: { id: matrizId },
      data: { isHeadquarters: true },
    });
  }

  for (const access of USER_BRANCH_ACCESS) {
    const user = await prisma.user.findFirst({
      where: { tenantId, email: access.email },
      select: { id: true },
    });
    if (!user) continue;

    for (const code of access.branchCodes) {
      const branchId = branchByCode.get(code);
      if (!branchId) continue;

      await prisma.userBranchAccess.upsert({
        where: {
          tenantId_userId_branchId: { tenantId, userId: user.id, branchId },
        },
        update: { scope: access.scope ?? "MEMBER" },
        create: {
          tenantId,
          userId: user.id,
          branchId,
          scope: access.scope ?? "MEMBER",
        },
      });
    }
  }

  await seedCustomers(tenantId, branchByCode);
}

async function main() {
  console.log("Seeding Nexum Tower database...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: TENANT_SLUG },
    update: { name: "Nexum Demo Logistics" },
    create: { name: "Nexum Demo Logistics", slug: TENANT_SLUG },
  });

  for (const def of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { key: def.key },
      update: {
        module: def.module,
        resource: def.resource,
        action: def.action,
        description: def.description,
      },
      create: def,
    });
  }

  const permissionRecords = await prisma.permission.findMany({
    where: { key: { in: ALL_PERMISSION_KEYS } },
  });
  const permissionByKey = new Map(permissionRecords.map((p) => [p.key, p]));

  const roleRecords = new Map<string, RoleRecord>();

  for (const roleDef of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: roleDef.slug } },
      update: {
        name: roleDef.name,
        description: roleDef.description,
        isSystem: true,
      },
      create: {
        tenantId: tenant.id,
        name: roleDef.name,
        slug: roleDef.slug,
        description: roleDef.description,
        isSystem: true,
      },
    });

    roleRecords.set(roleDef.slug, role);

    const keys = getRolePermissionKeys(roleDef.slug);
    for (const key of keys) {
      const permission = permissionByKey.get(key);
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  const groupRecords = new Map<string, GroupRecord>();

  for (const groupDef of GROUP_DEFINITIONS) {
    const group = await prisma.group.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: groupDef.slug } },
      update: { name: groupDef.name },
      create: {
        tenantId: tenant.id,
        name: groupDef.name,
        slug: groupDef.slug,
        description: `Grupo ${groupDef.name}`,
      },
    });

    groupRecords.set(groupDef.slug, group);

    const role = roleRecords.get(groupDef.roleSlug);
    if (role) {
      await prisma.groupRole.upsert({
        where: { groupId_roleId: { groupId: group.id, roleId: role.id } },
        update: {},
        create: { tenantId: tenant.id, groupId: group.id, roleId: role.id },
      });
    }
  }

  const passwordCache = new Map<string, string>();

  for (const userDef of DEV_USERS) {
    let passwordHash = passwordCache.get(userDef.password);
    if (!passwordHash) {
      passwordHash = await bcrypt.hash(userDef.password, 12);
      passwordCache.set(userDef.password, passwordHash);
    }

    await seedDevUser(tenant.id, userDef, passwordHash, roleRecords, groupRecords);
  }

  await seedSettings(tenant.id);
  await seedFeatures(tenant.id);
  await seedBranches(tenant.id);

  console.log("Seed completed.");
  console.log(`Tenant: ${tenant.name} (${tenant.slug})`);
  console.log("");
  console.log("Dev users (local only):");
  for (const user of DEV_USERS) {
    const group = "groupSlug" in user && user.groupSlug ? ` · grupo ${user.groupSlug}` : "";
    console.log(`  ${user.email} / ${user.password} · ${user.roleSlug}${group}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
