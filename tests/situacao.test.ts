import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clienteAtivo,
  mapaSituacaoPorApolice,
} from "../src/domain/situacao";

test("mapaSituacaoPorApolice lê a letra após os dígitos, não a do nome", () => {
  const texto = [
    "cabeçalho qualquer",
    "01/08/2026",
    "2204043CBRUNO HENRIQUE DUTRA PEREIRAPORTO",
    "1003110841348ACESAR PINHEIRO FRANCO PEREIRA",
    "7024112ACLEBER BERNARDO DOS SANTOSAZUL",
  ].join("\n");
  const mapa = mapaSituacaoPorApolice(texto);
  assert.equal(mapa.get("2204043"), "C"); // BRUNO cancelado
  assert.equal(mapa.get("1003110841348"), "A"); // CESAR ativo (nome com C)
  assert.equal(mapa.get("7024112"), "A"); // CLEBER ativo (nome com C)
});

test("cancelado (C) não é ativo", () => {
  assert.equal(clienteAtivo({ nome: "X", situacao: "C", detalhes: {} }), false);
  assert.equal(clienteAtivo({ nome: "X", situacao: "c", detalhes: {} }), false);
  assert.equal(clienteAtivo({ nome: "X", situacao: " C ", detalhes: {} }), false);
});

test("ativo (A) ou sem situação é considerado ativo", () => {
  assert.equal(clienteAtivo({ nome: "X", situacao: "A", detalhes: {} }), true);
  assert.equal(clienteAtivo({ nome: "X", detalhes: {} }), true);
});
