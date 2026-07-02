import crypto from "node:crypto";

/**
 * Valida a assinatura que o Trello envia no header `x-trello-webhook`:
 * base64( HMAC-SHA1( corpoBruto + callbackURL, secret ) ).
 * Comparação em tempo constante.
 */
export function assinaturaValida(
  corpoBruto: string,
  assinatura: string | undefined,
  callbackURL: string,
  secret: string,
): boolean {
  if (!assinatura || !secret) return false;
  const esperado = crypto
    .createHmac("sha1", secret)
    .update(corpoBruto + callbackURL)
    .digest("base64");
  const a = Buffer.from(assinatura);
  const b = Buffer.from(esperado);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export interface CartaoMovido {
  id: string;
  nome: string;
  lista: string;
}

/**
 * Interpreta um payload de webhook do Trello. Se for um cartão MOVIDO para uma
 * das listas-alvo, devolve os dados do cartão (id + nome + lista); senão `null`.
 * O telefone/descrição não vêm no webhook — o id é usado para buscar o cartão.
 */
export function cartaoMovidoParaListas(
  payload: unknown,
  listasAlvo: readonly string[],
): CartaoMovido | null {
  const action = (payload as { action?: Record<string, unknown> })?.action;
  if (!action || action.type !== "updateCard") return null;

  const data = action.data as Record<string, unknown> | undefined;
  const listAfter = data?.listAfter as { name?: string } | undefined;
  // Sem listAfter não é movimentação entre listas (é renomear, mover posição, etc.).
  if (!listAfter?.name) return null;

  const destino = listAfter.name.trim().toLowerCase();
  const casa = listasAlvo.some((l) => l.trim().toLowerCase() === destino);
  if (!casa) return null;

  const card = data?.card as { id?: string; name?: string } | undefined;
  if (!card?.id) return null;

  return {
    id: card.id,
    nome: card.name ?? "",
    lista: listAfter.name,
  };
}
