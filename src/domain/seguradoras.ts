// Contatos (assistência + app) por seguradora, escolhidos pela seguradora do cartão.

interface InfoSeguradora {
  /** Palavras-chave (MAIÚSCULAS, sem acento) para casar com a seguradora do cartão. */
  chaves: string[];
  /** Linhas de telefone/assistência. */
  assistencia: string[];
  iOS: string;
  android: string;
}

const APP_PORTO_IOS =
  "https://apps.apple.com/us/app/porto-seguros-cart%C3%A3o-e/id1511026277?pt=304855&ct=hub-vendas&mt=";
const APP_PORTO_ANDROID =
  "https://play.google.com/store/apps/details?id=br.com.portoseguro.experienciacliente.mundoporto&referrer=utm_source%3Dhub-vendas%26utm_medium%3Dcta-download%26utm_campaign%3Dhub-vendas&pli=1";

const SEGURADORAS: InfoSeguradora[] = [
  {
    chaves: ["PORTO"],
    assistencia: [
      "11 3366-3333 ou 3337-6786 - São Paulo Capital",
      "0800 727 0800 - Demais localidades",
      "11 3003-9303 - Atendimento via WhatsApp",
    ],
    iOS: APP_PORTO_IOS,
    android: APP_PORTO_ANDROID,
  },
  {
    chaves: ["AZUL"],
    assistencia: [
      "(11) 4004-3700 - Capitais e Grandes Centros",
      "0800 703 0203 - Demais localidades",
      "(21) 3906-2985 - Atendimento 24h via WhatsApp",
    ],
    iOS: APP_PORTO_IOS,
    android: APP_PORTO_ANDROID,
  },
  {
    chaves: ["ITAU"],
    assistencia: [
      "3003 1010 - Capitais e regiões metropolitanas",
      "0800 720 1010 - Demais localidades",
      "11 9 8355 9577 - Atendimento via WhatsApp",
    ],
    iOS: APP_PORTO_IOS,
    android: APP_PORTO_ANDROID,
  },
  {
    chaves: ["MAPFRE"],
    assistencia: [
      "(11) 4004 0101 - Capitais e principais cidades metropolitanas",
      "0800 705 0101 - Demais localidades",
    ],
    iOS: "https://apps.apple.com/br/app/mapfre-seguros-brasil/id1545147307",
    android:
      "https://play.google.com/store/apps/details?id=com.mapfre.autoserviciobr&hl=pt_BR&gl=US",
  },
  {
    chaves: ["TOKIO"],
    assistencia: [
      "0800 318 6546",
      "11 995786546 - Atendimento via WhatsApp",
    ],
    iOS: "https://apps.apple.com/br/app/tokio-marine/id1582879602",
    android:
      "https://play.google.com/store/apps/details?id=br.com.tokiomarine.seguradora.mobile.superapp&hl=pt_BR&gl=US",
  },
  {
    chaves: ["HDI"],
    assistencia: [
      "(11) 3003-5390 - Capitais e Regiões Metropolitanas",
      "0800 434 4340 - Demais localidades",
      "(11) 55020700 - Atendimento via WhatsApp",
    ],
    iOS: "https://apps.apple.com/br/app/hdi-segurado/id1170248571",
    android:
      "https://play.google.com/store/apps/details?id=com.hdi.segurado&hl=pt_BR&gl=US",
  },
  {
    chaves: ["BRADESCO"],
    assistencia: [
      "0800 701 4120",
      "4004-5423 - Capitais e Regiões Metropolitanas (Central de Atendimento)",
      "0800 709 5423 - Demais localidades (Central de Atendimento)",
    ],
    iOS: "https://apps.apple.com/br/app/bradesco-seguros/id1256508403",
    android:
      "https://play.google.com/store/apps/details?id=br.com.bradseg.bscelular",
  },
  {
    chaves: ["ZURICH"],
    assistencia: [
      "0800 729 1400 - Território Nacional",
      "(11) 2890-2121 - Atendimento via WhatsApp",
    ],
    iOS: "https://apps.apple.com/br/app/zurich-one-seguros/id6450266992",
    android:
      "https://play.google.com/store/apps/details?id=com.zurich.zurichone",
  },
  {
    chaves: ["YELUM", "LIBERTY"],
    assistencia: [
      "0800 729 1400 - Território Nacional",
      "(11) 2890-2121 - Atendimento via WhatsApp",
    ],
    iOS: "https://apps.apple.com/br/app/yelum-seguradora/id598237274",
    android:
      "https://play.google.com/store/apps/details?id=br.com.libertyseguros.mobile",
  },
  {
    chaves: ["ALIRO"],
    assistencia: [
      "11 3003 2127 - Capitais e grandes centros",
      "0800 220 2127 - Central de atendimento",
      "0800 770 1318 - Assistência 24 horas",
    ],
    iOS: "https://apps.apple.com/br/app/aliro-seguro/id1300679846",
    android:
      "https://play.google.com/store/apps/details?id=br.com.libertyseguros.aliro&hl=pt_BR&gl=US",
  },
];

const FALLBACK =
  "Consulte os canais de atendimento e o aplicativo da sua seguradora. " +
  "Qualquer dúvida, fale com a gente — estamos à disposição!";

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
}

function bloco(info: InfoSeguradora): string {
  const linhas = info.assistencia.map((l) => `- ${l}`).join("\n");
  return (
    `*📞 Assistência 24 horas:*\n${linhas}\n\n` +
    `*📱 Aplicativo:*\n` +
    `- iOS (iPhone): ${info.iOS}\n` +
    `- Android: ${info.android}`
  );
}

/**
 * Bloco de contatos/app da seguradora do cartão. Se a seguradora não for
 * reconhecida, devolve um texto de fallback genérico.
 */
export function contatosDaSeguradora(seguradora: string): string {
  const alvo = normalizar(seguradora);
  const info = SEGURADORAS.find((s) => s.chaves.some((k) => alvo.includes(k)));
  return info ? bloco(info) : FALLBACK;
}
