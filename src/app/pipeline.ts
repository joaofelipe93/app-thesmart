import { mesDoArquivo, nomeQuadro, nomeLista } from "../naming";
import { descricaoDoCartao } from "../domain/formatters";
import { ETAPAS_RENOVACAO, NOME_CHECKLIST } from "../domain/etapas";
import type {
  CartaoRef,
  DestinoCartoes,
  ExtratorClientes,
  LeitorRelatorio,
} from "../domain/types";

export interface DependenciasPipeline {
  leitor: LeitorRelatorio;
  extrator: ExtratorClientes;
  destino: DestinoCartoes;
  /** Callback opcional de log (no CLI é console.log; nos testes pode ser omitido). */
  log?: (mensagem: string) => void;
}

export interface ResultadoProcessamento {
  mes: string;
  quadro: string;
  lista: string;
  /** Cartões criados nesta execução. */
  cartoes: CartaoRef[];
  /** Quantos clientes foram pulados por já existirem na lista. */
  pulados: number;
}

/**
 * Núcleo da aplicação: lê o relatório, extrai os clientes e publica um cartão
 * por cliente. Depende apenas das portas (interfaces), então roda igual com
 * Trello/OpenAI reais ou com fakes nos testes.
 */
export async function processarRelatorio(
  caminhoArquivo: string,
  deps: DependenciasPipeline,
): Promise<ResultadoProcessamento> {
  const log = deps.log ?? (() => {});

  const mes = mesDoArquivo(caminhoArquivo);
  log(`Mês detectado: ${mes}`);

  log("Lendo o relatório...");
  const texto = await deps.leitor.lerTexto(caminhoArquivo);

  log("Extraindo clientes...");
  const clientes = await deps.extrator.extrair(texto);
  log(`${clientes.length} cliente(s) identificado(s).`);

  const tituloQuadro = nomeQuadro(mes);
  const tituloLista = nomeLista(mes);

  log(`Preparando o quadro "${tituloQuadro}"...`);
  const quadro = await deps.destino.garantirQuadro(tituloQuadro);

  log(`Preparando a lista "${tituloLista}"...`);
  const lista = await deps.destino.garantirLista(quadro, tituloLista);

  // Idempotência: nomes já presentes na lista não são recriados.
  const existentes = await deps.destino.cartoesExistentes(lista);

  const cartoes: CartaoRef[] = [];
  let pulados = 0;
  for (const cliente of clientes) {
    if (existentes.has(cliente.nome)) {
      pulados++;
      log(`  • Pulado (já existe): ${cliente.nome}`);
      continue;
    }

    const cartao = await deps.destino.criarCartao(
      lista,
      cliente.nome,
      descricaoDoCartao(cliente),
    );
    await deps.destino.adicionarChecklist(
      cartao,
      NOME_CHECKLIST,
      ETAPAS_RENOVACAO,
    );
    if (cliente.vencimento) {
      await deps.destino.aplicarEtiqueta(
        quadro,
        cartao,
        `VENCIMENTO ${cliente.vencimento}`,
      );
    }
    existentes.add(cliente.nome);
    const venc = cliente.vencimento ? ` (venc. ${cliente.vencimento})` : "";
    log(`  ✓ ${cliente.nome}${venc} — ${cartao.url}`);
    cartoes.push(cartao);
  }

  return { mes, quadro: tituloQuadro, lista: tituloLista, cartoes, pulados };
}
