#!/usr/bin/env bash
#
# Instalação da VPS (Ubuntu) — app-thesmart / webhook Trello -> WhatsApp
# Rode UMA vez, como root, numa droplet NOVA da DigitalOcean:
#
#   bash vps-setup.sh
#
# Ele instala Node, clona o repositório, compila, cria o serviço (systemd),
# configura o nginx como proxy reverso e (se houver domínio) o HTTPS.
#
set -euo pipefail

# ===================== AJUSTE ESTAS VARIÁVEIS =====================
REPO_URL="https://github.com/joaofelipe93/app-thesmart.git"
APP_USER="thesmart"
APP_DIR="/opt/thesmart"
APP_PORT="3001"
# Domínio que aponta para o IP desta droplet (ex.: webhook.suaempresa.com).
# Necessário para HTTPS — o Trello só chama URLs HTTPS válidas.
# Deixe vazio para configurar o domínio/HTTPS depois.
DOMAIN=""
EMAIL_LE="admin@example.com"   # e-mail para o Let's Encrypt (avisos de expiração)
# =================================================================

if [ "$(id -u)" -ne 0 ]; then
  echo "Rode como root (ex.: sudo bash vps-setup.sh)." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo ">>> Atualizando o sistema..."
apt-get update -y
apt-get upgrade -y

echo ">>> Instalando dependências base..."
apt-get install -y git nginx ufw curl ca-certificates build-essential python3

echo ">>> Instalando Node.js 20 LTS..."
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "    Node: $(node --version)"

echo ">>> Criando usuário de aplicação ($APP_USER)..."
id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --shell /bin/bash "$APP_USER"

echo ">>> Clonando/atualizando o repositório em $APP_DIR..."
if [ -d "$APP_DIR/.git" ]; then
  sudo -u "$APP_USER" git -C "$APP_DIR" pull --ff-only
else
  mkdir -p "$APP_DIR"
  chown "$APP_USER:$APP_USER" "$APP_DIR"
  sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR"
fi

echo ">>> Instalando dependências e compilando..."
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && npm install && npm run build"

echo ">>> Preparando o .env..."
if [ ! -f "$APP_DIR/.env" ]; then
  sudo -u "$APP_USER" cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo "    .env criado a partir do exemplo — PREENCHA os valores reais (passo final)."
fi

echo ">>> Criando o serviço systemd (thesmart-webhook)..."
cat > /etc/systemd/system/thesmart-webhook.service <<UNIT
[Unit]
Description=app-thesmart webhook (Trello -> WhatsApp)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node $APP_DIR/dist/webhook.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable thesmart-webhook

echo ">>> Configurando o nginx (proxy reverso -> 127.0.0.1:$APP_PORT)..."
SERVER_NAME="${DOMAIN:-_}"
cat > /etc/nginx/sites-available/thesmart <<NGINX
server {
    listen 80;
    server_name $SERVER_NAME;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/thesmart /etc/nginx/sites-enabled/thesmart
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ">>> Configurando o firewall (UFW)..."
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw --force enable

if [ -n "$DOMAIN" ]; then
  echo ">>> Configurando HTTPS (Let's Encrypt) para $DOMAIN..."
  apt-get install -y certbot python3-certbot-nginx
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL_LE" --redirect \
    || echo "    (certbot falhou — confira se o DNS de $DOMAIN aponta para esta droplet e rode: certbot --nginx -d $DOMAIN)"
fi

# Sobe o serviço (vai reiniciar em loop até o .env estar preenchido — normal).
systemctl restart thesmart-webhook || true

cat <<FIM

============================================================
 Instalação concluída. Faltam os passos que dependem de você:

 1) Preencha o .env com os valores reais:
      nano $APP_DIR/.env
    Importante:
      WEBHOOK_CALLBACK_URL = https://SEU_DOMINIO/webhook/trello
      TRELLO_API_SECRET, TRELLO_API_KEY, TRELLO_TOKEN, OPENAI_API_KEY
      LISTAS_NOTIFICAR, WHATSAPP_DESTINATARIOS

 2) Reinicie o serviço:
      systemctl restart thesmart-webhook

 3) Veja os logs e escaneie o QR:
      journalctl -u thesmart-webhook -f
      Abra https://SEU_DOMINIO/ e escaneie o QR com o WhatsApp do número dedicado.

 4) Registre o webhook no Trello (aponta para o quadro):
      sudo -u $APP_USER bash -lc "cd $APP_DIR && npm run webhook:registrar <idOuShortLinkDoQuadro>"

 Ainda sem domínio? O Trello exige HTTPS. Aponte um domínio (ou um subdomínio
 gratuito, ex.: DuckDNS) para o IP desta droplet e rode:
      certbot --nginx -d SEU_DOMINIO
============================================================
FIM
