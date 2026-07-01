import type {
  CartaoRef,
  DestinoCartoes,
  ListaRef,
  QuadroRef,
} from "../domain/types";

const BASE_URL = "https://api.trello.com/1";

// Cor das etiquetas de vencimento (paleta do Trello: "sky" = azul claro).
const COR_ETIQUETA = "sky";

// Formato bruto devolvido pela API do Trello (usa "name"/"url", não "nome").
interface TrelloBoard {
  id: string;
  name: string;
  idOrganization?: string | null;
}
interface TrelloOrg {
  id: string;
  name: string;
  displayName: string;
}
interface TrelloList {
  id: string;
  name: string;
}
interface TrelloCard {
  id: string;
  name: string;
  url: string;
}
interface TrelloLabel {
  id: string;
  name: string;
}

export interface OpcoesTrelloDestino {
  apiKey: string;
  token: string;
  /** Nome da área de trabalho (workspace). Vazio = quadros pessoais. */
  workspace?: string;
}

/** Publica quadro, lista e cartões no Trello via API REST. */
export class TrelloDestino implements DestinoCartoes {
  constructor(private readonly opcoes: OpcoesTrelloDestino) {}

  // Cache de etiquetas por quadro (nome -> id) para não recriar/recarregar.
  private etiquetasPorQuadro = new Map<string, Map<string, string>>();
  // Cache do id da área de trabalho (resolvido uma vez pelo nome).
  private idAreaResolvido?: string;

  /** Lista as áreas de trabalho (workspaces) do usuário — usado pela GUI. */
  async listarAreas(): Promise<{ id: string; nome: string }[]> {
    const orgs = await this.chamar<TrelloOrg[]>(
      "GET",
      "/members/me/organizations",
      { fields: "name,displayName" },
    );
    return orgs.map((o) => ({ id: o.id, nome: o.displayName }));
  }

  /** Resolve o id da área de trabalho pelo nome; undefined se não houver workspace configurada. */
  private async idArea(): Promise<string | undefined> {
    const nome = this.opcoes.workspace?.trim();
    if (!nome) return undefined;
    if (this.idAreaResolvido) return this.idAreaResolvido;

    const orgs = await this.chamar<TrelloOrg[]>(
      "GET",
      "/members/me/organizations",
      { fields: "name,displayName" },
    );
    const area = orgs.find(
      (o) => o.displayName === nome || o.name === nome,
    );
    if (!area) {
      const disponiveis =
        orgs.map((o) => `"${o.displayName}"`).join(", ") || "(nenhuma)";
      throw new Error(
        `Área de trabalho "${nome}" não encontrada no Trello. Disponíveis: ${disponiveis}.`,
      );
    }
    this.idAreaResolvido = area.id;
    return area.id;
  }

  /** Chamada à API do Trello já incluindo key+token e tratando erros. */
  private async chamar<T>(
    method: "GET" | "POST",
    path: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    url.searchParams.set("key", this.opcoes.apiKey);
    url.searchParams.set("token", this.opcoes.token);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    const maxTentativas = 5;
    for (let tentativa = 1; ; tentativa++) {
      const resposta = await fetch(url, { method });
      if (resposta.ok) {
        return (await resposta.json()) as T;
      }

      // 429 (limite de taxa) e 503: espera e tenta de novo.
      const temporario = resposta.status === 429 || resposta.status === 503;
      if (temporario && tentativa < maxTentativas) {
        const retryAfter = Number(resposta.headers.get("retry-after"));
        const esperaMs =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : 500 * 2 ** (tentativa - 1); // backoff: 0.5s, 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, esperaMs));
        continue;
      }

      const corpo = await resposta.text();
      throw new Error(
        `Erro na API do Trello (${resposta.status} ${resposta.statusText}) em ${method} ${path}: ${corpo}`,
      );
    }
  }

