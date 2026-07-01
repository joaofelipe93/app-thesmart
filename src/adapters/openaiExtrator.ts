import OpenAI from "openai";
import type { Cliente, ExtratorClientes } from "../domain/types";

const SYSTEM_PROMPT = `Você é um assistente que lê relatórios de renovação de seguros e extrai os dados de cada cliente de forma estruturada.

Regras:
- Identifique TODOS os clientes presentes no relatório.
- Para cada cliente, "nome" é o nome da pessoa ou empresa.
- "seguradora" é o nome da seguradora do cliente (ex.: Porto Seguro, Bradesco Seguros, SulAmérica). Se não houver, omita o campo.
- "vencimento" é a DATA DE VENCIMENTO do cliente, que aparece LOGO ACIMA do nome dele no relatório, no formato dd/mm/aaaa. Use exatamente essa data. Se não houver, omita o campo.
- Em "detalhes", coloque os outros campos relevantes que aparecerem (ex.: apólice, ramo, valor/prêmio, contato, telefone, e-mail, observações). Não repita aqui o vencimento nem a seguradora. Use as chaves que fizerem sentido para o documento.
- Não invente informações. Se um campo não existir, simplesmente não o inclua.
- Responda SOMENTE com JSON válido no formato:
  { "clientes": [ { "nome": "string", "seguradora": "string", "vencimento": "dd/mm/aaaa", "detalhes": { "campo": "valor" } } ] }`;

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
    return clientes;
  }
}
