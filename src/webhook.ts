import express from "express";
import path from "node:path";
import qrcode from "qrcode";

import { config } from "./config";
import { WhatsappBaileys } from "./adapters/whatsappBaileys";
import { TrelloDestino } from "./adapters/trelloDestino";
import {
  assinaturaValida,
  cartaoMovidoParaListas,
} from "./domain/webhookTrello";
import { extrairTelefone, normalizarTelefoneBR } from "./domain/telefone";
import {
  MENSAGEM_PADRAO_CLIENTE,
  montarMensagem,
  nomeDoTitulo,
  seguradoraDoTitulo,
} from "./domain/mensagens";

function exigir(nome: string, valor: string): void {
  if (!valor) {
    console.error(`[config] Falta ${nome} no .env — não é possível subir o webhook.`);
    process.exit(1);
  }
}
exigir("TRELLO_API_SECRET", config.trelloApiSecret);
exigir("WEBHOOK_CALLBACK_URL", config.webhookCallbackURL);
if (config.listasNotificar.length === 0) {
  console.warn(
    "[config] LISTAS_NOTIFICAR está vazio — nenhuma movimentação vai disparar mensagem.",
  );
}

const templateMensagem = config.mensagemCliente || MENSAGEM_PADRAO_CLIENTE;

const whatsapp = new WhatsappBaileys({
  pastaAuth: path.resolve(process.cwd(), "whatsapp-auth"),
  log: (m) => console.log("[whatsapp]", m),
});

const trello = new TrelloDestino({
  apiKey: config.trelloApiKey,
  token: config.trelloToken,
});

/** Busca o cartão, extrai o telefone do cliente e envia a mensagem padrão. */
async function enviarAoCliente(cartaoId: string, nomeCartao: string): Promise<void> {
  const cartao = await trello.obterCartao(cartaoId);

  const telefoneBruto = extrairTelefone(cartao.descricao);
  if (!telefoneBruto) {
    console.warn(`[whatsapp] cartão "${cartao.nome}" sem telefone na descrição — pulado.`);
    return;
  }
  const numero = normalizarTelefoneBR(telefoneBruto);
  if (!numero) {
    console.warn(
      `[whatsapp] telefone "${telefoneBruto}" de "${cartao.nome}" não é celular válido — pulado.`,
    );
    return;
  }

  const titulo = nomeCartao || cartao.nome;
  const nome = nomeDoTitulo(titulo);
  const seguradora = seguradoraDoTitulo(titulo);
  const mensagem = montarMensagem(templateMensagem, { nome, seguradora });
  await whatsapp.enviar(numero, mensagem);
  console.log(`[whatsapp] enviado para ${nome} (${numero}).`);
}

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

  const cartao = cartaoMovidoParaListas(payload, config.listasNotificar);
  if (cartao) {
    enviarAoCliente(cartao.id, cartao.nome).catch((e) =>
      console.error("[whatsapp] falha ao enviar:", (e as Error).message),
    );
  }
});

// Página para escanear o QR / ver o status da conexão.
app.get("/", async (_req, res) => {
  if (whatsapp.pronto) {
    res.send(
      "<h2>WhatsApp conectado ✅</h2><p>O servidor está pronto para enviar.</p>",
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
