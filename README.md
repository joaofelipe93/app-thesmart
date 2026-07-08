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

### Interface web (recomendado para o dia a dia)

**No Windows**, depois de configurar o `.env` (veja abaixo), é só dar **duplo-clique em `iniciar.bat`**.
Na primeira vez ele instala as dependências sozinho; nas próximas, sobe a aplicação e
**abre o navegador automaticamente**. Para encerrar, feche a janela preta.

Em qualquer sistema, pela linha de comando:

```bash
npm run web
```

Abra **http://localhost:3000** no navegador (ele abre sozinho), arraste o PDF (ou clique
para escolher) e clique em **Processar**. O progresso aparece ao vivo e, no fim, um resumo
de quantos cartões foram criados e quantos já existiam. As chaves ficam no `.env` da
máquina — quem usa não precisa mexer em nada disso.

A porta pode ser mudada com `PORT`; o navegador não abre sozinho se `ABRIR_NAVEGADOR=false`.

### Mensagem no WhatsApp para o cliente quando o cartão muda de lista (opcional)

Um serviço **separado** (`npm run webhook`) recebe o webhook do Trello e, quando um
cartão entra numa lista configurada (`LISTAS_NOTIFICAR`), busca o **telefone do cliente**
na descrição do cartão e envia uma mensagem no **WhatsApp** desse cliente, via **Baileys**
(conexão por QR code). Telefones fixos / sem o 9 são pulados.

> ⚠️ Baileys é **não-oficial** (usa o WhatsApp Web): há risco de bloqueio do número —
> use um **número dedicado**, não o pessoal. Mensagear **clientes externos** aumenta esse
> risco. O serviço precisa ficar **hospedado e ligado** (o Trello só alcança uma
> **URL pública HTTPS**; `localhost` não funciona).

**Passos:**

1. No `.env`, preencha `TRELLO_API_SECRET` (mesma página da API key), `WEBHOOK_CALLBACK_URL`
   (a URL pública completa, ex.: `https://seu-host/webhook/trello`), `LISTAS_NOTIFICAR`
   (lista que dispara, ex.: `Enviar msg Ass 24h e Aplicativo da seguradora`) e, opcionalmente,
   `MENSAGEM_CLIENTE` (o texto enviado, com `{nome}`; vazio usa o padrão do código).
2. Hospede e suba o serviço: `npm run build && npm run webhook:serve`.
3. Abra a URL pública no navegador e **escaneie o QR** com o WhatsApp do número dedicado
   (Aparelhos conectados ▸ Conectar um aparelho). A sessão fica salva em `whatsapp-auth/`.
4. **Registro do webhook:** se `WEBHOOK_CALLBACK_URL` também estiver no `.env` da máquina
   que roda a GUI/CLI, o webhook é **registrado automaticamente** para o quadro toda vez
   que um relatório é processado (idempotente — não duplica). Assim, cada mês novo já
   registra sozinho. Para registrar manualmente (ou ver/limpar), use
   `npm run webhook:registrar <idOuShortLinkDoQuadro>` (`--listar` mostra os existentes).

Pronto: mover um cartão para uma lista-alvo dispara a mensagem no WhatsApp.

### Linha de comando (alternativa)

```bash
npm start ./Relatorio_renovacao_Agosto-2026.pdf
npm test          # roda os testes (sem rede)
npm run typecheck # checagem de tipos
```

Em ambos os casos, basta o nome do arquivo conter o mês (ex.: `..._Setembro-2026.pdf`)
para o quadro/lista serem nomeados automaticamente (`SETEMBRO - PROCESSO DE VENDA`,
`RENOVAÇÕES - SETEMBRO`).

## Variáveis de ambiente

| Variável          | Descrição                                         |
| ----------------- | ------------------------------------------------- |
| `OPENAI_API_KEY`   | Chave da OpenAI.                                                     |
| `OPENAI_MODEL`     | Modelo (opcional, padrão `gpt-4o`).                                  |
| `TRELLO_API_KEY`   | API key do Trello.                                                  |
| `TRELLO_TOKEN`     | Token do Trello.                                                    |
| `TRELLO_WORKSPACE` | Área de trabalho onde o quadro é criado (opcional; vazio = pessoal). |
| `PORT`             | Porta da interface web (opcional, padrão `3000`).                   |

## Estrutura

Arquitetura de **portas e adaptadores** (o núcleo depende só de interfaces, o que
permite testar o fluxo inteiro sem chamar OpenAI/Trello de verdade).

```
src/
  index.ts             # composition root (CLI): lê o .env e liga os adaptadores
  server.ts            # composition root (web): Express + upload + progresso ao vivo
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
public/
  index.html           # a página da interface web (sem build, sem dependências)
tests/                 # testes (node:test), rodam com fakes, sem rede
```

A CLI (`index.ts`) e a web (`server.ts`) são duas "portas de entrada" diferentes
para o mesmo núcleo (`pipeline.ts`) — nenhuma lógica é duplicada.
