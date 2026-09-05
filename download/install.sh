#!/usr/bin/env bash
# NeonDB - VPS Installation Script
# Usage:
#   sudo bash install.sh
#
# This script:
# 1. Installs Node.js 20, Bun, Postgres 16, Nginx, PM2, Certbot
# 2. Creates a Postgres superuser for NeonDB to provision databases
# 3. Clones the repo and configures environment
# 4. Builds and starts the app with PM2
# 5. Configures Nginx as reverse proxy
# 6. Optionally sets up SSL with Let's Encrypt
#
# After running, you'll have a fully functional NeonDB clone where:
# - Users can register/login
# - Each "project" creates a REAL Postgres database
# - Connection strings are REAL and work from anywhere
# - The SQL editor runs REAL queries on the user's database

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()      { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()    { echo -e "${RED}[FAIL]${NC}  $*"; exit 1; }

# Must run as root or with sudo
if [[ $EUID -ne 0 ]]; then
  fail "Rode como root ou com sudo: sudo bash install.sh"
fi

# Detect OS
if [[ -f /etc/os-release ]]; then
  . /etc/os-release
  OS=$ID
  VER=$VERSION_ID
  info "OS detectado: $PRETTY_NAME"
else
  fail "Não foi possível detectar o sistema operacional. Use Ubuntu 20.04+ ou Debian 11+."
fi

if [[ "$OS" != "ubuntu" && "$OS" != "debian" ]]; then
  warn "Sistema $OS não é oficialmente suportado. Continuando mesmo assim..."
fi

# ============================================================
# COLLECT CONFIGURATION
# ============================================================
echo ""
echo "=========================================="
echo "  NeonDB - Configuração"
echo "=========================================="
echo ""

read -rp "Domínio ou IP público da VPS (ex: neondb.seudominio.com ou 203.0.113.10): " PUBLIC_HOST
PUBLIC_HOST=${PUBLIC_HOST:-$(curl -s ifconfig.me)}
info "Host público: $PUBLIC_HOST"

read -rp "Email do admin (para SSL Let's Encrypt) [admin@${PUBLIC_HOST}]: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@${PUBLIC_HOST}"}

read -rp "Senha do superuser postgres (deixe vazio para gerar uma): " PG_SUPER_PASS
if [[ -z "$PG_SUPER_PASS" ]]; then
  PG_SUPER_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 28)
  info "Senha gerada automaticamente (guarde em local seguro!)"
fi

REPO_URL=${REPO_URL:-"https://github.com/lipefbr/neonclone.git"}
APP_DIR=${APP_DIR:-"/opt/neondb"}
APP_PORT=${APP_PORT:-3000}
APP_USER=${APP_USER:-"neondb"}

echo ""
info "Resumo da configuração:"
echo "  Host público:      $PUBLIC_HOST"
echo "  Email admin:       $ADMIN_EMAIL"
echo "  Repo:              $REPO_URL"
echo "  Diretório:         $APP_DIR"
echo "  Porta:             $APP_PORT"
echo "  Usuário sistema:   $APP_USER"
echo ""
read -rp "Confirma? (s/N): " CONFIRM
[[ "$CONFIRM" =~ ^[sSyY]$ ]] || fail "Instalação cancelada."

# ============================================================
# 1. INSTALL SYSTEM PACKAGES
# ============================================================
echo ""
info "Atualizando sistema e instalando pacotes base..."

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl wget gnupg2 ca-certificates lsb-release \
  software-properties-common build-essential git ufw \
  nginx certbot python3-certbot-nginx unzip

# Node.js 20 (LTS)
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  info "Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
ok "Node.js: $(node -v)"

# Bun
if ! command -v bun &>/dev/null; then
  info "Instalando Bun..."
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  # Make bun available system-wide
  ln -sf "$BUN_INSTALL/bin/bun" /usr/local/bin/bun
fi
ok "Bun: $(bun --version)"

# Postgres 16
if ! command -v psql &>/dev/null; then
  info "Instalando PostgreSQL 16..."
  sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
  apt-get update -y
  apt-get install -y postgresql-16 postgresql-contrib-16
fi
ok "PostgreSQL: $(psql --version)"

# PM2
if ! command -v pm2 &>/dev/null; then
  info "Instalando PM2..."
  npm install -g pm2
fi
ok "PM2: $(pm2 --version)"

# ============================================================
# 2. CONFIGURE POSTGRESQL
# ============================================================
echo ""
info "Configurando PostgreSQL..."

# Ensure Postgres is running
systemctl enable postgresql
systemctl start postgresql

