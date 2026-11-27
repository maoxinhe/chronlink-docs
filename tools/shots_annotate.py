from PIL import Image, ImageDraw, ImageFont
import math

SRC = 'docs/.vuepress/public/shots'
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
OUT = 'docs/.vuepress/public/shots'
PINK = (255, 45, 120)

def label(d, xy, text, size=24, anchor='lm'):
    f = ImageFont.truetype(FONT, size, index=0)
    x, y = xy
    # 白色描边，压在任何背景上都读得清，又不遮挡
    for dx in (-2, 0, 2):
        for dy in (-2, 0, 2):
            d.text((x + dx, y + dy), text, font=f, fill=(255, 255, 255))
    d.text((x, y), text, font=f, fill=PINK)

def arrow(d, start, end, width=5, head=16):
    sx, sy = start; ex, ey = end
    ang = math.atan2(ey - sy, ex - sx)
    # 留出箭头长度，别把箭头插到元素中心
    bx, by = ex - math.cos(ang) * head, ey - math.sin(ang) * head
    d.line((sx, sy, bx, by), fill=PINK, width=width)
    p1 = (ex, ey)
    p2 = (ex - head * math.cos(ang - 0.42), ey - head * math.sin(ang - 0.42))
    p3 = (ex - head * math.cos(ang + 0.42), ey - head * math.sin(ang + 0.42))
    d.polygon([p1, p2, p3], fill=PINK)

def make(name, marks, out, pad_bottom=0):
    im = Image.open(f'{SRC}/{name}.webp').convert('RGB')
    if pad_bottom:
        bg = im.getpixel((5, im.height - 5))
        canvas = Image.new('RGB', (im.width, im.height + pad_bottom), bg)
        canvas.paste(im, (0, 0)); im = canvas
    d = ImageDraw.Draw(im, 'RGBA')
    for m in marks:
        label(d, m['text_at'], m['text'], anchor=m.get('anchor', 'lm'))
        arrow(d, m['from'], m['to'], width=m.get('w', 5))
    im.save(out, 'WEBP', quality=86, method=6)
    print('saved', out)

make('browse', [
    {'text': '点「安装」', 'text_at': (1000, 226), 'from': (1135, 228), 'to': (1250, 228)},
], f'{OUT}/gui-browse-install.webp')

make('browse', [
    {'text': '排序方式', 'text_at': (250, 112), 'from': (350, 128), 'to': (178, 144)},
    {'text': '按类别筛', 'text_at': (1450, 168), 'from': (1450, 150), 'to': (1450, 112)},
], f'{OUT}/gui-browse-filter.webp')

make('library', [
    {'text': '创建新实例', 'text_at': (1010, 78), 'from': (1160, 96), 'to': (1232, 116)},
], f'{OUT}/gui-create-instance.webp')

make('library', [
    {'text': '排序 / 分组 / 视图', 'text_at': (300, 200), 'from': (330, 186), 'to': (168, 172)},
], f'{OUT}/gui-library-manage.webp')

make('instance', [
    {'text': '开始游戏', 'text_at': (960, 108), 'from': (1108, 96), 'to': (1168, 88)},
], f'{OUT}/gui-instance-start.webp')

make('instance', [
    {'text': '文件', 'text_at': (330, 196), 'from': (312, 182), 'to': (242, 158)},
    {'text': '日志', 'text_at': (770, 196), 'from': (752, 182), 'to': (676, 158)},
], f'{OUT}/gui-instance-files.webp')

make('settings', [
    {'text': 'Java 与性能', 'text_at': (360, 452), 'from': (300, 452), 'to': (206, 452)},
], f'{OUT}/gui-settings-java.webp')

make('settings', [
    {'text': '首选下载源', 'text_at': (1010, 524), 'from': (1170, 500), 'to': (1268, 488)},
], f'{OUT}/gui-settings-download.webp')

make('home', [
    {'text': '开始游戏', 'text_at': (250, 250), 'from': (250, 272), 'to': (186, 296)},
    {'text': '换实例', 'text_at': (392, 250), 'from': (392, 272), 'to': (312, 296)},
], f'{OUT}/gui-home-start.webp')

make('multiplayer', [
    {'text': '启动联机', 'text_at': (300, 306), 'from': (280, 292), 'to': (180, 282)},
    {'text': '切换联机方案', 'text_at': (1120, 222), 'from': (1160, 208), 'to': (1186, 176)},
    {'text': '服务器列表', 'text_at': (300, 74), 'from': (280, 88), 'to': (228, 110)},
], f'{OUT}/gui-multiplayer.webp')

make('skins', [
    {'text': '创建皮肤', 'text_at': (1090, 142), 'from': (1160, 124), 'to': (1244, 92)},
    {'text': '查找玩家皮肤', 'text_at': (880, 142), 'from': (960, 122), 'to': (1088, 92)},
    {'text': '添加 / 拖入皮肤', 'text_at': (640, 300), 'from': (620, 288), 'to': (566, 268)},
], f'{OUT}/gui-skins.webp')

make('lab', [
    {'text': '进入工具', 'text_at': (1140, 306), 'from': (1220, 292), 'to': (1272, 272)},
    {'text': '按类型筛选', 'text_at': (930, 196), 'from': (1030, 180), 'to': (1082, 156)},
], f'{OUT}/gui-lab.webp')
