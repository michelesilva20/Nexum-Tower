import { test, expect, Page } from "@playwright/test";
import { SEED_USERS, login } from "./helpers/auth";

function expectDriverCode(page: Page, code: string) {
  return expect(
    page.locator("span.font-mono").filter({ hasText: new RegExp(`^${code}$`) }),
  ).toBeVisible();
}

function expectDriverCodeHidden(page: Page, code: string) {
  return expect(
    page.locator("span.font-mono").filter({ hasText: new RegExp(`^${code}$`) }),
  ).not.toBeVisible();
}

test.describe("Motoristas — E2E", () => {
  test.describe("Admin (owner)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.admin.email, SEED_USERS.admin.password);
    });

    test("vê menu Motoristas e acessa listagem", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Motoristas" })).toBeVisible();
      await page.goto("/app/logistics/drivers");
      await expect(page.getByRole("heading", { name: /^motoristas$/i })).toBeVisible();
      await expectDriverCode(page, "MOT_JOAO_SANTOS");
      await expectDriverCode(page, "MOT_MARCOS_PARANAGUA");
      await expectDriverCode(page, "MOT_CARLOS_BOTUCATU");
      await expectDriverCode(page, "MOT_ROBERTO_MATRIZ");
      await expectDriverCode(page, "MOT_FERNANDO_RONDONOPOLIS");
    });

    test("botão Novo motorista visível para admin", async ({ page }) => {
      await page.goto("/app/logistics/drivers");
      await expect(page.getByRole("button", { name: /novo motorista/i })).toBeVisible();
    });

    test("tentativa de code duplicado exibe erro", async ({ page }) => {
      await page.goto("/app/logistics/drivers");
      await page.getByRole("button", { name: /novo motorista/i }).click();
      const drawer = page.getByRole("dialog", { name: /novo motorista/i });
      await expect(drawer).toBeVisible();
      const textInputs = drawer.locator("input:not([type]), input[type='text'], input[type='email']");
      await textInputs.nth(0).fill("MOT_JOAO_SANTOS");
      await textInputs.nth(1).fill("Motorista Duplicado Teste");
      await drawer.getByRole("button", { name: /Santos \(SANTOS\)/i }).click();
      await drawer.getByRole("button", { name: /^salvar$/i }).click();
      await expect(
        page.getByText(/não é possível reutilizar este código de motorista/i),
      ).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe("Viewer (drivers.read)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.viewer.email, SEED_USERS.viewer.password);
    });

    test("viewer com drivers.read vê menu Motoristas", async ({ page }) => {
      await page.goto("/app/logistics/drivers");
      await expect(page.getByRole("heading", { name: /^motoristas$/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /novo motorista/i })).not.toBeVisible();
    });
  });

  test.describe("Financeiro (sem drivers.read)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.financeiro.email, SEED_USERS.financeiro.password);
    });

    test("não vê menu Motoristas", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Motoristas" })).not.toBeVisible();
    });
  });

  test.describe("Operação (escopo Santos + Paranaguá)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.operacao.email, SEED_USERS.operacao.password);
    });

    test("vê motoristas das filiais vinculadas", async ({ page }) => {
      await page.goto("/app/logistics/drivers");
      await expectDriverCode(page, "MOT_JOAO_SANTOS");
      await expectDriverCode(page, "MOT_MARCOS_PARANAGUA");
      await expectDriverCodeHidden(page, "MOT_CARLOS_BOTUCATU");
    });

    test("não vê ações globais de mutação", async ({ page }) => {
      await page.goto("/app/logistics/drivers");
      await expect(page.getByRole("button", { name: /novo motorista/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^editar$/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^desativar$/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^excluir$/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^filiais$/i })).not.toBeVisible();
    });
  });
});
