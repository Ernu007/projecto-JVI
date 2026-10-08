import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

/* ---------------------------------------------------------------------------
   O BUG

   `modal-aberto` (que faz `overflow: hidden` em styles.css) era posta e
   tirada por cada `abrir*`/`fechar*` por sua conta. O problema é que a
   Política de Privacidade NÃO é um diálogo independente: ela abre-se DE
   CIMA do modal do orçamento, a partir da caixa de consentimento que está
   dentro dele.

   O `fecharLegal` fazia `classList.remove('modal-aberto')` sem reparar
   que o modal continuava aberto. O caminho real:

     1. "Pedir orçamento" -> #modal[data-aberto=true], body.modal-aberto
     2. passo 3 -> clica em "Política de Privacidade" -> #legal aberto
     3. fecha a Política com o X dela
     4. a classe SAI. #modal continua aberto. O scroll da página fica
        destravado com a máscara do orçamento ainda no ecrã, e a página
        rola por trás dela.

   E com os dois abertos, o `Escape` fechava OS DOIS: o handler do modal
   tinha guarda para o `confirm` e não para o `legal`. Quem tivesse
   preenchido o formulário e fosse ler os termos perdia tudo com um
   Escape.

   A correção é não alternar a classe mas DERIVÁ-LA do estado das três
   sobreposições, e pôr o modal `inert` enquanto o legal está por cima —
   como `abrirConfirmacao` já fazia.
   --------------------------------------------------------------------------- */

const MAIN = fs.readFileSync('js/main.js', 'utf8');

test('a classe do body deriva-se do estado, não é alternada às cegas', () => {
  assert.match(MAIN, /function sincronizarBody\(\)/,
    'tem de existir uma função que derive a classe do estado');

  /* A derivação tem de olhar para as TRÊS sobreposições. Faltar a
     legal é exactamente o bug: com só modal e confirm, fechar a
     Política continuava a destravar o scroll. */
  const corpo = MAIN.match(/function sincronizarBody\(\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  for (const el of ['legal', 'confirm']) {
    assert.ok(corpo.includes(el),
      `sincronizarBody tem de considerar ${el} — sem ele a classe sai `
      + 'enquanto um dos diálogos continua aberto');
  }
  assert.match(corpo, /classList\.toggle\(\s*'modal-aberto'\s*,\s*algumAberto\s*\)/,
    'tem de ser um toggle com a condição, e não um add/remove separated');
});

test('nenhum fechar* tira a classe do body a unconditional', () => {
  /* O add/remove directo é o que produziu o bug. `sincronizarBody` é o
     único sitio autorizado a mexer na classe. */
  const foraDaFuncao = MAIN
    .replace(/function sincronizarBody\(\)\s*\{[\s\S]*?\n\}/, '')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ');

  const remocoes = [...foraDaFuncao.matchAll(
    /classList\.(add|remove)\(\s*'modal-aberto'\s*\)/g)];
  assert.deepEqual(remocoes.map((m) => m[1]), [],
    'ninguem pode fazer add/remove de modal-aberto fora de '
    + 'sincronizarBody: é isso que destrava o scroll com o modal aberto');
});

