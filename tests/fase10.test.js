import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { NOMES, PAGINAS, SITE } from './paginas.js';

/* ---------------------------------------------------------------------------
   FASE 10 — o site em cinco páginas

   O cliente achou o site "demasiado robusto": informação a mais, repetida,
   scroll longo. O Ernu aprovou cinco páginas HTML estáticas (Início,
   Serviços, Sobre nós, Orçamento, Contactos), com o mesmo cabeçalho e o
   mesmo rodapé em todas, e a regra de que cada informação aparece UMA só
   vez. Este ficheiro guarda isso.
   --------------------------------------------------------------------------- */

const MENU = [
  ['index.html', 'Início'],
  ['servicos.html', 'Serviços'],
  ['sobre.html', 'Sobre nós'],
  ['orcamento.html', 'Orçamento'],
  ['contactos.html', 'Contactos'],
];

const entre = (html, abre, fecha) => {
  const i = html.indexOf(abre);
  const j = html.indexOf(fecha, i);
  assert.ok(i >= 0 && j > i, `não encontrei ${abre} … ${fecha}`);
  return html.slice(i, j + fecha.length);
};
const semMarca = (html) => html.replace(/ aria-current="page"/g, '');
/** O texto visível de uma página: sem <script>, <template>, comentários e etiquetas. */
const texto = (html) => html
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<template[\s\S]*?<\/template>/g, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ');
/** O <main> de uma página, sem o rodapé (que se repete de propósito). */
const principal = (html) => entre(html, '<main', '</main>');

test('10.2: há exactamente cinco páginas, e são as que o Ernu aprovou', () => {
  assert.deepEqual(NOMES, MENU.map(([f]) => f));
  for (const n of NOMES) assert.ok(fs.existsSync(n), `${n} não existe`);
});

test('10.2: o menu tem cinco itens, pela ordem, e marca a página actual', () => {
  for (const [pagina, html] of Object.entries(PAGINAS)) {
    const nav = entre(html, '<nav class="nav"', '</nav>');
    const itens = [...nav.matchAll(/<a href="([^"]+)"( aria-current="page")?>([^<]+)<\/a>/g)];
    assert.deepEqual(itens.map((m) => [m[1], m[3]]), MENU, `${pagina}: o menu mudou`);
    const actuais = itens.filter((m) => m[2]).map((m) => m[1]);
    assert.deepEqual(actuais, [pagina], `${pagina}: aria-current devia estar só na própria página`);

    const movel = entre(html, '<nav class="menu"', '</nav>');
    const itensMovel = [...movel.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m) => [m[1], m[2]]);
    assert.deepEqual(itensMovel, MENU, `${pagina}: o menu móvel diverge do de topo`);
  }
});

test('10.2: o cabeçalho e o rodapé são iguais nas cinco páginas', () => {
  const cabecalho = (h) => semMarca(entre(h, '<header', '</header>'));
  const rodape = (h) => entre(h, '<footer', '</footer>');
  const fixos = (h) => entre(h, '<nav class="fixos"', '</nav>');
  for (const parte of [cabecalho, rodape, fixos]) {
    const [primeira, ...outras] = NOMES.map((n) => parte(PAGINAS[n]));
    for (const [i, outra] of outras.entries()) {
      assert.equal(outra, primeira, `${NOMES[i + 1]}: ${parte.name} diverge do de ${NOMES[0]}`);
    }
  }
});

test('10.2: o cabeçalho não tem botão "Pedir orçamento" — o cliente riscou-o', () => {
  for (const [pagina, html] of Object.entries(PAGINAS)) {
    const cab = entre(html, '<header', '</header>');
    assert.doesNotMatch(cab, /Pedir orçamento|<button class="btn|header__cta/, `${pagina}: o cabeçalho voltou a ter o botão de orçamento`);
    assert.doesNotMatch(html, /data-abrir-orc/, `${pagina}: sobrou um gatilho do pop-up antigo`);
  }
});

test('10.2: cada página tem um só <h1>, um título próprio e um canonical próprio', () => {
  const titulos = new Set();
  for (const [pagina, html] of Object.entries(PAGINAS)) {
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, `${pagina}: tem de ter um só h1`);
    const t = /<title>([^<]+)<\/title>/.exec(html)?.[1];
    assert.ok(t && !titulos.has(t), `${pagina}: título repetido ou em falta`);
    titulos.add(t);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://jvicargaservicos\\.co\\.mz/${pagina}">`));
  }
});

