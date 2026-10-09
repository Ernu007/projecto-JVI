# BRIEFING — Rollback para a V1 (aprovada) + ajustes pontuais do cliente

## Contexto (não repetir investigação, já está feita)

O cliente reprovou o redesenho da Fase 10 (2 mapas, carrossel novo, hero
diferente). Pediu para voltar à página que já tinha aprovado antes — a que
estava publicada no link antes do redesenho — com só estes ajustes pontuais.

Estás no branch `v1-aprovada-ajustes`, criado a partir do commit `a12bf1f`
("9.8: o ecrã no telemóvel..."), que é exactamente essa versão aprovada.
**Não** tragas nada do redesenho da Fase 10 (isso ficou gravado na tag
`fase10-redesign-rejeitado-pelo-cliente`, para referência futura, não mexas
nela). O objectivo é fazer SÓ as mudanças listadas abaixo em cima da V1,
mantendo tudo o resto exactamente como estava (mesmo texto, mesmas imagens,
mesma estrutura, mesmo CSS/JS fora do que é pedido).

## Mudanças a fazer

### 1. Remover o 2º mapa (secção "Cobertura")

Em `index.html` existe uma secção `<section class="seccao" id="cobertura" ...>`
(por volta da linha 392-424) com um `<canvas id="canvasMapa">` ("Mapa de
Moçambique com as rotas da JVI"), um parágrafo "Sede: Terminal de Carga do
Aeroporto de Maputo..." e uma lista de chips `.rotas` (Maputo — Sede,
Xai-Xai, Inhambane, ...). **Remove a secção inteira**, do `<section ...
id="cobertura"` até ao `</section>` correspondente.

Depois de remover o HTML, limpa o que ficar órfão por causa disso:
- `js/main.js`: a função/bloco que inicializa `canvasMapa` (procura por
  `canvasMapa`, `iniciarMapa` ou nome semelhante) — remove a chamada e a
  função, se só servir esse canvas.
- CSS: classes `.mapa-zona`, `.mapa-lado`, `.mapa-caixa`, `.mapa-grafico`,
  `.mapa-aviso`, `.rotas`, `.rota`, `.rota--hub` em `css/styles.css` — podes
  deixá-las (CSS morto não parte nada) ou remover se for trivial; prioridade
  é não partir o resto.
- `tests/mapa.test.js` e outros testes que testem especificamente este
  segundo mapa/canvasMapa/secção cobertura: actualiza-os para refletir a
  remoção (não apagues testes que validem `js/mapa-dados.js` ou o mapa do
  HERO, esses continuam a ser usados pelo mapa 1).
- O link de navegação para `#cobertura` no menu de topo e no menu móvel
  (`<a href="#cobertura">Cobertura.</a>`) também deve ser removido (os dois
  sítios — são a mesma lista testada por `tests/interface.test.js`).

### 2. Adicionar "Maputo — Sede" no PRIMEIRO mapa (hero)

O primeiro mapa é o `<canvas id="canvasHero">` desenhado por
`js/hero-voo.js`. A função `desenharAgencias()` (por volta da linha 444-479)
desenha, para cada província da rota, um ponto e o nome da cidade por baixo:

```js
ctx.strokeText(a.nome, x, y + raio + 9);
ctx.fillStyle = `rgba(232,237,245,${0.55 + 0.45 * luz});
ctx.fillText(a.nome, x, y + raio + 9);
```

Faz o ponto de Maputo (que é a sede da JVI — primeira entrada do array
`ROTA` em `js/mapa-dados.js`, ver o comentário "Maputo (a sede)") mostrar o
rótulo **"Maputo — Sede"** em vez de só "Maputo", mantendo exactamente o
mesmo texto usado antes na secção removida ("Maputo — Sede"). Só o ponto de
Maputo muda de rótulo; as outras 9 províncias continuam a mostrar só o nome
da cidade. Sugestão de implementação (adapta ao que vires no ficheiro):

```js
for (const nome of ROTA) {
  const a = agencyPoint(nome);
  if (!a) continue;
  const rotulo = nome === 'Maputo' ? `${a.nome} — Sede` : a.nome;
  // ...usa `rotulo` em vez de `a.nome` nos dois ctx.strokeText/fillText
}
```

Confirma visualmente (ou por teste) que o texto mais comprido não é cortado
pelo canvas nem sobrepõe o ponto seguinte da rota. Actualiza
`tests/mapa.test.js`/`tests/hero-acoes.test.js` se algum deles tiver uma
asserção rígida do texto desenhado (`a.nome` literal) que isto quebre.

### 3. Remover o botão "Pedir orçamento" fixo do CABEÇALHO (não o do hero)

Em `index.html`, dentro do `<header>`, existe:

```html
<div class="header__cta">
  <button class="btn btn--primario" data-abrir-orc>
    ...
    Pedir orçamento
  </button>
