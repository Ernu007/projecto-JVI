import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/* ---------------------------------------------------------------------------
   O hero e o telemóvel (Fase 9 → Fase 10)

   Na Fase 10 o hero ficou curto: título, uma linha, o botão do WhatsApp em
   destaque e um botão secundário para o orçamento. Saíram as provas, o
   percurso e o "Como chegar" (que vive só em Contactos). Os testes da
   disposição dos três botões em duas linhas ficaram sem objecto e saíram;
   ficam as regras do telemóvel que continuam a valer: alvos de toque de
   44 px, o mapa por baixo do texto e os botões fixos.
   --------------------------------------------------------------------------- */

const HTML = fs.readFileSync('index.html', 'utf8');
const CSS = fs.readFileSync(path.join('css', 'styles.css'), 'utf8');
const CSS_ORC = fs.readFileSync(path.join('css', 'orcamento.css'), 'utf8');
const CSS_PRIV = fs.readFileSync(path.join('css', 'privacidade.css'), 'utf8');

/* As larguras de cima, medidas no browser. O `.btn` usa `font-size: 15px`
   fixo (não é um `clamp()`), portanto valem em qualquer viewport. */
const ORCAMENTO = 204.5;
const WHATSAPP = 221.2;
const DIRECCOES = 217.88;
const PAR_MAIS_LARGO = ORCAMENTO + WHATSAPP;
/* Fase 9 (9.4): os dois primeiros passam a ter a MESMA largura, metade
   cada. O que tem de caber numa metade é o mais largo dos dois. */
const METADE_MINIMA = Math.max(ORCAMENTO, WHATSAPP);

/* Fase 9 (9.8): "é na versão mobile que 99% dos clientes irão ver a
   página". 360 px é o chão realista em Moçambique; 320 px é o mais estreito
   que ainda se vende. 44 px é o alvo de toque mínimo. */
const MOVEL = 360;
const MOVEL_ESTREITO = 320;
const TOQUE = 44;

/* ---------- leitura de CSS ---------- */

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * O corpo `{...}` da regra que segue um selector. O selector pode ser um
 * prefixo — `corpo('.hero__acoes')` encontra tanto `.hero__acoes {` como
 * `.hero__acoes > * {`, porque o que interessa é a regra do bloco, não
 * a forma exacta do selector.
 */
function corpo(selector, folha = CSS) {
  return new RegExp(`${escapar(selector)}[\\s>,:+~*]*\\{([^}]*)\\}`).exec(folha)?.[1];
}

/** O valor de uma propriedade dentro de um corpo de regra. */
function decl(corpoRegra, propriedade) {
  return new RegExp(`(?:^|;)\\s*${escapar(propriedade)}\\s*:\\s*([^;]+)`)
    .exec(corpoRegra)?.[1].trim();
}

/** O valor em pixels de uma declaração, `13` ou `13px`. */
const px = (valor) => {
  const n = Number.parseFloat(valor ?? '');
  assert.ok(Number.isFinite(n), `valor em px ilegível: ${valor}`);
  return n;
};

/** As declarações de um corpo de regra, `{ propriedade: valor }`. */
function declaracoes(corpoRegra) {
  return Object.fromEntries(
    corpoRegra.split(';').map((d) => d.split(':')).filter((p) => p.length >= 2)
      .map(([prop, ...resto]) => [prop.trim(), resto.join(':').trim()]),
  );
}

/** As declarações que se aplicam ao `.btn--bloco` dentro do hero. */
function declaracoesBlocoNoHero() {
  return {
    ...declaracoes(corpo('.btn--bloco') ?? ''),
    ...declaracoes(corpo('.hero__acoes > .btn--bloco') ?? ''),
  };
}

/**
 * Estas declarações dão ao elemento a largura toda do contentor?
 * `width: 100%`, `flex-basis: 100%` e `flex: <grow> <shrink> 100%`
 * dizem a mesma coisa — a última é a que está no CSS, porque torna
 * explícito que o botão fica sozinho na linha.
 */
function larguraInteira(ds) {
  const n = (v) => (v === undefined ? undefined : px(v));
  if (n(ds.width) === 100) return true;
  if (n(ds['flex-basis']) === 100) return true;
  const flex = ds.flex?.split(/\s+/);
  return flex?.length === 3 && n(flex[2]) === 100;
}

/**
 * A `@media (max-width: Npx)` que contém uma regra sobre este selector,
 * com o limite e o corpo da regra de dentro. Devolve `null` se não houver.
 */
