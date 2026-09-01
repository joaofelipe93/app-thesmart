import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mesDoArquivo,
  anoDoArquivo,
  nomeQuadro,
  nomeLista,
} from "../src/naming";

test("detecta o mês com e sem acento", () => {
  assert.equal(mesDoArquivo("Relatorio_renovacao_Agosto-2026.pdf"), "AGOSTO");
  assert.equal(mesDoArquivo("rel_Marco-2026.pdf"), "MARÇO");
  assert.equal(mesDoArquivo("/docs/RENOVACAO_setembro.pdf"), "SETEMBRO");
});

test("detecta o ano no nome do arquivo", () => {
  assert.equal(anoDoArquivo("Relatorio_renovacao_Agosto-2026.pdf"), 2026);
  assert.equal(anoDoArquivo("/docs/2025 - renovacao agosto.pdf"), 2025);
  // Sequência maior de dígitos não vale como ano...
  assert.equal(
    anoDoArquivo("20260831_relatorio_agosto.pdf"),
    new Date().getFullYear(),
  );
  // ...e sem ano nenhum, cai no ano atual.
  assert.equal(anoDoArquivo("relatorio_agosto.pdf"), new Date().getFullYear());
});

test("monta os nomes do quadro e da lista", () => {
  assert.equal(nomeQuadro("AGOSTO", 2026), "AGOSTO 2026 - PROCESSO DE VENDA");
  assert.equal(nomeLista("AGOSTO"), "RENOVAÇÕES - AGOSTO");
});

test("falha quando não há mês no nome do arquivo", () => {
  assert.throws(() => mesDoArquivo("relatorio.pdf"), /mês/);
});
