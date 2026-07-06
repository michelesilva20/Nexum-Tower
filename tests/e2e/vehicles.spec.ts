import { test, expect, Page } from "@playwright/test";
import { SEED_USERS, login } from "./helpers/auth";

function expectVehicleCode(page: Page, code: string) {
  return expect(
    page.locator("span.font-mono").filter({ hasText: new RegExp(`^${code}$`) }),
  ).toBeVisible();
}

function expectVehicleCodeHidden(page: Page, code: string) {
  return expect(
    page.locator("span.font-mono").filter({ hasText: new RegExp(`^${code}$`) }),
  ).not.toBeVisible();
}

test.describe("Veículos — E2E", () => {
  test.describe("Admin (owner)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.admin.email, SEED_USERS.admin.password);
    });

    test("vê menu Veículos e acessa listagem", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Veículos" })).toBeVisible();
      await page.goto("/app/logistics/vehicles");
      await expect(page.getByRole("heading", { name: /^veículos$/i })).toBeVisible();
      await expectVehicleCode(page, "VEI_CAVALO_SANTOS_001");
      await expectVehicleCode(page, "VEI_CARRETA_PARANAGUA_001");
    });

    test("botão Novo veículo visível para admin", async ({ page }) => {
      await page.goto("/app/logistics/vehicles");
      await expect(page.getByRole("button", { name: /novo veículo/i })).toBeVisible();
    });

    test("tentativa de code duplicado exibe erro", async ({ page }) => {
      await page.goto("/app/logistics/vehicles");
      await page.getByRole("button", { name: /novo veículo/i }).click();
      const drawer = page.getByRole("dialog", { name: /novo veículo/i });
      await expect(drawer).toBeVisible();
      const textInputs = drawer.locator("input:not([type]), input[type='text'], input[type='email']");
      await textInputs.nth(0).fill("VEI_CAVALO_SANTOS_001");
      await textInputs.nth(1).fill("ZZZ9Z99");
      await textInputs.nth(5).fill("Marca Teste");
      await textInputs.nth(6).fill("Modelo Teste");
      await drawer.getByRole("button", { name: /Santos \(SANTOS\)/i }).click();
      await drawer.getByRole("button", { name: /^salvar$/i }).click();
      await expect(
        page.getByText(/não é possível reutilizar este código de veículo/i),
      ).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe("Viewer (vehicles.read)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.viewer.email, SEED_USERS.viewer.password);
    });

    test("viewer com vehicles.read vê menu Veículos", async ({ page }) => {
      await page.goto("/app/logistics/vehicles");
      await expect(page.getByRole("heading", { name: /^veículos$/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /novo veículo/i })).not.toBeVisible();
    });
  });

  test.describe("Financeiro (sem vehicles.read)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.financeiro.email, SEED_USERS.financeiro.password);
    });

    test("não vê menu Veículos", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Veículos" })).not.toBeVisible();
    });
  });

  test.describe("Operação (escopo Santos + Paranaguá)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.operacao.email, SEED_USERS.operacao.password);
    });

    test("vê veículos das filiais vinculadas", async ({ page }) => {
      await page.goto("/app/logistics/vehicles");
      await expectVehicleCode(page, "VEI_CAVALO_SANTOS_001");
      await expectVehicleCode(page, "VEI_CARRETA_PARANAGUA_001");
      await expectVehicleCodeHidden(page, "VEI_TRUCK_BOTUCATU_001");
    });

    test("não vê ações globais de mutação", async ({ page }) => {
      await page.goto("/app/logistics/vehicles");
      await expect(page.getByRole("button", { name: /novo veículo/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^editar$/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^desativar$/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^excluir$/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^filiais$/i })).not.toBeVisible();
    });
  });
});
