# app-thesmart

Lê um relatório de renovação em **PDF**, extrai os clientes usando **OpenAI** e publica os **cartões no Trello** — um cartão por cliente, com checklist e etiqueta de vencimento.

## Fluxo

1. Você roda a app passando o PDF (ex.: `Relatorio_renovacao_Agosto-2026.pdf`).
2. O mês é detectado pelo nome do arquivo (`Agosto`).
3. O texto do PDF é extraído e enviado para a OpenAI, que devolve cada cliente com **nome**, **vencimento** (a data que aparece acima do nome) e demais **detalhes**, em JSON.
4. No Trello:
   - cria (ou reaproveita) o quadro **AGOSTO - PROCESSO DE VENDA**;
   - cria (ou reaproveita) a lista **RENOVAÇÕES - AGOSTO**;
   - para cada cliente, cria um **cartão** (dados na descrição) com:
     - um **checklist "Processo de Renovação"**: FAZER COTAÇÃO, FALAR COM O CLIENTE, TRANSMITIR PROPOSTAS, ACOMPANHAR TRANSMISSÃO DE PROPOSTAS, BAIXAR APÓLICE;
     - uma **etiqueta `VENCIMENTO {data}`** (clientes com a mesma data compartilham a etiqueta).

**Reprocessar é seguro:** clientes que já têm cartão na lista (mesmo nome) são **pulados**, não duplicados. Rodar de novo um relatório atualizado cria só os clientes novos.

## Pré-requisitos

- Node.js 18+ (usa `fetch` nativo).
- Chave da OpenAI.
- API key e token do Trello — gere em https://trello.com/app-key
  (a API key fica na página; clique em "Token" para gerar o token).

## Configuração

```bash
npm install
cp .env.example .env   # preencha as chaves
```

## Uso

```bash
npm start ./Relatorio_renovacao_Agosto-2026.pdf
npm test          # roda os testes (sem rede)
npm run typecheck # checagem de tipos
```

Para outros meses, basta o nome do arquivo conter o mês (ex.: `..._Setembro-2026.pdf`),
que o quadro/lista são nomeados automaticamente (`SETEMBRO - PROCESSO DE VENDA`,
`RENOVAÇÕES - SETEMBRO`).

## Variáveis de ambiente

| Variável          | Descrição                                         |
| ----------------- | ------------------------------------------------- |
| `OPENAI_API_KEY`  | Chave da OpenAI.                                   |
| `OPENAI_MODEL`    | Modelo (opcional, padrão `gpt-4o`).               |
| `TRELLO_API_KEY`  | API key do Trello.                                |
| `TRELLO_TOKEN`    | Token do Trello.                                  |

## Estrutura

Arquitetura de **portas e adaptadores** (o núcleo depende só de interfaces, o que
permite testar o fluxo inteiro sem chamar OpenAI/Trello de verdade).

```
src/
  index.ts             # composition root (CLI): lê o .env e liga os adaptadores
  config.ts            # lê as variáveis de ambiente
  naming.ts            # detecta o mês e monta os nomes do quadro/lista
  domain/
    types.ts           # tipos + interfaces (portas)
    formatters.ts      # descrição do cartão (puro)
    etapas.ts          # itens do checklist
  app/
    pipeline.ts        # núcleo: orquestra ler -> extrair -> publicar
  adapters/
    pdfLeitor.ts       # PDF -> texto
    openaiExtrator.ts  # OpenAI -> lista de clientes
    trelloDestino.ts   # quadro, lista, cartões, checklist, etiquetas
tests/                 # testes (node:test), rodam com fakes, sem rede
```
