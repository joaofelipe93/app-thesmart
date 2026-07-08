import { config } from "./config";
import { PdfLeitor } from "./adapters/pdfLeitor";
import { OpenAiExtrator } from "./adapters/openaiExtrator";
import { TrelloDestino } from "./adapters/trelloDestino";
import { processarRelatorio } from "./app/pipeline";

async function main(): Promise<void> {
  const caminhoArquivo = process.argv[2];
  if (!caminhoArquivo) {
    console.error(
      "Uso: npm start <caminho-do-relatorio.pdf>\n" +
        "Ex.:  npm start ./Relatorio_renovacao_Agosto-2026.pdf",
    );
    process.exit(1);
  }

  // Composition root: liga os adaptadores concretos ao núcleo.
  const destino = new TrelloDestino({
    apiKey: config.trelloApiKey,
    token: config.trelloToken,
    workspace: config.trelloWorkspace,
  });

  const resultado = await processarRelatorio(caminhoArquivo, {
    leitor: new PdfLeitor(),
    extrator: new OpenAiExtrator({
      apiKey: config.openaiApiKey,
      model: config.openaiModel,
    }),
    destino,
    log: (mensagem) => console.log(mensagem),
  });

  // Registra o webhook do Trello para o quadro criado (se configurado no .env).
  if (config.webhookCallbackURL) {
    try {
      const status = await destino.garantirWebhook(
        resultado.quadroRef,
        config.webhookCallbackURL,
      );
      console.log(
        status === "criado"
          ? `Webhook do Trello registrado para "${resultado.quadro}".`
          : `Webhook do Trello já estava registrado para "${resultado.quadro}".`,
      );
    } catch (e) {
      console.warn(
        `Aviso: não foi possível registrar o webhook: ${(e as Error).message}`,
      );
    }
  }

  const pulados =
    resultado.pulados > 0
      ? ` ${resultado.pulados} já existia(m) e foi(ram) pulado(s).`
      : "";
  const ignorados =
    resultado.ignorados > 0
      ? ` ${resultado.ignorados} cancelado(s) ignorado(s).`
      : "";
  console.log(
    `\nConcluído! ${resultado.cartoes.length} cartão(ões) criado(s) na lista "${resultado.lista}".${pulados}${ignorados}`,
  );
}

main().catch((erro: unknown) => {
  console.error("\nErro:", erro instanceof Error ? erro.message : erro);
  process.exit(1);
});
