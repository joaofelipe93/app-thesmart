import type { Cliente } from "./types";

/** Título do cartão: "NOME - SEGURADORA" (só o nome quando não há seguradora). */
export function tituloDoCartao(cliente: Cliente): string {
  return cliente.seguradora
    ? `${cliente.nome} - ${cliente.seguradora}`
    : cliente.nome;
}

/** Monta a descrição do cartão (markdown) a partir dos detalhes do cliente. */
export function descricaoDoCartao(cliente: Cliente): string {
  return Object.entries(cliente.detalhes)
    .map(([campo, valor]) => `**${campo}:** ${valor}`)
    .join("\n");
}