test('10.2: cada informação aparece uma só vez', () => {
  const corpo = Object.fromEntries(Object.entries(PAGINAS).map(([n, h]) => [n, texto(principal(h))]));
  const todo = Object.values(corpo).join(' | ');

  /* O mapa de Moçambique é só o do hero. */
  assert.equal((SITE.match(/<canvas\b/g) ?? []).length, 1, 'há mais de um canvas no site');
  assert.match(PAGINAS['index.html'], /<canvas id="canvasHero"/);
  assert.doesNotMatch(SITE, /canvasMapa|id="cobertura"|class="rotas"/, 'a secção Cobertura voltou');

  /* "10+ anos" já não existe como prova; a experiência diz-se uma vez, em Sobre nós. */
  assert.doesNotMatch(SITE, /10\+ anos|hero__provas|class="prova"/);
  assert.equal((todo.match(/dez anos|10 anos/gi) ?? []).length, 1);

  /* Credenciais: no corpo, só em Sobre nós (e no rodapé legal, que é igual em todas). */
  for (const n of NOMES) {
    const tem = /NUEL|NUIT|8732\/11\/04\/PS\/2014/.test(corpo[n]);
    assert.equal(tem, n === 'sobre.html', `${n}: credenciais ${tem ? 'presentes' : 'em falta'} no corpo`);
  }

  /* A lista de cidades não se repete em lado nenhum do texto visível. */
  assert.doesNotMatch(SITE, /Xai-Xai[^"]*Inhambane[^"]*Beira/, 'a lista de cidades voltou');
  assert.doesNotMatch(SITE, /rodape__seo/, 'o bloco SEO do rodapé voltou');

  /* O preço escreve-se uma vez, na página do orçamento (o formulário calcula-o). */
  const comPreco = NOMES.filter((n) => /255 MT/.test(corpo[n]));
  assert.deepEqual(comPreco, ['orcamento.html']);
  assert.equal((corpo['orcamento.html'].match(/255 MT/g) ?? []).length, 1);

  /* Os contactos escrevem-se na página de Contactos; as outras só linkam. */
  for (const n of NOMES.filter((x) => x !== 'contactos.html')) {
    assert.doesNotMatch(corpo[n], /\+258|jvicargaservicos@gmail\.com|Nº 113/, `${n}: repete contactos que vivem em Contactos`);
  }
});

test('10.2: o Início tem o hero e os três serviços em resumo, e mais nada', () => {
  const main = principal(PAGINAS['index.html']);
  const seccoes = [...main.matchAll(/<section\b[^>]*id="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(seccoes, ['hero', 'resumo']);
  assert.equal((main.match(/<li class="resumo__i">/g) ?? []).length, 3);
  assert.match(main, /<a class="resumo__mais" href="servicos\.html">/);
  assert.doesNotMatch(main, /hero__provas|scroll-hint|percurso|Como chegar/, 'o hero voltou a ter provas, percurso ou "Como chegar"');
});

test('10.2: Serviços tem carga aérea, rodoviária e os quatro passos da recolha à entrega', () => {
  const main = principal(PAGINAS['servicos.html']);
  assert.equal((main.match(/<article class="servico">/g) ?? []).length, 2);
  assert.match(main, /Transporte aéreo/);
  assert.match(main, /Transporte rodoviário/);
  assert.equal((main.match(/<li class="passo">/g) ?? []).length, 4);
});

test('10.2: o formulário e as perguntas frequentes (no máximo quatro) estão em Orçamento', () => {
  for (const n of NOMES.filter((x) => x !== 'orcamento.html')) {
    assert.doesNotMatch(PAGINAS[n], /id="tplOrc"|id="orcRaiz"|id="confirm"/, `${n}: tem partes do formulário`);
  }
  const o = PAGINAS['orcamento.html'];
  assert.match(o, /<template id="tplOrc">/);
  assert.match(o, /<div class="orc-caixa" id="orcRaiz">/);
  assert.match(o, /id="confirm"/);
  const perguntas = o.match(/<details class="faq__i">/g) ?? [];
  assert.ok(perguntas.length >= 1 && perguntas.length <= 4, `${perguntas.length} perguntas frequentes`);
  /* O formulário não ganhou campo de destino do envio: o cliente nunca vê o número. */
  assert.doesNotMatch(o, /name="(destino|numeroDestino|whatsappDestino)"/);
});

test('10.2: Contactos tem WhatsApp em destaque, telefone, email, morada e "Como chegar"', () => {
  const main = principal(PAGINAS['contactos.html']);
  assert.match(main, /<a class="btn btn--wa btn--grande btn--bloco" href="https:\/\/wa\.me\//);
  assert.match(main, /href="tel:\+258844700012"/);
  assert.match(main, /href="mailto:jvicargaservicos@gmail\.com"/);
  assert.match(main, /Av\. 19 de Outubro, Terminal de Cargas Nº 113/);
  assert.match(main, /Como chegar à JVI/);
  assert.match(main, /3H9C%2BVJ8/, 'o Plus Code saiu do botão');
});

test('10.2: a publicação, o sitemap e o robots conhecem as cinco páginas', () => {
  const publicar = fs.readFileSync('tools/publicar.py', 'utf8');
  const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
  for (const n of NOMES) {
    assert.ok(publicar.includes(`"${n}"`), `tools/publicar.py não lista ${n}`);
    assert.ok(sitemap.includes(`https://jvicargaservicos.co.mz/${n === 'index.html' ? '' : n}</loc>`), `sitemap.xml não tem ${n}`);
  }
});

test('10.2: todos os links internos apontam para páginas e ficheiros que existem', () => {
  for (const [pagina, html] of Object.entries(PAGINAS)) {
    for (const m of html.matchAll(/(?:href|src)="([^"#:]+?)(?:#[^"]*)?"/g)) {
      const alvo = m[1];
      if (/^(https?|mailto|tel|data):/.test(alvo) || alvo.startsWith('//')) continue;
      assert.ok(fs.existsSync(alvo), `${pagina}: ${alvo} não existe`);
    }
  }
});

test('10.4: Sobre nós tem a galeria de seis fotografias, sem as que mostram números e IVA errados', () => {
  const sobre = PAGINAS['sobre.html'];
  const fotos = [...sobre.matchAll(/data-gal-src="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(fotos.length, 6);
  assert.equal(new Set(fotos).size, 6);
  /* O Airwaybill (IVA 17%) e o poster do terminal (outros telefones) não entram. */
  assert.ok(!fotos.some((f) => /5e0f0d40bd0b|014b85241586/.test(f)));
  assert.match(sobre, /data-gal-contador[^>]*>1 \/ 6</);
  assert.match(sobre, /id="luz"/);
});