</div>
```

(por volta da linha 117-122, logo antes do botão do menu móvel). **Remove
só este bloco** (o `<div class="header__cta">...</div>` inteiro). NÃO
mexas no botão "Pedir orçamento" que está dentro da secção `<section
class="hero">` (dentro de `.hero__acoes`) nem no do menu móvel
(`.btn--bloco` dentro de `<nav class="menu">`) — esses continuam.
Se o CSS tiver uma regra específica só para `.header__cta` que fique
órfã, não precisas de remover o CSS (morto não parte nada), mas avisa
no resumo final se encontrares algo que dependa da existência desse botão
em JS (ex.: `main.js` ligando eventos a todos os `[data-abrir-orc]` —
nesse caso não há problema nenhum, o `querySelectorAll` simplesmente
encontra um a menos).

Corre `npm test` depois: há testes (`hero-acoes.test.js`,
`interface.test.js`) que podem mencionar `header__cta` ou contar botões
`data-abrir-orc` — actualiza-os para o novo número/estrutura.

### 4. Galeria: remover 2 fotos específicas, não mexer no resto do carrossel

Em `index.html`, dentro de `<section ... id="galeria">`, remove estes DOIS
`<button class="gal__item">` (e o `<img>`/`<span class="gal__legenda">`
dentro de cada um):

- `data-gal-src="assets/img/galeria/img_9a5743b57c0e.webp"` (legenda
  "Camisetas amarelas para Zambézia" — caixa de camião aberta, cheia de
  caixas de cartão expostas)
- `data-gal-src="assets/img/galeria/img_3fcdb0c13597.webp"` (legenda
  "Carga amarrada, pronta a sair" — camião pequeno carregado de caixas de
  cartão amarradas com cinta)

O cliente achou estas duas pouco profissionais (mostram a carga exposta
num camião aberto). **Não remover mais nenhuma** imagem do carrossel, e
**não tocar** no texto/legendas das restantes. Não mexas em
`assets/img/camiao.webp` (é uma imagem diferente, usada na secção
"Transporte rodoviário", fora da galeria — o cliente quer mantê-la).

Depois de remover:
- O contador `<span class="gal__contador" data-gal-contador>1 / 11</span>`
  deve passar a reflectir o novo total (confirma se `js/galeria.js`
  calcula isto dinamicamente a partir do número real de `.gal__item` — se
  calcular, não precisas de mexer no texto inicial "1 / 11"; se for
  estático, corrige para "1 / 9").
- `tests/galeria.test.js` pode ter uma contagem fixa de itens (11) —
  actualiza para 9.
- Não apagues os ficheiros de imagem do disco (`assets/img/galeria/`),
  só a referência no HTML — podem ser úteis no futuro.

### 5. Reaplicar o código de referência (rastreio de comissão) + FAQPage SEO

Este trabalho foi feito HOJE sobre o redesenho da Fase 10 (commit `439f376`
no branch `fases-1-6-briefing`) e precisa de ser reaplicado aqui, porque é
sobre o esquema de comissão do Ernu com a JVI — não tem nada a ver com o
redesenho visual rejeitado.

**5a. `js/orcamento.js`** — acrescenta estas mudanças (o ficheiro aqui é
quase idêntico ao da Fase 10 neste módulo, a lógica de preço/mensagens não
mudou):

- Substitui a função `refInterno()` por uma `gerarCodigoRef()` exportada,
  formato `JVI-AAAAMMDD-HHMM-XXX` (3 caracteres finais em base-36
  maiúsculas, para evitar colisão no mesmo minuto):
  ```js
  export function gerarCodigoRef() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const sufixo = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `JVI-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}-${sufixo}`;
  }
  ```
- Em `dados(form)`, acrescenta ao objecto devolvido: `codigo:
  gerarCodigoRef(),` (gerado uma única vez por submissão, porque `dados()`
  só corre uma vez no evento `orc:pronto`).
- Em `msgEmpresa(d)`, a linha do "Ref." passa a:
  `` `*Código de referência:* ${num(d.codigo)}`, `` (usa o helper `num`
  já existente no ficheiro).
- Em `msgCliente(d)`, acrescenta, a seguir à linha do destino e antes do
  total: `` `Código de referência do seu pedido: *${num(d.codigo)}*`, ``
  (com uma linha vazia `''` antes e depois, como as outras secções).
- Em `linhasResumo(d)`, acrescenta como PRIMEIRA linha da lista devolvida:
  `{ rotulo: 'Código de referência', valor: num(d.codigo) },`

**5b. `functions/submit.js`** — acrescenta, SEMPRE NO FIM das listas (nunca
no meio — a folha de cálculo da JVI já tem colunas criadas por posição):
- Em `LIMITES`: `codigo: 40,`
- Em `CAMPOS`: `['codigo', 'Código de referência (site)'],` como última
  entrada.

**5c. Testes** — se existirem `tests/envio.test.js` e `tests/submit.test.js`
com asserções exactas do objecto `dados()` ou do array `CAMPOS`
(`deepEqual`/`deepStrictEqual`), actualiza-os para incluir o campo
`codigo` (ver o padrão: no teste de `dados()`, compara
`{ ...dados(form), codigo: undefined }` contra o objecto esperado com
`codigo: undefined`, porque o valor é gerado aleatoriamente e não é
determinístico; no teste do `CAMPOS`, acrescenta `'codigo'` no fim do
array esperado).

**5d. FAQPage JSON-LD (SEO)** — a secção `<div id="faq">`/`<section
id="faq">` já existe neste branch com "Perguntas frequentes" em
`<details class="faq__i">`. Lê o texto real de cada pergunta/resposta
dessa secção (não inventes texto diferente) e acrescenta, a seguir ao
`<script type="application/ld+json">` do `Organization` que já existe
perto do fim do `<body>` (depois dele, não antes — há testes que fazem
`exec()` à procura do PRIMEIRO `<script type="application/ld+json">` à
espera do Organization), um schema:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "<pergunta 1 tal como está no HTML>",
      "acceptedAnswer": { "@type": "Answer", "text": "<resposta 1>" } },
    ... uma entrada por cada <details class="faq__i"> ...
  ]
}
</script>
```

