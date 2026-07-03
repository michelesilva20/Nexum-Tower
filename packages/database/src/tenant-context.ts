import { Prisma } from "@prisma/client";
import { prisma } from "./index";

export const TENANT_CONTEXT_KEY = "app.current_tenant_id";

/**
 * Executa um bloco de queries dentro de uma transação com o contexto de
 * tenant configurado no PostgreSQL (`app.current_tenant_id`).
 *
 * As policies de Row Level Security usam `current_setting('app.current_tenant_id', true)`
 * para filtrar linhas. O `set_config(..., true)` escopa o valor à transação
 * corrente, evitando vazamento entre conexões reaproveitadas do pool.
 *
 * Importante: com o usuário de banco atual (dono das tabelas), o RLS só é
 * efetivamente aplicado quando as tabelas usam FORCE ROW LEVEL SECURITY ou
 * quando a aplicação conecta com um usuário de baixo privilégio. Ver docs/RLS.md.
 */
export async function runWithTenant<T>(
  tenantId: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  if (!tenantId) {
    throw new Error("runWithTenant requer um tenantId não vazio.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config(${TENANT_CONTEXT_KEY}, ${tenantId}, true)`;
    return callback(tx);
  });
}
