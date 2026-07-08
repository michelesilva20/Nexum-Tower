import { test, expect, Page } from "@playwright/test";
import { SEED_USERS, login } from "./helpers/auth";

function expectRouteCode(page: Page, code: string) {
  return expect(
    page.locator("span.font-mono").filter({ hasText: new RegExp(`^${code}$`) }),
  ).toBeVisible();
}

function expectRouteCodeHidden(page: Page, code: string) {
  return expect(
    page.locator("span.font-mono").filter({ hasText: new RegExp(`^${code}$`) }),
  ).not.toBeVisible();
}

test.describe("Rotas — E2E", () => {
  test.describe("Admin (owner)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.admin.email, SEED_USERS.admin.password);
    });

    test("vê menu Rotas e acessa listagem", async ({ page }) => {
      await expect(page.getByRole("link", { name: /rotas/i })).toBeVisible();
      await page.goto("/app/logistics/routes");
      await expect(page.getByRole("heading", { name: /^rotas$/i })).toBeVisible();
      await expectRouteCode(page, "ROT_SANTOS_CUBATAO");
      await expectRouteCode(page, "ROT_PARANAGUA_TERMINAL");
    });

    test("botão Nova rota visível para admin", async ({ page }) => {
      await page.goto("/app/logistics/routes");
      await expect(page.getByRole("button", { name: /nova rota/i })).toBeVisible();
    });

    test("tentativa de code duplicado exibe erro", async ({ page }) => {
      await page.goto("/app/logistics/routes");
      await page.getByRole("button", { name: /nova rota/i }).click();
      const drawer = page.getByRole("dialog", { name: /nova rota/i });
      await expect(drawer).toBeVisible();
      const textInputs = drawer.locator("input:not([type]), input[type='text'], input[type='email']");
      await textInputs.nth(0).fill("ROT_SANTOS_CUBATAO");
      await textInputs.nth(1).fill("Rota duplicada teste");
      await drawer.getByRole("button", { name: /Santos \(SANTOS\)/i }).click();
      const pointSelects = drawer.locator("select");
      // 0=Status … 7=Filial principal, 8=Local origem, 11=Local destino
      await pointSelects.nth(8).selectOption({ index: 5 });
      await pointSelects.nth(11).selectOption({ index: 5 });
      await drawer.getByRole("button", { name: /^salvar$/i }).click();
      await expect(
        page.getByText(/não é possível reutilizar este código de rota/i),
      ).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe("Financeiro (sem routes.read)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.financeiro.email, SEED_USERS.financeiro.password);
    });

    test("não vê menu Rotas", async ({ page }) => {
      await expect(page.getByRole("link", { name: /rotas/i })).not.toBeVisible();
    });
  });

  test.describe("Operação (escopo Santos + Paranaguá)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.operacao.email, SEED_USERS.operacao.password);
    });

    test("vê rotas das filiais vinculadas", async ({ page }) => {
      await page.goto("/app/logistics/routes");
      await expectRouteCode(page, "ROT_SANTOS_CUBATAO");
      await expectRouteCode(page, "ROT_PARANAGUA_TERMINAL");
      await expectRouteCodeHidden(page, "ROT_BOTUCATU_BASE");
    });

    test("não vê ações globais de mutação", async ({ page }) => {
      await page.goto("/app/logistics/routes");
      await expect(page.getByRole("button", { name: /nova rota/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^editar$/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^desativar$/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^excluir$/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^filiais$/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^pontos$/i })).not.toBeVisible();
    });
  });
});
