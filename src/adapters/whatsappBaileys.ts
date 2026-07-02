import fs from "node:fs";
import type { Notificador } from "../domain/types";

// Baileys é ESM-only. Este import dinâmico via Function NÃO é rebaixado para
// require() pelo TypeScript/tsx, então funciona no projeto CommonJS.
const importDinamico = new Function("m", "return import(m)") as (
  m: string,
) => Promise<Record<string, unknown>>;

// Logger no-op no formato que o Baileys espera (evita depender do pino).
const loggerSilencioso: Record<string, unknown> = {
  level: "silent",
  trace() {},
  debug() {},
  info() {},
  warn() {},
  error() {},
  fatal() {},
  child() {
    return loggerSilencioso;
  },
};

export interface OpcoesWhatsappBaileys {
  /** Pasta onde a sessão do WhatsApp é salva (para não reescanear toda vez). */
  pastaAuth: string;
  log?: (mensagem: string) => void;
}

/** Notificador via WhatsApp usando Baileys (autenticação por QR code). */
export class WhatsappBaileys implements Notificador {
  private sock: {
    ev: { on(evento: string, cb: (arg: unknown) => void): void };
    sendMessage(jid: string, conteudo: { text: string }): Promise<unknown>;
  } | null = null;
  private qrAtual: string | undefined;
  private conectado = false;

  constructor(private readonly opcoes: OpcoesWhatsappBaileys) {}

  /** QR atual (string) para exibir/escanear; undefined se já conectado. */
  get qr(): string | undefined {
    return this.qrAtual;
  }

  /** true quando o WhatsApp está conectado e pronto para enviar. */
  get pronto(): boolean {
    return this.conectado;
  }

  private log(mensagem: string): void {
    (this.opcoes.log ?? (() => {}))(mensagem);
  }

  /** Inicia a conexão com o WhatsApp (mostra QR na primeira vez). */
  async iniciar(): Promise<void> {
    const baileys = await importDinamico("@whiskeysockets/baileys");
    const makeWASocket = baileys.default as (config: unknown) => typeof this.sock;
    const useMultiFileAuthState = baileys.useMultiFileAuthState as (
      pasta: string,
    ) => Promise<{ state: unknown; saveCreds: () => Promise<void> }>;
    const DisconnectReason = baileys.DisconnectReason as { loggedOut: number };

    fs.mkdirSync(this.opcoes.pastaAuth, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(
      this.opcoes.pastaAuth,
    );

    const conectar = (): void => {
      this.sock = makeWASocket({ auth: state, logger: loggerSilencioso });
      this.sock!.ev.on("creds.update", () => void saveCreds());
      this.sock!.ev.on("connection.update", (u: unknown) => {
        const { connection, lastDisconnect, qr } = u as {
          connection?: string;
          lastDisconnect?: { error?: { output?: { statusCode?: number } } };
          qr?: string;
        };
        if (qr) {
          this.qrAtual = qr;
          this.log("QR atualizado — escaneie na página do servidor.");
        }
        if (connection === "open") {
          this.conectado = true;
          this.qrAtual = undefined;
          this.log("WhatsApp conectado.");
        }
        if (connection === "close") {
          this.conectado = false;
          const codigo = lastDisconnect?.error?.output?.statusCode;
          if (codigo === DisconnectReason.loggedOut) {
            this.log(
              "WhatsApp deslogado — apague a pasta whatsapp-auth e reescaneie.",
            );
          } else {
            this.log("Conexão caiu; reconectando...");
            conectar();
          }
        }
      });
    };

    conectar();
  }

  /** Envia a mensagem para um número (só dígitos, formato internacional 55DDDNUMERO). */
  async enviar(destino: string, mensagem: string): Promise<void> {
    if (!this.conectado || !this.sock) {
      throw new Error(
        "WhatsApp não conectado — escaneie o QR na página do servidor.",
      );
    }
    const jid = `${destino.replace(/\D/g, "")}@s.whatsapp.net`;
    await this.sock.sendMessage(jid, { text: mensagem });
  }
}
