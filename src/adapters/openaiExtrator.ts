import OpenAI from "openai";
import type { Cliente, ExtratorClientes } from "../domain/types";
import { apenasDigitos, mapaSituacaoPorApolice } from "../domain/situacao";

const SYSTEM_PROMPT = `Você é um assistente que lê relatórios de renovação de seguros e extrai os dados de cada cliente de forma estruturada.

Regras:
- Identifique TODOS os clientes presentes no relatório.
- Cada registro começa com o número da APÓLICE (somente dígitos), seguido de uma letra (a situação) e do nome. Ex.: em "2204043CBRUNO HENRIQUE", a apólice é "2204043"; em "1003110841348ACESAR PINHEIRO", a apólice é "1003110841348".
- "apolice" é esse número da apólice (só os dígitos do início do registro).
- Para cada cliente, "nome" é o nome da pessoa ou empresa (vem logo após a apólice e a letra de situação).
- "seguradora" é o nome da seguradora do cliente (ex.: Porto Seguro, Bradesco Seguros, SulAmérica). Se não houver, omita o campo.
- "vencimento" é a DATA DE VENCIMENTO do cliente, que aparece LOGO ACIMA do nome dele no relatório, no formato dd/mm/aaaa. Use exatamente essa data. Se não houver, omita o campo.
- Em "detalhes", coloque os outros campos relevantes (ex.: ramo, valor/prêmio, contato, telefone, e-mail, observações). Não repita aqui a apólice, o vencimento nem a seguradora. Use as chaves que fizerem sentido para o documento.
- Não invente informações. Se um campo não existir, simplesmente não o inclua.
- Responda SOMENTE com JSON válido no formato:
  { "clientes": [ { "nome": "string", "apolice": "string", "seguradora": "string", "vencimento": "dd/mm/aaaa", "detalhes": { "campo": "valor" } } ] }`;

export interface OpcoesOpenAiExtrator {
  apiKey: string;
  model: string;
}

/** Extrai os clientes usando a API da OpenAI. */
export class OpenAiExtrator implements ExtratorClientes {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(opcoes: OpcoesOpenAiExtrator) {
    this.client = new OpenAI({ apiKey: opcoes.apiKey });
    this.model = opcoes.model;
  }

  async extrair(textoRelatorio: string): Promise<Cliente[]> {
    const resposta = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Extraia os clientes do seguinte relatório:\n\n${textoRelatorio}`,
        },
      ],
    });

    const conteudo = resposta.choices[0]?.message?.content;
    if (!conteudo) {
      throw new Error("A OpenAI não retornou conteúdo na resposta.");
    }

    let dados: { clientes?: Cliente[] };
    try {
      dados = JSON.parse(conteudo);
    } catch {
      throw new Error(
        `Não consegui interpretar o JSON retornado pela OpenAI:\n${conteudo}`,
      );
    }

    const clientes = dados.clientes ?? [];
    if (clientes.length === 0) {
      throw new Error("Nenhum cliente foi identificado no relatório.");
    }

    // A situação (A/C) é derivada do texto pela apólice — determinístico e
    // imune ao erro da LLM quando o nome começa com a mesma letra da situação.
    const situacaoPorApolice = mapaSituacaoPorApolice(textoRelatorio);
    for (const cliente of clientes) {
      const sit = situacaoPorApolice.get(apenasDigitos(cliente.apolice));
      if (sit) cliente.situacao = sit;
    }

    return clientes;
  }
}
