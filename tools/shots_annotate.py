from PIL import Image, ImageDraw, ImageFont

SRC = 'docs/.vuepress/public/shots'
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
PINK = (214, 84, 141)
W, H = 1600, 900

def pill(d, xy, text, size=26):
    f = ImageFont.truetype(FONT, size, index=0)
    x, y = xy
    tw = d.textlength(text, font=f)
    x = max(12, min(x, W - tw - 40))
    pad_x, pad_y = 16, 10
    box = (x, y, x + tw + pad_x * 2, y + size + pad_y * 2)
    d.rounded_rectangle(box, radius=(size + pad_y * 2) // 2, fill=PINK)
    d.text((x + pad_x, y + pad_y - 3), text, font=f, fill='white')
    return box

def ring(d, center, rx, ry, width=6, color=(255, 45, 120)):
    x, y = center
    d.ellipse((x - rx, y - ry, x + rx, y + ry), outline=color, width=width)

def badge(d, xy, num, r=22, color=(255, 45, 120)):
    f = ImageFont.truetype(FONT, int(r * 1.15), index=0)
    x, y = xy
    d.ellipse((x - r, y - r, x + r, y + r), fill=color)
    tw = d.textlength(num, font=f)
    d.text((x - tw / 2, y - r * 1.05), num, font=f, fill='white')

def leader(d, label_box, target, color=(255, 45, 120, 255)):
    lx = (label_box[0] + label_box[2]) / 2
    ly = label_box[1] if target[1] < label_box[1] else label_box[3]
    d.line((lx, ly, target[0], target[1]), fill=color, width=3)

def make(name, marks, out, pad_bottom=0):
    im = Image.open(f'{SRC}/{name}.webp').convert('RGB')
    if pad_bottom:
        bg = im.getpixel((5, im.height - 5))
        canvas = Image.new('RGB', (im.width, im.height + pad_bottom), bg)
        canvas.paste(im, (0, 0))
        im = canvas
    d = ImageDraw.Draw(im, 'RGBA')
    for m in marks:
        c = m['at']; rx, ry = m['r']
        ring(d, c, rx, ry, color=(255, 45, 120, 255))
        if m.get('badge'):
            badge(d, m['badge'], m['num'])
    im.save(out, 'WEBP', quality=86, method=6)
    print('saved', out, im.size)

OUT = 'docs/.vuepress/public/shots'

make('browse', [
    {'at': (1275, 225), 'r': (46, 24), 'num': '1', 'badge': (1170, 200)},
], f'{OUT}/gui-browse-install.webp')

make('library', [
    {'at': (1262, 124), 'r': (58, 24), 'num': '1', 'badge': (1310, 172)},
], f'{OUT}/gui-create-instance.webp')

make('instance', [
    {'at': (1202, 74), 'r': (66, 26), 'num': '1', 'badge': (1255, 132)},
    {'at': (100, 146), 'r': (42, 20), 'num': '2', 'badge': (52, 105)},
], f'{OUT}/gui-instance-start.webp')

make('settings', [
    {'at': (120, 450), 'r': (76, 16), 'num': '1', 'badge': (62, 428)},
], f'{OUT}/gui-settings-java.webp')
