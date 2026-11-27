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

def make(name, marks, out):
    im = Image.open(f'{SRC}/{name}.webp').convert('RGB')
    d = ImageDraw.Draw(im, 'RGBA')
    for m in marks:
        c = m['at']; rx, ry = m['r']
        ring(d, c, rx, ry, color=(255, 45, 120, 255))
        pill(d, (m['lx'], m['ly']), m['label'])
    im.save(out, 'WEBP', quality=86, method=6)
    print('saved', out, im.size)

OUT = 'docs/.vuepress/public/shots'

# 1. 发现内容：安装按钮
make('browse', [
    {'at': (1275, 225), 'r': (48, 26), 'label': '① 点「安装」', 'lx': 1140, 'ly': 300},
], f'{OUT}/gui-browse-install.webp')

# 2. 游戏库：创建实例
make('library', [
    {'at': (1262, 124), 'r': (62, 26), 'label': '① 点「创建新实例」', 'lx': 1010, 'ly': 165},
], f'{OUT}/gui-create-instance.webp')

# 3. 实例详情：启动 + 内容
make('instance', [
    {'at': (1202, 74), 'r': (70, 28), 'label': '① 点「开始游戏」', 'lx': 900, 'ly': 112},
    {'at': (100, 146), 'r': (44, 22), 'label': '② 内容页：装模组/资源包', 'lx': 210, 'ly': 190},
], f'{OUT}/gui-instance-start.webp')

# 4. 设置：Java 与性能
make('settings', [
    {'at': (66, 450), 'r': (58, 20), 'label': '① 选「Java 与性能」', 'lx': 300, 'ly': 424},
], f'{OUT}/gui-settings-java.webp')
