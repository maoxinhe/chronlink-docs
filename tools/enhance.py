#!/usr/bin/env python3
"""把「注意…」这类单行提醒升级成提示卡片，并给关键句加高亮。"""
import glob
import re

CARD = re.compile(r'^(?:\*\*)?(?:注意|⚠️)\s*[:：，]?\s*(.*)$')


def is_standalone(line):
    s = line.strip()
    if not s:
        return False
    if s.startswith(('-', '*', '|', '#', '>', ':::', '```')):
        return False
    return True


HL = [
    ('离线账户进不了开启“正版验证”的服务器', '离线账户进不了开启“正版验证”的服务器'),
]

RULES = [
    # (原文, 高亮后)
    ('目前 ChronLink 只发布 **Windows** 版本', '目前 ChronLink 只发布 ==**Windows**== 版本'),
    ('每个安装包旁边都有一份同名的 `.sig` 文件', '每个安装包旁边都有一份同名的 ==`.sig`== 文件'),
    ('你的实例就得用什么版本/模组', '你的实例就==得用什么版本/模组=='),
    ('正版验证', '==正版验证=='),
    ('游戏版本 + 加载器', '==游戏版本 + 加载器=='),
    ('更新不会动你的任何数据', '更新==不会动你的任何数据=='),
    ('完全不用管', '==完全不用管=='),
    ('.minecraft文件夹', '==.minecraft文件夹=='),
    ('内存与存储空间的区别', '==内存与存储空间的区别=='),
]


def process(path):
    src = open(path, encoding='utf-8').read()
    lines = src.split('\n')
    out = []
    i = 0
    changed = False
    while i < len(lines):
        ln = lines[i]
        m = CARD.match(ln.strip())
        if m and is_standalone(ln) and len(ln.strip()) > 8:
            body = m.group(1).strip().rstrip('*').strip()
            if not body:
                i += 1
                continue
            # 去掉行尾残留的 **
            out.append('::: warning 注意')
            out.append('')
            out.append(body)
            out.append(':::')
            changed = True
            i += 1
            continue
        out.append(ln)
        i += 1
    text = '\n'.join(out)
    for a, b in RULES:
        text = text.replace(a, b)
    if changed or text != src:
        open(path, 'w', encoding='utf-8').write(text)
        return True
    return False


for f in glob.glob('docs/docs/**/*.md', recursive=True) + glob.glob('docs/en/docs/**/*.md', recursive=True):
    if process(f):
        print('updated', f)
