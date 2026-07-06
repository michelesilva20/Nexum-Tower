import { test, expect, Page } from "@playwright/test";
import { SEED_USERS, login } from "./helpers/auth";

function expectCustomerCode(page: Page, code: string) {
  return expect(
    page.locator("span.font-mono").filter({ hasText: new RegExp(`^${code}$`) }),
  ).toBeVisible();
}

function expectCustomerCodeHidden(page: Page, code: string) {
  return expect(
    page.locator("span.font-mono").filter({ hasText: new RegExp(`^${code}$`) }),
  ).not.toBeVisible();
}

test.describe("Clientes — E2E", () => {
  test.describe("Admin (owner)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.admin.email, SEED_USERS.admin.password);
    });

    test("vê menu Clientes e acessa listagem", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Clientes" })).toBeVisible();
      await page.goto("/app/logistics/customers");
      await expect(page.getByRole("heading", { name: /^clientes$/i })).toBeVisible();
      await expectCustomerCode(page, "VALE");
      await expectCustomerCode(page, "CITROSUCO");
    });

    test("botão Novo cliente visível para admin", async ({ page }) => {
      await page.goto("/app/logistics/customers");
      await expect(page.getByRole("button", { name: /novo cliente/i })).toBeVisible();
    });

    test("tentativa de code duplicado exibe erro", async ({ page }) => {
      await page.goto("/app/logistics/customers");
      await page.getByRole("button", { name: /novo cliente/i }).click();
      const drawer = page.getByRole("dialog", { name: /novo cliente/i });
      await expect(drawer).toBeVisible();
      const textInputs = drawer.locator("input:not([type]), input[type='text'], input[type='email']");
      await textInputs.nth(0).fill("VALE");
      await textInputs.nth(1).fill("Cliente Duplicado Teste");
      await drawer.getByRole("button", { name: /Santos \(SANTOS\)/i }).click();
      await drawer.getByRole("button", { name: /^salvar$/i }).click();
      await expect(page.getByText(/não é possível reutilizar este código de cliente/i)).toBeVisible({
        timeout: 15_000,
      });
    });
  });

  test.describe("Viewer (customers.read)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.viewer.email, SEED_USERS.viewer.password);
    });

    test("viewer com customers.read vê menu Clientes", async ({ page }) => {
      await page.goto("/app/logistics/customers");
      await expect(page.getByRole("heading", { name: /^clientes$/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /novo cliente/i })).not.toBeVisible();
    });
  });

  test.describe("Operação (escopo Santos + Paranaguá)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.operacao.email, SEED_USERS.operacao.password);
    });

    test("vê clientes das filiais vinculadas", async ({ page }) => {
      await page.goto("/app/logistics/customers");
      await expectCustomerCode(page, "VALE");
      await expectCustomerCode(page, "BRF");
      await expectCustomerCode(page, "CITROSUCO");
      await expectCustomerCodeHidden(page, "AMBEV");
    });

    test("não vê ações globais de mutação", async ({ page }) => {
      await page.goto("/app/logistics/customers");
      await expect(page.getByRole("button", { name: /novo cliente/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^editar$/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^desativar$/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /^filiais$/i })).not.toBeVisible();
    });
  });

  test.describe("Operador (escopo Botucatu)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.operador.email, SEED_USERS.operador.password);
    });

    test("vê apenas CITROSUCO (Botucatu)", async ({ page }) => {
      await page.goto("/app/logistics/customers");
      await expectCustomerCode(page, "CITROSUCO");
      await expectCustomerCodeHidden(page, "VALE");
    });
  });
});
