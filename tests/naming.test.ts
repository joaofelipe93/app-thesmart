import { test } from "node:test";
import assert from "node:assert/strict";
import { mesDoArquivo, nomeQuadro, nomeLista } from "../src/naming";

test("detecta o mês com e sem acento", () => {
  assert.equal(mesDoArquivo("Relatorio_renovacao_Agosto-2026.pdf"), "AGOSTO");
  assert.equal(mesDoArquivo("rel_Marco-2026.pdf"), "MARÇO");
  assert.equal(mesDoArquivo("/docs/RENOVACAO_setembro.pdf"), "SETEMBRO");
});

test("monta os nomes do quadro e da lista", () => {
  assert.equal(nomeQuadro("AGOSTO"), "AGOSTO - PROCESSO DE VENDA");
  assert.equal(nomeLista("AGOSTO"), "RENOVAÇÕES - AGOSTO");
});

test("falha quando não há mês no nome do arquivo", () => {
  assert.throws(() => mesDoArquivo("relatorio.pdf"), /mês/);
});