function mediaMaxComRegra(selector, folha = CSS) {
  for (const m of folha.matchAll(/@media\s*\(\s*max-width:\s*(\d+)px\s*\)\s*\{/g)) {
    const abre = folha.indexOf('{', m.index);
    let fecha = abre + 1;
    for (let nivel = 1; nivel > 0; fecha++) {
      if (folha[fecha] === '{') nivel++;
      else if (folha[fecha] === '}') nivel--;
    }
    const dentro = folha.slice(abre + 1, fecha);
    const regra = corpo(selector, dentro);
    if (regra !== undefined) return { limite: Number(m[1]), corpo: regra, bloco: dentro };
  }
  return null;
}

/* ---------- leitura do hero ---------- */

/** Os elementos que estão dentro do `.hero__acoes`, pela ordem em que aparecem. */
function accoesDoHero() {
  const bloco = /<div class="hero__acoes">([\s\S]*?)<\/div>/.exec(HTML)?.[1];
  assert.ok(bloco, 'não encontrei .hero__acoes no index.html');
  /* O comentário que explica a Fase 7A tem um `<a>` literal escrito dentro,
     e uma tag a meio do texto é uma tag a meio do texto. */
  const semComentarios = bloco.replace(/<!--[\s\S]*?-->/g, '');
  return [...semComentarios.matchAll(/<(button|a)\b([^>]*)>[\s\S]*?<\/\1>/g)]
    .map((m) => ({ tag: m[1], atributos: m[2] }));
}

/* ---------- a disposição ---------- */

/* ---------- Fase 10: as acções do hero ---------- */

test('10.3/10B.3: o hero tem três acções — o WhatsApp em destaque, o orçamento e, secundário, «Como chegar»', () => {
  const accoes = accoesDoHero();
  assert.equal(accoes.length, 3);
  assert.match(accoes[0].atributos, /wa\.me\//, 'a primeira acção do hero deixou de ser o WhatsApp');
  assert.match(accoes[0].atributos, /class="btn btn--wa btn--grande"/);
  assert.match(accoes[1].atributos, /href="#orcamento"/, 'a segunda acção deixou de levar ao orçamento');
  assert.doesNotMatch(accoes[1].atributos, /btn--primario|btn--wa/, 'o orçamento do hero compete com o WhatsApp');
  /* Fase 10B (10B.3): «Como chegar à JVI», com o estilo antigo, a seguir. É
     secundário: nem verde da marca nem verde WhatsApp. */
  assert.match(accoes[2].atributos, /google\.com\/maps\/dir\//, 'a terceira acção deixou de ser «Como chegar à JVI»');
  assert.match(accoes[2].atributos, /class="btn btn--vidro btn-maps"/);
  assert.doesNotMatch(accoes[2].atributos, /btn--primario|btn--wa/, 'as direcções competem com o WhatsApp');
  const maps = /\.btn-maps\s*\{([^}]*)\}/.exec(CSS)?.[1] ?? '';
  assert.match(maps, /flex-direction:\s*column/, 'o ícone deixou de ficar numa faixa por cima do texto');
  assert.match(maps, /background:\s*var\(--c-fundo\)/, 'o botão perdeu o fundo');
  assert.match(CSS, /\.btn-maps svg \{[^}]*height:\s*44px;[^}]*color:\s*var\(--maps\)/, 'o pin deixou de ser vermelho e grande');
});

test('10.3: o WhatsApp do hero tem o verde do WhatsApp, liso e sem sombra', () => {
  const wa = corpo('.btn--wa', CSS_ORC);
  assert.match(decl(wa, 'background'), /^var\(--wa\)$/);
  assert.equal(decl(wa, 'box-shadow'), undefined, 'o WhatsApp ganhou sombra');
});

const noTelemovel = (selector, folha = CSS) => {
  const media = mediaMaxComRegra(selector, folha);
  assert.ok(media, `não há regra de telemóvel para ${selector}`);
  return media;
};

test('9.8: os botões fixos não roubam toques ao conteúdo que não tapam', () => {
  /* O contentor dos três botões media 156 × 162 px — a largura das
     legendas, que estão invisíveis — e os botões só 48 px. Os outros
     108 px eram uma faixa transparente por cima da página que engolia os
     toques: quem tocava no fim de um botão largo não acertava em nada. */
  assert.match(decl(corpo('.fixos'), 'pointer-events') ?? '', /^none$/,
    'a caixa invisível dos botões fixos intercepta os toques');
  assert.match(decl(corpo('.fixo__btn'), 'pointer-events') ?? '', /^auto$/,
    'os botões fixos deixaram de se poder tocar');
});

test('9.8: no telemóvel o mapa do hero sai de trás do texto', () => {
  /* O canvas ocupava o hero inteiro, por trás do conteúdo. No computador o
     país fica à direita e o texto à esquerda; num ecrã estreito ficavam um
     em cima do outro, e com as províncias acesas o parágrafo e os botões
     liam-se por cima de um mapa verde. Passa a ter o seu próprio espaço,
     por baixo do conteúdo. */
  const fundo = noTelemovel('.hero__fundo');
  assert.match(decl(fundo.corpo, 'position') ?? '', /^relative$/, 'o mapa continua por trás do texto no telemóvel');
  assert.ok(decl(fundo.corpo, 'height'), 'o mapa do hero não tem altura no telemóvel');
  /* Fase 10C (10C.2): o mapa é a coluna da DIREITA, ao lado dos botões. */
  assert.equal(decl(fundo.corpo, 'grid-column'), '2', 'o mapa deixou de ser a coluna da direita');
  assert.equal(decl(corpo('.hero__acoes', fundo.bloco), 'grid-column'), '1', 'os botões deixaram de ser a coluna da esquerda');
  assert.equal(decl(corpo('.hero__acoes', fundo.bloco), 'grid-row'), decl(fundo.corpo, 'grid-row'), 'botões e mapa não estão na mesma linha');

  /* O limite é o mesmo em que o `hero-voo.js` muda para o desenho de
     telemóvel (`w < 760`): um px de diferença punha o desenho de
     computador numa caixa de telemóvel. */
  const js = fs.readFileSync(path.join('js', 'hero-voo.js'), 'utf8');
  const limites = [...js.matchAll(/w < (\d+)/g)].map((m) => Number(m[1]));
  assert.ok(limites.length >= 2);
  assert.deepEqual([...new Set(limites)], [fundo.limite + 1]);

  /* O véu que escurecia o texto por cima do mapa deixa de fazer falta —
     e, a ficar, escurecia o mapa. */
  const veu = /\.hero__glow::after\s*\{([^}]*)\}/.exec(fundo.bloco)?.[1];
  assert.match(decl(veu ?? '', 'background') ?? '', /^none$/, 'o véu do hero continua por cima do mapa no telemóvel');
});

