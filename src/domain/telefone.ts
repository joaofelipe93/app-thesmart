// Extração e normalização de telefone brasileiro para WhatsApp.

/**
 * Procura um telefone na descrição do cartão. Prioriza linhas rotuladas
 * (telefone/celular/contato/fone/whats); se não achar, tenta qualquer padrão
 * de telefone no texto.
 */
export function extrairTelefone(descricao: string): string | null {
  const padrao = /\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}/;
  for (const linha of descricao.split("\n")) {
    if (/telefone|celular|contato|fone|whats/i.test(linha)) {
      const m = linha.match(padrao);
      if (m) return m[0];
    }
  }
  const m = descricao.match(padrao);
  return m ? m[0] : null;
}

/**
 * Normaliza um telefone brasileiro para o formato internacional só-dígitos
 * (55 + DDD + número). Retorna null para o que não for celular válido
 * (fixo, sem o 9, formato inesperado) — esses não têm WhatsApp.
 */
export function normalizarTelefoneBR(bruto: string): string | null {
  let d = bruto.replace(/\D/g, "");
  // Remove o DDI 55, se já vier com ele.
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  // Celular: DDD (2) + 9 + 8 dígitos = 11, com o "9" logo após o DDD.
  if (d.length === 11 && d[2] === "9") return `55${d}`;
  return null;
}
