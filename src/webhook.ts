import express from "express";
import path from "node:path";
import qrcode from "qrcode";

import { config } from "./config";
import { WhatsappBaileys } from "./adapters/whatsappBaileys";
import {
  assinaturaValida,
  notificacaoDeMovimentacao,
} from "./domain/webhookTrello";

function exigir(nome: string, valor: string): void {
  if (!valor) {
    console.error(`[config] Falta ${nome} no .env — não é possível subir o webhook.`);
    process.exit(1);
  }
}
exigir("TRELLO_API_SECRET", config.trelloApiSecret);
exigir("WEBHOOK_CALLBACK_URL", config.webhookCallbackURL);
if (config.whatsappDestinatarios.length === 0) {
  console.error("[config] Falta WHATSAPP_DESTINATARIOS no .env.");
  process.exit(1);
}
if (config.listasNotificar.length === 0) {
  console.warn(
    "[config] LISTAS_NOTIFICAR está vazio — nenhuma movimentação vai notificar.",
  );
}

const whatsapp = new WhatsappBaileys({
  pastaAuth: path.resolve(process.cwd(), "whatsapp-auth"),
  destinatarios: config.whatsappDestinatarios,
  log: (m) => console.log("[whatsapp]", m),
});

const app = express();

// Assinatura é calculada sobre o corpo BRUTO — precisa do raw body aqui.
app.use("/webhook/trello", express.raw({ type: () => true }));

// O Trello faz um HEAD ao registrar o webhook; precisa responder 200.
app.head("/webhook/trello", (_req, res) => res.sendStatus(200));

app.post("/webhook/trello", (req, res) => {
  const corpo = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
  const assinatura = req.header("x-trello-webhook");

  if (
    !assinaturaValida(
      corpo,
      assinatura,
      config.webhookCallbackURL,
      config.trelloApiSecret,
    )
  ) {
    res.sendStatus(401);
    return;
  }

  // Responde rápido (o Trello espera 200 em poucos segundos); processa depois.
  res.sendStatus(200);

  let payload: unknown;
  try {
    payload = JSON.parse(corpo);
  } catch {
    return;
  }

  const mensagem = notificacaoDeMovimentacao(payload, config.listasNotificar);
  if (mensagem) {
    whatsapp
      .notificar(mensagem)
      .then(() => console.log("[whatsapp] notificado:", mensagem))
      .catch((e) =>
        console.error("[whatsapp] falha ao notificar:", (e as Error).message),
      );
  }
});

// Página para escanear o QR / ver o status da conexão.
app.get("/", async (_req, res) => {
  if (whatsapp.pronto) {
    res.send(
      "<h2>WhatsApp conectado ✅</h2><p>O servidor está pronto para notificar.</p>",
    );
    return;
  }
  if (!whatsapp.qr) {
    res.send(
      "<h2>Iniciando conexão…</h2><p>Aguarde alguns segundos e atualize a página.</p>",
    );
    return;
  }
  const dataUrl = await qrcode.toDataURL(whatsapp.qr);
  res.send(
    `<!doctype html><meta charset="utf-8"><h2>Escaneie com o WhatsApp</h2>` +
      `<p>Abra o WhatsApp do número dedicado ▸ Aparelhos conectados ▸ Conectar um aparelho.</p>` +
      `<img src="${dataUrl}" width="300"/><p>Se o QR expirar, atualize a página.</p>`,
  );
});

const porta = Number(process.env.WEBHOOK_PORT || process.env.PORT) || 3001;
whatsapp.iniciar().catch((e) =>
  console.error("[whatsapp] erro ao iniciar:", (e as Error).message),
);
app.listen(porta, () => {
  console.log(`Webhook + QR em http://localhost:${porta}`);
  console.log(`Callback configurado: ${config.webhookCallbackURL}`);
});
