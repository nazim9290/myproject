#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# AgencyBook SaaS — Contabo VPS Full Setup Script
# Server: 161.97.175.16 (Ubuntu, 6 Core, 12GB RAM, 100GB NVMe)
# ═══════════════════════════════════════════════════════════════
# ব্যবহার: root হিসেবে SSH করে এই script চালান:
#   ssh root@161.97.175.16
#   bash vps-setup.sh
# ═══════════════════════════════════════════════════════════════

set -e  # কোনো error হলে থামবে

# ── রং (output সুন্দর দেখানোর জন্য) ──
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${CYAN}[AgencyBook]${NC} $1"; }
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }

# ── ভ্যারিয়েবল ──
DOMAIN="agencybook.net"
API_DOMAIN="api.agencybook.net"
APP_USER="agencybook"
DB_NAME="agencybook_db"
DB_USER="agencybook"
DB_PASS=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 32)
JWT_SECRET=$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 64)
FRONTEND_REPO="https://github.com/nazim9290/myproject.git"
BACKEND_REPO="https://github.com/nazim9290/newbook.git"
APP_DIR="/home/${APP_USER}"
FRONTEND_DIR="${APP_DIR}/frontend"
BACKEND_DIR="${APP_DIR}/backend"
BACKUP_DIR="${APP_DIR}/backups"

echo ""
echo "═══════════════════════════════════════════════════"
echo "   AgencyBook SaaS — VPS Setup শুরু হচ্ছে..."
echo "═══════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════
# 1. System Update
# ═══════════════════════════════════════════════════
log "1/12 — System update..."
export DEBIAN_FRONTEND=noninteractive
apt update -y && apt upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"
apt install -y curl wget git unzip software-properties-common gnupg2 build-essential
ok "System updated"

# ═══════════════════════════════════════════════════
# 2. User Create: agencybook
# ═══════════════════════════════════════════════════
log "2/12 — User '${APP_USER}' তৈরি হচ্ছে..."
if id "${APP_USER}" &>/dev/null; then
  warn "User '${APP_USER}' ইতিমধ্যে আছে — skip"
else
  adduser --disabled-password --gecos "" ${APP_USER}
  usermod -aG sudo ${APP_USER}
  echo "${APP_USER} ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/${APP_USER}
  ok "User '${APP_USER}' তৈরি হয়েছে (sudo access সহ)"
fi

# ═══════════════════════════════════════════════════
# 3. Firewall (UFW)
# ═══════════════════════════════════════════════════
log "3/12 — Firewall configure হচ্ছে..."
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
echo "y" | ufw enable
ok "UFW enabled — ports 22, 80, 443 open"

# ═══════════════════════════════════════════════════
# 4. Node.js 20 Install
# ═══════════════════════════════════════════════════
log "4/12 — Node.js 20 install হচ্ছে..."
if command -v node &>/dev/null && [[ "$(node -v)" == v20* ]]; then
  ok "Node.js $(node -v) ইতিমধ্যে installed"
else
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
  ok "Node.js $(node -v) installed"
fi
npm install -g npm@latest
ok "npm $(npm -v)"

# ═══════════════════════════════════════════════════
# 5. PM2 Install
# ═══════════════════════════════════════════════════
log "5/12 — PM2 install হচ্ছে..."
npm install -g pm2
pm2 startup systemd -u ${APP_USER} --hp ${APP_DIR} || true
ok "PM2 $(pm2 -v) installed"

# ═══════════════════════════════════════════════════
# 6. PostgreSQL 16 Install + Database Create
# ═══════════════════════════════════════════════════
log "6/12 — PostgreSQL 16 install হচ্ছে..."
if command -v psql &>/dev/null && psql --version | grep -q "16"; then
  ok "PostgreSQL 16 ইতিমধ্যে installed"
else
  sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
  apt update -y
  apt install -y postgresql-16 postgresql-client-16
fi
systemctl enable postgresql
systemctl start postgresql
ok "PostgreSQL $(psql --version | awk '{print $3}') installed"

