import { runWithTenant, TENANT_CONTEXT_KEY } from "database";

describe("runWithTenant", () => {
  it("exporta TENANT_CONTEXT_KEY correto", () => {
    expect(TENANT_CONTEXT_KEY).toBe("app.current_tenant_id");
  });

  it("rejeita tenantId vazio antes de abrir transação", async () => {
    await expect(runWithTenant("", async () => "ok")).rejects.toThrow(
      "runWithTenant requer um tenantId não vazio",
    );
  });
});

/**
 * Teste de integração RLS (set_config + policies):
 *   pnpm security:rls:test
 * Ver packages/database/sql/security/05-test-rls-isolation.sql
 */
