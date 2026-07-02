import { test } from "node:test";
import assert from "node:assert/strict";
import { extrairTelefone, normalizarTelefoneBR } from "../src/domain/telefone";

test("extrai telefone de linha rotulada na descrição", () => {
  const desc = "**Apólice:** 7011975\n**Telefone:** (11) 96392-3868\n**Ramo:** Auto";
  assert.equal(extrairTelefone(desc), "(11) 96392-3868");
});

test("extrai telefone sem rótulo (fallback)", () => {
  assert.equal(extrairTelefone("Contato do cliente: 11 96392-3868"), "11 96392-3868");
});

test("descrição sem telefone retorna null", () => {
  assert.equal(extrairTelefone("**Apólice:** 7011975\n**Ramo:** Auto"), null);
});

test("normaliza celular BR para 55DDDNUMERO", () => {
  assert.equal(normalizarTelefoneBR("(11) 96392-3868"), "5511963923868");
  assert.equal(normalizarTelefoneBR("84996039762"), "5584996039762");
  assert.equal(normalizarTelefoneBR("5511963923868"), "5511963923868"); // já com DDI
});

test("rejeita fixo / sem o 9", () => {
  assert.equal(normalizarTelefoneBR("(19) 7146-5640"), null); // 10 dígitos, sem 9
  assert.equal(normalizarTelefoneBR("1132664000"), null);
});
