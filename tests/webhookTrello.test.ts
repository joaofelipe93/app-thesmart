import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  assinaturaValida,
  notificacaoDeMovimentacao,
} from "../src/domain/webhookTrello";

const LISTAS = ["Apólices emitidas", "Não fechado"];

function moverCartao(listaDestino: string): unknown {
  return {
    action: {
      type: "updateCard",
      data: {
        card: { name: "FELIPE RODRIGUES - PORTO SEGURO" },
        listBefore: { name: "Aguardando cliente" },
        listAfter: { name: listaDestino },
        board: { name: "AGOSTO - PROCESSO DE VENDA" },
      },
      memberCreator: { fullName: "João Felipe" },
    },
  };
}

test("notifica quando move para uma lista-alvo", () => {
  const msg = notificacaoDeMovimentacao(moverCartao("Apólices emitidas"), LISTAS);
  assert.ok(msg);
  assert.match(msg!, /João Felipe/);
  assert.match(msg!, /FELIPE RODRIGUES - PORTO SEGURO/);
  assert.match(msg!, /Apólices emitidas/);
});

test("ignora move para lista fora da lista-alvo", () => {
  assert.equal(
    notificacaoDeMovimentacao(moverCartao("Cotações feitas"), LISTAS),
    null,
  );
});

test("casa lista ignorando maiúsculas/espaços", () => {
  assert.ok(
    notificacaoDeMovimentacao(moverCartao("  apólices emitidas  "), LISTAS),
  );
});

test("ignora updateCard que não é movimentação (sem listAfter)", () => {
  const payload = {
    action: { type: "updateCard", data: { card: { name: "X" }, old: { name: "Y" } } },
  };
  assert.equal(notificacaoDeMovimentacao(payload, LISTAS), null);
});

test("ignora ações que não são updateCard", () => {
  const payload = { action: { type: "commentCard", data: {} } };
  assert.equal(notificacaoDeMovimentacao(payload, LISTAS), null);
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
