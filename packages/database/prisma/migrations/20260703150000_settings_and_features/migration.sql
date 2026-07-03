-- Nexum Core Platform — Settings & Feature Flags

-- CreateEnum
CREATE TYPE "SettingValueType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'SELECT');

-- CreateTable
CREATE TABLE "SettingDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "valueType" "SettingValueType" NOT NULL,
    "defaultValue" JSONB,
    "options" JSONB,
    "isTenantScoped" BOOLEAN NOT NULL DEFAULT true,
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SettingDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSetting" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantFeature" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SettingDefinition_key_key" ON "SettingDefinition"("key");
CREATE INDEX "SettingDefinition_module_idx" ON "SettingDefinition"("module");

CREATE UNIQUE INDEX "TenantSetting_tenantId_definitionId_key" ON "TenantSetting"("tenantId", "definitionId");
CREATE INDEX "TenantSetting_tenantId_idx" ON "TenantSetting"("tenantId");

CREATE UNIQUE INDEX "Feature_key_key" ON "Feature"("key");
CREATE INDEX "Feature_module_idx" ON "Feature"("module");

CREATE UNIQUE INDEX "TenantFeature_tenantId_featureId_key" ON "TenantFeature"("tenantId", "featureId");
CREATE INDEX "TenantFeature_tenantId_idx" ON "TenantFeature"("tenantId");

-- AddForeignKey
ALTER TABLE "TenantSetting" ADD CONSTRAINT "TenantSetting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantSetting" ADD CONSTRAINT "TenantSetting_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "SettingDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantFeature" ADD CONSTRAINT "TenantFeature_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantFeature" ADD CONSTRAINT "TenantFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: tabelas tenant-scoped (ver docs/RLS.md; FORCE não habilitado por padrão)
ALTER TABLE "TenantSetting" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "TenantSetting_tenant_isolation" ON "TenantSetting"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "TenantFeature" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "TenantFeature_tenant_isolation" ON "TenantFeature"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));
