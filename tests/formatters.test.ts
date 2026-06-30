import { test } from "node:test";
import assert from "node:assert/strict";
import { descricaoDoCartao } from "../src/domain/formatters";

test("formata os detalhes como markdown", () => {
  const desc = descricaoDoCartao({
    nome: "X",
    detalhes: { "Apólice": "1", Valor: "R$ 10" },
  });
  assert.equal(desc, "**Apólice:** 1\n**Valor:** R$ 10");
});

test("detalhes vazios geram descrição vazia", () => {
  assert.equal(descricaoDoCartao({ nome: "X", detalhes: {} }), "");
});
