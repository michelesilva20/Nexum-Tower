import { test, expect, Page } from "@playwright/test";
import { SEED_USERS, login } from "./helpers/auth";

function expectLocationCode(page: Page, code: string) {
  return expect(
    page.locator("span.font-mono").filter({ hasText: new RegExp(`^${code}$`) }),
  ).toBeVisible();
}

function expectLocationCodeHidden(page: Page, code: string) {
  return expect(
    page.locator("span.font-mono").filter({ hasText: new RegExp(`^${code}$`) }),
  ).not.toBeVisible();
}

test.describe("Locais — E2E", () => {
  test.describe("Admin (owner)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.admin.email, SEED_USERS.admin.password);
    });

    test("vê menu Locais e acessa listagem", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Locais" })).toBeVisible();
      await page.goto("/app/logistics/locations");
      await expect(page.getByRole("heading", { name: /^locais$/i })).toBeVisible();
      await expectLocationCode(page, "PORTO_SANTOS");
      await expectLocationCode(page, "TERMINAL_PARANAGUA");
    });

    test("botão Novo local visível para admin", async ({ page }) => {
      await page.goto("/app/logistics/locations");
      await expect(page.getByRole("button", { name: /novo local/i })).toBeVisible();
    });

    test("tentativa de code duplicado exibe erro", async ({ page }) => {
      await page.goto("/app/logistics/locations");
      await page.getByRole("button", { name: /novo local/i }).click();
      const drawer = page.getByRole("dialog", { name: /novo local/i });
      await expect(drawer).toBeVisible();
      await drawer.locator("select").nth(1).selectOption("PORT");
      const textInputs = drawer.locator("input:not([type]), input[type='text'], input[type='email']");
      await textInputs.nth(0).fill("PORTO_SANTOS");
      await textInputs.nth(1).fill("Local Duplicado Teste");
      await textInputs.nth(2).fill("Rua Teste 123");
      await textInputs.nth(5).fill("Santos");
      await textInputs.nth(6).fill("SP");
      await drawer.getByRole("button", { name: /Santos \(SANTOS\)/i }).click();
      await drawer.getByRole("button", { name: /^salvar$/i }).click();
      await expect(page.getByText(/não é possível reutilizar este código de local/i)).toBeVisible({
        timeout: 15_000,
      });
    });
  });

  test.describe("Viewer (locations.read)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.viewer.email, SEED_USERS.viewer.password);
    });

    test("viewer com locations.read vê menu Locais", async ({ page }) => {
      await page.goto("/app/logistics/locations");
      await expect(page.getByRole("heading", { name: /^locais$/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /novo local/i })).not.toBeVisible();
    });
  });

  test.describe("Operação (escopo Santos + Paranaguá)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.operacao.email, SEED_USERS.operacao.password);
    });

    test("vê locais das filiais vinculadas", async ({ page }) => {
      await page.goto("/app/logistics/locations");
      await expectLocationCode(page, "PORTO_SANTOS");
      await expectLocationCode(page, "TERMINAL_PARANAGUA");
      await expectLocationCodeHidden(page, "BASE_BOTUCATU");
    });

    test("não vê ações globais de mutação", async ({ page }) => {
      await page.goto("/app/logistics/locations");
      await expect(page.getByRole("button", { name: /novo local/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^editar$/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^desativar$/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^filiais$/i })).not.toBeVisible();
    });
  });

  test.describe("Operador (escopo Botucatu)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.operador.email, SEED_USERS.operador.password);
    });

    test("vê apenas BASE_BOTUCATU", async ({ page }) => {
      await page.goto("/app/logistics/locations");
      await expectLocationCode(page, "BASE_BOTUCATU");
      await expectLocationCodeHidden(page, "PORTO_SANTOS");
    });
  });
});
