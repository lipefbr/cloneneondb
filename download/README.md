# NeonDB — Sistema de Hospedagem de Banco de Dados

Sistema completo estilo **neon.tech** para hospedagem de bancos de dados Postgres serverless, com layout preto e branco. **Provisiona bancos Postgres REAIS** quando rodado em uma VPS.

## O que o sistema faz

- **Landing page** estilo neon.tech (B&W)
- **Autenticação**: cadastro/login com bcrypt + JWT
- **Dashboard**: criar projetos → cada projeto provisiona um **banco Postgres real**
- **Connection strings reais**: cada projeto tem uma URI `postgresql://...` que funciona de qualquer lugar
- **Branches**: cada branch é uma cópia real do banco (via `CREATE DATABASE WITH TEMPLATE`)
- **SQL Editor**: executa queries reais no banco do usuário
- **API Keys**: gerar, listar, deletar
- **Settings e Billing** completos

## Deploy em VPS — Uma linha

A maneira mais fácil de rodar em produção é usar o script `install.sh` incluso no repositório:

```bash
# Em uma VPS Ubuntu 20.04+ ou Debian 11+ limpa
curl -fsSL https://raw.githubusercontent.com/lipefbr/neonclone/main/install.sh -o install.sh
sudo bash install.sh
```

O script pergunta domínio/IP e email, e faz tudo automaticamente:

1. Instala Node.js 20, Bun, Postgres 16, Nginx, PM2, Certbot
2. Configura o Postgres com superuser e senha forte
3. Libera conexões externas (porta 5432) com autenticação md5
4. Clona o repo, instala dependências
5. Cria `.env` com todas as variáveis
6. Compila com `bun run build`
7. Inicia com PM2 (auto-start no boot)
8. Configura Nginx como reverse proxy
9. Configura SSL com Let's Encrypt (se tiver domínio)

**Depois de ~5 minutos**, usuários podem:
- Acessar `https://seu-dominio.com`
- Criar conta
- Criar um projeto → recebe uma connection string **real**
- Conectar a partir de qualquer app externo via `psql`, `pg`, `psycopg2`, etc.

## Deploy manual (passo a passo)

### 1. Preparar a VPS

```bash
# Ubuntu 20.04+ ou Debian 11+
sudo apt update && sudo apt install -y curl wget gnupg2 ca-certificates lsb-release \
  software-properties-common build-essential git ufw nginx

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# Bun
curl -fsSL https://bun.sh/install | bash
sudo ln -sf ~/.bun/bin/bun /usr/local/bin/bun

# PM2
sudo npm install -g pm2

# PostgreSQL 16
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16
```

### 2. Configurar PostgreSQL

```bash
# Definir senha do superuser postgres
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'SUA_SENHA_FORTE_AQUI';"

# Permitir conexões externas
echo "host    all    all    0.0.0.0/0    md5" | sudo tee -a /etc/postgresql/16/main/pg_hba.conf
echo "host    all    all    ::/0         md5" | sudo tee -a /etc/postgresql/16/main/pg_hba.conf

# Escutar em todas as interfaces
sudo sed -i "s/^#listen_addresses = .*/listen_addresses = '*'/" /etc/postgresql/16/main/postgresql.conf

sudo systemctl restart postgresql

# Abrir portas no firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5432/tcp
echo "y" | sudo ufw enable
```

### 3. Clonar e configurar o app

```bash
sudo useradd -m -s /bin/bash neondb
sudo mkdir -p /opt/neondb
sudo chown -R neondb:neondb /opt/neondb

sudo -u neondb git clone https://github.com/lipefbr/neonclone.git /opt/neondb
cd /opt/neondb
sudo -u neondb bun install
```

### 4. Criar `.env`

```bash
sudo -u neondb tee /opt/neondb/.env <<EOF
DATABASE_URL=file:/opt/neondb/data/neondb.db
NEXTAUTH_SECRET=$(openssl rand -base64 48)
PG_SUPERUSER_USER=postgres
PG_SUPERUSER_PASSWORD=SUA_SENHA_FORTE_AQUI
PG_SUPERUSER_HOST=localhost
PG_SUPERUSER_PORT=5432
PUBLIC_HOST=seu-dominio.com
NODE_ENV=production
NEXTAUTH_URL=https://seu-dominio.com
EOF

sudo -u neondb mkdir -p /opt/neondb/data
sudo chmod 600 /opt/neondb/.env
```

