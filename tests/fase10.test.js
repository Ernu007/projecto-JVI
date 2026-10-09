import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ORDEM, SITE, seccao } from './paginas.js';

/* ---------------------------------------------------------------------------
   FASE 10 / 10B — o site em UMA página com cinco secções (a 10B revogou as cinco páginas)

   O cliente achou o site "demasiado robusto": informação a mais, repetida,
   scroll longo. O Ernu aprovou cinco páginas HTML estáticas (Início,
   Serviços, Sobre nós, Orçamento, Contactos), com o mesmo cabeçalho e o
   mesmo rodapé em todas, e a regra de que cada informação aparece UMA só
   vez. Este ficheiro guarda isso.
   --------------------------------------------------------------------------- */

const MENU = [
  ['#inicio', 'Início'],
  ['#servicos', 'Serviços'],
  ['#orcamento', 'Orçamento'],
  ['#sobre', 'Sobre nós'],
  ['#contactos', 'Contactos'],
];

const entre = (html, abre, fecha) => {
  const i = html.indexOf(abre);
  const j = html.indexOf(fecha, i);
  assert.ok(i >= 0 && j > i, `não encontrei ${abre} … ${fecha}`);
  return html.slice(i, j + fecha.length);
};
/** O texto visível: sem <script>, <template>, comentários e etiquetas. */
const texto = (html) => html
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<template[\s\S]*?<\/template>/g, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ');
const principal = (html) => entre(html, '<main', '</main>');

test('10B.1: o site é uma só página, e as quatro páginas extra foram apagadas', () => {
  assert.ok(fs.existsSync('index.html'));
  for (const n of ['servicos.html', 'sobre.html', 'orcamento.html', 'contactos.html']) {
    assert.ok(!fs.existsSync(n), `${n} devia ter sido apagada`);
  }
  assert.deepEqual(fs.readdirSync('.').filter((f) => f.endsWith('.html')), ['index.html']);
});

test('10B.1: as cinco secções estão pela ordem Início, Serviços, Orçamento, Sobre nós, Contactos', () => {
  const main = principal(SITE);
  const ids = [...main.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ORDEM);
  /* O orçamento (com as FAQ) vem ANTES de Sobre nós. */
  assert.ok(main.indexOf('id="faq"') < main.indexOf('id="sobre"'));
});

test('10B.1: o menu tem cinco âncoras, pela ordem, no cabeçalho e no menu móvel', () => {
  const nav = entre(SITE, '<nav class="nav"', '</nav>');
  const itens = [...nav.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(itens, MENU);
  const movel = entre(SITE, '<nav class="menu"', '</nav>');
  assert.deepEqual([...movel.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m) => [m[1], m[2]]), MENU);
  for (const [href] of MENU) assert.ok(SITE.includes(`id="${href.slice(1)}"`), `${href} não existe`);
});

