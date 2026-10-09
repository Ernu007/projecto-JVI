# Fase 10B — Ajustes do cliente depois de ver a Fase 10 (09/10/2026)

Fonte: notas de voz do Ernu, transcritas. Prevalece sobre `BRIEFING-FASE10-REDESIGN.md`
onde houver conflito. **A paleta (claro + preto + verde JVI) foi aprovada: NÃO mexer.**
O texto do hero, o título "A sua carga, em mãos seguras.", os botões "Falar no
WhatsApp" e "Pedir orçamento", o formulário e as FAQ estão aprovados ("da top").

## 1. Voltar a UMA página, com scroll (prioridade máxima)

O cliente NÃO quer 5 ficheiros HTML com o menu a abrir outra página. Quer abrir o site
e fazer scroll por tudo. As "5 páginas" passam a ser **5 secções de `index.html`**,
nesta ordem exacta:

1. **Início** (`#inicio`)
2. **Serviços** (`#servicos`)
3. **Orçamento** (`#orcamento`) — formulário + as 4 FAQ (antes de Sobre nós!)
4. **Sobre nós** (`#sobre`)
5. **Contactos** (`#contactos`)

- O menu MANTÉM-SE (5 itens, nesta ordem), mas com âncoras `#…` que fazem scroll suave
  para a secção. Marcar o item da secção visível (IntersectionObserver), `aria-current`.
- Compensar o cabeçalho fixo (`scroll-margin-top`) para o título da secção não ficar tapado.
- Apagar `servicos.html`, `sobre.html`, `orcamento.html`, `contactos.html`. Actualizar
  `tools/publicar.py`, `sitemap.xml`, `robots.txt` e os testes (`tests/paginas.js`,
  `tests/fase10.test.js` …) para uma página com 5 secções pela ordem acima. Manter a
  regra "cada informação aparece uma só vez".
- O conteúdo de cada secção é o que já existe nas páginas da Fase 10 (aprovado).
- Revoga a decisão da 10.2 em `docs/decisoes.md` com uma D-nova.

## 2. Título do hero aparece logo

"A sua carga, em mãos seguras." demora a aparecer: fica desfocado/apagado e só depois
acende com o voo. Com internet fraca ninguém o lê. **O título tem de estar 100% nítido
e opaco desde o primeiro paint**, sem depender de JS, do canvas ou do avião. Tirar o
`blur`/`opacity`/`translate` ligados a `--p` em `.pal` (ou o equivalente). Pode ficar
um efeito subtil que NÃO reduza a legibilidade (ex.: sublinhado verde que cresce).
Teste que falha se `.hero h1` ou `.pal` tiverem `filter: blur`, `opacity` < 1 ou
dependerem de `--p`.

## 3. Botão "Como chegar à JVI" no Início, com as cores antigas

O cliente gostou muito do botão "Como chegar à JVI" com o estilo antigo (pin do Google
Maps vermelho `#EA4335`, grande, ícone numa faixa por cima do texto: ver `.btn-maps`
no commit `a12bf1f:css/styles.css` linhas ~792-802). Pôr esse botão **no hero do
Início**, a seguir a "Falar no WhatsApp" e "Pedir orçamento" (é secundário; não pode ser
uma terceira acção primária verde). Mesmo `href` (Plus Code 3H9C+VJ8, `linkDirecoes()`
de `js/rota.js`; o `tests/rota.test.js` confere).

Em **Contactos**, o mesmo botão: hoje parece só texto. Dar-lhe **fundo** (cartão/botão
com fundo, borda, o pin vermelho), para se perceber que é um botão. Os dois iguais.

## 4. Mapa: "Maputo — Sede"

No mapa do hero, a etiqueta de Maputo passa a **"Maputo — Sede"** (como estava no mapa
antigo: `a12bf1f:js/main.js:468` fazia `'Maputo · Sede'`; usa travessão "—"). Só no
mapa. Actualizar `etiquetasDoMapa` e o teste de sobreposição (a etiqueta fica mais
larga: tem de continuar sem colidir a 320-1440 px).

## 5. Imagem do camião (Serviços → Transporte rodoviário)

`assets/img/camiao.webp` é uma imagem de banco muito usada por empresas de carga. Sai.
Pôr **um camião em andamento numa estrada, com a marca JVI no baú**.

- Fotos candidatas (licença Unsplash, uso livre, já descarregadas) em
  `.tmp/fotos-camiao/`:
  - `EmEQ6kK_5P0.jpg` (1600×2399, semirreboque prateado ao pôr do sol, lateral grande
    sem marcas; a lateral é oblíqua — encolhe ~3× para a esquerda. Recorte sugerido
    y 700-1767; zona lisa no recorte ≈ (720,40) (1570,15) (1570,560) (720,585).
    ATENÇÃO: os guarda-lamas têm "TRANS CHICAGO TRUCK GROUP" e "ROADSQUAD" —
    recortar ou desfocar/apagar esse texto.)
  - `neCb34TcLEg.jpg` (dois camiões brancos em autoestrada, vista de cima, de frente).
  - `R1B3C08aVn8.jpg` (autoestrada ao pôr do sol, camião de baú branco pequeno).
  Escolhe a que fica mais credível. Podes procurar outra no Unsplash (licença livre,
  sem marcas de terceiros visíveis) se nenhuma servir.
