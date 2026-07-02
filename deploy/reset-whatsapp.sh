#!/usr/bin/env bash
#
# Reseta a sessão do WhatsApp — apaga a autenticação salva e reinicia o serviço,
# para gerar um QR novo (use quando o número desconectar ou quiser trocar de número).
#
# Rode como root na VPS:
#   bash reset-whatsapp.sh
#
set -euo pipefail

# ===================== AJUSTE SE PRECISAR =====================
APP_DIR="/opt/thesmart"
SERVICE="thesmart-webhook"
# =============================================================

if [ "$(id -u)" -ne 0 ]; then
  echo "Rode como root (ex.: sudo bash reset-whatsapp.sh)." >&2
  exit 1
fi

echo ">>> Parando o serviço $SERVICE..."
systemctl stop "$SERVICE" || true

echo ">>> Apagando a sessão do WhatsApp ($APP_DIR/whatsapp-auth)..."
rm -rf "$APP_DIR/whatsapp-auth"

echo ">>> Subindo o serviço de novo..."
systemctl start "$SERVICE"

cat <<FIM

>>> Pronto. Uma sessão nova será criada.
    Abra a URL do servidor (https://SEU_DOMINIO/) e escaneie o novo QR.
    Acompanhe pelos logs:
      journalctl -u $SERVICE -f
FIM
