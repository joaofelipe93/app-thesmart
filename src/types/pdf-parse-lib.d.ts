// O @types/pdf-parse só tipa o import principal "pdf-parse".
// Importamos o subcaminho "/lib/pdf-parse.js" para evitar o código de debug
// do index, então declaramos os tipos dele aqui reaproveitando os do pacote.
declare module "pdf-parse/lib/pdf-parse.js" {
  import pdf from "pdf-parse";
  export default pdf;
}