- Aplicar o logótipo JVI no baú com **transformação de perspectiva** (Pillow 12 está
  instalado: `Image.transform(..., Image.PERSPECTIVE, coeffs)`), com mistura que mantenha
  os reflexos (multiply/overlay ou opacidade ~0.9). Logótipos: `assets/logo-branco.png`
  (RGBA), `assets/logo-full.png`, `assets/logo.webp`. Pode levar também o texto
  "JVI Carga & Serviços" em letra da marca.
- **Tens de olhar para o resultado** (abre a imagem gerada) e só aceitar se parecer real.
  Guardar o script em `tools/gerar-camiao.py` e a imagem final em
  `assets/img/camiao-jvi.webp` (≤ 200 KB). Crédito do fotógrafo Unsplash num comentário
  HTML e em `docs/decisoes.md`.
- Se não conseguires um resultado credível, diz isso claramente no resumo final e deixa
  a melhor tentativa num ficheiro em `.tmp/` — não publiques um logótipo mal colado.

## 6. Galeria (Sobre nós): só carga bem embalada, carrossel automático

O cliente diz que caixas soltas empilhadas no camião ou no chão mostram pouco
profissionalismo. **Sair:** `3fcdb0c13597`, `6b6532bd8520`, `78498ba3732e`,
`9a5743b57c0e`, `06fa9ae40417`, e também o poster `014b85241586` e o Airwaybill
`5e0f0d40bd0b` (números/IVA errados — ver D-entradas existentes).

**Entram** (carga embalada e individual — o que ele pediu: motos embaladas, TV
embalada, caixote fechado com fita da JVI):
`7296cfa7277f` (caixotes com a marca JVI), `ac351fd019f4` (TVs reforçadas com madeira),
`492cc8a760cc`, `ca40db758afe`, `f4ab097ea722` (motos embrulhadas),
`8c88f37e0265` (volume embrulhado em palete), `d544eaf40b51` (caixotes fechados).
Confirma cada uma abrindo a imagem; escreve legendas/`alt` correctos depois de ver.
Podes juntar `700cc775e008` (placa da JVI) se ficar bem.

**Carrossel moderno, automático, sem setas nem botões de pausa:**
- Passa sozinho, uma imagem de cada vez (fade/slide suave, ~4 s por imagem), em loop.
- Sem setas, sem botão de pausa visíveis. Pode ter pontos indicadores discretos.
- Acessibilidade sem botões (registar a escolha em `docs/decisoes.md`): pausa ao passar
  o rato, ao tocar/segurar, ao receber foco do teclado, e quando sai do ecrã
  (IntersectionObserver) ou o separador fica oculto. Com `prefers-reduced-motion`
  NÃO roda sozinho (mostra a primeira; swipe continua a funcionar). Swipe no telemóvel.
- Só `transform`/`opacity` (sem layout thrash), imagens `loading="lazy"` excepto a 1.ª.
- Remover o código/CSS das setas e do botão de pausa antigos e actualizar os testes.

## 7. Perguntas frequentes (Orçamento)

- **"Trabalham para fora do país?"** → resposta nova: "Sim. Enviamos para qualquer
  país, através da nossa rede de parceiros aéreos e rodoviários. Fale connosco para
  saber prazo e preço para o seu destino." (sem listar só Angola/África do Sul/Zimbabwe).
- **"Como posso pagar?"** → "Em numerário, por dinheiro móvel (e-Mola ou M-Pesa) ou por
  transferência bancária. Pode pagar no acto de envio ou no levantamento, na província
  de destino."
- **Prazos** (24–72 h úteis, confirmar ao fechar o orçamento): aprovado, NÃO mexer.

## 8. Numerário no formulário

O passo 3 do formulário ("Como pretende pagar") passa a ter a opção **"Numerário"**
(dinheiro físico). Acrescentar a `PAGAMENTOS` em `js/orcamento.js` **e** em
`functions/submit.js` (as duas listas têm de ser iguais — há testes que o confirmam
ou escreve um), na mensagem de WhatsApp/email, e nos testes. Ordem sugerida:
Numerário, Dinheiro móvel (e-Mola / M-Pesa), Transferência bancária.

## Regras que se mantêm

- Preços: 3000 MT base até 10 kg, 255 MT/kg acima, +16% IVA, mínimo 3000 MT. NÃO MEXER.
- O formulário envia por WhatsApp para +258 84 793 5035. NÃO MEXER. Sem campo destino.
- Dois botões flutuantes (WhatsApp + telefone), sem tapar conteúdo.
- Avião visível no telemóvel; etiquetas do mapa sem sobreposição.

## Etapas (um commit cada, mensagens em português, `npm test` verde antes de cada um)

- **10B.1** Uma página com 5 secções pela ordem Início → Serviços → Orçamento → Sobre
  nós → Contactos; menu com âncoras e item activo; páginas extra apagadas.
- **10B.2** Título do hero nítido desde o primeiro paint (+ teste).
- **10B.3** Botão "Como chegar à JVI" no hero com as cores antigas; o de Contactos com fundo.
- **10B.4** "Maputo — Sede" no mapa (+ teste de sobreposição actualizado).
- **10B.5** FAQ (estrangeiro, pagamento) + Numerário no formulário e no servidor.
- **10B.6** Galeria: fotos novas + carrossel automático sem setas.
- **10B.7** Camião em andamento com a marca JVI (ou relatório honesto se não ficar bom).
- **10B.8** Verificação no Chrome a 360, 390, 768 e 1440 px: scroll pela página toda,
  menu leva à secção certa, título visível logo, carrossel roda e pára como descrito,
  nada tapado pelos botões flutuantes. Medidas em `docs/decisoes.md`.
