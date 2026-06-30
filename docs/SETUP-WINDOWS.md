# Setup — Windows

Guia rápido para configurar o ambiente local no Windows.

## Pré-requisitos

1. **Node.js 20+** — [nodejs.org](https://nodejs.org)
2. **pnpm 9+** — `npm install -g pnpm`
3. **PostgreSQL 18** — instalado em `C:\Program Files\PostgreSQL\18`

## PostgreSQL

### Verificar se o serviço está rodando

Abra *Serviços* do Windows e confirme que `postgresql-x64-18` está em execução.

### Criar o banco `nexum_tower`

```powershell
$env:PGPASSWORD = "admin"
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres nexum_tower
```

Se o banco já existir, o comando retornará erro — isso é normal.

### Testar conexão

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d nexum_tower -c "\dt"
```

## Variáveis de ambiente

Na raiz do projeto:

```powershell
copy .env.example .env
```

Edite `.env` e configure:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/nexum_tower?schema=public"
```

Repita em `packages/database`:

```powershell
copy packages\database\.env.example packages\database\.env
```

## Instalação e execução

```powershell
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Solução de problemas

| Problema | Solução |
|----------|---------|
| `ECONNREFUSED` no Prisma | Verifique se o PostgreSQL está rodando |
| Senha incorreta | Confira `DATABASE_URL` nos arquivos `.env` |
| Porta 3000 ou 3333 em uso | Encerre o processo ou altere a porta no `.env` |
| `createdb` não encontrado | Use o caminho completo do binário PostgreSQL 18 |

## Ferramentas úteis

- **Prisma Studio**: `pnpm db:studio`
- **Health check API**: http://localhost:3333/health
- **Frontend**: http://localhost:3000