### 5. Aplicar schema e buildar

```bash
cd /opt/neondb
sudo -u neondb bun run db:push
sudo -u neondb bun run build
```

### 6. Iniciar com PM2

```bash
sudo -u neondb bash -c "cd /opt/neondb && pm2 start 'bun run start' --name neondb"
sudo -u neondb pm2 save
sudo -u neondb pm2 startup systemd -u neondb --hp /home/neondb | tail -1 | bash
```

### 7. Configurar Nginx

```bash
sudo tee /etc/nginx/sites-available/neondb <<EOF
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        client_max_body_size 50m;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/neondb /etc/nginx/sites-enabled/neondb
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 8. SSL com Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com --non-interactive --agree-tos -m voce@email.com --redirect
```

## Variáveis de ambiente

| Variável | Descrição | Default |
|----------|-----------|---------|
| `DATABASE_URL` | URL do banco de metadados (SQLite) | `file:./data/neondb.db` |
| `NEXTAUTH_SECRET` | Chave secreta para JWT (qualquer string aleatória) | obrigatório |
| `PG_SUPERUSER_USER` | User do Postgres superuser | `postgres` |
| `PG_SUPERUSER_PASSWORD` | Senha do Postgres superuser | obrigatório |
| `PG_SUPERUSER_HOST` | Host do Postgres | `localhost` |
| `PG_SUPERUSER_PORT` | Porta do Postgres | `5432` |
| `PUBLIC_HOST` | Host público (IP ou domínio) que usuários usam para conectar | `localhost` |
| `NODE_ENV` | `production` ou `development` | `development` |

## Como funciona o provisionamento de bancos

Quando um usuário cria um projeto pela UI:

1. A API `/api/projects/create` chama `provisionDatabase()` em `src/lib/postgres-admin.ts`
2. Esta função conecta ao Postgres como superuser
3. Cria um **role** Postgres real: `CREATE ROLE neondb_<id> WITH LOGIN PASSWORD '...';`
4. Cria um **database** real: `CREATE DATABASE proj_<id> OWNER neondb_<id>;`
5. Concede privilégios completos
6. Habilita extensões `uuid-ossp` e `pgcrypto`
7. Salva a connection string completa no banco de metadados
8. Retorna a URI para a UI mostrar ao usuário

Quando um usuário cria um branch:

1. A API chama `cloneDatabase()`
2. Cria um novo role + database
3. Usa `CREATE DATABASE WITH TEMPLATE <source>` para copiar schema e dados
4. Salva a nova connection string

Quando o usuário executa uma query no SQL Editor:

1. A API `/api/sql` verifica permissão do usuário sobre o projeto
2. Pega a connection string real do banco
3. Chama `executeUserQuery()` que conecta ao banco **como o role do usuário** (não como superuser)
4. Executa a query com timeout de 30s
5. Retorna colunas, linhas, rowCount e tempo de execução

## Segurança

- **Senhas**: hash bcrypt com salt 10
- **Sessões**: JWT em cookie httpOnly (7 dias)
- **Isolamento**: cada projeto tem seu próprio role Postgres com acesso apenas ao seu database
- **SQL Editor**: conecta como o role do usuário (não superuser) — usuários não podem ver bancos de outros
- **Firewall**: o script abre 5432 para acesso externo (necessário para os clientes conectarem). Se quiser restringir, edite `/etc/postgresql/16/main/pg_hba.conf`

## Comandos úteis após deploy

```bash
# Ver status da app
pm2 status

# Ver logs
pm2 logs neondb

# Reiniciar
pm2 restart neondb

# Atualizar código
cd /opt/neondb && git pull && bun install && bun run build && pm2 restart neondb

# Reiniciar Postgres
sudo systemctl restart postgresql

# Listar bancos criados
sudo -u postgres psql -c "\l"

# Listar roles
sudo -u postgres psql -c "\du"

# Conectar ao banco de metadados
sudo -u neondb sqlite3 /opt/neondb/data/neondb.db ".tables"
```

## Licença

MIT — use à vontade.
