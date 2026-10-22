#!/usr/bin/env python3
"""Builds the three game cards on the homepage from real gameplay frames.

Each card's chrome is drawn on a small pixel grid, and a real game frame is set
into it at the game's native resolution. The result is exported at 2x for sharp
screens. The frames in art-src/cards/ are untouched captures from the
games themselves, and the lettering uses Crazy Weapon Man's 5x7 bitmap font.

    python3 tools/build-cards.py
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'art-src' / 'cards'
OUT = ROOT / 'public' / 'img' / 'cards'
SCALE = 2
GLYPHS = json.loads((SRC / 'font-5x7.json').read_text())

INK = (26, 20, 40)
WIN_W, WIN_H = 238, 106  # gameplay window, in card grid pixels


def hexc(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def text_width(s, k=1):
    return sum((len(GLYPHS.get(ch, GLYPHS[' '])[0]) + 1) * k for ch in s) - k


def draw_text(img, s, x, y, k, fill, fill_low=None, outline=None, shadow=None):
    """Bitmap text. fill_low shades the lower rows; outline and shadow are 1 grid pixel."""
    px = img.load()
    W, H = img.size
    cells = []
    cx = x
    for ch in s:
        g = GLYPHS.get(ch, GLYPHS[' '])
        for r, row in enumerate(g):
            for c, v in enumerate(row):
                if v == '#':
                    for dy in range(k):
                        for dx in range(k):
                            cells.append((cx + c * k + dx, y + r * k + dy, r))
        cx += (len(g[0]) + 1) * k
    on = {(a, b) for a, b, _ in cells}

    def put(a, b, col):
        if 0 <= a < W and 0 <= b < H:
            px[a, b] = col
    if shadow:
        for a, b, _ in cells:
            for d in ((1, 1), (0, 1), (1, 2), (0, 2)):
                if (a + d[0], b + d[1]) not in on:
                    put(a + d[0], b + d[1], shadow)
    if outline:
        for a, b, _ in cells:
            for d in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, -1), (-1, 1), (1, 1)):
                if (a + d[0], b + d[1]) not in on:
                    put(a + d[0], b + d[1], outline)
    for a, b, r in cells:
        put(a, b, fill_low if fill_low and r >= 4 else fill)


def bevel(d, x0, y0, x1, y1, face, light, dark):
    d.rectangle((x0, y0, x1, y1), fill=face)
    d.line((x0, y0, x1, y0), fill=light)
    d.line((x0, y0, x0, y1), fill=light)
    d.line((x0, y1, x1, y1), fill=dark)
    d.line((x1, y0, x1, y1), fill=dark)


def card(c):
    W, H = c['w'], 212
    img = Image.new('RGB', (W, H), INK)
    d = ImageDraw.Draw(img)
    rim, rim_l, rim_d = hexc(c['rim']), hexc(c['rim_light']), hexc(c['rim_dark'])
    panel = hexc(c['panel'])

    # frame: ink edge, bevelled rim, ink inner line, flat panel
    bevel(d, 1, 1, W - 2, H - 2, rim, rim_l, rim_d)
    d.rectangle((4, 4, W - 5, H - 5), fill=INK)
    d.rectangle((5, 5, W - 6, H - 6), fill=panel)
    for (x, y) in ((2, 2), (W - 4, 2), (2, H - 4), (W - 4, H - 4)):
        d.rectangle((x, y, x + 1, y + 1), fill=rim_d)
        img.putpixel((x, y), rim_l)

    # title and genre line
    t = c['title']
    tw = text_width(t, 2)
    draw_text(img, t, (W - tw) // 2, 9, 2, hexc(c['title_hi']), hexc(c['title_lo']),
              outline=INK, shadow=hexc(c['title_shadow']))
    g = c['genre']
    draw_text(img, g, (W - text_width(g)) // 2, 29, 1, hexc(c['genre_col']))

    # gameplay window frame (the frame itself goes in after the 2x step)
    ax0 = (W - WIN_W) // 2 - 1
    ax1, ay0, ay1 = ax0 + WIN_W + 1, 40, 41 + WIN_H
    d.rectangle((ax0 - 1, ay0 - 1, ax1 + 1, ay1 + 1), fill=rim_l)
    d.rectangle((ax0, ay0, ax1, ay1), fill=INK)

    # play button where the page's play hotspot sits (71-86% down, middle half)
    bx0, bx1 = round(W * c['play'][0]), round(W * c['play'][1])
    by0, by1 = 152, 180
    btn, btn_l, btn_d = hexc(c['btn']), hexc(c['btn_light']), hexc(c['btn_dark'])
    d.rectangle((bx0 - 1, by0 - 1, bx1 + 1, by1 + 3), fill=INK)
    d.rectangle((bx0, by0, bx1, by1 + 2), fill=btn_d)
    d.rectangle((bx0, by0, bx1, by1), fill=btn)
    d.line((bx0 + 1, by0 + 1, bx1 - 1, by0 + 1), fill=btn_l)
    d.line((bx0 + 1, by0 + 1, bx0 + 1, by1 - 1), fill=btn_l)
    label = 'PLAY'
    lw = text_width(label, 2)
    tri = 7
    gx = (bx0 + bx1 - (lw + tri + 6)) // 2
    gy = (by0 + by1) // 2 - 7
    for i in range(tri):
        d.line((gx + i, gy + i, gx + i, gy + 13 - i), fill=hexc(c['btn_text']))
    draw_text(img, label, gx + tri + 6, gy, 2, hexc(c['btn_text']), outline=None, shadow=btn_d)

    # feature tags, on the page's "about this game" hotspot
    tags = c['tags']
    ty = 192
    tw = sum(text_width(s) + 10 for s in tags) - 4
    x = (W - tw) // 2
    for s in tags:
        w = text_width(s)
        d.rectangle((x - 3, ty - 3, x + w + 2, ty + 9), fill=hexc(c['tag_bg']))
        d.rectangle((x - 3, ty + 10, x + w + 2, ty + 10), fill=INK)
        draw_text(img, s, x, ty, 1, hexc(c['tag_fg']))
        x += w + 10

    # the card chrome is drawn at 2 page pixels per grid pixel, and the game
    # frame drops in at its own native resolution, one game pixel per page pixel
    img = img.resize((W * 2, H * 2), Image.NEAREST)
    shot = Image.open(SRC / c['frame']).convert('RGB')
    fx, fy = c['crop']
    img.paste(shot.crop((fx, fy, fx + WIN_W * 2, fy + WIN_H * 2)), ((ax0 + 1) * 2, (ay0 + 1) * 2))
    return img


CARDS = [
    dict(name='siege-of-legends', w=260, frame='siege-of-legends.png', crop=(2, 58),
         title='SIEGE OF LEGENDS', genre='CASTLE DEFENSE AUTO-BATTLER',
         panel='#2a1a26', rim='#8a4f22', rim_light='#c9a66b', rim_dark='#5d2f14',
         title_hi='#ffe08a', title_lo='#f08a2c', title_shadow='#7a1f2b', genre_col='#f4c9a8',
         btn='#c4363e', btn_light='#f06a52', btn_dark='#7a1f2b', btn_text='#f8e08e',
         play=(.247, .79), tags=['12 CASTLES', 'CHAMPIONS', '1 GOOSE'], tag_bg='#4a2a36', tag_fg='#f8e08e'),
    dict(name='andromedas', w=260, frame='andromedas.png', crop=(1, 92),
         title='ANDROMEDAS', genre='ASTEROID MINING STRATEGY',
         panel='#141c3d', rim='#3e4f8a', rim_light='#7f9ad8', rim_dark='#1d2b6b',
         title_hi='#ffd84a', title_lo='#ffb02e', title_shadow='#c4501f', genre_col='#a8dcfd',
         btn='#2f8fd0', btn_light='#7fd0ff', btn_dark='#1d2b6b', btn_text='#f4f1e8',
         play=(.27, .72), tags=['MINE', 'BUILD', '4 CREWS', 'CO-OP'], tag_bg='#22306a', tag_fg='#a8dcfd'),
    dict(name='crazy-weapon-man', w=269, frame='crazy-weapon-man.png', crop=(2, 22),
         title='CRAZY WEAPON MAN', genre='WEAPON-FUELED ACTION ROGUELIKE',
         panel='#2b2442', rim='#7a4bc2', rim_light='#c39bff', rim_dark='#22107f',
         title_hi='#ffc15a', title_lo='#f06a52', title_shadow='#22107f', genre_col='#ffb3d9',
         btn='#f08a2c', btn_light='#ffc15a', btn_dark='#c4501f', btn_text='#1a1428',
         play=(.24, .736), tags=['ABSURD WEAPONS', 'BOSSES', 'WAR GOOSE'], tag_bg='#3e3a5c', tag_fg='#f8e08e'),
]

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for c in CARDS:
        im = card(c)
        im.resize((im.width * SCALE, im.height * SCALE), Image.NEAREST).save(OUT / (c['name'] + '.png'), optimize=True)
        print('wrote', OUT / (c['name'] + '.png'))
        # the full frame, for the game's preview window
        Image.open(SRC / c['frame']).convert('RGB').save(OUT / (c['name'] + '-frame.png'), optimize=True)
