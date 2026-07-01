import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Variável de ambiente ${name} não está definida. Copie .env.example para .env e preencha.`,
    );
  }
  return value.trim();
}

export const config = {
  openaiApiKey: required("OPENAI_API_KEY"),
  openaiModel: (process.env.OPENAI_MODEL || "gpt-4o").trim(),
  trelloApiKey: required("TRELLO_API_KEY"),
  trelloToken: required("TRELLO_TOKEN"),
  // Área de trabalho (workspace/organization) onde o quadro é criado.
  // Vazio = quadros pessoais.
  trelloWorkspace: (process.env.TRELLO_WORKSPACE || "").trim(),
};
