import { test, expect, Page } from "@playwright/test";
import { SEED_USERS, expectAccessDenied, login } from "./helpers/auth";

function expectBranchCode(page: Page, code: string) {
  return expect(
    page.locator("span.font-mono").filter({ hasText: new RegExp(`^${code}$`) }),
  ).toBeVisible();
}

function expectBranchCodeHidden(page: Page, code: string) {
  return expect(
    page.locator("span.font-mono").filter({ hasText: new RegExp(`^${code}$`) }),
  ).not.toBeVisible();
}

test.describe("Filiais — E2E", () => {
  test.describe("Admin (owner)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.admin.email, SEED_USERS.admin.password);
    });

    test("vê menu Filiais e acessa listagem", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Filiais" })).toBeVisible();
      await page.goto("/app/admin/branches");
      await expect(page.getByRole("heading", { name: /filiais/i })).toBeVisible();
      await expectBranchCode(page, "MATRIZ");
      await expectBranchCode(page, "SANTOS");
    });

    test("botão Nova filial visível para admin", async ({ page }) => {
      await page.goto("/app/admin/branches");
      await expect(page.getByRole("button", { name: /nova filial/i })).toBeVisible();
    });
  });

  test.describe("Viewer (sem permissão)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.viewer.email, SEED_USERS.viewer.password);
    });

    test("não vê menu Filiais", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Filiais" })).not.toBeVisible();
    });

    test("acesso direto cai em access denied", async ({ page }) => {
      await page.goto("/app/admin/branches");
      await expectAccessDenied(page);
    });
  });

  test.describe("Operação (escopo limitado)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.operacao.email, SEED_USERS.operacao.password);
    });

    test("vê apenas filiais vinculadas", async ({ page }) => {
      await page.goto("/app/admin/branches");
      await expect(page.getByRole("heading", { name: /filiais/i })).toBeVisible();
      await expectBranchCode(page, "SANTOS");
      await expectBranchCode(page, "PARANAGUA");
      await expectBranchCodeHidden(page, "BOTUCATU");
    });

    test("não vê botão Nova filial", async ({ page }) => {
      await page.goto("/app/admin/branches");
      await expect(page.getByRole("button", { name: /nova filial/i })).not.toBeVisible();
    });
  });

  test.describe("Operador (escopo Botucatu)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.operador.email, SEED_USERS.operador.password);
    });

    test("vê apenas Botucatu", async ({ page }) => {
      await page.goto("/app/admin/branches");
      await expectBranchCode(page, "BOTUCATU");
      await expectBranchCodeHidden(page, "SANTOS");
    });
  });
});
