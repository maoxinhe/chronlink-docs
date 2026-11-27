#!/usr/bin/env python3
"""扫描 docs/docs/**/*.md，按 H2/H3 切块，生成 AI 助手用的检索索引 docs/.vuepress/public/docs-index.json"""
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs' / 'docs'
OUT = ROOT / 'docs' / '.vuepress' / 'public' / 'docs-index.json'

clean_re = [
    (re.compile(r'```.*?```', re.S), ' '),
    (re.compile(r'`([^`]*)`'), r'\1'),
    (re.compile(r'!\[[^\]]*\]\([^)]*\)'), ' '),
    (re.compile(r'\[([^\]]*)\]\([^)]*\)'), r'\1'),
    (re.compile(r'<[^>]+>'), ' '),
    (re.compile(r'^:::+.*$', re.M), ' '),
    (re.compile(r'^#{1,6}\s*', re.M), ''),
    (re.compile(r'[*>|-]'), ' '),
]


def plain(md: str) -> str:
    for pat, rep in clean_re:
        md = pat.sub(rep, md)
    md = re.sub(r'\s+', ' ', md)
    return md.strip()


def parse(path: Path):
    raw = path.read_text(encoding='utf-8')
    fm = {}
    body = raw
    if raw.startswith('---'):
        end = raw.find('\n---', 3)
        head = raw[3:end]
        body = raw[end + 4:]
        for line in head.splitlines():
            if ':' in line:
                k, v = line.split(':', 1)
                fm[k.strip()] = v.strip().strip('"\'')
    title = fm.get('title') or path.stem
    permalink = fm.get('permalink')
    if not permalink:
        rel = path.relative_to(SRC).with_suffix('')
        permalink = f'/docs/{rel}.html'
    sections = []
    cur_h = ''
    buf = []
    for line in body.splitlines():
        m = re.match(r'^(#{2,3})\s+(.*)$', line)
        if m:
            if buf and any(x.strip() for x in buf):
                sections.append((cur_h, '\n'.join(buf)))
            cur_h = m.group(2).strip()
            buf = []
        else:
            buf.append(line)
    if buf and any(x.strip() for x in buf):
        sections.append((cur_h, '\n'.join(buf)))
    if not sections:
        sections = [('', body)]
    out = []
    for h, text in sections:
        t = plain(text)
        if len(t) < 20:
            continue
        out.append({
            'title': title,
            'heading': h,
            'url': permalink,
            'text': t[:700],
        })
    return out


def anchor(h: str) -> str:
    s = h.strip().lower()
    s = re.sub(r'[^\w\u4e00-\u9fa5\s-]', '', s)
    s = re.sub(r'\s+', '-', s)
    return s


def main():
    data = []
    for path in sorted(SRC.rglob('*.md')):
        try:
            data.extend(parse(path))
        except Exception as e:
            print(f'skip {path}: {e}')
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
    print(f'{len(data)} 块 -> {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
