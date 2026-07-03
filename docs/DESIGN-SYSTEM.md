# Design System — Nexum Tower (Plataforma Interna)

Documentação do padrão visual da área autenticada do Nexum Tower.

## Identidade

- **Estética:** central de comando logística, dark premium, glassmorphism controlado
- **Tipografia:** Outfit (sans), JetBrains Mono (dados/códigos)
- **Densidade:** média — funcional sem parecer sistema legado

## Paleta (tokens CSS)

| Token | Uso |
|-------|-----|
| `--nexum-bg` | Fundo principal |
| `--nexum-bg-soft` | Fundo secundário / inputs |
| `--nexum-surface` | Cards e painéis |
| `--nexum-border` | Bordas |
| `--nexum-primary` | Ação principal (ciano) |
| `--nexum-secondary` | Destaque verde |
| `--nexum-success/warning/risk/danger` | Semânticos |
| `--nexum-*-bg` | Fundos translúcidos de badge |
| `--nexum-glass` | Superfície glass |
| `--nexum-focus-ring` | Foco acessível |

Definidos em `apps/web/app/globals.css`.

## Estrutura de layout

```txt
AppShell
├── AppSidebar (280px, grupos de menu)
├── Main
│   ├── AppTopbar (72px, busca, status, perfil)
│   └── Page content
```

Arquivos: `apps/web/components/layout/`

## Componentes (`components/ui/nexum/`)

| Componente | Uso |
|------------|-----|
| `NexumButton` | Ações primárias/secundárias |
| `NexumCard` / `NexumMetricCard` | Containers e KPIs |
| `NexumBadge` | Status genéricos |
| `NexumStatusBadge` | Status logísticos (`TripStatusKey`) |
| `NexumRiskBadge` | Risk Score 0–100 |
| `NexumDataTable` | Tabelas premium |
| `NexumInput`, `NexumFormField` | Formulários |
| `NexumModal`, `NexumDrawer` | Overlays |
| `NexumEmptyState` | Telas vazias |
| `NexumSkeleton` | Loading |
| `NexumTabs`, `NexumDropdown` | Navegação local |
| `NexumToastProvider` | Notificações |
| `PageHeader` | Título + breadcrumb + ações |

## Helpers

- `lib/status-styles.ts` — mapa de status de viagem
- `lib/risk-styles.ts` — faixas de risco
- `lib/navigation.ts` — menu lateral agrupado

## Páginas de referência

| Rota | Descrição |
|------|-----------|
| `/app` | Command Center (KPIs + tabela demo) |
| `/app/design-system` | Showcase de componentes |
| `/app/users` | Exemplo admin com `PageHeader` + `NexumDataTable` |

## Padrão de página interna

```txt
PageHeader
Filtros / ações
Conteúdo (cards, tabela)
Estados: loading (skeleton) | empty | error
```

## Responsividade

- **Desktop:** sidebar fixa, topbar completa
- **Tablet/Mobile:** sidebar vira drawer, busca oculta em telas pequenas

## Acessibilidade

- Foco visível em botões e inputs
- Labels em formulários
- `aria-label` em ícones
- Modais com `<dialog>` nativo
- Drawer fecha com ESC

## Próximos passos

1. Migrar demais páginas admin para `NexumDataTable` + `PageHeader`
2. Instalar Radix/shadcn apenas se precisar de primitivos complexos (Combobox, Command)
3. Conectar módulos operacionais quando existirem rotas reais
4. Atalho global Ctrl+K (command palette)
