import path from "node:path";

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

// Normaliza removendo acentos, para casar "marco" com "março" etc.
function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Descobre o mês a partir do nome do arquivo do relatório.
 * Ex.: "Relatorio_renovacao_Agosto-2026.pdf" -> "AGOSTO"
 */
export function mesDoArquivo(caminhoArquivo: string): string {
  const base = semAcento(path.basename(caminhoArquivo)).toLowerCase();
  const mes = MESES.find((m) => base.includes(semAcento(m)));
  if (!mes) {
    throw new Error(
      `Não consegui identificar o mês no nome do arquivo "${path.basename(
        caminhoArquivo,
      )}". Inclua o mês no nome, ex.: Relatorio_renovacao_Agosto-2026.pdf`,
    );
  }
  return mes.toUpperCase();
}

/**
 * Descobre o ano a partir do nome do arquivo do relatório.
 * Ex.: "Relatorio_renovacao_Agosto-2026.pdf" -> 2026
 *
 * Procura um ano de 4 dígitos (19xx/20xx) que não faça parte de uma sequência
 * maior de dígitos (assim "20260831_..." não vira "2026") e usa o último, que
 * é o que costuma vir logo depois do mês. Sem ano no nome, assume o ano atual.
 */
export function anoDoArquivo(caminhoArquivo: string): number {
  const base = path.basename(caminhoArquivo);
  const achados = base.match(/(?<!\d)(?:19|20)\d{2}(?!\d)/g);
  if (!achados || achados.length === 0) {
    return new Date().getFullYear();
  }
  return Number(achados[achados.length - 1]);
}

export function nomeQuadro(mes: string, ano: number): string {
  return `${mes} ${ano} - PROCESSO DE VENDA`;
}

export function nomeLista(mes: string): string {
  return `RENOVAÇÕES - ${mes}`;
}
