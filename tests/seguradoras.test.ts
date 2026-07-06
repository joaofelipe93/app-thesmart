import { test } from "node:test";
import assert from "node:assert/strict";
import { contatosDaSeguradora } from "../src/domain/seguradoras";

test("casa a seguradora pelo nome (variações de caixa/acento)", () => {
  assert.match(contatosDaSeguradora("PORTO SEGURO"), /0800 727 0800/);
  assert.match(contatosDaSeguradora("azul seguros"), /4004-3700/);
  assert.match(contatosDaSeguradora("ITAÚ"), /0800 720 1010/);
  assert.match(contatosDaSeguradora("Tokio Marine"), /0800 318 6546/);
  assert.match(contatosDaSeguradora("MAPFRE"), /0800 705 0101/);
  assert.match(contatosDaSeguradora("HDI"), /0800 434 4340/);
  assert.match(contatosDaSeguradora("Bradesco Seguros"), /0800 701 4120/);
  assert.match(contatosDaSeguradora("ZURICH"), /zurichone/);
  assert.match(contatosDaSeguradora("YELUM"), /yelum-seguradora/);
  assert.match(contatosDaSeguradora("Liberty"), /yelum-seguradora/); // Liberty -> Yelum
  assert.match(contatosDaSeguradora("ALIRO"), /0800 770 1318/);
});

test("todo bloco reconhecido tem assistência e app", () => {
  const b = contatosDaSeguradora("PORTO SEGURO");
  assert.match(b, /Assistência 24 horas/);
  assert.match(b, /iOS \(iPhone\):/);
  assert.match(b, /Android:/);
});

test("Suhai tem contatos mas não tem app", () => {
  const b = contatosDaSeguradora("SUHAI SEGUROS");
  assert.match(b, /0800 327 8424/);
  assert.doesNotMatch(b, /Aplicativo/);
});

test("Allianz tem contatos e app", () => {
  const b = contatosDaSeguradora("ALLIANZ SEGUROS");
  assert.match(b, /0800 777 7243/);
  assert.match(b, /allianz-cliente-auto/);
});

test("seguradora desconhecida usa o fallback", () => {
  const b = contatosDaSeguradora("SULAMÉRICA SEGUROS");
  assert.match(b, /Consulte os canais de atendimento/);
  assert.doesNotMatch(b, /0800/);
});
