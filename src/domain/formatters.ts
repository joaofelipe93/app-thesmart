import type { Cliente } from "./types";

/** Monta a descrição do cartão (markdown) a partir dos detalhes do cliente. */
export function descricaoDoCartao(cliente: Cliente): string {
  return Object.entries(cliente.detalhes)
    .map(([campo, valor]) => `**${campo}:** ${valor}`)
    .join("\n");
}