Corre `npm test` no fim e garante 0 falhas antes de terminar esta parte.

## Build e publicação

**IMPORTANTE — mudou em relação a uma versão anterior deste briefing:**
NÃO mexer em `https://github.com/Ernu007/projecto-beta.git` nem no seu
branch `gh-pages` — esse link já está publicado e é a versão de HOJE
(Fase 10, a que o cliente reprovou), e o Ernu precisa dele intacto para
comparar lado a lado com esta versão nova. **NÃO** actualizar `main` do
`https://github.com/Ernu007/projecto-JVI.git` também, por agora (fica só
neste branch `v1-aprovada-ajustes` até o cliente decidir).

Este trabalho publica-se num repositório DIFERENTE e já existente:
`https://github.com/Ernu007/JVI-1.git` (branch `gh-pages`, pasta raiz).

1. `npm test` — tudo tem de passar (295 testes era o número antes da Fase
   10; aqui pode ser diferente, o que importa é 0 falhas).
2. `python tools/publicar.py` (gera `dist/`). Se o Windows recusar apagar
   `dist/.git` de uma tentativa anterior, apaga a pasta `dist` primeiro à
   mão (`rm -rf dist`) antes de correr o script.
3. Faz commit das mudanças neste branch (`v1-aprovada-ajustes`), mensagem
   clara em português, uma por mudança ou um commit único bem descrito —
   decide tu, mas o histórico tem de ficar legível.
4. Publica o resultado NO REPOSITÓRIO JVI-1 (não no projecto-beta):
   - `cd dist && touch .nojekyll && git init -q && git checkout -q -b
     gh-pages && git add -A && git -c
     user.email="deploy@jvicargaservicos.local" -c user.name="Deploy JVI"
     commit -q -m "Deploy V1 aprovada + ajustes do cliente" && git push
     https://github.com/Ernu007/JVI-1.git gh-pages:gh-pages --force`
   - Depois volta à raiz do projecto (`cd ..`) e apaga a pasta `dist`
     outra vez para não deixar o repo aninhado a atrapalhar o próximo
     build.
5. Activa o GitHub Pages nesse repositório, se ainda não estiver activo
   (hoje está `has_pages: false`):
   `gh api -X POST repos/Ernu007/JVI-1/pages -f "source[branch]=gh-pages"
   -f "source[path]=/"` (se já existir, este comando dá erro inofensivo
   "already exists" — ignora-o e segue em frente).
6. Espera uns 20-30 segundos e confirma com:
   `curl -s https://ernu007.github.io/JVI-1/ | grep -c cobertura` (deve
   dar 0) e `curl -s https://ernu007.github.io/JVI-1/ | grep -c FAQPage`
   (deve dar pelo menos 1).

No relatório final, o link a dar ao Ernu para esta versão é
**https://ernu007.github.io/JVI-1/** — e lembra que
**https://ernu007.github.io/projecto-beta/** continua a ser a versão de
hoje (Fase 10), sem alterações, para ele comparar as duas.

## Relatório final (obrigatório)

No fim, escreve um resumo curto e directo (pode ser a tua resposta final)
com:
- O que foi removido/adicionado, ficheiro a ficheiro.
- O resultado de `npm test` (quantos testes, 0 falhas confirmado).
- A confirmação de que o deploy em https://ernu007.github.io/projecto-beta/
  está a servir a versão nova (com os prints dos `curl` do passo 5).
- Qualquer coisa ambígua em que tenhas tido de decidir sozinho (documenta
  a decisão, como o briefing original do cliente pede).
