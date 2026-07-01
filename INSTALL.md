# Instalação do zero (Windows)

Guia para preparar a aplicação em um computador novo. Os passos 1 a 3 são feitos
**uma vez por máquina** (parte técnica). Depois disso, quem usa só dá duplo-clique
no `iniciar.bat`.

---

## Passo 1 — Instalar o Node.js

1. Acesse **https://nodejs.org**.
2. Baixe a versão **LTS** (o botão da esquerda).
3. Execute o instalador e clique em **Next** até o fim (pode deixar tudo no padrão).
4. Pronto — isso também instala o `npm`, que a aplicação usa.

> Para conferir: abra o **Prompt de Comando** e digite `node --version`. Deve aparecer
> algo como `v20.x` ou `v22.x`.

---

## Passo 2 — Baixar os arquivos da aplicação

**Opção A — sem Git (mais simples):**
1. Acesse o repositório no GitHub: `https://github.com/joaofelipe93/app-thesmart`.
2. Clique no botão verde **Code → Download ZIP**.
3. Extraia o ZIP para uma pasta fixa, por exemplo `C:\app-thesmart`.

**Opção B — com Git (se você usa Git):**
```bash
git clone https://github.com/joaofelipe93/app-thesmart.git
```

---

## Passo 3 — Configurar as chaves (`.env`)

A aplicação precisa de 3 chaves para funcionar. Elas ficam num arquivo chamado `.env`.

1. Na pasta da aplicação, encontre o arquivo **`.env.example`**.
2. Faça uma **cópia** dele e renomeie a cópia para **`.env`** (só `.env`, sem `.example`).
3. Abra o `.env` no Bloco de Notas e preencha:

   ```
   OPENAI_API_KEY=...
   OPENAI_MODEL=gpt-4o
   TRELLO_API_KEY=...
   TRELLO_TOKEN=...
   TRELLO_WORKSPACE=THE SMART - 2026
   PORT=3000
   ```

   > `TRELLO_WORKSPACE` é o nome da **área de trabalho** do Trello onde o quadro
   > será criado (exatamente como aparece no Trello). Deixe vazio para criar nos
   > quadros pessoais.

### Onde conseguir cada chave

- **`OPENAI_API_KEY`** — em https://platform.openai.com/api-keys, clique em
  *Create new secret key* e copie o valor (começa com `sk-...`).
- **`TRELLO_API_KEY`** — em https://trello.com/app-key, copie a *API key* da página.
- **`TRELLO_TOKEN`** — na mesma página, clique em *Token* (ou *Gerar um Token*),
  autorize, e copie a sequência longa que aparece.

> **Importante:** o `.env` contém senhas. Não compartilhe e não suba para lugar nenhum.

---

## Passo 4 — Primeiro uso

1. Abra a pasta da aplicação.
2. Dê **duplo-clique em `iniciar.bat`**.
3. Na **primeira vez**, ele instala as dependências e compila a aplicação — isso
   pode levar alguns minutos. Aguarde até o navegador abrir sozinho.
4. Nas próximas vezes ele já pula essas etapas e abre rapidinho.

> **Ao atualizar o programa** (baixar uma versão nova): apague a pasta `dist` antes
> de abrir o `iniciar.bat`, para ele recompilar com o código novo.

---

## Uso no dia a dia

1. Duplo-clique em **`iniciar.bat`**.
2. O navegador abre em `http://localhost:3000`.
3. **Arraste o PDF** do relatório (ou clique para escolher).
4. Clique em **Processar** e acompanhe o progresso.
5. Para **encerrar**, feche a janela preta que ficou aberta.

> O nome do arquivo precisa conter o mês (ex.: `Relatorio_Renovacao_Agosto_2026.pdf`),
> porque é por ele que o quadro e a lista do Trello são nomeados.

---

## Problemas comuns

| Mensagem / sintoma | O que fazer |
|---|---|
| `Node.js nao encontrado` | Faça o Passo 1 (instalar o Node.js) e tente de novo. |
| `Arquivo .env nao encontrado` | Faça o Passo 3 (criar e preencher o `.env`). |
| O navegador não abriu | Abra manualmente e acesse `http://localhost:3000`. |
| `address already in use` (porta ocupada) | A aplicação já está aberta em outra janela, ou mude `PORT` no `.env` (ex.: `3001`). |
| Deu erro ao processar o PDF | Confira se o PDF tem texto (não pode ser uma imagem escaneada) e se as chaves do `.env` estão corretas. |