log "Database ও user তৈরি হচ্ছে..."
sudo -u postgres psql <<EOSQL
-- User তৈরি (যদি না থাকে)
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;

-- Database তৈরি (যদি না থাকে)
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}');
\gexec

-- Permissions
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
EOSQL

# pg_hba.conf — local password auth allow
PG_HBA=$(find /etc/postgresql -name pg_hba.conf | head -1)
if ! grep -q "${DB_USER}" "$PG_HBA" 2>/dev/null; then
  sed -i "/^# IPv4 local connections/a host    ${DB_NAME}    ${DB_USER}    127.0.0.1/32    scram-sha-256" "$PG_HBA"
  systemctl reload postgresql
fi
ok "Database '${DB_NAME}' ও user '${DB_USER}' তৈরি হয়েছে"

# ═══════════════════════════════════════════════════
# 7. Nginx Install + Configure
# ═══════════════════════════════════════════════════
log "7/12 — Nginx install ও configure হচ্ছে..."
apt install -y nginx
systemctl enable nginx

# Frontend config (agencybook.net + wildcard *.agencybook.net)
cat > /etc/nginx/sites-available/agencybook <<'NGINX_FRONTEND'
server {
    listen 80;
    server_name agencybook.net www.agencybook.net *.agencybook.net;

    root /home/agencybook/frontend/dist;
    index index.html;

    # gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # Static assets cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA — সব route index.html এ redirect
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX_FRONTEND

# API config (api.agencybook.net → backend:5000)
cat > /etc/nginx/sites-available/agencybook-api <<'NGINX_API'
server {
    listen 80;
    server_name api.agencybook.net;

    # Request size limit (file upload)
    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }
}
NGINX_API

# Enable sites
ln -sf /etc/nginx/sites-available/agencybook /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/agencybook-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Nginx config test
nginx -t
systemctl restart nginx
ok "Nginx configured — frontend + API proxy"

# ═══════════════════════════════════════════════════
# 8. Frontend Deploy
# ═══════════════════════════════════════════════════
log "8/12 — Frontend deploy হচ্ছে..."
mkdir -p ${FRONTEND_DIR}
if [ -d "${FRONTEND_DIR}/.git" ]; then
  cd ${FRONTEND_DIR} && git pull origin main
else
  git clone ${FRONTEND_REPO} ${FRONTEND_DIR}
fi
cd ${FRONTEND_DIR}
npm install
npm run build
chown -R ${APP_USER}:${APP_USER} ${FRONTEND_DIR}
ok "Frontend build সম্পন্ন — dist/ ready"

# ═══════════════════════════════════════════════════
# 9. Backend Deploy
# ═══════════════════════════════════════════════════
log "9/12 — Backend deploy হচ্ছে..."
mkdir -p ${BACKEND_DIR}
if [ -d "${BACKEND_DIR}/.git" ]; then
  cd ${BACKEND_DIR} && git pull origin main
else
  git clone ${BACKEND_REPO} ${BACKEND_DIR}
fi
cd ${BACKEND_DIR}
npm install

# .env ফাইল তৈরি
cat > ${BACKEND_DIR}/.env <<ENVFILE
# ═══ AgencyBook Backend Environment ═══
NODE_ENV=production
PORT=5000

# Database (Local PostgreSQL)
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}

# JWT
JWT_SECRET=${JWT_SECRET}

# Supabase (আপনার existing Supabase credentials রাখুন যদি দরকার হয়)
# SUPABASE_URL=https://lylfzhoilpepxlayeers.supabase.co
# SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_KEY=your_service_key

# CORS
CORS_ORIGIN=https://agencybook.net,https://www.agencybook.net,http://localhost:5173

# File uploads
UPLOAD_DIR=/home/agencybook/uploads
MAX_FILE_SIZE=10485760
ENVFILE

mkdir -p /home/${APP_USER}/uploads
chown -R ${APP_USER}:${APP_USER} ${BACKEND_DIR}
chown -R ${APP_USER}:${APP_USER} /home/${APP_USER}/uploads

