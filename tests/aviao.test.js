import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  tamanhoDoAviao, dprDoCanvas, aviaoParado, caixaDoAviao, etiquetasDoMapa,
  AVIAO_MIN, AVIAO_MAX, DPR_MAX,
} from '../js/hero-voo.js';

/* Fase 10C (10C.1). O avião não aparecia no telemóvel real do cliente. Estes
   testes falham se voltar a ficar minúsculo, se o canvas voltar a crescer com
   o DPR, ou se o avião estático (movimento reduzido) voltar a esconder-se em
   cima da etiqueta de Maputo. */

const CANVAS = [[142, 275], [163, 310], [181, 338], [343, 440], [360, 420], [390, 844], [768, 900], [1440, 900]];
const cruzam = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

test('10C.1: abaixo de 760 px o avião tem pelo menos o tamanho mínimo e cresce com o mapa', () => {
  assert.ok(AVIAO_MIN >= 16, 'o mínimo do avião desceu abaixo de 16 px');
  for (let w = 100; w < 760; w += 20) {
    assert.ok(tamanhoDoAviao(w) >= AVIAO_MIN, `avião de ${tamanhoDoAviao(w)} px a ${w} px`);
    assert.ok(tamanhoDoAviao(w) <= AVIAO_MAX);
  }
  assert.ok(tamanhoDoAviao(160) > 15, 'o avião do telemóvel voltou a ser o de 15 px');
  assert.equal(tamanhoDoAviao(1440), AVIAO_MAX);
  assert.ok(tamanhoDoAviao(300) >= tamanhoDoAviao(160));
});

test('10C.1: o DPR do canvas é limitado a 2', () => {
  assert.equal(DPR_MAX, 2);
  for (const [dpr, esperado] of [[1, 1], [1.5, 1.5], [2, 2], [2.75, 2], [3, 2], [4, 2], [undefined, 1], [0, 1]]) {
    assert.equal(dprDoCanvas(dpr), esperado, `dpr ${dpr}`);
  }
  const js = fs.readFileSync('js/hero-voo.js', 'utf8');
  assert.match(js, /dpr = dprDoCanvas\(window\.devicePixelRatio\)/, 'o resize deixou de usar o limite');
  assert.doesNotMatch(js, /const tam = \(w < 900 \? 15/, 'voltou o tamanho fixo de 15 px');
});

const reservada = (w, h) => { const a = aviaoParado(w, h); return { a, caixa: caixaDoAviao(a.x, a.y, a.tam) }; };

for (const [w, h] of CANVAS) {
  test(`10C.1: o avião estático (movimento reduzido) vê-se e não tapa etiquetas a ${w}x${h}`, () => {
    const { a, caixa } = reservada(w, h);
    assert.ok(Number.isFinite(a.x) && Number.isFinite(a.y) && Number.isFinite(a.ang));
    assert.ok(a.tam >= AVIAO_MIN);
    assert.ok(caixa.x0 >= 0 && caixa.x1 <= w && caixa.y0 >= 0 && caixa.y1 <= h, 'o avião sai do canvas');
    /* Em movimento reduzido as etiquetas cedem o lugar ao avião. */
    for (const e of etiquetasDoMapa(w, h, [caixa])) {
      assert.ok(!cruzam(caixa, e), `o avião parado tapa «${e.texto}» a ${w}x${h}`);
    }
  });

  test(`10C.1: com o avião estático, «Maputo — Sede» continua à vista, sem tapar o avião, a ${w}x${h}`, () => {
    const { a, caixa } = reservada(w, h);
    const sede = etiquetasDoMapa(w, h, [caixa]).find((e) => e.nome === 'Maputo');
    assert.ok(sede, 'a etiqueta da sede desapareceu');
    assert.ok(!cruzam(caixa, sede));
    assert.ok(a.y < sede.y0 - 20, 'o avião parado devia estar bem acima de Maputo, a meio do percurso');
  });
}