# Set the postgres superuser password
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$PG_SUPER_PASS';"

# Allow connections from anywhere (so users can connect to their databases)
PG_HBA=$(find /etc/postgresql -name pg_hba.conf | head -1)
PG_CONF=$(find /etc/postgresql -name postgresql.conf | head -1)

info "Configurando $PG_HBA para permitir conexões externas..."
# Add rules for password-based auth from anywhere
if ! grep -q "neondb-allow" "$PG_HBA"; then
  cat >> "$PG_HBA" <<EOF

# neondb-allow: permit auth from anywhere with md5
host    all    all    0.0.0.0/0    md5
host    all    all    ::/0         md5
EOF
fi

info "Configurando $PG_CONF para escutar em todas as interfaces..."
sed -i "s/^#listen_addresses = .*/listen_addresses = '*'  # neondb/" "$PG_CONF"
sed -i "s/^#password_encryption = .*/password_encryption = scram-sha-256/" "$PG_CONF"

# Detect RAM and optimize for ~200 databases target
TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
TOTAL_RAM_GB=$((TOTAL_RAM_KB / 1024 / 1024))
SHARED_BUFFERS_MB=$((TOTAL_RAM_KB / 1024 / 4))    # 25% of RAM
EFFECTIVE_CACHE_MB=$((TOTAL_RAM_KB / 1024 * 3 / 4)) # 75% of RAM
info "RAM detectada: ${TOTAL_RAM_GB}GB — otimizando para ~200 bancos"
info "  shared_buffers = ${SHARED_BUFFERS_MB}MB"
info "  effective_cache_size = ${EFFECTIVE_CACHE_MB}MB"

# Append NeonDB tuning block (idempotent — check marker)
if ! grep -q "neondb-tuning" "$PG_CONF"; then
  cat >> "$PG_CONF" <<EOF

# neondb-tuning: optimized for ~200 databases on ${TOTAL_RAM_GB}GB RAM
max_connections = 200
shared_buffers = ${SHARED_BUFFERS_MB}MB
effective_cache_size = ${EFFECTIVE_CACHE_MB}MB
work_mem = 16MB
maintenance_work_mem = 256MB
max_files_per_process = 1000
wal_buffers = 16MB
random_page_cost = 1.1
effective_io_concurrency = 200
log_min_duration_statement = 1000
log_connections = off
log_disconnections = off
track_activities = on
track_counts = on
EOF
fi

systemctl restart postgresql
ok "PostgreSQL configurado: max_connections=200, tuning para ~200 bancos"

# Open port 5432 in firewall
if command -v ufw &>/dev/null; then
  ufw allow 22/tcp || true
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
  ufw allow 5432/tcp || true
  echo "y" | ufw enable 2>/dev/null || true
  ok "Firewall: portas 22, 80, 443 e 5432 liberadas"
fi

# ============================================================
# 3. CREATE SYSTEM USER + APP DIRECTORY
# ============================================================
echo ""
info "Criando usuário $APP_USER e diretório $APP_DIR..."

if ! id -u "$APP_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$APP_USER"
fi

mkdir -p "$APP_DIR"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

# ============================================================
# 4. CLONE REPO AND INSTALL
# ============================================================
echo ""
info "Clonando repositório..."

if [[ -d "$APP_DIR/.git" ]]; then
  info "Repo já existe em $APP_DIR — fazendo pull..."
  sudo -u "$APP_USER" git -C "$APP_DIR" pull || warn "Pull falhou, continuando com o código existente"
else
  sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
info "Instalando dependências..."
sudo -u "$APP_USER" bun install

# ============================================================
# 5. CONFIGURE ENVIRONMENT
# ============================================================
echo ""
info "Configurando variáveis de ambiente..."

# Generate app secret
APP_SECRET=$(openssl rand -base64 48)

