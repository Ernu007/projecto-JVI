import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { CAPITAIS, agencyPoint } from '../js/mapa-dados.js';

/* ---------------------------------------------------------------------------
   FASE 8C — correcções do áudio completo (BRIEFING-FASE8C-CORRECCOES.md).

   C1 (rota) e C2 (ordem das províncias) estão em tests/mapa.test.js e
   tests/formulario.test.js, ao lado dos testes que corrigem. Aqui fica o
   resto: a cobertura (C3, C4), os botões e a secção da empresa (C5, C6) e
   o SEO (C7).
   --------------------------------------------------------------------------- */

const HTML = fs.readFileSync('index.html', 'utf8');
const CSS = fs.readFileSync('css/styles.css', 'utf8');

/** O código sem os comentários — a prosa descreve os defeitos antigos. */
const semComentarios = (fonte) => fonte
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const MAIN = semComentarios(fs.readFileSync('js/main.js', 'utf8'));

/** O HTML de uma <section id="…">, sem comentários. */
function seccao(id) {
  const m = new RegExp(`<section\\b[^>]*id="${id}"[^>]*>([\\s\\S]*?)</section>`).exec(HTML);
  assert.ok(m, `não há <section id="${id}">`);
  return m[1].replace(/<!--[\s\S]*?-->/g, '');
}

/** O corpo da primeira regra CSS cujo selector é exactamente `sel`. */
function regra(sel) {
  const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|[}\\s])${esc}\\s*\\{([^}]*)\\}`, 'm').exec(CSS);
  assert.ok(m, `não há regra CSS para ${sel}`);
  return m[1];
}

test('C3: o ponto da JVI em Maputo chama-se Maputo, não Matola', () => {
  assert.equal(CAPITAIS.Maputo.nome, 'Maputo');
  assert.equal(agencyPoint('Maputo').nome, 'Maputo');
});

test('C4: a etiqueta larga é de facto mais larga do que a normal', () => {
  const larga = regra('.etiqueta--larga');
  assert.match(larga, /padding\s*:/);
  assert.match(larga, /min-width\s*:/);
});

/* ---------- C5: os botões de contacto com as cores do Google ---------- */

/** O valor de um token do :root. */
function token(nome) {
  const m = new RegExp(`${nome}\s*:\s*([^;]+);`).exec(CSS);
  assert.ok(m, `token ${nome} não existe`);
  return m[1].trim();
}
const hex = (h) => [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16));
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contraste = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/* Fase 10 (10.1/10.5): os botões fixos são dois — WhatsApp (verde do
   WhatsApp) e telefone (verde da JVI). Sem cores do Google, sem Gmail. */
test('C5: WhatsApp = verde do WhatsApp, telefone = verde da JVI', () => {
  assert.match(regra('.fixo--wa   .fixo__btn'), /background\s*:\s*var\(--wa\)/);
  assert.match(regra('.fixo--tel  .fixo__btn'), /background\s*:\s*var\(--verde-marca\)/);
});

test('C5: o ícone de cada botão lê-se sobre a cor (3:1, gráfico)', () => {
  assert.ok(contraste(hex(token('--sobre-wa')), hex(token('--wa'))) >= 3);
  assert.ok(contraste(hex('#0B0B0C'), hex(token('--verde-marca'))) >= 3);
});

/* ---------- C7: SEO, sem keyword stuffing e sem texto escondido ---------- */

/* Os termos vêm da lógica do negócio e do vocabulário dos concorrentes
   moçambicanos (ver docs/decisoes.md): não há dados de volume de pesquisa
   verificáveis, e o briefing proíbe inventá-los. */
/* Só as expressões de serviço: "Maputo" aparece onze vezes porque é a
   morada e o nome de uma província, e isso não é stuffing. */
const TERMOS = ['envio de encomendas', 'transporte de carga', 'carga aérea', 'agência de carga'];

const titulo = /<title>([^<]*)<\/title>/.exec(HTML)?.[1] ?? '';
const descricao = /<meta name="description" content="([^"]*)"/.exec(HTML)?.[1] ?? '';
const LD = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(HTML)?.[1] ?? '{}');
const minus = (s) => s.toLowerCase();

test('C7: o <title> tem o serviço e o sítio, e cabe no resultado do Google', () => {
  assert.match(minus(titulo), /envio de encomendas/);
  assert.match(minus(titulo), /maputo/);
  assert.match(titulo, /JVI/);
  assert.ok(titulo.replace(/&amp;/g, '&').length <= 65, `o título tem ${titulo.length} caracteres`);
});

test('C7: a meta description tem os termos e o tamanho de um snippet', () => {
  const d = minus(descricao);
  for (const t of ['envio de encomendas', 'carga', 'maputo', 'províncias']) assert.ok(d.includes(t), `falta "${t}"`);
  assert.ok(descricao.length >= 120 && descricao.length <= 160, `a descrição tem ${descricao.length} caracteres`);
});

test('C7: og e twitter dizem o mesmo que o <title> e a description', () => {
  assert.ok(HTML.includes(`<meta property="og:title" content="${titulo}">`));
  assert.ok(HTML.includes(`<meta name="twitter:title" content="${titulo}">`));
  assert.ok(HTML.includes(`<meta property="og:description" content="${descricao}">`));
  assert.ok(HTML.includes(`<meta name="twitter:description" content="${descricao}">`));
});

test('C7: o JSON-LD diz que serviços são e que províncias serve', () => {
  const areas = (LD.areaServed ?? []).map((a) => a.name);
  for (const p of ['Maputo', 'Gaza', 'Inhambane', 'Sofala', 'Manica', 'Tete', 'Zambézia', 'Niassa', 'Nampula', 'Cabo Delgado']) {
    assert.ok(areas.includes(p), `o JSON-LD não serve ${p}`);
  }
  const servicos = (LD.hasOfferCatalog?.itemListElement ?? []).map((o) => minus(o.itemOffered?.name ?? ''));
  for (const t of ['envio de encomendas', 'carga aérea', 'transporte rodoviário']) {
    assert.ok(servicos.some((s) => s.includes(t)), `o catálogo do JSON-LD não tem "${t}"`);
  }
  assert.match(minus(LD.description), /envio de encomendas/);
});

test('C7: sem keyword stuffing — nenhum termo repetido à exaustão', () => {
  /* Conta no texto visível (sem scripts, estilos, comentários e atributos).
     Um limite generoso, mas que apanha um bloco de palavras-chave colado. */
  const visivel = minus(HTML
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' '));
  for (const t of TERMOS) {
    const n = visivel.split(t).length - 1;
    assert.ok(n <= 8, `"${t}" aparece ${n} vezes no texto visível`);
  }
  assert.ok(minus(titulo).split('encomendas').length - 1 <= 1, 'o título repete "encomendas"');
});

