import { expect, Page } from "@playwright/test";

/** Credenciais do seed local (pnpm db:seed) */
export const SEED_USERS = {
  admin: {
    email: "admin@nexumtower.local",
    password: "admin123",
  },
  viewer: {
    email: "visualizador@nexumtower.local",
    password: "test123",
  },
} as const;

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /entrar na plataforma|entrar|sign in/i }).click();
  await page.waitForURL(/\/app(\/)?$/);
}

export async function expectAccessDenied(page: Page) {
  await expect(page.getByRole("heading", { name: /acesso negado/i })).toBeVisible();
}
