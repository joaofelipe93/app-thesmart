import { config } from "./config";

// Registra (ou lista) o webhook do Trello apontando para WEBHOOK_CALLBACK_URL.
// Uso:
//   npm run webhook:registrar <idOuShortLinkDoQuadro>   -> cria o webhook no quadro
//   npm run webhook:registrar --listar                  -> lista webhooks do token

const BASE = "https://api.trello.com/1";

function url(caminho: string, params: Record<string, string> = {}): URL {
  const u = new URL(`${BASE}${caminho}`);
  u.searchParams.set("key", config.trelloApiKey);
  u.searchParams.set("token", config.trelloToken);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u;
}

async function main(): Promise<void> {
  const arg = process.argv[2];

  if (arg === "--listar") {
    const r = await fetch(url(`/tokens/${config.trelloToken}/webhooks`));
    console.log(await r.text());
    return;
  }

  if (!arg) {
    console.error(
      "Uso: npm run webhook:registrar <idOuShortLinkDoQuadro>\n" +
        "     (o shortLink é o código da URL do quadro: trello.com/b/<shortLink>/...)\n" +
        "     npm run webhook:registrar --listar   # lista os webhooks existentes",
    );
    process.exit(1);
  }

  if (!config.webhookCallbackURL) {
    console.error("Falta WEBHOOK_CALLBACK_URL no .env.");
    process.exit(1);
  }

  // Resolve o id real do quadro (aceita id ou shortLink).
  const rb = await fetch(url(`/boards/${arg}`, { fields: "id,name" }));
  if (!rb.ok) {
    console.error(`Quadro "${arg}" não encontrado: ${rb.status} ${await rb.text()}`);
    process.exit(1);
  }
  const board = (await rb.json()) as { id: string; name: string };

  const r = await fetch(url("/webhooks"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: `app-thesmart — ${board.name}`,
      callbackURL: config.webhookCallbackURL,
      idModel: board.id,
    }),
  });

  if (r.ok) {
    console.log(`Webhook criado no quadro "${board.name}".`);
    console.log(await r.text());
  } else {
    console.error(`Falha ao criar webhook: ${r.status}`);
    console.error(await r.text());
    process.exit(1);
  }
}

main().catch((e: unknown) => {
  console.error("Erro:", e instanceof Error ? e.message : e);
  process.exit(1);
});
