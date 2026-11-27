#!/usr/bin/env python3
"""把文档里的原生 HTML 表格等收拾成 VuePress 能编译的 Markdown。"""
import glob
import re

CELL = re.compile(r'<t[dh][^>]*>(.*?)</t[dh]>', re.S)
ROW = re.compile(r'<tr>(.*?)</tr>', re.S)
TABLE = re.compile(r'<table>(.*?)</table>', re.S)


def inline_tags(s):
    s = re.sub(r'<code>(.*?)</code>', lambda m: '`' + m.group(1).strip() + '`', s, flags=re.S)
    s = re.sub(r'<strong>(.*?)</strong>', lambda m: '**' + m.group(1).strip() + '**', s, flags=re.S)
    s = re.sub(r'<br\s*/?>', ' ', s)
    s = re.sub(r'<li>(.*?)</li>', lambda m: '- ' + m.group(1).strip(), s, flags=re.S)
    s = re.sub(r'<[^>]+>', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s.replace('|', '\\|')


def table_to_md(m):
    body = m.group(1)
    rows = [CELL.findall(r) for r in ROW.findall(body)]
    rows = [r for r in rows if r]
    if not rows:
        return ''
    width = max(len(r) for r in rows)
    out = []
    header = [inline_tags(c) for c in rows[0]] + [''] * (width - len(rows[0]))
    out.append('| ' + ' | '.join(header) + ' |')
    out.append('|' + '|'.join(['---'] * width) + '|')
    for r in rows[1:]:
        cells = [inline_tags(c) for c in r] + [''] * (width - len(r))
        out.append('| ' + ' | '.join(cells) + ' |')
    return '\n'.join(out) + '\n'


def clean(text):
    text = TABLE.sub(table_to_md, text)
    # 剩余 HTML 标签转义或删除
    text = re.sub(r'</?(?:p|div|span|tbody|thead|center|font|section)[^>]*>', '\n', text)
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'<(?:u|em|i|b)>(.*?)</(?:u|em|i|b)>', lambda m: '*' + m.group(1) + '*', text, flags=re.S)
    text = re.sub(r'<(img[^>]*?)>', r'\1', text)
    # 多余 H1 降为 H2（标题行已由 transform 处理）
    lines = text.split('\n')
    seen_h1 = False
    out = []
    for ln in lines:
        if re.match(r'^# ', ln):
            if seen_h1:
                ln = '## ' + ln[2:].strip()
            else:
                seen_h1 = True
        out.append(ln)
    text = '\n'.join(out)
    text = text.replace('美西螈启动器', 'ChronLink 启动器').replace('美西螈', 'ChronLink')
    text = text.replace('AXL', 'ChronLink')
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text


for path in glob.glob('docs/docs/**/*.md', recursive=True) + glob.glob('docs/en/docs/**/*.md', recursive=True):
    raw = open(path, encoding='utf-8').read()
    new = clean(raw)
    if new != raw:
        open(path, 'w', encoding='utf-8').write(new)
        print('sanitized', path)