# PM2 দিয়ে start
cd ${BACKEND_DIR}
sudo -u ${APP_USER} pm2 delete agencybook-api 2>/dev/null || true
sudo -u ${APP_USER} pm2 start npm --name "agencybook-api" -- start
sudo -u ${APP_USER} pm2 save
ok "Backend running on PM2 (port 5000)"

# ═══════════════════════════════════════════════════
# 10. SSL — Certbot Install (domain point হলে certificate নেবে)
# ═══════════════════════════════════════════════════
log "10/12 — Certbot (Let's Encrypt) install হচ্ছে..."
apt install -y certbot python3-certbot-nginx
ok "Certbot installed — domain point হলে এই command দিন:"
echo ""
echo "  sudo certbot --nginx -d agencybook.net -d www.agencybook.net -d api.agencybook.net"
echo ""

# ═══════════════════════════════════════════════════
# 11. Backup Script — Daily DB backup at 2 AM
# ═══════════════════════════════════════════════════
log "11/12 — Backup script তৈরি হচ্ছে..."
mkdir -p ${BACKUP_DIR}
chown ${APP_USER}:${APP_USER} ${BACKUP_DIR}

cat > ${APP_DIR}/backup.sh <<'BACKUP'
#!/bin/bash
# AgencyBook — Daily Database Backup
BACKUP_DIR="/home/agencybook/backups"
DB_NAME="agencybook_db"
DB_USER="agencybook"
TIMESTAMP=$(date +%Y-%m-%d_%H%M)
FILENAME="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Backup
PGPASSWORD="${DB_PASS}" pg_dump -U ${DB_USER} -h 127.0.0.1 ${DB_NAME} | gzip > ${FILENAME}

# ৭ দিনের পুরনো backup delete
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +7 -delete

echo "[$(date)] Backup complete: ${FILENAME}"
BACKUP

# backup script-এ actual password বসাও
sed -i "s|\${DB_PASS}|${DB_PASS}|g" ${APP_DIR}/backup.sh
sed -i "s|\${DB_USER}|${DB_USER}|g" ${APP_DIR}/backup.sh
sed -i "s|\${DB_NAME}|${DB_NAME}|g" ${APP_DIR}/backup.sh
sed -i "s|\${BACKUP_DIR}|${BACKUP_DIR}|g" ${APP_DIR}/backup.sh
chmod +x ${APP_DIR}/backup.sh
chown ${APP_USER}:${APP_USER} ${APP_DIR}/backup.sh

# Cron job — প্রতিদিন রাত ২ টায়
(crontab -u ${APP_USER} -l 2>/dev/null; echo "0 2 * * * ${APP_DIR}/backup.sh >> ${APP_DIR}/backup.log 2>&1") | sort -u | crontab -u ${APP_USER} -
ok "Daily backup — প্রতিদিন রাত ২:০০ AM (৭ দিন পর্যন্ত রাখবে)"

# ═══════════════════════════════════════════════════
# 12. Auto-Deploy Script
# ═══════════════════════════════════════════════════
log "12/12 — Deploy script তৈরি হচ্ছে..."

cat > ${APP_DIR}/deploy.sh <<'DEPLOY'
#!/bin/bash
# AgencyBook — Auto Deploy Script
# ব্যবহার: bash ~/deploy.sh [frontend|backend|all]

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

TARGET=${1:-all}

if [ "$TARGET" = "frontend" ] || [ "$TARGET" = "all" ]; then
  echo -e "${CYAN}[Deploy]${NC} Frontend deploying..."
  cd /home/agencybook/frontend
  git pull origin main
  npm install
  npm run build
  echo -e "${GREEN}[✓]${NC} Frontend deployed!"
fi

if [ "$TARGET" = "backend" ] || [ "$TARGET" = "all" ]; then
  echo -e "${CYAN}[Deploy]${NC} Backend deploying..."
  cd /home/agencybook/backend
  git pull origin main
  npm install
  pm2 restart agencybook-api
  echo -e "${GREEN}[✓]${NC} Backend deployed & restarted!"
fi

