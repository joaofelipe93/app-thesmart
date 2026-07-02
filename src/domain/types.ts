// Tipos do domínio e as "portas" (interfaces) que o núcleo da aplicação usa.
// Os adaptadores concretos (PDF, OpenAI, Trello) implementam essas interfaces.

export interface Cliente {
  /** Nome do cliente. */
  nome: string;
  /** Número da apólice — usado para derivar a situação de forma determinística. */
  apolice?: string;
  /** Situação (coluna "Sit" do relatório): "A" = ativo, "C" = cancelado. Cancelados não viram cartão. */
  situacao?: string;
  /** Seguradora — compõe o título do cartão: "NOME - SEGURADORA". */
  seguradora?: string;
  /** Data de vencimento (dd/mm/aaaa) — vira a etiqueta "VENCIMENTO {data}". */
  vencimento?: string;
  /** Demais informações do cliente (apólice, valor, etc.). */
  detalhes: Record<string, string>;
}

export interface QuadroRef {
  id: string;
  nome: string;
}

export interface ListaRef {
  id: string;
  nome: string;
}

export interface CartaoRef {
  id: string;
  nome: string;
  url: string;
}

/** Porta de entrada: lê o relatório e devolve o texto. */
export interface LeitorRelatorio {
  lerTexto(caminhoArquivo: string): Promise<string>;
}

/** Porta de extração: transforma o texto do relatório em clientes. */
export interface ExtratorClientes {
  extrair(textoRelatorio: string): Promise<Cliente[]>;
}

/** Porta de saída: onde os cartões são publicados (Trello, etc.). */
export interface DestinoCartoes {
  garantirQuadro(nome: string): Promise<QuadroRef>;
  garantirLista(quadro: QuadroRef, nome: string): Promise<ListaRef>;
  /** Nomes dos cartões que já existem na lista (para não duplicar ao reprocessar). */
  cartoesExistentes(lista: ListaRef): Promise<Set<string>>;
  criarCartao(lista: ListaRef, nome: string, descricao: string): Promise<CartaoRef>;
  adicionarChecklist(
    cartao: CartaoRef,
    nome: string,
    itens: readonly string[],
  ): Promise<void>;
  /** Aplica ao cartão uma etiqueta com o texto dado, reutilizando-a se já existir no quadro. */
  aplicarEtiqueta(
    quadro: QuadroRef,
    cartao: CartaoRef,
    texto: string,
  ): Promise<void>;
}
