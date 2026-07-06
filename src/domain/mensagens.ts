// Mensagem enviada ao cliente quando o cartão entra na lista-alvo.
// Pode ser sobrescrita pela variável de ambiente MENSAGEM_CLIENTE.

// Mensagem ao cliente. Os contatos ({contatos}) são preenchidos conforme a
// seguradora do cartão (ver domain/seguradoras.ts). Pode ser sobrescrita por
// MENSAGEM_CLIENTE no .env.
export const MENSAGEM_PADRAO_CLIENTE = `Olá, {nome}! 😊

Agradecemos pela confiança em contar com a The Smart Corretora para cuidar da proteção do seu patrimônio.

Para que você tenha tudo à mão quando precisar, reunimos abaixo os principais canais de atendimento da sua seguradora:

*Seguradora:* {seguradora}

{contatos}

Sempre que precisar de qualquer orientação, nossa equipe estará à disposição para ajudar.

Conte conosco!`;

/**
 * Substitui placeholders no template pelos valores informados. Tolera variações:
 * {chave}, {{chave}}, {Chave}, {{Chave}} (sem diferenciar maiúsculas/minúsculas).
 * Ex.: montarMensagem(t, { nome: "MARIA", seguradora: "AZUL" }).
 */
export function montarMensagem(
  template: string,
  valores: Record<string, string>,
): string {
  let resultado = template;
  for (const [chave, valor] of Object.entries(valores)) {
    const re = new RegExp(`\\{\\{?\\s*${chave}\\s*\\}?\\}`, "gi");
    resultado = resultado.replace(re, valor);
  }
  return resultado;
}

/** Extrai o nome do cliente do título do cartão ("NOME - SEGURADORA"). */
export function nomeDoTitulo(tituloCartao: string): string {
  const idx = tituloCartao.lastIndexOf(" - ");
  return idx > 0 ? tituloCartao.slice(0, idx).trim() : tituloCartao.trim();
}

/** Extrai a seguradora do título do cartão ("NOME - SEGURADORA"); "" se não houver. */
export function seguradoraDoTitulo(tituloCartao: string): string {
  const idx = tituloCartao.lastIndexOf(" - ");
  return idx > 0 ? tituloCartao.slice(idx + 3).trim() : "";
}
