import type { Cliente } from "./types";

/** Título do cartão: "NOME - SEGURADORA" (só o nome quando não há seguradora). */
export function tituloDoCartao(cliente: Cliente): string {
  return cliente.seguradora
    ? `${cliente.nome} - ${cliente.seguradora}`
    : cliente.nome;
}

/** Monta a descrição do cartão (markdown) a partir da apólice e dos detalhes. */
export function descricaoDoCartao(cliente: Cliente): string {
  const linhas: string[] = [];
  if (cliente.apolice) linhas.push(`**Apólice:** ${cliente.apolice}`);
  for (const [campo, valor] of Object.entries(cliente.detalhes)) {
    linhas.push(`**${campo}:** ${valor}`);
  }
  return linhas.join("\n");
}
