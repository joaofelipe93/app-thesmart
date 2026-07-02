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
  const resultado = await processarRelatorio(caminhoArquivo, {
    leitor: new PdfLeitor(),
    extrator: new OpenAiExtrator({
      apiKey: config.openaiApiKey,
      model: config.openaiModel,
    }),
    destino: new TrelloDestino({
      apiKey: config.trelloApiKey,
      token: config.trelloToken,
      workspace: config.trelloWorkspace,
    }),
    log: (mensagem) => console.log(mensagem),
  });

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
