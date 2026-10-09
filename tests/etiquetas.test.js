import test from 'node:test';
import assert from 'node:assert/strict';
import { etiquetasDoMapa, geometriaDoMapa, raioAgencia, ROTULO_SEDE } from '../js/hero-voo.js';
import { CAPITAIS, ROTA, BBOX } from '../js/mapa-dados.js';

/* Fase 10 (10.7). A 360 px "MANICA" caía em cima de "SOFALA" e "Chimoio" em
   cima de "Beira". As caixas vêm da mesma geometria que o canvas usa. Os
   tamanhos são os do ecrã real: 360x800 (telemóvel; o mapa ocupa a largura),
   o canvas de mapa do telemóvel (360x420) e 1440x900 (computador). */
const TAMANHOS = [[320, 700], [360, 800], [360, 420], [390, 844], [768, 900], [1440, 900]];

const cruzam = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

for (const [w, h] of TAMANHOS) {
  test(`etiquetas do mapa não se sobrepõem a ${w}x${h}`, () => {
    const et = etiquetasDoMapa(w, h);
    for (let i = 0; i < et.length; i += 1) {
      for (let j = i + 1; j < et.length; j += 1) {
        assert.ok(!cruzam(et[i], et[j]),
          `${et[i].tipo} "${et[i].texto}" cruza ${et[j].tipo} "${et[j].texto}" a ${w}x${h}`);
      }
    }
  });

  test(`nenhuma etiqueta tapa um ponto de agência a ${w}x${h}`, () => {
    const { esc, ox, oy } = geometriaDoMapa(w, h);
    const r = raioAgencia(1) + 2.4;
    for (const e of etiquetasDoMapa(w, h)) {
      for (const nome of ROTA) {
        const c = CAPITAIS[nome];
        const x = ox + (c.x - BBOX[0]) * esc;
        const y = oy + (c.y - BBOX[1]) * esc;
        const ponto = { x0: x - r, y0: y - r, x1: x + r, y1: y + r };
        assert.ok(!cruzam(e, ponto), `"${e.texto}" tapa o ponto de ${c.nome} a ${w}x${h}`);
      }
    }
  });

  test(`todas as cidades têm nome visível, dentro do canvas, a ${w}x${h}`, () => {
    const et = etiquetasDoMapa(w, h);
    for (const nome of ROTA) {
      const e = et.find((x) => x.tipo === 'cidade' && x.nome === nome);
      assert.ok(e, `falta o nome da cidade de ${nome}`);
      assert.ok(e.x0 >= 0 && e.x1 <= w && e.y0 >= 0 && e.y1 <= h, `"${e.texto}" sai do canvas a ${w}x${h}`);
    }
  });
}

test('não se repete o nome da província quando a cidade tem o mesmo nome', () => {
  const et = etiquetasDoMapa(360, 800);
  for (const nome of ROTA) {
    if (CAPITAIS[nome].nome.toLowerCase() !== nome.toLowerCase()) continue;
    assert.ok(!et.some((e) => e.tipo === 'provincia' && e.nome === nome), `${nome} escrito duas vezes`);
  }
});

test('10B.4: a etiqueta de Maputo é «Maputo — Sede» (travessão), e só essa', () => {
  assert.equal(ROTULO_SEDE, 'Maputo — Sede');
  for (const [w, h] of TAMANHOS) {
    const et = etiquetasDoMapa(w, h);
    const maputo = et.filter((e) => e.tipo === 'cidade' && e.nome === 'Maputo');
    assert.equal(maputo.length, 1, `${w}x${h}: etiquetas de Maputo`);
    assert.equal(maputo[0].texto, 'Maputo — Sede');
    assert.equal(et.filter((e) => /Sede/.test(e.texto)).length, 1, 'só Maputo é sede');
    /* A etiqueta é mais larga do que "Maputo" e continua dentro do canvas. */
    assert.ok(maputo[0].x1 - maputo[0].x0 > 60);
  }
});
