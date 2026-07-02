import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Variável de ambiente ${name} não está definida. Copie .env.example para .env e preencha.`,
    );
  }
  return value.trim();
}

export const config = {
  openaiApiKey: required("OPENAI_API_KEY"),
  openaiModel: (process.env.OPENAI_MODEL || "gpt-4o").trim(),
  trelloApiKey: required("TRELLO_API_KEY"),
  trelloToken: required("TRELLO_TOKEN"),
  // Área de trabalho (workspace/organization) onde o quadro é criado.
  // Vazio = quadros pessoais.
  trelloWorkspace: (process.env.TRELLO_WORKSPACE || "").trim(),

  // --- Usados apenas pelo servidor de webhook (opcionais para CLI/GUI) ---
  // Secret da API do Trello (trello.com/app-key) — valida a assinatura do webhook.
  trelloApiSecret: (process.env.TRELLO_API_SECRET || "").trim(),
  // URL pública COMPLETA do endpoint do webhook (ex.: https://seu-host/webhook/trello).
  webhookCallbackURL: (process.env.WEBHOOK_CALLBACK_URL || "").trim(),
  // Lista(s) que disparam a notificação (separadas por vírgula).
  listasNotificar: (process.env.LISTAS_NOTIFICAR || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  // Números de WhatsApp que recebem a notificação (só dígitos, formato internacional).
  whatsappDestinatarios: (process.env.WHATSAPP_DESTINATARIOS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};
