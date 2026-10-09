import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

/* ---------------------------------------------------------------------------
   FASE 8B — menu, botões, rodapé, galeria e a secção nova.

   Estes testes não verificam se o texto é bonito. Verificam as TRÊS coisas
   que o cliente disse e que uma revisão a olho não apanha:

     1. A lista do menu é a que ele ditou, palavra por palavra, e
        "Credenciais" desapareceu porque não há página para linkar.
     2. O WhatsApp tem o ícone do WhatsApp, e o botão de direcções tem o
        ícone do Google Maps a ocupar a largura toda do botão.
     3. O botão "Pedir orçamento" continua no topo e passa a ser `sticky`.

   E uma quarta, que é a razão de o ficheiro existir: o menu é escrito em
   DOIS sítios — a barra do topo e o painel móvel. Estavam diferentes: o
   móvel tinha "Perguntas frequentes" e o topo não, e ambos tinham
   "Credenciais", que não aponta para lado nenhum. Duas listas da mesma
   navegação divergem sempre uma de cada vez.
   --------------------------------------------------------------------------- */

import { SITE, PAGINAS } from './paginas.js';
const HTML = SITE;
const CSS = fs.readFileSync('css/styles.css', 'utf8');
const CSS_RODAPE = `${CSS}\n${fs.readFileSync('css/galeria.css', 'utf8')}`;

