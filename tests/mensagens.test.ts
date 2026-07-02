import { test } from "node:test";
import assert from "node:assert/strict";
import { montarMensagem, nomeDoTitulo } from "../src/domain/mensagens";

test("substitui {nome} no template", () => {
  assert.equal(
    montarMensagem("Olá {nome}, tudo bem?", "MARIA"),
    "Olá MARIA, tudo bem?",
  );
});

test("nomeDoTitulo pega o nome antes da seguradora", () => {
  assert.equal(
    nomeDoTitulo("FELIPE RODRIGUES - PORTO SEGURO"),
    "FELIPE RODRIGUES",
  );
});

test("nomeDoTitulo sem seguradora devolve o título inteiro", () => {
  assert.equal(nomeDoTitulo("FELIPE RODRIGUES"), "FELIPE RODRIGUES");
});
