import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  assinaturaValida,
  cartaoMovidoParaListas,
} from "../src/domain/webhookTrello";

const LISTAS = ["Enviar msg Ass 24h e Aplicativo da seguradora"];

function moverCartao(listaDestino: string): unknown {
  return {
    action: {
      type: "updateCard",
      data: {
        card: { id: "card123", name: "FELIPE RODRIGUES - PORTO SEGURO" },
        listBefore: { name: "Aguardando cliente" },
        listAfter: { name: listaDestino },
        board: { name: "AGOSTO - PROCESSO DE VENDA" },
      },
      memberCreator: { fullName: "João Felipe" },
    },
  };
}

test("retorna o cartão quando move para a lista-alvo", () => {
  const c = cartaoMovidoParaListas(
    moverCartao("Enviar msg Ass 24h e Aplicativo da seguradora"),
    LISTAS,
  );
  assert.deepEqual(c, {
    id: "card123",
    nome: "FELIPE RODRIGUES - PORTO SEGURO",
    lista: "Enviar msg Ass 24h e Aplicativo da seguradora",
  });
});

test("ignora move para lista fora da lista-alvo", () => {
  assert.equal(cartaoMovidoParaListas(moverCartao("Cotações feitas"), LISTAS), null);
});

test("casa lista ignorando maiúsculas/espaços", () => {
  assert.ok(
    cartaoMovidoParaListas(
      moverCartao("  enviar msg ass 24h e aplicativo da seguradora  "),
      LISTAS,
    ),
  );
});

test("ignora updateCard sem listAfter (não é movimentação)", () => {
  const payload = {
    action: { type: "updateCard", data: { card: { id: "x", name: "X" }, old: {} } },
  };
  assert.equal(cartaoMovidoParaListas(payload, LISTAS), null);
});

test("ignora ações que não são updateCard", () => {
  assert.equal(
    cartaoMovidoParaListas({ action: { type: "commentCard", data: {} } }, LISTAS),
    null,
  );
});

test("assinatura válida passa; inválida falha", () => {
  const secret = "segredo-de-teste";
  const callback = "https://exemplo.com/webhook/trello";
  const corpo = JSON.stringify({ action: { type: "updateCard" } });
  const assinatura = crypto
    .createHmac("sha1", secret)
    .update(corpo + callback)
    .digest("base64");

  assert.equal(assinaturaValida(corpo, assinatura, callback, secret), true);
  assert.equal(assinaturaValida(corpo, "errada", callback, secret), false);
  assert.equal(assinaturaValida(corpo, undefined, callback, secret), false);
  assert.equal(assinaturaValida(corpo, assinatura, callback, ""), false);
});
