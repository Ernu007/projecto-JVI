import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const CSS = fs.readdirSync('css')
  .filter((f) => f.endsWith('.css'))
  .map((f) => ['css', f, fs.readFileSync(path.join('css', f), 'utf8')]);

const RAIZ = path.resolve('css/styles.css');
const bloco = CSS.find(([d, f]) => path.resolve(d, f) === RAIZ)[2];

/* Um token que se refere a si mesmo não tem cor nenhuma: o browser
   descarta a declaração. Foi o que aconteceu quando o script de
   tokenização substituiu `#25D366` por `var(--wa)` dentro da
   definição de `--wa`. Este teste existe para isso não voltar. */
test('nenhum token se define a si mesmo', () => {
  const auto = [...bloco.matchAll(/(--[a-z0-9-]+)\s*:\s*var\(\s*\1\s*\)/g)];
  assert.deepEqual(auto.map((m) => m[1]), [],
    'token auto-referencial: ' + auto.map((m) => m[0]).join(', '));
});

test('todo token usado tem de estar definido em :root', () => {
  const definidos = new Set([...bloco.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  const usados = new Set();
  for (const [, , txt] of CSS) {
    for (const m of txt.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) usados.add(m[1]);
  }
  assert.deepEqual([...usados].filter((t) => !definidos.has(t)), []);
});

test('as tres cores de marca so aparecem como token, nunca literais', () => {
  const literais = { '169, 207, 68': 'verde', '234, 130, 64': 'laranja' };
  for (const [canal, nome] of Object.entries(literais)) {
    for (const [dir, ficheiro, txt] of CSS) {
      // fora da definição do próprio token de canal
      const usos = [...txt.matchAll(new RegExp(`rgba\\(\\s*${canal}\\s*,`, 'g'))];
      const linhaDefinicao = new RegExp(`--${nome}-rgb\\s*:`);
      for (const u of usos) {
        const linha = txt.slice(0, u.index).split('\n').length;
        const linhaTxt = txt.split('\n')[linha - 1];
        assert.ok(linhaDefinicao.test(linhaTxt),
          `${ficheiro}:${linha} ainda escreve rgb(${canal}, ...) à mão`);
      }
    }
  }
});

/* Lê as cores do `:root` em vez de as escrever à mão. A versão
   anterior testava hexadecimais literais, pelo que mudar `--laranja` ou
   `--texto-fraco` mantinha o teste verde a medir uma cor que já não
   existe. */
function token(nome) {
  const m = new RegExp(
    `^\\s*${nome}\\s*:\\s*(#[0-9A-Fa-f]{3,8}|rgba?\\([^;]*?\\)|rgb\\(.*?\\)|[\\d\\s]+)\\s*;`,
    'm',
  ).exec(bloco);
  if (!m) throw new Error(`token ${nome} não encontrado no :root`);
  return m[1];
}

const lin = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const hex = (h) => [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16));
const rgba = (v) => {
  const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/.exec(v);
  return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
};

/** Resolve um valor de cor do `:root` para [frente, alfa], seja
 *  #hex, rgba(...), rgb(var(--canal-rgb) / alfa) ou um canal `R G B`. */
function resolver(valor) {
  if (valor.startsWith('#')) return [hex(valor), 1];
  if (valor.startsWith('rgb(var(')) {
    const canal = /var\((--[a-z-]+)\)/.exec(valor)[1];
    const alfa = Number(/\/\s*([\d.]+)\s*\)/.exec(valor)[1]);
    return [resolver(token(canal))[0], alfa];
  }
  if (valor.startsWith('rgb(')) return [[255, 255, 255], 1];
  // canal "R G B" (--verde-rgb: 169 207 68)
  const canais = valor.trim().split(/\s+/).map(Number);
  if (canais.length >= 3 && canais.every(Number.isFinite)) return [canais.slice(0, 3), 1];
  const [r, g, b, a] = rgba(valor);
  return [[r, g, b], a];
}

/** Compõe uma cor com alfa sobre um fundo opaco, como o browser faz. */
const sobre = (frente, alpha, fundo) =>
  frente.map((c, i) => Math.round(alpha * c + (1 - alpha) * fundo[i]));

test('o contraste do texto principal continua a passar AA', () => {
  const fundos = { '--base': hex(token('--base')), '--base-2': hex(token('--base-2')),
    '--base-3': hex(token('--base-3')), '--rodape': hex(token('--rodape')) };

  for (const nome of ['--texto', '--texto-suave', '--texto-fraco', '--claro', '--verde']) {
    const [frente, alpha] = resolver(token(nome));
    for (const [fnome, fundo] of Object.entries(fundos)) {
      const r = ratio(sobre(frente, alpha, fundo), fundo);
      assert.ok(r >= 4.5, `${nome} sobre ${fnome} dá ${r.toFixed(2)}:1`);
    }
  }
});

/* Fase 10 (10.1): o tema claro do corpo da página. O verde claro da marca
   (#A9CF44) dá 1,9:1 sobre branco e NÃO pode ser texto ali: o texto verde
   do tema claro é o `--c-verde`, mais escuro. */
