# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é

CLI em TypeScript/Node que lê um relatório de renovação de seguros em **PDF**, extrai os clientes com a **OpenAI** e publica no **Trello**: um cartão por cliente, cada um com **descrição**, um **checklist** de etapas e uma **etiqueta de vencimento**. É um pipeline de uma passada só, sem servidor nem banco de dados. Reprocessar o mesmo relatório é seguro — clientes já presentes na lista são pulados (idempotência por nome).

## Comandos

```bash
npm install
npm start ./Relatorio_renovacao_Agosto-2026.pdf   # CLI, via tsx (dev)
npm run web                                         # GUI web em http://localhost:3000 (PORT muda a porta)
npm test                                            # node:test + tsx (sem rede)
npm run typecheck                                   # tsc --noEmit (checa tudo, inclusive testes)
npm run build                                       # tsc -p tsconfig.build.json -> dist/ (exclui *.test.ts)
npm run serve                                       # node dist/index.js  (CLI, após build)
npm run web:serve                                   # node dist/server.js (GUI, após build)
```

Não há linter. Testes ficam em `tests/` (fora de `src/`), usam `node:test` + `node:assert/strict` e rodam via `node --import tsx`; importam o código de produção via `../src/...`. O `tsconfig.json` base inclui `src` + `tests` (é o que o `typecheck` usa); o `tsconfig.build.json` define `rootDir: src`/`outDir: dist` e inclui só `src`, para o build gerar apenas o código de produção em `dist/`.

Requer **Node 18+** (usa `fetch` nativo) e um `.env` (veja `.env.example`): `OPENAI_API_KEY`, `OPENAI_MODEL` (opcional, padrão `gpt-4o`), `TRELLO_API_KEY`, `TRELLO_TOKEN`, `TRELLO_WORKSPACE` (opcional — nome da área de trabalho onde o quadro é criado; vazio = quadros pessoais). O `config.ts` lança erro no import se qualquer variável **obrigatória** faltar — qualquer script que importe módulos que dependem de `config` precisa do `.env` preenchido.

## Arquitetura

**Portas e adaptadores (hexagonal).** O núcleo depende só de interfaces; OpenAI/Trello/PDF são adaptadores injetados. Isso é o que permite testar o fluxo inteiro sem rede.

- `domain/types.ts` — tipos (`Cliente`, `*Ref`) e as **portas**: `LeitorRelatorio`, `ExtratorClientes`, `DestinoCartoes` (esta inclui `cartoesExistentes`, `criarCartao`, `adicionarChecklist`, `aplicarEtiqueta`). `domain/formatters.ts` tem `descricaoDoCartao` (puro); `domain/etapas.ts` tem o nome e os itens do checklist fixo.
- `app/pipeline.ts` — `processarRelatorio(caminho, deps)`: o **núcleo**. Recebe as portas por injeção e orquestra ler → extrair → publicar. Para cada cliente: pula se já existe na lista, senão cria cartão + checklist + (se houver vencimento) etiqueta. Não importa nada de OpenAI/Trello/PDF nem de `config`, por isso roda igual com adaptadores reais ou com fakes.
- `adapters/` — implementações concretas: `PdfLeitor`, `OpenAiExtrator` (recebe `apiKey`/`model` no construtor), `TrelloDestino` (recebe `apiKey`/`token`).
- `index.ts` (CLI) e `server.ts` (web) — **dois composition roots** para o mesmo núcleo. Cada um lê `config`, instancia os adaptadores e chama `processarRelatorio`. Em teste, o pipeline é exercido com fakes, então `config` (que lança no import se faltar env var) nunca é tocado.
  - `server.ts`: Express. Serve `public/index.html` (estático, sem build) e expõe `POST /processar`. O upload usa `multer` com **diskStorage que preserva o nome original** (o mês depende dele) num diretório temp único, apagado ao fim. A resposta é **NDJSON em streaming**: o callback `log` do pipeline vira eventos `{tipo:"log"}` enviados ao vivo, seguidos de `{tipo:"fim", resultado}` ou `{tipo:"erro"}`. O front lê o stream e mostra progresso + resumo. `public/` é resolvido via `process.cwd()`, então rode pela raiz do projeto (os scripts npm já fazem isso). Ao subir, abre o navegador automaticamente (desligável com `ABRIR_NAVEGADOR=false`).
  - `iniciar.bat` (Windows): atalho de duplo-clique para usuários não-técnicos — checa Node e `.env`, roda `npm install` e `npm run build` só na 1ª vez (`if not exist "dist\server.js"`) e depois chama `npm run web:serve` (compilado, boot rápido). Atualizou o código? Apague `dist/` para recompilar. O `.gitattributes` força CRLF nos `.bat`.

Detalhes que só se entende lendo o código:

1. **Mês vem do nome do arquivo** (`naming.ts`): `..._Agosto-2026.pdf` → `AGOSTO`, definindo quadro `AGOSTO - PROCESSO DE VENDA` e lista `RENOVAÇÕES - AGOSTO`. Normaliza acento (`Marco` casa com `MARÇO`); sem mês reconhecível, lança erro.
2. **`pdf-parse` é importado pelo subcaminho** `pdf-parse/lib/pdf-parse.js` de propósito (evita o debug do `index` do pacote); por isso existe `src/types/pdf-parse-lib.d.ts`. PDF sem texto (imagem) lança erro — não há OCR.
3. **Extração com schema flexível**: `chat.completions`, `response_format: json_object`, `temperature: 0`. Cada `Cliente` é `nome` (título do cartão) + `vencimento` opcional (a data que aparece **logo acima do nome** no relatório, dd/mm/aaaa → vira a etiqueta) + `detalhes` (mapa livre → descrição markdown). Os campos de `detalhes` são desconhecidos de propósito; se o relatório for padronizado, vale travar o schema.
4. **Trello** (`adapters/trelloDestino.ts`): REST via `fetch`, `key`+`token` na query; a API responde `name`/`url`, mapeados para `nome`/`url` do domínio. Pontos a saber:
   - **Quadro e lista são find-or-create por nome.** Se `TRELLO_WORKSPACE` estiver definido, o `idArea()` resolve o id da área de trabalho (organization) por `displayName`/`name` (cacheado, lança se não achar), o quadro é criado com `idOrganization` e o reaproveitamento filtra por essa área.
   - **Idempotência**: `cartoesExistentes` lê os nomes da lista; o pipeline pula clientes já presentes (match por nome exato do título). Não atualiza cartões existentes — só cria os que faltam.
   - **Checklist e etiqueta** são adicionados a cada cartão novo. Etiquetas são reaproveitadas por texto (cache `nome→id` por quadro, carregado uma vez), então clientes com a mesma data compartilham a etiqueta.
   - **Retry**: `chamar()` repete em `429`/`503` com backoff (respeita `Retry-After`), porque um relatório grande dispara muitas chamadas (≈ 8 por cliente: cartão + checklist + 5 itens + etiqueta).

Convenções: código e mensagens ao usuário em **português**; saída em CommonJS.
