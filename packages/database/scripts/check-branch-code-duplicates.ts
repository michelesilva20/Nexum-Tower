/**
 * Diagnóstico Fase 1.0.2 — duplicidade de Branch.code por tenant.
 * Uso: pnpm --filter database exec tsx scripts/check-branch-code-duplicates.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw<
    { tenantId: string; code: string; total: bigint; branch_ids: string[]; statuses: string[] }[]
  >`
    SELECT
      "tenantId",
      "code",
      COUNT(*)::bigint AS total,
      array_agg("id" ORDER BY "createdAt") AS branch_ids,
      array_agg(CASE WHEN "deletedAt" IS NULL THEN 'active' ELSE 'deleted' END ORDER BY "createdAt") AS statuses
    FROM "Branch"
    GROUP BY "tenantId", "code"
    HAVING COUNT(*) > 1
  `;

  if (rows.length === 0) {
    console.log("OK: nenhuma duplicidade de tenantId + code encontrada.");
    process.exit(0);
  }

  console.error("ERRO: duplicidades encontradas — não aplicar índice permanente sem correção manual:");
  console.error(JSON.stringify(rows, (_, v) => (typeof v === "bigint" ? Number(v) : v), 2));
  process.exit(1);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
