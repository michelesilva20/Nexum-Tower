import { test, expect } from "@playwright/test";
import { SEED_USERS, expectAccessDenied, login } from "./helpers/auth";

test.describe("Nexum Core Platform — E2E", () => {
  test.describe("Admin (owner)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.admin.email, SEED_USERS.admin.password);
    });

    test("admin acessa Command Center", async ({ page }) => {
      await expect(page).toHaveURL(/\/app/);
      await expect(page.getByText(/command center|nexum tower command center/i).first()).toBeVisible();
    });

    test("admin vê menus administrativos", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Usuários" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Filiais" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Grupos" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Papéis" })).toBeVisible();
    });

    test("admin acessa /app/admin/branches", async ({ page }) => {
      await page.goto("/app/admin/branches");
      await expect(page.getByRole("heading", { name: /filiais/i })).toBeVisible();
    });

    test("admin acessa /app/admin/users", async ({ page }) => {
      await page.goto("/app/admin/users");
      await expect(page.getByRole("heading", { name: /usuários/i })).toBeVisible();
    });

    test("admin acessa /app/settings", async ({ page }) => {
      await page.goto("/app/settings");
      await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
    });

    test("admin acessa /app/admin/audit", async ({ page }) => {
      await page.goto("/app/admin/audit");
      await expect(page.getByRole("heading", { name: /auditoria/i })).toBeVisible();
    });

    test("logout funciona", async ({ page }) => {
      await page.getByRole("button", { name: "Sair" }).click();
      await page.waitForURL(/\/login/);
    });
  });

  test.describe("Viewer (somente leitura)", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, SEED_USERS.viewer.email, SEED_USERS.viewer.password);
    });

    test("viewer não vê menus administrativos", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Usuários" })).not.toBeVisible();
      await expect(page.getByRole("link", { name: "Filiais" })).not.toBeVisible();
      await expect(page.getByRole("link", { name: "Grupos" })).not.toBeVisible();
    });

    test("viewer tentando acessar /app/admin/users cai em access denied", async ({ page }) => {
      await page.goto("/app/admin/users");
      await expectAccessDenied(page);
    });
  });
});
