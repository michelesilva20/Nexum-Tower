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
  operacao: {
    email: "operacao@nexumtower.local",
    password: "test123",
  },
  operador: {
    email: "operador@nexumtower.local",
    password: "test123",
  },
} as const;

/** Aguarda API + Web prontos (Nest compila na primeira subida). */
export async function waitForStackReady(timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const [api, web] = await Promise.all([
        fetch("http://localhost:3333/health"),
        fetch("http://localhost:3000/pt/login"),
      ]);
      if (api.ok && web.ok) return;
    } catch {
      // stack ainda subindo
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("Stack E2E não ficou pronta (API :3333 + Web :3000).");
}

export async function login(page: Page, email: string, password: string) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await page.goto("/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.locator("form button[type='submit']").click();

    try {
      await page.waitForURL(/\/app/, { timeout: 20_000 });
      return;
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await page.waitForTimeout(2000);
    }
  }
}

export async function expectAccessDenied(page: Page) {
  await expect(page.getByRole("heading", { name: /acesso negado|access denied/i })).toBeVisible();
}