  /** Cria o quadro na área de trabalho configurada, ou reaproveita um existente de mesmo nome nela. */
  async garantirQuadro(nome: string): Promise<QuadroRef> {
    const idArea = await this.idArea();

    const quadros = await this.chamar<TrelloBoard[]>(
      "GET",
      "/members/me/boards",
      { fields: "name,idOrganization" },
    );
    const existente = quadros.find(
      (q) => q.name === nome && (!idArea || q.idOrganization === idArea),
    );
    if (existente) return { id: existente.id, nome: existente.name };

    const params: Record<string, string> = {
      name: nome,
      defaultLists: "false",
    };
    if (idArea) params.idOrganization = idArea;

    const criado = await this.chamar<TrelloBoard>("POST", "/boards", params);
    return { id: criado.id, nome: criado.name };
  }

  /** Cria a lista no quadro, ou reaproveita uma existente de mesmo nome. */
  async garantirLista(quadro: QuadroRef, nome: string): Promise<ListaRef> {
    const listas = await this.chamar<TrelloList[]>(
      "GET",
      `/boards/${quadro.id}/lists`,
      { fields: "name" },
    );
    const existente = listas.find((l) => l.name === nome);
    if (existente) return { id: existente.id, nome: existente.name };

    // pos "bottom" = adiciona à direita, então a ordem de criação é preservada
    // (RENOVAÇÕES é criada primeiro, então fica sempre em primeiro).
    const criada = await this.chamar<TrelloList>("POST", "/lists", {
      name: nome,
      idBoard: quadro.id,
      pos: "bottom",
    });
    return { id: criada.id, nome: criada.name };
  }

  /** Nomes dos cartões abertos já presentes na lista. */
  async cartoesExistentes(lista: ListaRef): Promise<Set<string>> {
    const cartoes = await this.chamar<TrelloCard[]>(
      "GET",
      `/lists/${lista.id}/cards`,
      { fields: "name" },
    );
    return new Set(cartoes.map((c) => c.name));
  }

  /** Cria um cartão na lista. */
  async criarCartao(
    lista: ListaRef,
    nome: string,
    descricao: string,
  ): Promise<CartaoRef> {
    const cartao = await this.chamar<TrelloCard>("POST", "/cards", {
      idList: lista.id,
      name: nome,
      desc: descricao,
    });
    return { id: cartao.id, nome: cartao.name, url: cartao.url };
  }

  /** Cria um checklist no cartão e adiciona os itens (na ordem informada). */
  async adicionarChecklist(
    cartao: CartaoRef,
    nome: string,
    itens: readonly string[],
  ): Promise<void> {
    const checklist = await this.chamar<{ id: string }>("POST", "/checklists", {
      idCard: cartao.id,
      name: nome,
    });
    for (const item of itens) {
      await this.chamar<unknown>(
        "POST",
        `/checklists/${checklist.id}/checkItems`,
        { name: item },
      );
    }
  }

  /** Anexa ao cartão uma etiqueta com o texto dado, reaproveitando-a no quadro. */
  async aplicarEtiqueta(
    quadro: QuadroRef,
    cartao: CartaoRef,
    texto: string,
  ): Promise<void> {
    const etiquetas = await this.carregarEtiquetas(quadro);

    let idEtiqueta = etiquetas.get(texto);
    if (!idEtiqueta) {
      const criada = await this.chamar<TrelloLabel>("POST", "/labels", {
        idBoard: quadro.id,
        name: texto,
        color: COR_ETIQUETA,
      });
      idEtiqueta = criada.id;
      etiquetas.set(texto, idEtiqueta);
    }

    await this.chamar<unknown>("POST", `/cards/${cartao.id}/idLabels`, {
      value: idEtiqueta,
    });
  }

  /** Carrega (uma vez por quadro) o mapa nome→id das etiquetas existentes. */
  private async carregarEtiquetas(
    quadro: QuadroRef,
  ): Promise<Map<string, string>> {
    const cache = this.etiquetasPorQuadro.get(quadro.id);
    if (cache) return cache;

    const labels = await this.chamar<TrelloLabel[]>(
      "GET",
      `/boards/${quadro.id}/labels`,
      { fields: "name", limit: "1000" },
    );
    const mapa = new Map<string, string>(
      labels.filter((l) => l.name).map((l) => [l.name, l.id] as const),
    );
    this.etiquetasPorQuadro.set(quadro.id, mapa);
    return mapa;
  }
}
