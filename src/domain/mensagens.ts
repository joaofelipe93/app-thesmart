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

// Marcadores que o usuário coloca em cartões manuais e que não fazem parte do
// nome nem da seguradora (ex.: "NOME - NOVO - SEGURADORA").
const MARCADORES = new Set(["NOVO"]);

/** Remove segmentos marcadores (ex.: "NOVO") do título. */
function tituloSemMarcadores(tituloCartao: string): string {
  return tituloCartao
    .split(" - ")
    .filter((parte) => !MARCADORES.has(parte.trim().toUpperCase()))
    .join(" - ");
}

/** Extrai o nome do cliente do título ("NOME - SEGURADORA"), ignorando marcadores. */
export function nomeDoTitulo(tituloCartao: string): string {
  const t = tituloSemMarcadores(tituloCartao);
  const idx = t.lastIndexOf(" - ");
  return idx > 0 ? t.slice(0, idx).trim() : t.trim();
}

/** Extrai a seguradora do título ("NOME - SEGURADORA"), ignorando marcadores; "" se não houver. */
export function seguradoraDoTitulo(tituloCartao: string): string {
  const t = tituloSemMarcadores(tituloCartao);
  const idx = t.lastIndexOf(" - ");
  return idx > 0 ? t.slice(idx + 3).trim() : "";
}
