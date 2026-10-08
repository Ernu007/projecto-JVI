# Fase 10 — Redesenho pedido pelo cliente (08/10/2026)

Feedback do cliente final depois de ver o site. Fonte: notas de voz + 8 prints do
telemóvel enviados pelo Ernu via WhatsApp.

## Pedidos do cliente

1. **Site demasiado robusto.** Tirar informação desnecessária e eliminar TODA a
   informação repetida.
2. **Máximo 5 páginas**, só as mais importantes.
3. **Scroll curto.** Cada página com pouco scroll.
4. **Avião não aparece no telemóvel.** A animação do avião só aparece no PC. Corrigir
   para mobile.
5. **Menos colorido.** Visual sóbrio e profissional ("não tão simples, mas não tão
   colorido, um site top"). As cores actuais atrapalham o lead de ver a identidade.
6. **Botões do WhatsApp em destaque.** Há uma parte do áudio que não se percebeu
   ("quando estão em ponte de madeira"). Confirmar com o Ernu se ficar ambíguo.
7. **Seguir as referências** (abaixo): adaptar o estilo à JVI.

## Sites de referência

- https://www.mzexpress.co.mz/
- https://movicargo.co.mz/

Analisar estrutura, número de páginas, paleta, hero, posição dos CTAs WhatsApp.
Adaptar, não copiar.

## Problemas vistos nos prints (mobile)

- **Botão "Pedir orçamento" do cabeçalho:** o cliente riscou-o a vermelho. Remover.
  Duplica o CTA do hero e aperta o header no telemóvel.
- **Mapa de Moçambique:** os nomes das províncias sobrepõem-se ("ManicaSofala",
  "Inhambane/Gaza").
- **Botões flutuantes:** WhatsApp, telefone e Gmail tapam conteúdo (cartões, mapa,
  botão "Como chegar à JVI").
- **Conteúdo repetido** (aparece 2 vezes ou mais): mapa, "10+ anos",
  licença/credenciais, NUEL/NUIT, "Pedir orçamento", lista de cidades.
- **Galeria com 11 fotos:** demasiado scroll. Reduzir.

## Regras que se mantêm (ver BRIEFING-JVI.md)

- Preços: 3000 MT base até 10 kg, 255 MT/kg acima, +16% IVA, mínimo 3000 MT.
- Formulário de orçamento envia por WhatsApp para +258 84 793 5035. O cliente nunca
  vê campo de destino.
- Contactos, morada, email e NUIT conforme BRIEFING-JVI.md.

## Decisões do Ernu (08/10/2026) — prevalecem sobre tudo o que está acima

**Plano aprovado: 5 páginas, cada uma um ficheiro HTML estático** (sem SPA, sem
framework): `index.html`, `servicos.html`, `sobre.html`, `orcamento.html`,
`contactos.html`. Cabeçalho e rodapé iguais nas 5. Menu com 5 itens: Início,
Serviços, Sobre nós, Orçamento, Contactos. Actualizar `tools/publicar.py` (lista
explícita de ficheiros), `sitemap.xml` e os testes que leem `index.html`.

1. **Início** (`index.html`): hero com o avião e o mapa de Moçambique (o ÚNICO mapa
   do site), título curto, botão WhatsApp em destaque + botão secundário para
   Orçamento. **SEM provas** (tirar `.hero__provas`: nada de "10+ anos", licença,
   cobertura no hero — pedido explícito). Depois do hero: 3 serviços em resumo
   (uma linha cada, link para Serviços) e mais nada. Scroll curto.
2. **Serviços**: carga aérea e rodoviária + "Da recolha à entrega" em 4 passos curtos.
3. **Sobre nós**: empresa + credenciais (NUEL/NUIT/licença aparecem SÓ aqui e no
   rodapé legal mínimo) + galeria com **6 fotos** (escolhe as 6 melhores das 11;
   regista quais em `docs/decisoes.md`). A carta de apresentação pode ficar como link.
4. **Orçamento**: o formulário (regras de preço e envio intactas, ver abaixo) +
   **4 perguntas frequentes** no máximo.
5. **Contactos**: WhatsApp em destaque, telefone, email, morada, "Como chegar à JVI"
   (manter o Plus Code 3H9C+VJ8 e `js/rota.js`).

**Sai:** a secção "Cobertura" (o mapa do hero já mostra as cidades), o botão
"Pedir orçamento" do cabeçalho, os botões com as cores do Google, o "10+ anos"
repetido, a lista de cidades repetida, o bloco SEO de texto do rodapé (os destinos
podem ficar no JSON-LD). Regra: cada informação aparece **uma só vez** no site.

**Paleta clara, mas com a identidade da JVI: VERDE e PRETO.**
- Fundo branco / cinzento muito claro (`#F7F8FA`), texto quase preto.
- **Preto** (ex. `#0B0B0C`–`#111`) no cabeçalho ou hero e no rodapé: é a cor da marca,
  não azul-marinho. O avião e o mapa vivem sobre o preto.
- **Verde JVI `#A9CF44`** como cor de acento: botão principal, sublinhados, ícones,
  províncias acesas no mapa. Verificar contraste (verde sobre branco NÃO serve para
  texto pequeno — usar verde só em fundos escuros ou como fundo com texto preto).
  Usar `tools/contraste.py`.
- Laranja: sai da interface (fica só se fizer parte do logótipo).
- Verde WhatsApp `#25D366` só nos botões WhatsApp.
- Sóbrio e profissional: menos cores, menos gradientes, menos brilho.

**Botões flutuantes:** ficam **dois**, WhatsApp e telefone (sai o Gmail). Pequenos,
e **não podem tapar conteúdo**: reservar espaço no fundo da página
(`padding-bottom` no `body`/`main` igual à altura da faixa) e verificar a 360 px que
não tapam cartões, mapa nem o botão "Como chegar à JVI".

**Avião no telemóvel:** hoje só se vê no PC. Diagnosticar primeiro a causa real
(a 360×800 e 390×844, com o browser): canvas com tamanho 0? `IntersectionObserver`?
`prefers-reduced-motion`? o hero em coluna empurra o mapa para fora? Corrigir a causa
e escrever um teste que falha se o voo deixar de arrancar abaixo de 760 px.

**Mapa:** os nomes das províncias não se podem sobrepor ("ManicaSofala",
"Inhambane/Gaza"). Afastar/reposicionar as etiquetas (ou encurtar no mobile) e
testar que as caixas das etiquetas não se intersectam.

**Ponto 6 do cliente ("ponte de madeira"):** ninguém sabe o que quer dizer. Ignorar
essa frase; aplica-se só "botões WhatsApp em destaque".

## Execução

- Modelo: claude-sonnet-5-5 (custo-benefício). Opus só para partes difíceis.
- Primeiro: propor ao Ernu o plano das 5 páginas e a paleta. Só depois mexer no código.
- Commit por etapa, mensagens em português.
- O plano já foi aprovado: NÃO voltar a propor, executar.
- A decisão D6 de `docs/decisoes.md` (página única) fica revogada por esta fase —
  regista D-nova em `docs/decisoes.md`.

### Etapas (um commit cada, `npm test` verde antes de cada commit)

- **10.1** Paleta: tokens em `css/styles.css` (claro + preto + verde JVI), sem laranja
  nem cores Google na interface. Contraste AA verificado.
- **10.2** Divisão em 5 páginas + cabeçalho/menu de 5 itens sem "Pedir orçamento" +
  `publicar.py` + `sitemap.xml` + testes actualizados. Conteúdo repetido eliminado.
- **10.3** Início sem provas, hero curto, 3 serviços em resumo.
- **10.4** Sobre nós com galeria de 6 fotos.
- **10.5** Botões flutuantes: só WhatsApp + telefone, sem tapar conteúdo.
- **10.6** Avião visível no telemóvel (causa diagnosticada + teste).
- **10.7** Etiquetas do mapa sem sobreposição (+ teste).
- **10.8** Verificação final no browser a 360, 390, 768, 1440 px: medir alturas de
  scroll de cada página (regista em `docs/decisoes.md`), confirmar que nada fica tapado.
