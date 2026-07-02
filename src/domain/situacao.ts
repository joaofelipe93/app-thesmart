import type { Cliente } from "./types";

/**
 * Cliente com situação "C" (cancelado) não vira cartão.
 * Só a situação "C" é filtrada; qualquer outra (ou ausente) é considerada ativa,
 * para não descartar clientes por engano de extração.
 */
export function clienteAtivo(cliente: Cliente): boolean {
  return (cliente.situacao ?? "").trim().toUpperCase() !== "C";
}

/**
 * Deriva a situação (letra "Sit") de cada apólice direto do texto do relatório:
 * cada registro começa com os dígitos da apólice, seguidos de UMA letra (a situação),
 * seguida do nome (que começa com letra). Retorna um mapa apólice(dígitos) → situação.
 *
 * É determinístico e não depende da LLM ler a letra colada ao nome — o ponto frágil
 * quando o nome começa com a mesma letra (ex.: "...ACLEBER" = situação A, nome CLEBER).
 */
export function mapaSituacaoPorApolice(
  textoRelatorio: string,
): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const linha of textoRelatorio.split("\n")) {
    const m = linha.trim().match(/^(\d{4,})([A-Z])(?=[A-ZÀ-Ú])/);
    if (m) mapa.set(m[1], m[2].toUpperCase());
  }
  return mapa;
}

/** Só dígitos, para casar apólices entre a LLM e o texto cru. */
export function apenasDigitos(valor: string | undefined): string {
  return (valor ?? "").replace(/\D/g, "");
}
