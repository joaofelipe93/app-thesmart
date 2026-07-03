// Mensagem enviada ao cliente quando o cartão entra na lista-alvo.
// Pode ser sobrescrita pela variável de ambiente MENSAGEM_CLIENTE.

// Mensagem de teste (canais de atendimento Porto Seguro). Ainda não é a final —
// para produção, cada seguradora precisaria da sua própria mensagem.
export const MENSAGEM_PADRAO_CLIENTE = `Olá, {nome}! 😊

Agradecemos pela confiança em contar com a The Smart Corretora para cuidar da proteção do seu patrimônio.

Para que você tenha tudo à mão quando precisar, reunimos abaixo os principais canais de atendimento da sua seguradora:

*Seguradora:* {seguradora}

*📞 Assistência 24 horas:*

- (11) 3366-3110 – Grande São Paulo
- 3004-6268 – Capitais e grandes centros
- 0800 727 8118 – Demais localidades

*📱 Aplicativo:*

- iOS (iPhone): https://apps.apple.com/us/app/porto-seguros-cart%C3%A3o-e/id1511026277?pt=304855&ct=hub-vendas&mt=

- Android: https://play.google.com/store/apps/details?id=br.com.portoseguro.experienciacliente.mundoporto&referrer=utm_source%3Dhub-vendas%26utm_medium%3Dcta-download%26utm_campaign%3Dhub-vendas&pli=1

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
