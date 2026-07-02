# Deploy do webhook (VPS DigitalOcean)

Scripts para hospedar o serviço de webhook (Trello → WhatsApp) numa droplet Ubuntu.

## Pré-requisitos

- Uma droplet **Ubuntu** (22.04 ou 24.04) nova na DigitalOcean.
- Um **domínio** (ou subdomínio gratuito, ex.: DuckDNS) apontando para o **IP** da droplet
  — o Trello só chama URLs **HTTPS** válidas, então HTTPS é obrigatório.
- Um **número de WhatsApp dedicado** (Baileys é não-oficial; risco de bloqueio).

## Instalação (uma vez)

1. Aponte o DNS do seu domínio para o IP da droplet.
2. Acesse a droplet por SSH (como `root`).
3. Baixe e edite o script, ajustando as variáveis do topo (principalmente `DOMAIN`):

   ```bash
   curl -fsSL https://raw.githubusercontent.com/joaofelipe93/app-thesmart/main/deploy/vps-setup.sh -o vps-setup.sh
   nano vps-setup.sh    # ajuste DOMAIN, EMAIL_LE
   bash vps-setup.sh
   ```

   O script instala Node, clona o repo, compila, cria o serviço `systemd`, configura o
   nginx (proxy reverso) e o HTTPS (Let's Encrypt).

4. Preencha o `.env` e reinicie:

   ```bash
   nano /opt/thesmart/.env          # WEBHOOK_CALLBACK_URL = https://SEU_DOMINIO/webhook/trello, etc.
   systemctl restart thesmart-webhook
   ```

5. Abra `https://SEU_DOMINIO/` e **escaneie o QR** com o WhatsApp do número dedicado.

6. Registre o webhook no Trello:

   ```bash
   sudo -u thesmart bash -lc "cd /opt/thesmart && npm run webhook:registrar <idOuShortLinkDoQuadro>"
   ```

## Operação

```bash
systemctl status thesmart-webhook       # estado do serviço
journalctl -u thesmart-webhook -f       # logs ao vivo (mostra conexão do WhatsApp)
systemctl restart thesmart-webhook      # reiniciar
```

## Resetar a sessão do WhatsApp

Quando o número desconectar ou você quiser trocar de número:

```bash
bash /opt/thesmart/deploy/reset-whatsapp.sh
```

Apaga a sessão salva e reinicia o serviço — depois é só escanear o novo QR em
`https://SEU_DOMINIO/`.

## Atualizar o código (nova versão)

```bash
sudo -u thesmart bash -lc "cd /opt/thesmart && git pull && npm install && npm run build"
systemctl restart thesmart-webhook
```