test('10B.1: o item da secção visível leva aria-current (IntersectionObserver) e o cabeçalho é compensado', () => {
  const js = fs.readFileSync('js/main.js', 'utf8');
  assert.match(js, /new IntersectionObserver\(marcarSeccaoActual/);
  assert.match(js, /setAttribute\('aria-current'/);
  const css = fs.readFileSync('css/styles.css', 'utf8');
  assert.match(css, /\.hero,\s*\.secao-pagina\s*\{\s*scroll-margin-top:\s*\d+px/);
  assert.match(css, /html\s*\{[^}]*scroll-behavior:\s*smooth/);
});

test('10B.1: o cabeçalho não tem botão "Pedir orçamento" — o cliente riscou-o', () => {
  const cab = entre(SITE, '<header', '</header>');
  assert.doesNotMatch(cab, /Pedir orçamento|<button class="btn|header__cta/);
  assert.doesNotMatch(SITE, /data-abrir-orc/);
});

test('10B.1: um só <h1> (o do hero); as outras secções abrem com <h2>', () => {
  assert.equal((SITE.match(/<h1[\s>]/g) ?? []).length, 1);
  assert.match(seccao('inicio'), /<h1>/);
  for (const id of ORDEM.slice(1)) assert.match(seccao(id), new RegExp(`<h2 id="t-${id}">`), `#${id} sem título`);
  assert.equal((SITE.match(/<link rel="canonical"/g) ?? []).length, 1);
});

test('10B.1: cada informação aparece uma só vez', () => {
  const corpo = texto(principal(SITE));

  /* O mapa de Moçambique é só o do hero. */
  assert.equal((SITE.match(/<canvas\b/g) ?? []).length, 1, 'há mais de um canvas no site');
  assert.match(seccao('inicio'), /<canvas id="canvasHero"/);
  assert.doesNotMatch(SITE, /canvasMapa|id="cobertura"|class="rotas"/, 'a secção Cobertura voltou');

  assert.doesNotMatch(SITE, /10\+ anos|hero__provas|class="prova"/);
  assert.equal((corpo.match(/dez anos|10 anos/gi) ?? []).length, 1);

  /* Credenciais no corpo: só em Sobre nós (o rodapé legal fica fora do <main>). */
  for (const id of ORDEM) {
    const tem = /NUEL|NUIT|8732\/11\/04\/PS\/2014/.test(texto(seccao(id)));
    assert.equal(tem, id === 'sobre', `#${id}: credenciais ${tem ? 'presentes' : 'em falta'}`);
  }

  assert.doesNotMatch(SITE, /Xai-Xai[^"]*Inhambane[^"]*Beira/, 'a lista de cidades voltou');
  assert.doesNotMatch(SITE, /rodape__seo/, 'o bloco SEO do rodapé voltou');

  /* O preço escreve-se uma vez, em Orçamento (o formulário calcula-o). */
  assert.equal((corpo.match(/255 MT/g) ?? []).length, 1);
  assert.match(texto(seccao('orcamento')), /255 MT/);

  /* Os contactos escrevem-se em Contactos; as outras secções só linkam. */
  for (const id of ORDEM.filter((x) => x !== 'contactos')) {
    assert.doesNotMatch(texto(seccao(id)), /\+258|jvicargaservicos@gmail\.com|Nº 113/, `#${id} repete contactos`);
  }
  /* O resumo de serviços do Início já não existe: Serviços diz-se uma vez. */
  assert.doesNotMatch(SITE, /resumo__i|resumo__mais/);
});

test('10B.1: Serviços tem carga aérea, rodoviária e os quatro passos da recolha à entrega', () => {
  const s = seccao('servicos');
  assert.equal((s.match(/<article class="servico">/g) ?? []).length, 2);
  assert.match(s, /Transporte aéreo/);
  assert.match(s, /Transporte rodoviário/);
  assert.equal((s.match(/<li class="passo">/g) ?? []).length, 4);
});

test('10B.1: o formulário e as perguntas frequentes (no máximo quatro) estão em Orçamento', () => {
  const o = seccao('orcamento');
  assert.match(SITE, /<template id="tplOrc">/);
  assert.match(o, /<div class="orc-caixa" id="orcRaiz">/);
  assert.match(SITE, /id="confirm"/);
  const perguntas = o.match(/<details class="faq__i">/g) ?? [];
  assert.ok(perguntas.length >= 1 && perguntas.length <= 4, `${perguntas.length} perguntas frequentes`);
  assert.doesNotMatch(SITE, /name="(destino|numeroDestino|whatsappDestino)"/);
});

test('10B.1: Contactos tem WhatsApp em destaque, telefone, email, morada e "Como chegar"', () => {
  const c = seccao('contactos');
  assert.match(c, /<a class="btn btn--wa btn--grande btn--bloco" href="https:\/\/wa\.me\//);
  assert.match(c, /href="tel:\+258844700012"/);
  assert.match(c, /href="mailto:jvicargaservicos@gmail\.com"/);
  assert.match(c, /Av\. 19 de Outubro, Terminal de Cargas Nº 113/);
  assert.match(c, /Como chegar à JVI/);
  assert.match(c, /3H9C%2BVJ8/, 'o Plus Code saiu do botão');
});

test('10B.1: a publicação, o sitemap e o robots conhecem só a página única', () => {
  const publicar = fs.readFileSync('tools/publicar.py', 'utf8');
  const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
  assert.match(publicar, /PAGINAS = \["index\.html"\]/);
  assert.doesNotMatch(publicar, /servicos\.html|sobre\.html|orcamento\.html|contactos\.html/);
  assert.equal((sitemap.match(/<loc>/g) ?? []).length, 1);
  assert.ok(sitemap.includes('<loc>https://jvicargaservicos.co.mz/</loc>'));
  assert.doesNotMatch(sitemap, /\.html</);
  const robots = fs.readFileSync('robots.txt', 'utf8');
  assert.match(robots, /Sitemap: https:\/\/jvicargaservicos\.co\.mz\/sitemap\.xml/);
  assert.doesNotMatch(robots, /\.html/);
});

test('10B.1: todos os links internos apontam para ficheiros e secções que existem', () => {
  for (const m of SITE.matchAll(/(?:href|src)="([^"]+?)"/g)) {
    const alvo = m[1];
    if (/^(https?|mailto|tel|data):/.test(alvo) || alvo.startsWith('//')) continue;
    if (alvo === '#') continue;
    if (alvo.startsWith('#')) {
      assert.ok(SITE.includes(`id="${alvo.slice(1)}"`), `${alvo} não existe`);
      continue;
    }
    assert.ok(fs.existsSync(alvo.split('#')[0]), `${alvo} não existe`);
  }
});

test('10.3: o hero é curto — nunca mais alto do que 720 px — e o telemóvel começa abaixo de 900 px', () => {
  const css = fs.readFileSync('css/styles.css', 'utf8');
  const hero = /\.hero\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  assert.match(hero, /min-height:\s*min\(100svh,\s*720px\)/, 'o hero deixou de ter o tecto de 720 px');
  assert.doesNotMatch(hero, /min-height:\s*100svh\s*;/, 'o hero voltou a ocupar o ecrã inteiro');

  /* Entre 760 e 899 px o texto e o mapa sobrepunham-se (o mapa fica a 66% da
     largura): o hero passa a coluna abaixo de 900 px, em CSS e no JS do voo — têm de ser o mesmo número (o título já não
     depende do voo, 10B.2). */
  assert.match(css, /@media \(max-width: 899px\) \{\s*\.hero \{/);
  const voo = fs.readFileSync('js/hero-voo.js', 'utf8');
  assert.deepEqual([...new Set([...voo.matchAll(/w < (\d+)/g)].map((m) => m[1]))], ['900']);
});