test('9.8: os nomes dos passos do formulário não ficam cortados a 360 px', () => {
  /* "Emissor" e "Pagamento" acabavam em reticências: cada passo tinha
     44 px para o texto, ao lado do número. No telemóvel o nome passa para
     baixo do número e fica com a coluna inteira. */
  const passo = noTelemovel('.orc-passo', CSS_ORC);
  assert.ok(passo.limite >= MOVEL);
  assert.match(decl(passo.corpo, 'flex-direction') ?? '', /^column$/);

  /* E a caixa do formulário não gasta um terço do ecrã em margens: a
     360 px os campos ficam com pelo menos 290 px. */
  const lateral = px(decl(noTelemovel('.orc-caixa', CSS_ORC).corpo, 'padding').split(/\s+/)[1]);
  const campo = MOVEL - 2 * 20 - 2 * lateral - 2; /* 20 px de margem do .container no telemóvel */
  assert.ok(campo >= 290, `a 360px os campos do formulário têm ${campo}px`);
});

test('10.5: a marca e o botão do menu são alvos de 44 px', () => {
  const menu = /^\.menu-btn \{([^}]*)\}/m.exec(CSS)?.[1];
  assert.ok(px(decl(menu, 'width')) >= TOQUE && px(decl(menu, 'height')) >= TOQUE);
  const marca = corpo('.brand');
  assert.ok(px(decl(marca, 'min-width')) >= TOQUE && px(decl(marca, 'min-height')) >= TOQUE,
    'o logótipo é um link de 38 px de largura');
});

/* ---------- Fase 10 (10.5): os botões fixos ---------- */

