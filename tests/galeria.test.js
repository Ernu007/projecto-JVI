import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SITE, seccao } from './paginas.js';

/* ---------------------------------------------------------------------------
   FASE 10B (10B.6) — galeria: só carga bem embalada, carrossel automático

   O cliente achou que caixas soltas empilhadas mostram pouco profissionalismo.
   Ficam as fotografias de carga embalada e individual. O carrossel passa
   sozinho (~4 s), sem setas nem botão de pausa; a pausa é por gestos.
   --------------------------------------------------------------------------- */

const GAL = seccao('sobre');
const CSS = fs.readFileSync('css/galeria.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');
const JS = fs.readFileSync('js/galeria.js', 'utf8');

const ENTRAM = ['7296cfa7277f', 'ac351fd019f4', '492cc8a760cc', 'ca40db758afe', 'f4ab097ea722', '8c88f37e0265', 'd544eaf40b51'];
const SAEM = ['3fcdb0c13597', '6b6532bd8520', '78498ba3732e', '9a5743b57c0e', '06fa9ae40417', '014b85241586', '5e0f0d40bd0b'];

const regra = (sel) => new RegExp(`(?:^|[}\\s])${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'm').exec(CSS)?.[1];

/* ---------- as fotografias ---------- */

test('10B.6: a galeria tem as sete fotografias de carga embalada, por esta ordem', () => {
  const fotos = [...GAL.matchAll(/data-gal-src="assets\/img\/galeria\/img_([0-9a-f]+)\.webp"/g)].map((m) => m[1]);
  assert.deepEqual(fotos, ENTRAM);
  for (const id of ENTRAM) assert.ok(fs.existsSync(`assets/img/galeria/img_${id}.webp`), `${id} não existe`);
});

test('10B.6: saíram as caixas soltas, o poster do terminal e o Airwaybill', () => {
  for (const id of SAEM) assert.ok(!SITE.includes(id), `${id} voltou ao site`);
  assert.doesNotMatch(SITE, /700cc775e008/, 'a placa da parede não entra: não é carga embalada');
});

test('10B.6: cada fotografia tem alt, legenda, dimensões reais e luzbox; só a primeira é eager', () => {
  const cartoes = [...GAL.matchAll(/<button class="gal__item" type="button"([^>]*)>([\s\S]*?)<\/button>/g)];
  assert.equal(cartoes.length, ENTRAM.length);
  cartoes.forEach(([, attrs, dentro], k) => {
    assert.match(attrs, /data-gal-alt="[^"]{15,}"/, `cartão ${k + 1}: luzbox sem alt`);
    assert.match(attrs, /aria-label="Ampliar: [^"]+"/);
    const foto = /<img class="gal__foto" src="([^"]+)" width="(\d+)" height="(\d+)"([^>]*)alt="([^"]{8,})"/.exec(dentro);
    assert.ok(foto, `cartão ${k + 1}: a fotografia não tem src, width, height e alt`);
    assert.match(dentro, /<span class="gal__legenda">[^<]+<\/span>/);
    /* O fundo desfocado é decorativo: alt vazio e aria-hidden. */
    assert.match(dentro, /<img class="gal__fundo" src="[^"]+" alt="" aria-hidden="true"/);
    const lazy = /loading="lazy"/.test(dentro);
    assert.equal(lazy, k > 0, `cartão ${k + 1}: loading="lazy" ${k === 0 ? 'na primeira' : 'em falta'}`);
    assert.equal(/ inert/.test(attrs), k > 0, `cartão ${k + 1}: só a primeira fica activa no HTML`);
  });
  /* O alt não diz marcas de terceiros (os televisores eram Hisense, não ULTRAK). */
  assert.doesNotMatch(GAL, /ULTRAK|Hisense/i);
});

test('10B.6: o contador (só para leitores de ecrã) e os pontos batem com o número de fotografias', () => {
  assert.match(GAL, new RegExp(`data-gal-contador[^>]*>1 / ${ENTRAM.length}<`));
  assert.equal((GAL.match(/<i data-gal-ponto/g) ?? []).length, ENTRAM.length);
  assert.equal((GAL.match(/data-gal-src=/g) ?? []).length, ENTRAM.length);
  /* Um só `[data-gal-src]` fora do carrossel contaria mal a luzbox. */
  assert.ok(GAL.indexOf('data-gal-pista') < GAL.indexOf('data-gal-src'));
});

/* ---------- sem setas nem botão de pausa ---------- */

test('10B.6: sem setas nem botão de pausa — nem no HTML, nem no CSS, nem no JS', () => {
  for (const [nome, txt] of [['HTML', GAL], ['CSS', CSS], ['JS', JS]]) {
    assert.doesNotMatch(txt, /gal__ctl|gal__controlos|data-gal-pausa|data-gal-ant|data-gal-prox|data-ico-pausa|data-ico-play/,
      `${nome}: sobrou código das setas ou do botão de pausa`);
  }
  assert.doesNotMatch(JS, /indiceMaisProximo|scrollTo|scrollLeft/, 'o carrossel já não é uma pista com scroll');
  /* Nenhum <button> dentro do palco além dos cartões que abrem a luzbox. */
  const palco = /<div class="gal__palco">([\s\S]*?)<\/section>/.exec(GAL)?.[1] ?? '';
  const botoes = palco.match(/<button\b/g) ?? [];
  assert.equal(botoes.length, ENTRAM.length, 'há botões no carrossel que não são fotografias');
});

/* ---------- CSS: só transform/opacity, swipe, 4:3 ---------- */

test('10B.6: os itens empilham-se e só se anima opacity e transform', () => {
  const grelha = regra('.gal__grelha');
  assert.match(grelha, /position:\s*relative/);
  assert.match(grelha, /overflow:\s*hidden/);
  assert.match(grelha, /aspect-ratio:\s*4\s*\/\s*3/, 'a proporção do palco mudou');
  assert.match(grelha, /touch-action:\s*pan-y/, 'sem touch-action o deslize luta com o scroll da página');
  const item = regra('.gal__item');
  assert.match(item, /position:\s*absolute/);
  assert.match(item, /inset:\s*0/);
  const trans = /transition:\s*([^;]+);/.exec(item)?.[1] ?? '';
  const props = [...trans.matchAll(/(?:^|,)\s*([a-z-]+)\s/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(props)].sort(), ['opacity', 'transform'], `o item anima ${props.join(', ')}`);
  /* Nada do que obriga a layout é animado em lado nenhum da galeria. */
  assert.doesNotMatch(CSS, /transition:[^;]*\b(width|height|left|top|margin|padding)\b/);
  assert.doesNotMatch(CSS, /@keyframes/, 'a galeria usa transições, não keyframes que mexam em layout');
  assert.match(CSS, /\.gal__item\[data-estado="ativo"\]\s*\{[^}]*opacity:\s*1/);
});

test('10B.6: a fotografia vai inteira (contain) sobre ela própria desfocada; sem recortar a carga', () => {
  assert.match(CSS, /\.gal__foto\s*\{\s*object-fit:\s*contain/);
  assert.match(CSS, /\.gal__fundo\s*\{[^}]*object-fit:\s*cover/);
  assert.match(CSS, /\.gal__fundo\s*\{[^}]*filter:\s*blur\(/);
  assert.doesNotMatch(CSS, /object-fit:\s*fill/);
});

test('10B.6: com prefers-reduced-motion não há transições; o palco continua grande e com limite', () => {
  assert.match(CSS, /@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.gal__item[^}]*transition:\s*none/);
  const palco = regra('.gal__palco');
  assert.match(palco, /max-width:\s*min\(860px,\s*calc\(78svh \* 4 \/ 3\)\)/);
});

test('10B.6: os pontos são discretos e não são botões', () => {
  assert.match(GAL, /<div class="gal__pontos" aria-hidden="true">/);
  assert.ok(regra('.gal__pontos i'));
});

/* ---------- comportamento (DOM simulado, relógio simulado) ---------- */

function montar({ reduzido = false } = {}) {
  const ouvintes = {};
  const palco = {
    addEventListener(tipo, fn) { (ouvintes[tipo] ??= []).push(fn); },
    querySelectorAll() { return itens; },
    observar: null,
    observe() {},
  };
  const itens = Array.from({ length: 7 }, (_, k) => ({
    dataset: { estado: k === 0 ? 'ativo' : 'inactivo' },
    inerte: k !== 0,
    focado: false,
    toggleAttribute(nome, v) { if (nome === 'inert') this.inerte = !!v; },
    focus() { this.focado = true; },
  }));
  const pontos = Array.from({ length: 7 }, () => ({ dataset: {} }));
  const contador = { textContent: '1 / 7' };
  const raiz = {
    querySelector(s) { return s === '[data-gal-pista]' ? palco : s === '[data-gal-contador]' ? contador : null; },
    querySelectorAll(s) { return s === '[data-gal-ponto]' ? pontos : []; },
  };
  const doc = { hidden: false, ouvintes: {}, addEventListener(t, f) { (this.ouvintes[t] ??= []).push(f); } };
  const observador = { cb: null };
  globalThis.document = doc;
  globalThis.window = {
    matchMedia: () => ({ matches: reduzido, addEventListener() {} }),
    IntersectionObserver: class { constructor(cb) { observador.cb = cb; } observe() {} },
  };
  globalThis.IntersectionObserver = globalThis.window.IntersectionObserver;
  const emitir = (tipo, ev = {}) => (ouvintes[tipo] ?? []).forEach((fn) => fn({
    type: tipo, preventDefault() {}, stopPropagation() { ev.parou = true; }, ...ev,
  }));
  const activo = () => itens.findIndex((it) => it.dataset.estado === 'ativo');
  return { raiz, palco, itens, pontos, contador, doc, observador, emitir, activo };
}

async function arrancar(opcoes) {
  mock.timers.enable({ apis: ['setInterval'] });
  const m = montar(opcoes);
  const { iniciarCarrossel, INTERVALO_MS } = await import('../js/galeria.js');
  iniciarCarrossel(m.raiz);
  return { ...m, INTERVALO_MS };
}
const fim = () => mock.timers.reset();

test('10B.6: passa sozinho de ~4 s em ~4 s, em ciclo, e só uma fotografia fica activa e focável', async () => {
  const c = await arrancar();
  try {
    assert.equal(c.INTERVALO_MS, 4000);
    assert.equal(c.activo(), 0);
    for (let k = 1; k <= 7; k += 1) {
      mock.timers.tick(c.INTERVALO_MS);
      assert.equal(c.activo(), k % 7, `passo ${k}`);
      assert.equal(c.itens.filter((it) => !it.inerte).length, 1, 'mais de uma fotografia focável');
      assert.equal(c.itens[c.activo()].inerte, false);
      assert.equal(c.pontos.filter((p) => p.dataset.estado === 'ativo').length, 1);
      assert.equal(c.contador.textContent, `${(k % 7) + 1} / 7`);
    }
  } finally { fim(); }
});

test('10B.6: pára com o rato por cima (só rato) e retoma ao sair', async () => {
  const c = await arrancar();
  try {
    c.emitir('pointerenter', { pointerType: 'touch' });
    mock.timers.tick(c.INTERVALO_MS);
    assert.equal(c.activo(), 1, 'o hover emulado do toque parou o carrossel para sempre');
    c.emitir('pointerenter', { pointerType: 'mouse' });
    mock.timers.tick(c.INTERVALO_MS * 3);
    assert.equal(c.activo(), 1, 'não parou com o rato por cima');
    c.emitir('pointerleave', { pointerType: 'mouse' });
    mock.timers.tick(c.INTERVALO_MS);
    assert.equal(c.activo(), 2, 'não retomou');
  } finally { fim(); }
});

test('10B.6: pára enquanto se segura o dedo e retoma ao largar', async () => {
  const c = await arrancar();
  try {
    c.emitir('pointerdown', { pointerType: 'touch', clientX: 100, clientY: 100 });
    mock.timers.tick(c.INTERVALO_MS * 3);
    assert.equal(c.activo(), 0);
    c.emitir('pointerup', { pointerType: 'touch', clientX: 102, clientY: 101 });
    assert.equal(c.activo(), 0, 'um toque não é um deslize');
    mock.timers.tick(c.INTERVALO_MS);
    assert.equal(c.activo(), 1);
  } finally { fim(); }
});

test('10B.6: um deslize horizontal muda de fotografia e não abre a luzbox; o vertical não conta', async () => {
  const c = await arrancar();
  try {
    c.emitir('pointerdown', { pointerType: 'touch', clientX: 200, clientY: 100 });
    c.emitir('pointerup', { pointerType: 'touch', clientX: 100, clientY: 110 });
    assert.equal(c.activo(), 1, 'deslize para a esquerda = seguinte');
    const clique = {};
    c.emitir('click', clique);
    assert.ok(clique.parou, 'o deslize abriu a luzbox');
    c.emitir('pointerdown', { pointerType: 'touch', clientX: 100, clientY: 100 });
    c.emitir('pointerup', { pointerType: 'touch', clientX: 200, clientY: 100 });
    assert.equal(c.activo(), 0, 'deslize para a direita = anterior');
    c.emitir('pointerdown', { pointerType: 'touch', clientX: 100, clientY: 100 });
    c.emitir('pointerup', { pointerType: 'touch', clientX: 120, clientY: 300 });
    assert.equal(c.activo(), 0, 'um gesto vertical (scroll da página) mudou a fotografia');
    c.emitir('pointerdown', { pointerType: 'touch', clientX: 100, clientY: 100 });
    c.emitir('pointerup', { pointerType: 'touch', clientX: 100, clientY: 100 });
    const toque = {};
    c.emitir('click', toque);
    assert.ok(!toque.parou, 'um toque simples deixou de abrir a luzbox');
  } finally { fim(); }
});

test('10B.6: pára com o foco do teclado e retoma ao sair; ← → mudam e levam o foco', async () => {
  const c = await arrancar();
  try {
    c.emitir('focusin');
    mock.timers.tick(c.INTERVALO_MS * 3);
    assert.equal(c.activo(), 0);
    c.emitir('keydown', { key: 'ArrowRight' });
    assert.equal(c.activo(), 1);
    assert.equal(c.itens[1].focado, true, 'o foco não acompanhou a fotografia');
    c.emitir('keydown', { key: 'ArrowLeft' });
    c.emitir('keydown', { key: 'ArrowLeft' });
    assert.equal(c.activo(), 6, 'o teclado também dá a volta');
    c.emitir('focusout');
    mock.timers.tick(c.INTERVALO_MS);
    assert.equal(c.activo(), 0);
  } finally { fim(); }
});

test('10B.6: pára fora do ecrã e com o separador oculto', async () => {
  const c = await arrancar();
  try {
    c.observador.cb([{ isIntersecting: false }]);
    mock.timers.tick(c.INTERVALO_MS * 3);
    assert.equal(c.activo(), 0, 'rodou fora do ecrã');
    c.observador.cb([{ isIntersecting: true }]);
    mock.timers.tick(c.INTERVALO_MS);
    assert.equal(c.activo(), 1);

    c.doc.hidden = true;
    c.doc.ouvintes.visibilitychange.forEach((f) => f());
    mock.timers.tick(c.INTERVALO_MS * 3);
    assert.equal(c.activo(), 1, 'rodou com o separador oculto');
    c.doc.hidden = false;
    c.doc.ouvintes.visibilitychange.forEach((f) => f());
    mock.timers.tick(c.INTERVALO_MS);
    assert.equal(c.activo(), 2);
  } finally { fim(); }
});

test('10B.6: com prefers-reduced-motion não roda sozinho, mas o deslize e o teclado continuam', async () => {
  const c = await arrancar({ reduzido: true });
  try {
    mock.timers.tick(c.INTERVALO_MS * 5);
    assert.equal(c.activo(), 0, 'rodou sozinho com movimento reduzido');
    c.emitir('pointerdown', { pointerType: 'touch', clientX: 200, clientY: 100 });
    c.emitir('pointerup', { pointerType: 'touch', clientX: 100, clientY: 100 });
    assert.equal(c.activo(), 1, 'o deslize deixou de funcionar');
    mock.timers.tick(c.INTERVALO_MS * 5);
    assert.equal(c.activo(), 1);
  } finally { fim(); }
});

/* ---------- 10B.7: o camião ---------- */

test('10B.7: o camião de banco saiu; o de Serviços é o gerado, com crédito e ≤ 200 KB', () => {
  assert.ok(!fs.existsSync('assets/img/camiao.webp'), 'a imagem de banco antiga ainda existe');
  assert.doesNotMatch(SITE, /camiao\.webp/);
  const s = seccao('servicos');
  assert.match(s, /<img src="assets\/img\/camiao-jvi\.webp" alt="[^"]*JVI[^"]*"[^>]*width="1000" height="625"/);
  assert.match(s, /<!-- Fotografia: Unsplash[^>]*EmEQ6kK_5P0/);
  assert.ok(fs.statSync('assets/img/camiao-jvi.webp').size <= 200 * 1024);
  assert.ok(fs.existsSync('tools/gerar-camiao.py'));
});
