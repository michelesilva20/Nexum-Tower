-- CreateEnum
CREATE TYPE "BranchStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "UserBranchAccessScope" AS ENUM ('MEMBER', 'MANAGER', 'ADMIN');

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "documentType" TEXT,
    "documentNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT DEFAULT 'BR',
    "zipCode" TEXT,
    "status" "BranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "isHeadquarters" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disabledAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBranchAccess" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "scope" "UserBranchAccessScope" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,

    CONSTRAINT "UserBranchAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Branch_tenantId_idx" ON "Branch"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_tenantId_code_key" ON "Branch"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_tenantId_documentNumber_key" ON "Branch"("tenantId", "documentNumber");

-- CreateIndex
CREATE INDEX "Branch_tenantId_status_idx" ON "Branch"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Branch_tenantId_isHeadquarters_idx" ON "Branch"("tenantId", "isHeadquarters");

-- CreateIndex
CREATE INDEX "Branch_tenantId_deletedAt_idx" ON "Branch"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "UserBranchAccess_tenantId_idx" ON "UserBranchAccess"("tenantId");

-- CreateIndex
CREATE INDEX "UserBranchAccess_tenantId_userId_idx" ON "UserBranchAccess"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "UserBranchAccess_tenantId_branchId_idx" ON "UserBranchAccess"("tenantId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBranchAccess_tenantId_userId_branchId_key" ON "UserBranchAccess"("tenantId", "userId", "branchId");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranchAccess" ADD CONSTRAINT "UserBranchAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranchAccess" ADD CONSTRAINT "UserBranchAccess_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS (preparação — ver docs/RLS.md)
ALTER TABLE "Branch" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Branch_tenant_isolation" ON "Branch"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

ALTER TABLE "UserBranchAccess" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "UserBranchAccess_tenant_isolation" ON "UserBranchAccess"
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));
