# Fase 10C — Hero no telemóvel + carrossel (09/10/2026)

Pedido do Ernu depois de ver a 10B no telemóvel real. Prevalece sobre as fases
anteriores onde houver conflito. Paleta, textos, ordem das secções: NÃO mexer.

## 1. O avião TEM de aparecer no telemóvel (prioridade máxima)

No telemóvel real do Ernu (Android, Chrome, ~360-393 px de largura) o avião não
aparece. No Chrome desktop com emulação a 360×800 ele aparece — por isso a causa é
algo que a emulação não reproduz. Hipóteses a investigar e eliminar, uma a uma:

- O mapa está por baixo dos três botões (y ≈ 580 px num ecrã de 800) e o voo só arranca
  com `IntersectionObserver` threshold 0.2 — num ecrã mais baixo (ex.: 360×640, 393×740
  com as barras do browser) o mapa fica abaixo da dobra e o avião não está à vista.
  → resolvido em parte pelo ponto 2 (mapa no primeiro ecrã).
- `prefers-reduced-motion` (Android "Remover animações"): hoje o avião desenha-se parado
  **em cima de Maputo, a tapar "Maputo — Sede"** — quase não se distingue. Com movimento
  reduzido, o avião deve aparecer parado num sítio bem visível do percurso (ex.: a meio
  entre Beira e Tete), grande o bastante e sem tapar etiquetas.
- `devicePixelRatio` 2.75/3 → canvas enorme; verificar que não há limite de memória
  (limitar o DPR do canvas a 2).
- O avião é desenhado com um tamanho fixo (15 px abaixo de 900): no telemóvel fica
  minúsculo. Aumentar para que se veja bem (proporcional à largura do mapa).
- Qualquer excepção JS (abrir a consola a 360×640 com DPR 3 e com reduced-motion).
- O arranque do voo não pode depender de o utilizador fazer scroll: com o mapa no primeiro
  ecrã, o avião tem de estar a voar (ou visível, se movimento reduzido) **nos primeiros
  2 segundos** depois de abrir a página.

Escrever teste(s) que falhem se: o tamanho do avião abaixo de 760 px for menor que um
mínimo razoável; o DPR do canvas não for limitado; o avião estático em reduced-motion
estiver em cima da etiqueta de Maputo.

## 2. Hero no telemóvel: botões à ESQUERDA, mapa à DIREITA (como no PC)

Hoje, abaixo de 900 px, o hero é uma coluna: texto, botões, e o mapa por baixo. O Ernu
quer o mesmo arranjo do PC em todos os tamanhos:

- Título + subtítulo podem ocupar a largura toda em cima (decide tu o que fica melhor a
  360 px), mas **os botões ficam numa coluna à esquerda e o mapa numa coluna à direita,
  lado a lado**, ajustados ao ecrã. Moçambique é alto e estreito, cabe bem numa coluna de
  ~45 % da largura.
- Tudo (título, botões e mapa com o avião) tem de caber **no primeiro ecrã** a 360×740.
- Botões compactos na coluna esquerda (altura ≥ 44 px, toque fácil), texto pode partir
  em duas linhas. Nada pode sair do ecrã nem sobrepor-se.
- No mapa estreito, as etiquetas pequenas podem ser escondidas/encurtadas (ex.: só os
  pontos + "Maputo — Sede"), mas sem sobreposições: actualizar `etiquetasDoMapa` e o
  teste de caixas para a nova geometria (320, 360, 390, 768, 1440 px).
- Os botões flutuantes (WhatsApp + telefone) não podem tapar o mapa nem os botões do hero.

## 3. Botão "Como chegar à JVI" do hero: mesmo tamanho dos outros

Hoje é um cartão branco quase o dobro da altura dos outros dois (ícone em cima do texto).
Passa a ter **a mesma altura, a mesma forma (pílula) e o mesmo padding** que "Falar no
WhatsApp" e "Pedir orçamento", com o **pin vermelho do Google Maps à esquerda do texto**
(como os ícones dos outros). Mantém a identidade (pin vermelho `#EA4335`; fundo branco ou
o estilo secundário — decide e regista), mas sem ser maior que o botão principal.
Teste: as alturas dos três botões do hero são iguais (±2 px) a 360 e 1440 px.
O botão de Contactos fica como está.

## 4. Carrossel: 2 segundos por imagem

`INTERVALO_MS` passa a **2000**, igual para todas as imagens. A transição tem de ser
curta (≤ 0,6 s) para a imagem ficar parada a maior parte dos 2 s. Actualizar testes.
Mantém tudo o resto (sem setas, pausa por gestos, reduced-motion, swipe).

## Regras

- Preços, número do formulário (+258 84 793 5035), sem campo destino: NÃO MEXER.
- Um commit por ponto (10C.1 … 10C.4), português, `npm test` verde antes de cada um.
- Verificação final no Chrome headless a 360×640 (DPR 3), 360×740, 393×800, 768 e 1440,
  com e sem `prefers-reduced-motion`: captura de ecrã do primeiro ecrã, e **olha para ela**
  para confirmar que o avião se vê. Regista em `docs/decisoes.md`.