/** O corpo de um elemento pelo atributo que o identifica. */
function blocoDe(tag, attr, valor) {
  const re = new RegExp(`<${tag}\\b[^>]*${attr}="${valor}"[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const m = re.exec(HTML);
  assert.ok(m, `não encontrei <${tag} ${attr}="${valor}"> no index.html`);
  return m[1];
}

/** O texto de um link, sem o SVG nem o comentário. */
const textoDoLink = (a) => a
  .replace(/<svg[\s\S]*?<\/svg>/g, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\s+/g, ' ')
  .trim();

/** Os links de navegação de um elemento, pela ordem. */
function linksDe(html) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
    .map((m) => ({ attrs: m[1], texto: textoDoLink(m[2]) }));
}

/* ---------- B1: o menu ---------- */

/* B1 manda seis itens, dos quais um é "A JVI" e outro "Contactos". A
   Fase 8B acrescenta "Nossa empresa" (B9), que o briefing exige que
   esteja no menu e entre "A JVI" e "Contactos" — o cliente disse que
   "A JVI" e "Contactos" ficam no fim, e a secção nova tem de ir entre
   os dois para não os empurrar para fora do fim da lista. */
const MENU_ESPERADO = [
  { texto: 'Nossos serviços.', alvo: '#servicos' },
  { texto: 'Como funciona.', alvo: '#fluxo' },
  { texto: 'Nosso trabalho.', alvo: '#galeria' },
  { texto: 'Cobertura.', alvo: '#cobertura' },
  { texto: 'A JVI.', alvo: '#jvi' },
  { texto: 'Nossa empresa.', alvo: '#empresa' },
  { texto: 'Contactos.', alvo: '#contactos' },
];

test('o menu de topo e o menu móvel dizem a mesma coisa', () => {
  /* Duas listas da mesma navegação divergem sempre uma de cada vez. O
     móvel tinha "Perguntas frequentes", que o topo não tinha, e ambos
     tinham "Credenciais", que não existe. */
  const topo = linksDe(blocoDe('nav', 'class', 'nav'))
    .map((l) => l.texto);
  const movel = linksDe(blocoDe('nav', 'id', 'menu'))
    .map((l) => l.texto);
  assert.deepEqual(movel, topo,
    `topo: ${topo.join(' · ')} | móvel: ${movel.join(' · ')}`);
});

test('nenhum link do menu aponta para um alvo que não existe', () => {
  const alvos = [...HTML.matchAll(/<a\b[^>]*href="#([A-Za-z0-9_-]+)"/g)].map((m) => m[1]);
  const ids = new Set([...HTML.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const orfaos = [...new Set(alvos)].filter((a) => !ids.has(a));
  assert.deepEqual(orfaos, [], `links para ids que não existem: ${orfaos.join(', ')}`);
});

/* ---------- B2: ícones e botões ---------- */

/** O `path` de um svg que está dentro de um bloco. */
function pathsDe(html) {
  return [...html.matchAll(/<path\b[^>]*d="([^"]+)"/g)].map((m) => m[1]);
}

/** Um traço do logótipo do WhatsApp: o quadrado com a cauda do telefone. */
const ICO_WHATSAPP = 'M17.47 14.38c-.3-.15-1.76-.87-2.03-.97';
/** O ícone do Google Maps: o pin com o buraco. */
const ICO_MAPS = 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z';

test('todos os botões de WhatsApp do site têm o ícone do WhatsApp', () => {
  /* "O cliente notou e pediu explicitamente." O ícone é a marca registada:
     um telefone dentro de um balão de fala. O que lá estava era um desenho
     genérico — três botões, cinco svg, nenhum deles o do WhatsApp. */
  const semIcone = [];
  const conta = [...HTML.matchAll(/<a\b[^>]*href="https:\/\/wa\.me\/[^"]*"[\s\S]*?<\/a>/g)];
  assert.ok(conta.length >= 3, `só encontrei ${conta.length} botões de WhatsApp — espero ao menos 3`);
  for (const m of conta) {
    const d = pathsDe(m[0]);
    if (!d.some((p) => p.startsWith(ICO_WHATSAPP))) {
      semIcone.push(m[0].replace(/\s+/g, ' ').slice(0, 90));
    }
  }
  assert.deepEqual(semIcone, [], `botões de WhatsApp sem o ícone do WhatsApp:\n${semIcone.join('\n')}`);
});

test('nenhum svg do site desenha um telefone dentro de um balão sem ser do WhatsApp', () => {
  /* O contrário do teste anterior: se alguém voltar a pôr um desenho
     genérico no botão do WhatsApp, ou trocar o ícone de outro sítio, o
     traço do logótipo tem de estar lá. */
  const iconesWa = pathsDe(HTML).filter((d) => d.startsWith(ICO_WHATSAPP));
  assert.ok(iconesWa.length >= 4,
    `o traço do logótipo do WhatsApp aparece ${iconesWa.length} vezes; esperava ao menos 4`);
});

test('o botão "Como chegar à JVI" tem o ícone do Google Maps', () => {
  const botoes = [...HTML.matchAll(/<a\b[^>]*>[^<]*(?:<svg[\s\S]*?<\/svg>)?\s*Como chegar à JVI[\s\S]*?<\/a>/g)];
  assert.ok(botoes.length >= 1, `só encontrei ${botoes.length} botões "Como chegar à JVI"`);
  for (const m of botoes) {
    assert.ok(pathsDe(m[0]).some((p) => p.startsWith(ICO_MAPS)),
      `o botão "Como chegar à JVI" não tem o ícone do Maps: ${m[0].replace(/\s+/g, ' ').slice(0, 90)}`);
  }
});

test('o botão do telefone fica como estava', () => {
  /* B2: "Botão do telefone: está bom, não mexer." O traço do telefone é o
     mesmo de sempre, e o rótulo continua a dizer "Ligar". */
  assert.match(HTML, /Ligar/);
  assert.ok(pathsDe(HTML).some((d) => d.startsWith('M22 16.92v3a2 2 0 0')),
    'o ícone do telefone foi alterado');
});

/* ---------- B7: galeria em carrossel ---------- */

test('a galeria é um carrossel: uma imagem de cada vez', () => {
  /* B7: "Passar a carrossel: uma imagem de cada vez, cards pequenos, a
     passar automaticamente. Ciclo contínuo." */
  const grelha = /\.gal__grelha\b[^{]*\{([^}]*)\}/.exec(CSS_RODAPE)?.[1];
  assert.ok(grelha, 'não há regra para .gal__grelha');
  assert.match(grelha, /display\s*:\s*flex/,
    'a galeria ainda é uma grelha de miniaturas, não um carrossel');
  assert.doesNotMatch(grelha, /display\s*:\s*grid/,
    'a galeria continua em `grid`, o que mostra várias imagens de cada vez');
});

test('o carrossel tem um item visível de cada vez', () => {
  const item = /\.gal__item\b[^{]*\{([^}]*)\}/.exec(CSS_RODAPE)?.[1];
  assert.ok(item, 'não há regra para .gal__item');
  assert.match(item, /flex\s*:\s*0 0 (100%|var\()|width\s*:\s*100%/,
    `o item do carrossel não ocupa a largura toda: ${item.replace(/\s+/g, ' ')}`);
});

/* ---------- Fase 9 (9.5): as imagens do carrossel estavam pequenas ---------- */

/* O cliente: "aumente o tamanho das imagens do carrossel, está muito
   pequeno!" Na Fase 8B tinha pedido "cards pequenos" para o carrossel
   passar um de cada vez, e o palco ficou com 520 px. Não se contradiz:
   continua a ser um item por ecrã — mas grande. */

const GALERIA = fs.readFileSync('css/galeria.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');

/** O corpo da primeira regra de galeria.css com este selector exacto. */
const regraGal = (sel, folha = GALERIA) => new RegExp(
  `(?:^|[}\\s])${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'm',
).exec(folha)?.[1];

/** A primeira `@media (max-width: Npx)` de galeria.css que mexe no palco. */
function mediaDoPalco() {
  for (const m of GALERIA.matchAll(/@media\s*\(\s*max-width:\s*(\d+)px\s*\)\s*\{/g)) {
    let fim = m.index + m[0].length;
    for (let nivel = 1; nivel > 0; fim += 1) {
      if (GALERIA[fim] === '{') nivel += 1;
      else if (GALERIA[fim] === '}') nivel -= 1;
    }
    const dentro = GALERIA.slice(m.index + m[0].length, fim - 1);
    const palco = regraGal('.gal__palco', dentro);
    if (palco) return { limite: Number(m[1]), palco };
  }
  return null;
}

test('9.5: no computador o carrossel cresceu, mas com um máximo', () => {
  const palco = regraGal('.gal__palco');
  assert.ok(palco, 'não há regra para .gal__palco');
  const larguras = [...(/max-width\s*:\s*([^;]+)/.exec(palco)?.[1] ?? '').matchAll(/(\d+)px/g)].map((m) => Number(m[1]));
  assert.ok(larguras.length, 'o palco do carrossel não tem largura máxima: fica gigante num ecrã largo');
  const maximo = Math.max(...larguras);
  assert.ok(maximo >= 760, `o carrossel continua pequeno: ${maximo}px de largura máxima (eram 520)`);
  assert.ok(maximo <= 960, `o carrossel ficou gigante: ${maximo}px`);
});

test('9.5: no telemóvel a imagem ocupa praticamente a largura toda do ecrã', () => {
  const media = mediaDoPalco();
  assert.ok(media, 'não há regra de telemóvel para o palco do carrossel');
  assert.ok(media.limite >= 520, `a regra só vale até ${media.limite}px`);

  /* O palco sai para fora das margens do contentor: a margem lateral é
     negativa, e o que sobra de cada lado é a margem do contentor menos isso. */
  const margem = Number(/margin-inline\s*:\s*(-?[\d.]+)px/.exec(media.palco)?.[1]);
  assert.ok(margem < 0, 'no telemóvel o carrossel fica preso às margens do contentor');
  const contentor = Number(/\.container\s*\{[^}]*padding-inline:\s*(\d+)px/.exec(CSS)?.[1]);
  assert.ok(contentor > 0, 'não consegui ler a margem do .container');
  const sobra = contentor + margem;
  assert.ok(sobra >= 0, `o carrossel sai ${-sobra}px para fora do ecrã`);

  for (const viewport of [360, 320]) {
    const imagem = viewport - 2 * sobra;
    assert.ok(imagem / viewport >= 0.93,
      `a ${viewport}px a imagem tem ${imagem}px: ${(100 * imagem / viewport).toFixed(0)}% do ecrã`);
  }
});

test('9.5: as fotografias mantêm a proporção — crescem, não esticam', () => {
  const item = regraGal('.gal__item');
  assert.match(item, /aspect-ratio\s*:\s*4\s*\/\s*3/, 'o cartão do carrossel mudou de proporção');
  const img = regraGal('.gal__item img');
  assert.match(img, /object-fit\s*:\s*cover/, 'a fotografia deixou de ser recortada e passa a esticar');
  assert.doesNotMatch(GALERIA, /\.gal__item img[^{]*\{[^}]*object-fit\s*:\s*fill/);
  /* Em nenhum ecrã se fixa uma altura ao cartão: é a largura que manda, e
     a altura sai da proporção. */
  for (const m of GALERIA.matchAll(/\.gal__item\s*\{([^}]*)\}/g)) {
    assert.doesNotMatch(m[1], /(?:^|;)\s*height\s*:/, 'o cartão do carrossel tem uma altura fixa');
  }
  /* Num telemóvel deitado o cartão não pode ser mais alto do que o ecrã:
     o limite vem da altura do viewport, mantendo os 4:3. */
  assert.match(regraGal('.gal__palco'), /svh\s*\*\s*4\s*\/\s*3/,
    'o palco não tem limite pela altura do ecrã: num telemóvel deitado a fotografia não cabe');
});

test('9.5: continua a ser um item por ecrã, a passar bem com o dedo', () => {
  const item = regraGal('.gal__item');
  assert.match(item, /flex\s*:\s*0 0 100%/);
  assert.match(item, /scroll-snap-align\s*:\s*(start|center)/);
  /* Um gesto, uma fotografia: sem isto um gesto rápido salta três. */
  assert.match(item, /scroll-snap-stop\s*:\s*always/,
    'um gesto rápido passa várias fotografias de uma vez');
  const pista = regraGal('.gal__grelha');
  assert.match(pista, /scroll-snap-type\s*:\s*x mandatory/);
  assert.match(pista, /overflow-x\s*:\s*auto/, 'a pista deixou de se arrastar com o dedo');

  /* Os controlos são alvos de toque de 44 px. */
  const ctl = regraGal('.gal__ctl');
  for (const prop of ['width', 'height']) {
    const v = Number(new RegExp(`(?:^|;|\\s)${prop}\\s*:\\s*(\\d+)px`).exec(ctl)?.[1]);
    assert.ok(v >= 44, `os botões do carrossel têm ${v}px de ${prop}`);
  }
});

test('9.5: quem arrasta com o dedo fica na fotografia que vê', async () => {
  /* O índice saía de `scrollLeft / clientWidth`, que ignora o intervalo de
     16 px entre fotografias: o erro acumula, e na penúltima fotografia de
     um ecrã de 312 px a conta já arredondava para a seguinte. O índice
     passa a ser o da fotografia cujo início está mais perto. */
  const { indiceMaisProximo } = await import('../js/galeria.js');
  assert.equal(typeof indiceMaisProximo, 'function', 'galeria.js não exporta indiceMaisProximo');
  for (const largura of [272, 312, 344, 520, 860]) {
    const inicios = Array.from({ length: 11 }, (_, k) => k * (largura + 16));
    inicios.forEach((x, k) => {
      assert.equal(indiceMaisProximo(x, inicios), k, `largura ${largura}: fotografia ${k + 1}`);
      /* E um encaixe que ficou a uns píxeis do sítio é a mesma fotografia. */
      assert.equal(indiceMaisProximo(x + 6, inicios), k);
      assert.equal(indiceMaisProximo(x - 6, inicios), k);
    });
  }
  assert.equal(indiceMaisProximo(0, []), 0);
});

test('o carrossel passa sozinho e em ciclo contínuo', () => {
  const fonte = fs.readFileSync('js/galeria.js', 'utf8');
  assert.match(fonte, /setInterval|setTimeout/,
    'a galeria não tem temporizador nenhum — não passa sozinha');
  assert.match(fonte, /prefers-reduced-motion/,
    'o carrossel não pára com prefers-reduced-motion');
  /* Ciclo contínuo: o índice dá a volta em vez de parar no fim. */
  assert.match(fonte, /%\s*itens\.length|%\s*lista\.length|\+\s*1\s*%\s*|length\s*-\s*1\s*\?/,
    'o índice do carrossel não dá a volta — acaba numa fotografia e fica lá');
});

test('a galerie continua a expor data-gal-src: o lightbox depende disso', () => {
  /* `js/galeria.js` lê `[data-gal-src]` para a lightbox, e
     `tests/dom.test.js` confirma o âmbito. Um carrossel que passa as
     imagens por outro atributo parte os dois. */
  assert.ok(HTML.includes('data-gal-src'), 'nenhuma imagem tem data-gal-src');
  const itens = [...HTML.matchAll(/data-gal-src="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(itens.length, 6, `a galeria tem ${itens.length} fotografias; são 6 (Fase 10)`);
  for (const [, alt] of HTML.matchAll(/data-gal-src="[^"]+"\s*\n?\s*data-gal-alt="([^"]+)"/g)) {
    assert.ok(alt.trim().length > 10, `um alt ficou vazio: "${alt}"`);
  }
});

