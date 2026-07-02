import { test } from "node:test";
import assert from "node:assert/strict";
import { descricaoDoCartao, tituloDoCartao } from "../src/domain/formatters";

test("título junta nome e seguradora", () => {
  assert.equal(
    tituloDoCartao({ nome: "FELIPE RODRIGUES", seguradora: "PORTO SEGURO", detalhes: {} }),
    "FELIPE RODRIGUES - PORTO SEGURO",
  );
});

test("título é só o nome quando não há seguradora", () => {
  assert.equal(
    tituloDoCartao({ nome: "FELIPE RODRIGUES", detalhes: {} }),
    "FELIPE RODRIGUES",
  );
});

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

test("descrição inclui a apólice quando presente", () => {
  const desc = descricaoDoCartao({
    nome: "X",
    apolice: "7024112",
    detalhes: { Valor: "R$ 10" },
  });
  assert.equal(desc, "**Apólice:** 7024112\n**Valor:** R$ 10");
});
