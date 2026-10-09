#!/usr/bin/env python3
"""Gera `assets/img/camiao-jvi.webp`: um camião em andamento com a marca JVI no baú.

Fotografia de base: Unsplash, licença Unsplash (uso livre). Não está no
repositório; descarregue-a para `.tmp/fotos-camiao/` antes de correr.
    EmEQ6kK_5P0.jpg   semirreboque prateado ao pôr do sol, 1600x2399

Passos:
  1. O logótipo (`assets/logo-full.png`, fundo preto) ganha canal alfa pelo
     brilho e é recortado ao conteúdo.
  2. Projecta-se no baú com uma transformação de perspectiva (Image.PERSPECTIVE).
     O quadrilátero vem do ponto de fuga das linhas horizontais do baú
     (as linhas do telhado e do rodapé convergem para a esquerda), por isso
     o logótipo encolhe para o lado do cabine, como o baú.
  3. Mistura-se com o brilho da própria chapa (multiplicação), para manter
     os reflexos do céu, as costuras e os rebites.
  4. Recorta-se a 16:10 (a caixa da figura no site) e grava-se em WebP.

Uso:  python tools/gerar-camiao.py [--teste]   (--teste grava em .tmp/)
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
FOTO = RAIZ / ".tmp" / "fotos-camiao" / "EmEQ6kK_5P0.jpg"
LOGO = RAIZ / "assets" / "logo-full.png"
SAIDA = RAIZ / "assets" / "img" / "camiao-jvi.webp"

# Ponto de fuga das horizontais do baú, em píxeis da foto original.
VP = (-300.0, 1320.0)
# Zona do logótipo no baú: x esquerdo/direito e y de cima/baixo do lado esquerdo.
X0, X1 = 850.0, 1180.0
Y_TOPO, Y_BAIXO = 900.0, 1250.0
CORTE = (0, 540, 1600, 1540)  # 1600x1000 = 16:10
LARGURA_FINAL = 1000


def logo_rgba() -> Image.Image:
    im = Image.open(LOGO).convert("RGB")
    r, g, b = im.split()
    alfa = ImageChops.lighter(ImageChops.lighter(r, g), b)
    alfa = alfa.point(lambda v: 0 if v < 24 else min(255, int((v - 24) * 1.25)))
    # tira o fundo preto das cores (desassociar o alfa)
    px = im.load()
    al = alfa.load()
    for y in range(im.height):
        for x in range(im.width):
            a = al[x, y]
            if a:
                c = px[x, y]
                f = 255.0 / max(c)
                px[x, y] = tuple(min(255, int(v * f)) for v in c)
    out = im.convert("RGBA")
    out.putalpha(alfa)
    # O ficheiro tem 1600 px de altura com muito vazio (e uma linha de ruído nas
    # bordas, que engana o getbbox). O símbolo e o «JVI» vão das linhas 368 a
    # 1082; abaixo, depois de um intervalo, vem «Carga & Serviços, Lda», que
    # fica de fora: a letra fina não se lê a esta escala e um logótipo que não
    # se lê não é credível num camião.
    out = out.crop((0, 368, out.width, 1083))
    return out.crop(out.getbbox())


def y_em(x: float, y_ref: float, x_ref: float) -> float:
    """A linha horizontal do baú que passa por (x_ref, y_ref), no x dado."""
    return VP[1] + (y_ref - VP[1]) * (x - VP[0]) / (x_ref - VP[0])


def main() -> int:
    teste = "--teste" in sys.argv
    base = Image.open(FOTO).convert("RGB")
    logo = logo_rgba()
    lw, lh = logo.size

    # Quadrilátero de destino: TL, TR, BR, BL.
    destino = [
        (X0, Y_TOPO), (X1, y_em(X1, Y_TOPO, X0)),
        (X1, y_em(X1, Y_BAIXO, X0)), (X0, Y_BAIXO),
    ]
    # Coeficientes inversos: de cada píxel do destino para a origem (logo).
    origem = [(0, 0), (lw, 0), (lw, lh), (0, lh)]
    import numpy as np
    A, B = [], []
    for (x, y), (u, v) in zip(destino, origem):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); B.append(v)
    coef = np.linalg.solve(np.array(A, float), np.array(B, float))

    camada = logo.transform(base.size, Image.PERSPECTIVE, tuple(coef), Image.BICUBIC)
    # bordas mais suaves: a tinta não tem o recorte vivo de um PNG
    alfa = camada.getchannel("A").filter(ImageFilter.GaussianBlur(0.8))

    # Brilho da chapa: normalizado pelo desfoque largo, para ficarem só as
    # costuras, os rebites e os reflexos locais (a luz geral do céu fica na cor).
    cinza = base.convert("L")
    local = cinza.filter(ImageFilter.GaussianBlur(40))
    nb = np.asarray(cinza, np.float32) / np.maximum(np.asarray(local, np.float32), 1)
    nb = np.clip(nb, 0.55, 1.15)
    luz = np.clip(np.asarray(local, np.float32) / 215.0, 0.35, 1.0)  # a tinta não é mais clara que a chapa
    sombra = ((nb ** 1.8) * luz)[..., None]

    tinta = np.asarray(camada.convert("RGB"), np.float32)
    # vinil, não néon: menos saturado e mais escuro do que o ficheiro do logótipo
    cinza_t = tinta.mean(axis=2, keepdims=True)
    tinta = cinza_t * 0.3 + tinta * 0.7
    # a chapa tem um tom frio/rosado do pôr do sol: a tinta apanha-o um pouco
    ambiente = np.asarray(base, np.float32) / np.maximum(np.asarray(local.convert("RGB"), np.float32), 1)
    tinta = np.clip(tinta * sombra * np.clip(ambiente, 0.8, 1.2) * 0.80, 0, 255)

    a = (np.asarray(alfa, np.float32) / 255.0 * 0.96)[..., None]
    mistura = np.asarray(base, np.float32) * (1 - a) + tinta * a
    final = Image.fromarray(np.clip(mistura, 0, 255).astype("uint8")).crop(CORTE)
    final = final.resize((LARGURA_FINAL, LARGURA_FINAL * 10 // 16), Image.LANCZOS)

    destino_ficheiro = (RAIZ / ".tmp" / "camiao-jvi-teste.webp") if teste else SAIDA
    qualidade = 80
    while True:
        final.save(destino_ficheiro, "WEBP", quality=qualidade, method=6)
        if destino_ficheiro.stat().st_size <= 200 * 1024 or qualidade <= 55:
            break
        qualidade -= 5
    print(f"{destino_ficheiro.name}: {final.size}, q={qualidade}, {destino_ficheiro.stat().st_size // 1024} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
