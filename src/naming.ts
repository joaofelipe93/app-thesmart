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

export function nomeQuadro(mes: string): string {
  return `${mes} - PROCESSO DE VENDA`;
}

export function nomeLista(mes: string): string {
  return `RENOVAÇÕES - ${mes}`;
}
