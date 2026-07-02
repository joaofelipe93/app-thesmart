import { test } from "node:test";
import assert from "node:assert/strict";
import { processarRelatorio } from "../src/app/pipeline";
import { ETAPAS_RENOVACAO } from "../src/domain/etapas";
import { LISTAS_FLUXO } from "../src/domain/listas";
import type {
  Cliente,
  DestinoCartoes,
  ExtratorClientes,
  LeitorRelatorio,
  ListaRef,
  QuadroRef,
  CartaoRef,
} from "../src/domain/types";

class LeitorFake implements LeitorRelatorio {
  constructor(private readonly texto: string) {}
  async lerTexto(): Promise<string> {
    return this.texto;
  }
}

class ExtratorFake implements ExtratorClientes {
  constructor(private readonly clientes: Cliente[]) {}
  async extrair(): Promise<Cliente[]> {
    return this.clientes;
  }
}

class DestinoFake implements DestinoCartoes {
  quadros: string[] = [];
  listas: string[] = [];
  cartoes: { lista: string; nome: string; descricao: string }[] = [];
  checklists: { cartao: string; nome: string; itens: readonly string[] }[] = [];
  etiquetas: { cartao: string; texto: string }[] = [];
  /** Nomes já presentes na lista antes de processar (pré-semeável nos testes). */
  existentesIniciais = new Set<string>();

  async garantirQuadro(nome: string): Promise<QuadroRef> {
    this.quadros.push(nome);
    return { id: "q1", nome };
  }
  async garantirLista(_quadro: QuadroRef, nome: string): Promise<ListaRef> {
    this.listas.push(nome);
    return { id: "l1", nome };
  }
  async cartoesExistentes(): Promise<Set<string>> {
    return new Set(this.existentesIniciais);
  }
  async criarCartao(
    lista: ListaRef,
    nome: string,
    descricao: string,
  ): Promise<CartaoRef> {
    this.cartoes.push({ lista: lista.nome, nome, descricao });
    return { id: `c${this.cartoes.length}`, nome, url: `https://trello/${nome}` };
  }
  async adicionarChecklist(
    cartao: CartaoRef,
    nome: string,
    itens: readonly string[],
  ): Promise<void> {
    this.checklists.push({ cartao: cartao.nome, nome, itens });
  }
  async aplicarEtiqueta(
    _quadro: QuadroRef,
    cartao: CartaoRef,
    texto: string,
  ): Promise<void> {
    this.etiquetas.push({ cartao: cartao.nome, texto });
  }
}

test("deriva os nomes do arquivo e cria um cartão por cliente", async () => {
  const destino = new DestinoFake();

  const resultado = await processarRelatorio(
    "Relatorio_renovacao_Agosto-2026.pdf",
    {
      leitor: new LeitorFake("texto qualquer"),
      extrator: new ExtratorFake([
        {
          nome: "Cliente A",
          seguradora: "Porto Seguro",
          vencimento: "01/08/2026",
          detalhes: { "Apólice": "123" },
        },
        { nome: "Cliente B", detalhes: {} },
      ]),
      destino,
    },
  );

  assert.equal(resultado.quadro, "AGOSTO - PROCESSO DE VENDA");
  assert.equal(resultado.lista, "RENOVAÇÕES - AGOSTO");
  assert.deepEqual(destino.quadros, ["AGOSTO - PROCESSO DE VENDA"]);
  // A lista de renovações vem primeiro, seguida das listas do fluxo.
  assert.deepEqual(destino.listas, ["RENOVAÇÕES - AGOSTO", ...LISTAS_FLUXO]);
  assert.equal(destino.cartoes.length, 2);
  // Título = "NOME - SEGURADORA" (ou só o nome quando não há seguradora).
  assert.equal(destino.cartoes[0].nome, "Cliente A - Porto Seguro");
  assert.equal(destino.cartoes[1].nome, "Cliente B");
  assert.match(destino.cartoes[0].descricao, /Apólice/);
  assert.equal(resultado.cartoes.length, 2);

  // Cada cartão recebe o checklist com as 5 etapas, na ordem.
  assert.equal(destino.checklists.length, 2);
  assert.deepEqual(destino.checklists[0].itens, ETAPAS_RENOVACAO);
  assert.equal(destino.checklists[0].cartao, "Cliente A - Porto Seguro");
  assert.deepEqual(destino.checklists[0].itens, [
    "FAZER COTAÇÃO",
    "FALAR COM O CLIENTE",
    "TRANSMITIR PROPOSTA",
    "ACOMPANHAR TRANSMISSÃO DE PROPOSTA",
    "BAIXAR APÓLICE",
  ]);

  // Só quem tem vencimento recebe etiqueta "VENCIMENTO {data}".
  assert.equal(destino.etiquetas.length, 1);
  assert.deepEqual(destino.etiquetas[0], {
    cartao: "Cliente A - Porto Seguro",
    texto: "VENCIMENTO 01/08/2026",
  });

  // Nada foi pulado nem ignorado (lista vazia, sem cancelados).
  assert.equal(resultado.pulados, 0);
  assert.equal(resultado.ignorados, 0);
});

test("ignora clientes cancelados (situação C)", async () => {
  const destino = new DestinoFake();

  const resultado = await processarRelatorio("x_Agosto.pdf", {
    leitor: new LeitorFake("t"),
    extrator: new ExtratorFake([
      { nome: "Ativo", situacao: "A", detalhes: {} },
      { nome: "Cancelado", situacao: "C", detalhes: {} },
    ]),
    destino,
  });

  assert.equal(resultado.ignorados, 1);
  assert.equal(resultado.cartoes.length, 1);
  assert.equal(destino.cartoes.length, 1);
  assert.equal(destino.cartoes[0].nome, "Ativo");
});

test("não recria cartões de clientes que já existem na lista", async () => {
  const destino = new DestinoFake();
  // O cartão existente tem o título composto (nome - seguradora).
  destino.existentesIniciais.add("Cliente A - Porto Seguro");

  const resultado = await processarRelatorio("x_Agosto.pdf", {
    leitor: new LeitorFake("t"),
    extrator: new ExtratorFake([
      {
        nome: "Cliente A",
        seguradora: "Porto Seguro",
        vencimento: "01/08/2026",
        detalhes: {},
      },
      { nome: "Cliente B", detalhes: {} },
    ]),
    destino,
  });

  // Cliente A já existia -> pulado; só Cliente B é criado.
  assert.equal(resultado.pulados, 1);
  assert.equal(resultado.cartoes.length, 1);
  assert.equal(destino.cartoes.length, 1);
  assert.equal(destino.cartoes[0].nome, "Cliente B");
  assert.equal(destino.checklists.length, 1);
  assert.equal(destino.etiquetas.length, 0); // Cliente B não tem vencimento
});

test("propaga erro do destino sem engolir", async () => {
  class DestinoQuebrado extends DestinoFake {
    async garantirQuadro(): Promise<QuadroRef> {
      throw new Error("falha no trello");
    }
  }

  await assert.rejects(
    () =>
      processarRelatorio("x_Agosto.pdf", {
        leitor: new LeitorFake("t"),
        extrator: new ExtratorFake([{ nome: "A", detalhes: {} }]),
        destino: new DestinoQuebrado(),
      }),
    /falha no trello/,
  );
});
