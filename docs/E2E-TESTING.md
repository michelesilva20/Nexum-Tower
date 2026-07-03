# E2E Testing — Nexum Tower

Testes end-to-end com Playwright para validar fluxos críticos do Core Platform.

---

## Instalação

```bash
# Dependência já incluída no monorepo
pnpm install

# Instalar browser Chromium (primeira vez)
pnpm exec playwright install chromium
```

---

## Como rodar

```bash
# Pré-requisito: banco migrado e seed aplicado
pnpm db:migrate
pnpm db:seed

# Com servidores já rodando (pnpm dev em outro terminal)
pnpm test:e2e

# Modo UI interativo
pnpm test:e2e:ui

# Playwright sobe pnpm dev automaticamente se não houver servidor
# (reuseExistingServer=true fora do CI)
```

---

## Usuários do seed

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin (owner) | `admin@nexumtower.local` | `admin123` |
| Viewer | `visualizador@nexumtower.local` | `test123` |

---

## Fluxos cobertos

Arquivo: `tests/e2e/core-platform.spec.ts`

**Admin:**

- Login e acesso ao Command Center
- Menus administrativos visíveis
- Acesso a `/app/admin/users`, `/app/settings`, `/app/admin/audit`
- Logout

**Viewer:**

- Login
- Menus admin ocultos
- Acesso direto a `/app/admin/users` → access denied

---

## Estrutura

```txt
tests/e2e/
├── core-platform.spec.ts
└── helpers/
    └── auth.ts          # login(), expectAccessDenied()

playwright.config.ts     # baseURL: http://localhost:3000/pt
```

---

## CI

Job `e2e` no GitHub Actions roda em push para `main`:

- PostgreSQL service container
- migrate + seed
- `pnpm test:e2e` (sobe `pnpm dev` via webServer)

---

## Problemas comuns (Windows)

| Problema | Solução |
|----------|---------|
| `pnpm dev` já rodando | Playwright reutiliza servidor (`reuseExistingServer`) |
| Login falha 401 | Rodar `pnpm db:seed` |
| EPERM no Prisma generate | Parar `pnpm dev`, rodar `pnpm db:generate`, reiniciar |
| Browser não instalado | `pnpm exec playwright install chromium` |
| Porta 3000 ocupada | Definir `PLAYWRIGHT_PORT=3001` e ajustar config |

---

## Adicionar novos testes

Ao criar módulo operacional, adicionar specs em `tests/e2e/`:

```typescript
test("operador vê viagens mas não edita", async ({ page }) => {
  await login(page, "operador@nexumtower.local", "test123");
  // ...
});
```

Sempre usar credenciais do seed e PermissionGate no frontend + guards no backend.
