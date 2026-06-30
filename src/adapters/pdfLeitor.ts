import fs from "node:fs/promises";
// Importa direto do lib para evitar o código de debug que o index do pdf-parse
// roda quando é carregado sem argumentos.
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import type { LeitorRelatorio } from "../domain/types";

/** Lê relatórios em PDF do disco. */
export class PdfLeitor implements LeitorRelatorio {
  async lerTexto(caminhoArquivo: string): Promise<string> {
    const buffer = await fs.readFile(caminhoArquivo);
    const { text } = await pdfParse(buffer);
    const texto = text.trim();
    if (!texto) {
      throw new Error(
        "O PDF não tem texto extraível (pode ser um PDF digitalizado/imagem). " +
          "Nesse caso seria necessário OCR.",
      );
    }
    return texto;
  }
}