test('10.1: o texto do tema claro passa AA sobre os dois fundos claros', () => {
  const fundos = { '--c-fundo': hex(token('--c-fundo')), '--c-fundo-2': hex(token('--c-fundo-2')) };
  for (const nome of ['--c-texto', '--c-texto-suave', '--c-texto-fraco', '--c-verde']) {
    for (const [fnome, fundo] of Object.entries(fundos)) {
      const r = ratio(hex(token(nome)), fundo);
      assert.ok(r >= 4.5, `${nome} sobre ${fnome} dá ${r.toFixed(2)}:1`);
    }
  }
  const marcaSobreBranco = ratio(hex(token('--verde-marca')), hex(token('--c-fundo')));
  assert.ok(marcaSobreBranco < 4.5, 'o verde da marca passou a servir de texto sobre branco? confirme o contraste');
});

test('10.1: sem laranja nem cores do Google na interface', () => {
  for (const [, f, txt] of CSS) {
    const sem = txt.replace(/\/\*[\s\S]*?\*\//g, ' ');
    assert.doesNotMatch(sem, /laranja|google-|#EA8240|#EA4335|#34A853|#FBBC05|#4285F4/i, `${f} ainda tem laranja ou cores do Google`);
  }
});

/* Fase 9 (9.6). O botão de WhatsApp do hero passou de vidro a verde — o
   verde da marca WhatsApp (`--wa`), com o texto em `--sobre-wa`. Os três
   botões de cor sólida do site têm texto escuro sobre cor viva; nenhum
   estava medido, porque o teste de cima só mede texto sobre os fundos
   escuros. */
test('9.6: o texto dos botoes de cor solida passa AA sobre a cor do botao', () => {
  const pares = [
    ['--sobre-wa', '--wa'],              // WhatsApp: hero, rodapé, ecrã de sucesso
    ['--base', '--verde-marca'],         // primário: texto preto sobre o verde da marca
  ];
  for (const [texto, fundo] of pares) {
    const r = ratio(hex(token(texto)), hex(token(fundo)));
    assert.ok(r >= 4.5, `${texto} sobre ${fundo} dá ${r.toFixed(2)}:1`);
  }

  /* E são mesmo essas as cores do botão do WhatsApp. */
  const orc = CSS.find(([, f]) => f === 'orcamento.css')[2];
  const wa = /\.btn--wa\s*\{([^}]*)\}/.exec(orc)?.[1] ?? '';
  assert.match(wa, /background:\s*var\(--wa\)/);
  assert.match(wa, /color:\s*var\(--sobre-wa\)/);
});

/* "Usa o verde da marca WhatsApp (diferente do verde JVI) para não ficarem
   dois verdes a competir." Diferente tem de se ver: mede-se o tom. */
test('9.6: o verde do WhatsApp nao se confunde com o verde da JVI', () => {
  const tom = ([r, g, b]) => {
    const [x, y, z] = [r, g, b].map((c) => c / 255);
    const max = Math.max(x, y, z);
    const d = max - Math.min(x, y, z);
    const h = max === x ? ((y - z) / d) % 6 : max === y ? (z - x) / d + 2 : (x - y) / d + 4;
    return (h * 60 + 360) % 360;
  };
  assert.equal(token('--wa').toUpperCase(), '#25D366', 'o --wa deixou de ser o verde da marca WhatsApp');
  const wa = tom(hex(token('--wa')));
  for (const nome of ['--verde', '--verde-escuro']) {
    const jvi = tom(hex(token(nome)));
    assert.ok(Math.abs(wa - jvi) >= 40,
      `o tom do WhatsApp (${wa.toFixed(0)}°) está a ${Math.abs(wa - jvi).toFixed(0)}° do ${nome} (${jvi.toFixed(0)}°)`);
  }
});

/* Fase 10B (10B.2): o titulo do hero tem de estar nitido e opaco desde o
   primeiro paint. Antes comecava apagado/desfocado e acendia com o voo; com
   internet fraca ninguem o lia. Nada no h1, nas palavras ou no contentor do
   hero pode ter blur, opacidade < 1, deslocamento ou depender de --p. */
test('10B.2: o titulo do hero nao tem blur, opacidade, deslocamento nem --p', () => {
  const regras = [...bloco.matchAll(/([^{}]*)\{([^{}]*)\}/g)]
    .map((m) => ({ sel: m[1].trim(), corpo: m[2] }));
  const doTitulo = regras.filter((r) => /(^|[\s,])(\.hero h1|\.h1linha|\.pal)(?![\w-])/.test(r.sel)
    && !/::after/.test(r.sel));
  assert.ok(doTitulo.length >= 3, 'não encontrei as regras do título');
  for (const r of doTitulo) {
    assert.doesNotMatch(r.corpo, /filter\s*:|backdrop-filter|--p/, `${r.sel}: blur/filtro ou --p`);
    assert.doesNotMatch(r.corpo, /opacity\s*:\s*(0(\.\d+)?|calc|0?\.\d+)\s*;/, `${r.sel}: opacidade < 1`);
    assert.doesNotMatch(r.corpo, /transform\s*:|transition\s*:|animation\s*:/, `${r.sel}: desloca ou anima o texto`);
  }
  /* O contentor do hero anima os filhos, mas nunca o h1. */
  assert.match(bloco, /\.hero__conteudo > \*:not\(h1\)\s*\{[^}]*opacity:\s*0/);
  assert.doesNotMatch(bloco, /\.hero__conteudo > \*\s*\{[^}]*opacity:\s*0/);
  assert.doesNotMatch(bloco, /\.hero\.pronto/, 'a entrada do hero voltou a depender de JS');
  /* E o JS já não escreve --p. */
  assert.doesNotMatch(fs.readFileSync('js/main.js', 'utf8'), /--p['"]|reporTitulo/);
  assert.doesNotMatch(fs.readFileSync('index.html', 'utf8'), /<h1[^>]*style=/);
});
