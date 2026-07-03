import { test } from "node:test";
import assert from "node:assert/strict";
import {
  montarMensagem,
  nomeDoTitulo,
  seguradoraDoTitulo,
} from "../src/domain/mensagens";

test("substitui {nome} e {seguradora} no template", () => {
  assert.equal(
    montarMensagem("Olá {nome}, sua seguradora é {seguradora}.", {
      nome: "MARIA",
      seguradora: "AZUL SEGUROS",
    }),
    "Olá MARIA, sua seguradora é AZUL SEGUROS.",
  );
});

test("tolera variações dos placeholders", () => {
  assert.equal(
    montarMensagem("Oi {{Nome}} — {{seguradora}}", {
      nome: "ANA",
      seguradora: "PORTO SEGURO",
    }),
    "Oi ANA — PORTO SEGURO",
  );
});

test("nomeDoTitulo e seguradoraDoTitulo separam o título", () => {
  assert.equal(nomeDoTitulo("FELIPE RODRIGUES - PORTO SEGURO"), "FELIPE RODRIGUES");
  assert.equal(seguradoraDoTitulo("FELIPE RODRIGUES - PORTO SEGURO"), "PORTO SEGURO");
});

test("título sem seguradora: nome inteiro e seguradora vazia", () => {
  assert.equal(nomeDoTitulo("FELIPE RODRIGUES"), "FELIPE RODRIGUES");
  assert.equal(seguradoraDoTitulo("FELIPE RODRIGUES"), "");
});
