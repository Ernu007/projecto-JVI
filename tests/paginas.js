/* O site é UMA página, `index.html`, com cinco secções pela ordem que o
   cliente pediu (Fase 10B): Início, Serviços, Orçamento, Sobre nós,
   Contactos. Os testes que antes liam uma página por assunto leem agora a
   secção respectiva, ou `SITE` (a página inteira). */
import fs from 'node:fs';

export const ORDEM = ['inicio', 'servicos', 'orcamento', 'sobre', 'contactos'];
export const lerPagina = (nome) => fs.readFileSync(nome, 'utf8');
export const SITE = lerPagina('index.html');
export const NOMES = ['index.html'];
export const PAGINAS = { 'index.html': SITE };

/** O HTML de uma secção de topo: do seu `<section id=…>` ao começo da seguinte (ou ao `</main>`). */
export function seccao(id, html = SITE) {
  const i = html.search(new RegExp(String.raw`<section\b[^>]*\bid="${id}"`));
  if (i < 0) throw new Error(`secção #${id} não existe`);
  const resto = html.slice(i + 1);
  const j = resto.search(/<section\b[^>]*\b(?:class="(?:hero|secao-pagina)")|<\/main>/);
  return html.slice(i, j < 0 ? html.length : i + 1 + j);
}
