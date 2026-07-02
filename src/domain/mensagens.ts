// Mensagem enviada ao cliente quando o cartão entra na lista-alvo.
// Pode ser sobrescrita pela variável de ambiente MENSAGEM_CLIENTE.

export const MENSAGEM_PADRAO_CLIENTE =
  "Olá {nome}! Aqui é a TheSmart Seguros. Em breve enviaremos os dados da " +
  "assistência 24h e do aplicativo da sua seguradora. Qualquer dúvida, " +
  "estamos à disposição!";

/** Substitui {nome} pelo nome do cliente no template da mensagem. */
export function montarMensagem(template: string, nome: string): string {
  return template.replaceAll("{nome}", nome);
}

/** Extrai o nome do cliente do título do cartão ("NOME - SEGURADORA"). */
export function nomeDoTitulo(tituloCartao: string): string {
  const idx = tituloCartao.lastIndexOf(" - ");
  return idx > 0 ? tituloCartao.slice(0, idx).trim() : tituloCartao.trim();
}