echo -e "${GREEN}[✓]${NC} Deploy complete — $(date)"
DEPLOY

chmod +x ${APP_DIR}/deploy.sh
chown ${APP_USER}:${APP_USER} ${APP_DIR}/deploy.sh
ok "deploy.sh তৈরি হয়েছে"

# ═══════════════════════════════════════════════════
# Credentials ফাইলে Save (গুরুত্বপূর্ণ!)
# ═══════════════════════════════════════════════════
CREDS_FILE="${APP_DIR}/CREDENTIALS.txt"
cat > ${CREDS_FILE} <<CREDS
═══════════════════════════════════════════════════
  AgencyBook SaaS — Server Credentials
  Generated: $(date)
  Server: 161.97.175.16
═══════════════════════════════════════════════════

── Database ──
  Host:     127.0.0.1
  Port:     5432
  Database: ${DB_NAME}
  User:     ${DB_USER}
  Password: ${DB_PASS}
  URL:      postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}

── JWT ──
  Secret:   ${JWT_SECRET}

── Paths ──
  Frontend: ${FRONTEND_DIR}
  Backend:  ${BACKEND_DIR}
  Backups:  ${BACKUP_DIR}
  Uploads:  /home/agencybook/uploads

── Commands ──
  Deploy all:      bash ~/deploy.sh
  Deploy frontend: bash ~/deploy.sh frontend
  Deploy backend:  bash ~/deploy.sh backend
  Manual backup:   bash ~/backup.sh
  PM2 status:      pm2 status
  PM2 logs:        pm2 logs agencybook-api
  PM2 restart:     pm2 restart agencybook-api
  Nginx restart:   sudo systemctl restart nginx
  SSL setup:       sudo certbot --nginx -d agencybook.net -d www.agencybook.net -d api.agencybook.net

── URLs (domain point হলে) ──
  Frontend: https://agencybook.net
  API:      https://api.agencybook.net
  IP:       http://161.97.175.16

═══════════════════════════════════════════════════
CREDS

chmod 600 ${CREDS_FILE}
chown ${APP_USER}:${APP_USER} ${CREDS_FILE}

# ═══════════════════════════════════════════════════
# সম্পন্ন!
# ═══════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════"
echo -e "${GREEN}  AgencyBook SaaS — Setup সম্পন্ন! ✓${NC}"
echo "═══════════════════════════════════════════════════"
echo ""
echo -e "${CYAN}── Installed ──${NC}"
echo "  Node.js:     $(node -v)"
echo "  npm:         $(npm -v)"
echo "  PM2:         $(pm2 -v)"
echo "  PostgreSQL:  $(psql --version | awk '{print $3}')"
echo "  Nginx:       $(nginx -v 2>&1 | awk -F/ '{print $2}')"
echo "  Certbot:     $(certbot --version 2>&1 | awk '{print $2}')"
echo ""
echo -e "${CYAN}── Database ──${NC}"
echo "  Name:     ${DB_NAME}"
echo "  User:     ${DB_USER}"
echo "  Password: ${DB_PASS}"
echo ""
echo -e "${CYAN}── PM2 Status ──${NC}"
sudo -u ${APP_USER} pm2 status
echo ""
echo -e "${CYAN}── Next Steps ──${NC}"
echo "  1. Domain DNS এ A record point করুন: 161.97.175.16"
echo "     - agencybook.net     → 161.97.175.16"
echo "     - www.agencybook.net → 161.97.175.16"
echo "     - api.agencybook.net → 161.97.175.16"
echo "     - *.agencybook.net   → 161.97.175.16"
echo ""
echo "  2. DNS propagate হলে SSL নিন:"
echo "     sudo certbot --nginx -d agencybook.net -d www.agencybook.net -d api.agencybook.net"
echo ""
echo "  3. Credentials সংরক্ষিত আছে:"
echo "     cat ~/CREDENTIALS.txt"
echo ""
echo "  4. Backend .env চেক করুন (Supabase keys যোগ করতে হতে পারে):"
echo "     nano ~/backend/.env"
echo ""
echo "═══════════════════════════════════════════════════"