# Determine PUBLIC_HOST (use IP if no domain was given)
if [[ "$PUBLIC_HOST" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  info "Usando IP público: $PUBLIC_HOST (sem SSL)"
  USE_SSL=false
else
  USE_SSL=true
fi

# Create .env
cat > "$APP_DIR/.env" <<EOF
# NeonDB - Production Environment
# Generated by install.sh on $(date)

# Database (SQLite for app metadata — NeonDB's own state)
DATABASE_URL=file:$APP_DIR/data/neondb.db

# Auth secret (for JWT signing)
NEXTAUTH_SECRET=$APP_SECRET

# Postgres superuser credentials (used to provision user databases)
PG_SUPERUSER_USER=postgres
PG_SUPERUSER_PASSWORD=$PG_SUPER_PASS
PG_SUPERUSER_HOST=localhost
PG_SUPERUSER_PORT=5432

# Public host where users will connect to their databases
PUBLIC_HOST=$PUBLIC_HOST

# Next.js
NODE_ENV=production
NEXTAUTH_URL=http${USE_SSL:+s}://$PUBLIC_HOST
EOF

chown "$APP_USER":"$APP_USER" "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"
ok "Arquivo .env criado em $APP_DIR/.env"

# Create data directory for SQLite
mkdir -p "$APP_DIR/data"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR/data"

# ============================================================
# 6. PUSH DATABASE SCHEMA
# ============================================================
echo ""
info "Aplicando schema Prisma ao banco de metadados..."
sudo -u "$APP_USER" bash -c "cd $APP_DIR && bun run db:push"
ok "Schema aplicado"

# ============================================================
# 7. BUILD THE APP
# ============================================================
echo ""
info "Compilando a aplicação..."
sudo -u "$APP_USER" bash -c "cd $APP_DIR && bun run build" || fail "Falha no build"
ok "Build concluído"

# ============================================================
# 8. START WITH PM2
# ============================================================
echo ""
info "Iniciando com PM2..."

# Kill any existing process on APP_PORT
pm2 delete neondb 2>/dev/null || true

sudo -u "$APP_USER" bash -c "cd $APP_DIR && pm2 start 'bun run start' --name neondb --cwd $APP_DIR"
sudo -u "$APP_USER" bash -c "pm2 save"

# Configure PM2 to start on boot
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" 2>/dev/null | tail -1 | bash 2>/dev/null || true
ok "App rodando em porta $APP_PORT com PM2 (nome: neondb)"

# ============================================================
# 9. CONFIGURE NGINX
# ============================================================
echo ""
info "Configurando Nginx..."

cat > /etc/nginx/sites-available/neondb <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $PUBLIC_HOST;

    # Main app
    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        # Allow large SQL queries
        client_max_body_size 50m;
    }
}
EOF

ln -sf /etc/nginx/sites-available/neondb /etc/nginx/sites-enabled/neondb
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
ok "Nginx configurado para $PUBLIC_HOST"

# ============================================================
# 10. SSL WITH LET'S ENCRYPT (only if domain, not IP)
# ============================================================
if [[ "$USE_SSL" == "true" ]]; then
  echo ""
  info "Configurando SSL com Let's Encrypt..."
  certbot --nginx -d "$PUBLIC_HOST" --non-interactive --agree-tos -m "$ADMIN_EMAIL" --redirect || {
    warn "Falha ao configurar SSL. Você pode tentar depois com:"
    warn "  certbot --nginx -d $PUBLIC_HOST"
  }
  ok "SSL configurado"
else
  warn "Sem domínio — SSL não configurado. Para habilitar, aponte um domínio para este IP e rode:"
  warn "  certbot --nginx -d SEU_DOMINIO"
fi

# ============================================================
# 11. PRINT SUMMARY
# ============================================================
echo ""
echo "=========================================="
echo -e "${GREEN}  NeonDB INSTALADO COM SUCESSO!${NC}"
echo "=========================================="
echo ""
echo "Acesse:    http${USE_SSL:+s}://$PUBLIC_HOST"
echo ""
echo "Credenciais do PostgreSQL superuser (GUARDE EM SEGREDO):"
echo "  User:     postgres"
echo "  Password: $PG_SUPER_PASS"
echo ""
echo "Arquivo .env: $APP_DIR/.env"
echo "Logs PM2:    pm2 logs neondb"
echo "Status:       pm2 status"
echo "Restart:      pm2 restart neondb"
echo ""
echo "Para conectar ao banco de um usuário a partir de fora da VPS:"
echo "  psql postgresql://<role>:<password>@${PUBLIC_HOST}:5432/<database>"
echo ""
echo "Firewall:    ufw status"
echo ""
echo "Para PROMOVER o primeiro usuário a admin (acessar /api/admin/stats):"
echo "  cd $APP_DIR"
echo "  sqlite3 data/neondb.db \"UPDATE User SET role='admin' WHERE email='seu@email.com';\""
echo ""
warn "ANOTA a senha do postgres acima — sem ela você não consegue administrar o Postgres."
echo ""
info "Pronto! Agora usuários podem se cadastrar, criar projetos e receber connection strings REAIS."
info "Configurado para até ~200 bancos com tuning automático de PostgreSQL."
