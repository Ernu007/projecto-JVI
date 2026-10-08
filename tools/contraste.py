"""Mede o contraste real da paleta da JVI contra a WCAG 2.1 AA.

Não calcula nada "de olhos": converte sRGB -> linear, aplica a fórmula
da WCAG, e diz o rácio de cada par usado no site.

Uso: python tools/contraste.py
"""
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CSS = RAIZ / "css" / "styles.css"

# Fundos reais. Fase 10 (10.1): preto no cabeçalho, hero e rodapé; claro no corpo.
FUNDOS = {
    "base": "#0B0B0C",
    "base-2": "#151516",
    "base-3": "#1C1C1E",
    "rodape": "#060607",
}
# Tema claro (secções do corpo)
FUNDOS_CLAROS = {
    "c-fundo": "#FFFFFF",
    "c-fundo-2": "#F7F8FA",
}


def hex_rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def sobreposicao(frente, fundo, alpha):
    """Compõe uma cor com alpha sobre um fundo opaco.

    É o que o browser faz de facto: `rgba(203,213,225,.66)` sobre
    `#0F172A` não é #CBD5E1 — é uma cor mais escura, e o contraste
    é MENOR do que o da cor nominal. Sem esta conta, a palete parece
    passar quando não passa.
    """
    fb = hex_rgb(fundo)
    return tuple(round(alpha * c + (1 - alpha) * b) for c, b in zip(frente, fb))


def rgba_sobre_fundo(valor, fundo):
    """Aceita '#RRGGBB' ou 'rgba(r,g,b,a)' e devolve o RGB efetivo."""
    m = re.match(r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)", valor)
    if m:
        r, g, b = int(m.group(1)), int(m.group(2)), int(m.group(3))
        a = float(m.group(4)) if m.group(4) else 1.0
        return sobreposicao((r, g, b), fundo, a)
    return hex_rgb(valor)


def srgb_linear(c):
    c = c / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminancia(rgb):
    r, g, b = (srgb_linear(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratiocontraste_rgb(a_rgb, b_rgb):
    la, lb = luminancia(a_rgb), luminancia(b_rgb)
    if la < lb:
        la, lb = lb, la
    return (la + 0.05) / (lb + 0.05)


def ratiocontraste(a, b):
    return ratiocontraste_rgb(hex_rgb(a), hex_rgb(b))


def token(css):
    """Lê o valor de um token, seja #hex ou rgba(...)."""
    m = re.search(
        rf"^\s*{re.escape(css)}\s*:\s*(#[0-9A-Fa-f]{{3,8}}|rgba?\([^)]*\))\s*;",
        css_txt, re.M,
    )
    return m.group(1) if m else None


css_txt = CSS.read_text(encoding="utf-8")

# Texto: tokens e combinações literais usadas no CSS. Os dois tokens
# de texto secundário são translúcidos, por isso a medição é feita
# depois de os compor sobre cada fundo — não sobre a cor nominal.
TEXTOS = {
    "texto": token("--texto"),
    "texto-suave": token("--texto-suave"),
    "texto-fraco": token("--texto-fraco"),
    "claro": token("--claro"),
    "verde": token("--verde"),
    "wa": token("--wa"),
}
TEXTOS_CLAROS = {
    "c-texto": token("--c-texto"),
    "c-texto-suave": token("--c-texto-suave"),
    "c-texto-fraco": token("--c-texto-fraco"),
    "c-verde": token("--c-verde"),
}

# Texto escuro sobre os botões de cor sólida (o verde da marca e o do WhatsApp).
BOTOES = [
    ("sobre-wa", "wa"),
    ("base", "verde-marca"),
]

if __name__ == "__main__":
    print(f"{'texto':<14} {'fundo':<14} {'raio':>6}  AA-normal  AA-grande  AAA")
    print("-" * 68)
    falhas = []
    pares = [(t, FUNDOS) for t in TEXTOS.items()] + [(t, FUNDOS_CLAROS) for t in TEXTOS_CLAROS.items()]
    for (nome_tx, cor_tx), fundos in pares:
        if not cor_tx:
            continue
        for nome_bg, hx_bg in fundos.items():
            rgb_efetivo = rgba_sobre_fundo(cor_tx, hx_bg)
            r = ratiocontraste_rgb(rgb_efetivo, hex_rgb(hx_bg))
            normal = "sim" if r >= 4.5 else "NAO"
            grande = "sim" if r >= 3.0 else "NAO"
            aaa = "sim" if r >= 7.0 else "nao"
            marca = "  <-- FALHA texto normal" if r < 4.5 else ""
            print(f"{nome_tx:<14} {nome_bg:<14} {r:>6.2f}  {normal:<10} {grande:<10} {aaa}{marca}")
            if r < 4.5:
                falhas.append((nome_tx, nome_bg, cor_tx, hx_bg, r))

    print()
    print("texto sobre botões de cor sólida")
    for nome_tx, nome_bg in BOTOES:
        cor_tx, cor_bg = token(f"--{nome_tx}"), token(f"--{nome_bg}")
        r = ratiocontraste(cor_tx, cor_bg)
        marca = "  <-- FALHA texto normal" if r < 4.5 else ""
        print(f"{nome_tx:<14} {nome_bg:<14} {r:>6.2f}{marca}")
        if r < 4.5:
            falhas.append((nome_tx, nome_bg, cor_tx, cor_bg, r))

    print()
    if falhas:
        print(f"PARES ABAIXO DE 4.5:1 (texto normal): {len(falhas)}")
        for nome_tx, nome_bg, cor_tx, hx_bg, r in falhas:
            print(f"  {cor_tx} sobre {hx_bg} = {r:.2f}:1  ({nome_tx} em {nome_bg})")
        sys.exit(1)
    print("Todos os pares passam 4.5:1 para texto normal.")
