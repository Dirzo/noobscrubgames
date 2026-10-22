#!/usr/bin/env python3
"""Builds the pixel-art lobby background (public/assets/lobby-pixel.png).

The painted lobby in art-src/lobby/ is put on a true pixel grid: 4 page
pixels per grid pixel, a 48-colour palette, and a cleanup pass that removes
stray single pixels. The small lettering (quiz panel and patch notes) does not
survive that, so it is cleared and re-lettered in bitmap fonts: Crazy Weapon
Man's 5x7 for headings and a 3x5 for body text, both at 2 page pixels.

    python3 tools/build-lobby.py
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
PAINTING = ROOT / 'art-src' / 'lobby' / 'arcade-painting.png'
OUT = ROOT / 'public' / 'assets' / 'lobby-pixel.png'
K = 4                  # page pixels per grid pixel
GRID = (418, 235)      # 1672 x 940 on the page, the painting's 1671 x 941 frame
COLOURS = 48

BIG = json.loads((ROOT / 'art-src' / 'cards' / 'font-5x7.json').read_text())
SMALL = {k: v.split() for k, v in {
    'A': '.#. #.# ### #.# #.#', 'B': '##. #.# ##. #.# ##.', 'C': '.## #.. #.. #.. .##',
    'D': '##. #.# #.# #.# ##.', 'E': '### #.. ##. #.. ###', 'F': '### #.. ##. #.. #..',
    'G': '.## #.. #.# #.# .##', 'H': '#.# #.# ### #.# #.#', 'I': '### .#. .#. .#. ###',
    'J': '..# ..# ..# #.# .#.', 'K': '#.# #.# ##. #.# #.#', 'L': '#.. #.. #.. #.. ###',
    'M': '#.# ### #.# #.# #.#', 'N': '##. #.# #.# #.# #.#', 'O': '.#. #.# #.# #.# .#.',
    'P': '##. #.# ##. #.. #..', 'Q': '.#. #.# #.# ##. .##', 'R': '##. #.# ##. #.# #.#',
    'S': '.## #.. .#. ..# ##.', 'T': '### .#. .#. .#. .#.', 'U': '#.# #.# #.# #.# ###',
    'V': '#.# #.# #.# #.# .#.', 'W': '#.# #.# #.# ### #.#', 'X': '#.# #.# .#. #.# #.#',
    'Y': '#.# #.# .#. .#. .#.', 'Z': '### ..# .#. #.. ###',
    '0': '### #.# #.# #.# ###', '1': '.#. ##. .#. .#. ###', '2': '##. ..# .#. #.. ###',
    '3': '##. ..# .#. ..# ##.', '4': '#.# #.# ### ..# ..#', '5': '### #.. ##. ..# ##.',
    '6': '.## #.. ### #.# ###', '7': '### ..# .#. .#. .#.', '8': '### #.# ### #.# ###',
    '9': '### #.# ### ..# ##.', ' ': '... ... ... ... ...', '.': '. . . . #',
    '!': '# # # . #', '?': '##. ..# .#. ... .#.', '(': '.# #. #. #. .#', ')': '#. .# .# .# #.',
    '#': '#.# ### #.# ### #.#', ':': '. # . # .', "'": '# # . . .', ',': '.. .. .. .# #.',
    '-': '... ... ### ... ...', '>': '#.. .#. ..# .#. #..',
}.items()}

CYAN, GOLD, PALE, MIST = (96, 232, 240), (255, 198, 92), (205, 228, 242), (160, 196, 214)
QUIZ_BG, PATCH_BG = (1, 16, 33), (0, 11, 23)


def width(s, font, k=2):
    return sum((len(font.get(c, font[' '])[0]) + 1) * k for c in s) - k


def text(d, s, x, y, font, col, k=2, shadow=None):
    for c in s:
        g = font.get(c, font[' '])
        for r, row in enumerate(g):
            for i, v in enumerate(row):
                if v == '#':
                    if shadow:
                        d.rectangle((x + i * k, y + r * k + k, x + i * k + k - 1, y + r * k + 2 * k - 1), fill=shadow)
                    d.rectangle((x + i * k, y + r * k, x + i * k + k - 1, y + r * k + k - 1), fill=col)
        x += (len(g[0]) + 1) * k


def despeckle(img):
    """A pixel whose four neighbours agree on another colour takes that colour."""
    px = img.load()
    w, h = img.size
    src = img.copy().load()
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            n = src[x - 1, y]
            if n != src[x, y] and n == src[x + 1, y] == src[x, y - 1] == src[x, y + 1]:
                px[x, y] = n


def build():
    painting = Image.open(PAINTING).convert('RGB')
    grid = painting.resize(GRID, Image.BOX)
    grid = grid.quantize(colors=COLOURS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    despeckle(grid)
    page = grid.resize((GRID[0] * K, GRID[1] * K), Image.NEAREST)
    d = ImageDraw.Draw(page)

    # tagline under the logo
    d.rectangle((662, 200, 986, 224), fill=(10, 10, 20))
    tag = "GAMES THAT DON'T SUCK."
    text(d, tag, 824 - width(tag, BIG) // 2, 206, BIG, (248, 214, 150), shadow=(90, 60, 30))

    # quiz panel
    d.rectangle((160, 744, 548, 770), fill=QUIZ_BG)
    d.rectangle((160, 772, 396, 812), fill=QUIZ_BG)
    text(d, 'ARE YOU A NOOB OR A SCRUB?', 166, 750, BIG, CYAN, shadow=(0, 60, 80))
    for i, line in enumerate(('A TOTALLY SCIENTIFIC', '(PROBABLY) TEST TO', 'DETERMINE YOUR FATE.')):
        text(d, line, 278 - width(line, SMALL) // 2, 775 + i * 13, SMALL, PALE)
    d.rectangle((166, 816, 384, 870), fill=QUIZ_BG)
    d.rectangle((172, 822, 378, 864), fill=CYAN)
    d.rectangle((176, 826, 374, 860), fill=(6, 34, 50))
    d.rectangle((176, 856, 374, 860), fill=(3, 24, 38))
    label = 'TAKE THE QUIZ >'
    text(d, label, 275 - width(label, BIG) // 2, 836, BIG, CYAN, shadow=(0, 60, 80))
    d.rectangle((396, 774, 550, 874), fill=QUIZ_BG)
    for i, item in enumerate(('FUN QUESTIONS', 'FIND YOUR RANK', 'GET A TITLE', 'BRAG TO FRIENDS')):
        y = 781 + i * 24
        d.rectangle((400, y - 4, 417, y + 13), fill=MIST)
        d.rectangle((402, y - 2, 415, y + 11), fill=(6, 34, 50))
        for a, b in ((404, y + 4), (406, y + 6), (408, y + 4), (410, y + 2), (412, y)):
            d.rectangle((a, b, a + 1, b + 3), fill=(124, 214, 84))
        text(d, item, 428, y, SMALL, PALE)

    # patch notes; the goose in the corner is left alone
    d.rectangle((1314, 744, 1452, 770), fill=PATCH_BG)
    d.rectangle((1536, 744, 1606, 770), fill=PATCH_BG)
    d.rectangle((1314, 776, 1612, 820), fill=PATCH_BG)
    d.rectangle((1314, 820, 1584, 868), fill=PATCH_BG)
    text(d, 'PATCH NOTES', 1318, 750, BIG, GOLD, shadow=(90, 50, 10))
    text(d, 'V0.9.4', 1600 - width('V0.9.4', SMALL), 753, SMALL, GOLD)
    notes = (('MAR 12', 'NEW BIOME IN ANDROMEDAS!'), ('FEB 28', 'WEAPON PROTOTYPE #9: SILLY.'),
             ('FEB 14', 'BALANCE? NEVER HEARD.'), ('JAN 30', 'MORE GEESE. ALWAYS.'))
    for i, (date, note) in enumerate(notes):
        y = 781 + i * 24
        text(d, date, 1318, y, SMALL, GOLD)
        text(d, note, 1380, y, SMALL, PALE)
        if i < 3:
            d.rectangle((1318, y + 16, 1600 if i < 2 else 1580, y + 17), fill=(12, 30, 48))

    page.save(OUT, optimize=True)
    print('wrote', OUT, page.size)


if __name__ == '__main__':
    build()