test('10.5: os botões fixos são dois, pequenos, numa fila, e o fim da página guarda-lhes o lugar', () => {
  /* Só WhatsApp e telefone: o Gmail saiu. */
  assert.equal((HTML.match(/class="fixo fixo--/g) ?? []).length, 2);
  assert.doesNotMatch(HTML, /fixo--mail|ico-gmail/);

  assert.match(decl(corpo('.fixos'), 'flex-direction') ?? '', /^row$/, 'os botões fixos não estão numa fila');
  const botao = px(decl(corpo('.fixo__btn'), 'height'));
  assert.ok(botao >= TOQUE && botao <= 52, `os botões fixos têm ${botao}px: ou não se tocam, ou já não são pequenos`);
  assert.equal(px(decl(corpo('.fixo__btn'), 'width')), botao);

  /* O `body` reserva a faixa: o botão, a margem de baixo e uma folga igual. */
  const fundo = px(decl(corpo('.fixos'), 'bottom'));
  const faixa = px(/--faixa:\s*(\d+)px/.exec(CSS)?.[1]);
  assert.ok(faixa >= botao + 2 * fundo,
    `a faixa reservada é de ${faixa}px e os botões ocupam ${botao + 2 * fundo}px: tapam o fim da página`);
  assert.match(decl(corpo('body'), 'padding-bottom') ?? '', /var\(--faixa\)/,
    'o body não reserva a altura da faixa dos botões fixos');
});

test('10.5: os links legais do rodapé e o botão de fechar da privacidade chegam aos 44 px', () => {
  const links = corpo('.rodape__links a');
  assert.ok(px(decl(links, 'min-height')) >= TOQUE, 'os links do rodapé não têm altura de toque');
  assert.match(decl(links, 'display') ?? '', /flex/, 'sem display flex o min-height não se aplica a um link em linha');
  const fechar = corpo('.legal__fechar', CSS_PRIV);
  assert.ok(px(decl(fechar, 'width')) >= TOQUE && px(decl(fechar, 'height')) >= TOQUE, '.legal__fechar tem menos de 44 px');
});

/* ---------- Fase 10C (10C.2): hero em duas colunas e fixos ---------- */

test('10C.2: o hero do telemóvel é uma grelha de duas colunas e o texto ocupa a largura toda', () => {
  const m = mediaMaxComRegra('.hero', CSS);
  assert.equal(m.limite, 899);
  assert.match(m.corpo, /display:\s*grid/);
  assert.match(m.corpo, /grid-template-columns:\s*minmax\(0,\s*[\d.]+fr\)\s*minmax\(0,\s*[\d.]+fr\)/);
  assert.match(m.bloco, /\.hero__int,\s*\.hero__conteudo\s*\{\s*display:\s*contents/);
  assert.match(m.bloco, /\.hero__conteudo h1,\s*\.hero__lead\s*\{\s*grid-column:\s*1\s*\/\s*-1/);
  assert.ok(px(decl(/\.hero__acoes \.btn-maps\s*\{([^}]*)\}/.exec(m.bloco)?.[1] ?? '', 'min-height')) >= TOQUE, 'botões do hero abaixo de 44 px');
});

test('10C.2: os botões fixos escondem-se com o hero à vista, só no telemóvel', () => {
  const js = fs.readFileSync(path.join('js', 'main.js'), 'utf8');
  assert.match(js, /classList\.toggle\('fixos--sobre-hero'/);
  const m = mediaMaxComRegra('.fixos--sobre-hero', CSS);
  assert.ok(m && m.limite === 899, 'a regra dos fixos escondidos não é só do telemóvel');
  assert.match(m.corpo, /visibility:\s*hidden/);
});

/* ---------- Fase 10C (10C.3): «Como chegar» do hero igual aos outros ---------- */

test('10C.3: «Como chegar» do hero é uma pílula do tamanho dos outros, com o pin vermelho à esquerda', () => {
  const hero = /\.hero__acoes \.btn-maps\s*\{([^}]*)\}/.exec(CSS)?.[1] ?? '';
  assert.match(hero, /flex-direction:\s*row/, 'o pin voltou a ficar por cima do texto');
  assert.match(hero, /border-radius:\s*100px/, 'deixou de ser uma pílula');
  assert.match(hero, /padding:\s*16px 28px/, 'o padding não é o do `.btn`');
  assert.match(CSS, /\.btn\s*\{[^}]*padding:\s*16px 28px/, 'o `.btn` mudou de padding: rever o «Como chegar»');
  const svg = /\.hero__acoes \.btn-maps svg\s*\{([^}]*)\}/.exec(CSS)?.[1] ?? '';
  assert.equal(px(decl(svg, 'height')), 19, 'o pin não tem o tamanho dos ícones dos outros botões');
  /* A mesma altura nos três: as linhas da grelha são iguais (`1fr`). */
  assert.match(/\.hero__acoes\s*\{\s*grid-auto-rows:\s*1fr/.exec(CSS)?.[0] ?? '', /1fr/, 'as linhas dos botões do hero não são iguais');
  /* O pin é o primeiro filho (à esquerda do texto) e continua a ser o vermelho do Maps. */
  assert.match(HTML, /class="btn btn--vidro btn-maps"[^>]*><svg[\s\S]*?<\/svg>\s*Como chegar à JVI/);
  assert.match(CSS, /\.btn-maps svg \{[^}]*color:\s*var\(--maps\)/);
  /* O de Contactos fica como está: cartão com o pin grande em cima. */
  assert.match(/\.btn-maps\s*\{([^}]*)\}/.exec(CSS)?.[1] ?? '', /flex-direction:\s*column/);
});
