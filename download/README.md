# NeonDB — Sistema de Hospedagem de Banco de Dados

Sistema completo estilo **neon.tech** para hospedagem de bancos de dados Postgres serverless, com layout preto e branco.

## Stack

- **Next.js 16** (App Router)
- **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui**
- **Prisma ORM** (SQLite para dev — troque por Postgres em produção)
- **NextAuth-style** custom auth (JWT em cookies httpOnly)
- **bcryptjs** para hash de senha

## Funcionalidades

### Landing Page
- Hero com code preview animado
- Logo cloud com marquee
- Seção de features (6 cards)
- Workflow em 4 passos
- Code showcase com CLI mockup
- Pricing com toggle mensal/anual
- CTA final + footer completo

### Autenticação
- Cadastro (`/?view=register`)
- Login (`/?view=login`)
- Logout (via API)
- Sessão persistente em cookie httpOnly (7 dias)
- Hash de senha com bcrypt

### Dashboard
- **Visão geral**: stats (projetos, branches, API keys, storage), projetos recentes, atividade, uso mensal
- **Projetos**: listar, criar (com região e versão PG), deletar
- **Detalhes do projeto**: connection strings (direct + pooled), parâmetros individuais (host, port, db, user, password, ssl), tabelas, branches, atividade, configurações, zona de perigo
- **Branches**: listar todos os branches em todos os projetos, criar novo branch
- **SQL Editor**: textarea com syntax highlighting básica, botões de exemplo, execução via API (mock), tabela de resultados, histórico
- **API Keys**: listar, criar, revelar/ocultar, copiar, deletar
- **Configurações**: perfil, preferências, segurança, zona de perigo
- **Faturamento**: plano atual, uso, planos disponíveis, método de pagamento

### APIs REST
- `POST /api/auth/register` — cadastro
- `POST /api/auth/login` — login
- `POST /api/auth/logout` — logout
- `GET /api/auth/me` — usuário atual
- `GET/POST /api/projects/list` — listar/criar projetos
- `GET /api/projects/[id]` — detalhes do projeto
- `DELETE /api/projects/[id]/delete` — deletar projeto
- `POST /api/projects/[id]/branches/create` — criar branch
- `GET/POST /api/api-keys` — listar/criar API keys
- `DELETE /api/api-keys/[id]/delete` — deletar API key
- `GET /api/stats` — estatísticas do usuário
- `GET /api/activity` — log de atividades
- `POST /api/sql` — executar query SQL (mock)

## Como rodar localmente

```bash
bun install
bun run db:push     # cria as tabelas
bun run dev         # inicia em http://localhost:3000
```

## Deploy em VPS

### 1. Preparar o servidor
```bash
# Instale Node 20+, bun, git, nginx
curl -fsSL https://bun.sh/install | bash
git clone <seu-repo> /var/www/neondb
cd /var/www/neondb
bun install
```

### 2. Configurar variáveis de ambiente
Crie `.env` na VPS:
```env
DATABASE_URL=file:/var/www/neondb/data/neondb.db
NEXTAUTH_SECRET=sua-chave-super-secreta-mudar-isso
NODE_ENV=production
```

**Para usar Postgres real em produção** (recomendado), troque o provider no `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
E configure a URL de conexão:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/neondb
```

### 3. Build e start
```bash
bun run build
bun run start   # roda em production
```

### 4. Nginx reverse proxy
```nginx
server {
  listen 80;
  server_name seu-dominio.com;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
  }
}
```

### 5. PM2 para manter rodando
```bash
npm i -g pm2
pm2 start "bun run start" --name neondb
pm2 startup
pm2 save
```

### 6. SSL com Certbot
```bash
certbot --nginx -d seu-dominio.com
```

## Para realmente provisionar bancos Postgres reais

O sistema atual usa SQLite para armazenar os metadados (projetos, branches, conexões) e gera connection strings *fictícias*. Para provisionar bancos **reais**, você precisará:

1. **Instalar Postgres na VPS** e criar um superuser dedicado
2. **Modificar `/api/projects/create/route.ts`** para, ao criar um projeto:
   - Criar um database real: `CREATE DATABASE proj_<id>;`
   - Criar um role real: `CREATE ROLE neondb_<id> WITH LOGIN PASSWORD '<senha>';`
   - Conceder privilégios: `GRANT ALL ON DATABASE proj_<id> TO neondb_<id>;`
3. **Modificar a connection string** para apontar para o host real da VPS
4. **Para branches reais**: usar `pg_dump` + `pg_restore` ou a tecnologia de branching do Postgres 17

## Estrutura de arquivos

```
src/
├── app/
│   ├── api/
│   │   ├── auth/{login,logout,register,me}/route.ts
│   │   ├── projects/{list,create,[id]/,[id]/delete,[id]/branches/create}/
│   │   ├── api-keys/{route.ts,[id]/delete/}
│   │   ├── stats/route.ts
│   │   ├── activity/route.ts
│   │   └── sql/route.ts
│   ├── globals.css        # tema B&W + fontes + animações
│   ├── layout.tsx         # Inter + JetBrains Mono
│   └── page.tsx           # roteamento client-side (landing/auth/dashboard)
├── components/
│   ├── landing/           # nav, hero, logo-cloud, features, pricing, footer
│   ├── auth/              # auth-page (login + register)
│   └── dashboard/         # shell, overview, projects, project-detail, sql-editor, api-keys, settings-billing
└── lib/
    ├── auth.ts            # JWT, hash, session
    └── db.ts              # Prisma client
```

## Licença

MIT — use à vontade.
