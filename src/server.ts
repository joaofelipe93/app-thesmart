import express from "express";
import multer from "multer";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import { config } from "./config";
import { PdfLeitor } from "./adapters/pdfLeitor";
import { OpenAiExtrator } from "./adapters/openaiExtrator";
import { TrelloDestino } from "./adapters/trelloDestino";
import { processarRelatorio } from "./app/pipeline";

// Salva cada upload num diretório temporário próprio, PRESERVANDO o nome
// original — o mês é detectado a partir do nome do arquivo.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(os.tmpdir(), "app-thesmart", crypto.randomUUID());
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => cb(null, file.originalname),
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

const app = express();
app.use(express.static(path.resolve(process.cwd(), "public")));

app.post("/processar", upload.single("relatorio"), async (req, res) => {
  const arquivo = req.file;
  if (!arquivo) {
    res.status(400).json({ erro: "Nenhum arquivo enviado." });
    return;
  }

  // Resposta em NDJSON (uma linha JSON por evento), enviada conforme acontece.
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();
  const enviar = (evento: unknown) => res.write(JSON.stringify(evento) + "\n");

  try {
    const resultado = await processarRelatorio(arquivo.path, {
      leitor: new PdfLeitor(),
      extrator: new OpenAiExtrator({
        apiKey: config.openaiApiKey,
        model: config.openaiModel,
      }),
      destino: new TrelloDestino({
        apiKey: config.trelloApiKey,
        token: config.trelloToken,
      }),
      log: (msg) => enviar({ tipo: "log", msg }),
    });
    enviar({ tipo: "fim", resultado });
  } catch (erro) {
    enviar({
      tipo: "erro",
      msg: erro instanceof Error ? erro.message : String(erro),
    });
  } finally {
    res.end();
    // Remove o PDF temporário (contém dados de clientes).
    fs.rm(path.dirname(arquivo.path), { recursive: true, force: true }, () => {});
  }
});

const porta = Number(process.env.PORT) || 3000;
app.listen(porta, () => {
  console.log(`GUI disponível em http://localhost:${porta}`);
});
