import { test } from "node:test";
import assert from "node:assert/strict";
import { montarMensagem, nomeDoTitulo } from "../src/domain/mensagens";

test("substitui {nome} no template", () => {
  assert.equal(
    montarMensagem("Olá {nome}, tudo bem?", "MARIA"),
    "Olá MARIA, tudo bem?",
  );
});

test("tolera variações do placeholder de nome", () => {
  assert.equal(montarMensagem("Oi {{Nome}}", "ANA"), "Oi ANA");
  assert.equal(montarMensagem("Oi {{nome}}", "ANA"), "Oi ANA");
  assert.equal(montarMensagem("Oi {Nome}", "ANA"), "Oi ANA");
  assert.equal(montarMensagem("Oi {nome} e {{Nome}}", "ANA"), "Oi ANA e ANA");
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
