#!/usr/bin/env python3
"""把 axlmc.org 的 Markdown 源整理成 ChronLink 文档站内容。

- 清理上游 frontmatter / llms.txt 行 / 末尾 Sitemap 段落
- 品牌替换：Axolotl -> ChronLink
- 内部链接重写成本站相对路径
- 按章节落到 docs/<sec>/<slug>.md
"""
import os
import re
import shutil
import posixpath

SRC = '/home/user/Doubao/chats/38455282480390914/axlmc-docs'
OUT = '/home/user/Doubao/chats/38455282480390914/chronlink-docs-site/docs'

# slug -> (section, order, sidebar title override or None)
PLAN = {
    'getting-started': ('start', 1, '欢迎使用 ChronLink'),
    'installation': ('start', 2, '安装与更新'),
    'sign-in': ('start', 3, '登录账户'),
    'first-launch': ('start', 4, '快速上手'),
    'first-world': ('start', 5, '创建新世界'),
    'interface': ('instance', 1, '游戏库与实例'),
    'what-is-instance': ('instance', 2, '什么是实例'),
    'create-instance': ('instance', 3, '创建实例'),
    'manage-instances': ('instance', 4, '管理实例'),
    'instance-details': ('instance', 5, '实例详情页'),
    'instance-transfer': ('instance', 6, '实例导入与导出'),
    'settings': ('instance', 7, '设置详解'),
    'content-center': ('content', 1, '内容中心'),
    'browse-search': ('content', 2, '浏览与搜索'),
    'install-content': ('content', 3, '安装内容'),
    'modpacks': ('content', 4, '模组与整合包'),
    'project-details': ('content', 5, '项目详情页'),
    'mod-translation': ('content', 6, '模组翻译'),
    'skins': ('online', 1, '皮肤与个性化'),
    'change-skin': ('online', 2, '正版换肤'),
    'gradient-text': ('online', 3, '渐变文字'),
    'multiplayer': ('online', 4, '多人游戏'),
    'join-server': ('online', 5, '联机与服务端'),
    'lab': ('lab', 1, '实验室'),
    'lab-guide': ('lab', 2, '实验室功能详解'),
    'seed-map': ('lab', 3, '种子地图'),
    'projection-preview': ('lab', 4, '投影预览'),
    'recipe-generator': ('lab', 5, '配方生成器'),
    'faq': ('more', 1, '常见问题'),
    'contributing': ('more', 2, '支持与贡献'),
}
# 上游重复页，不入站
SKIP = {'install-update', 'index'}

SECTIONS = {
    'start': '快速开始',
    'instance': '界面与实例',
    'content': '内容与模组',
    'online': '皮肤与联机',
    'lab': '实验室',
    'more': '其他',
}

LINK_MAP = {slug: f'/docs/{sec}/{slug}.md' for slug, (sec, _, _) in PLAN.items()}


def split_front(text):
    if not text.startswith('---'):
        return {}, text
    end = text.find('\n---', 3)
    if end < 0:
        return {}, text
    fm_raw = text[3:end]
    body = text[end + 4:]
    fm = {}
    for line in fm_raw.splitlines():
        m = re.match(r'^([a-z_]+):\s*(.*)$', line.strip())
        if m:
            fm[m.group(1)] = m.group(2).strip().strip('"')
    return fm, body.lstrip('\n')


def clean_body(body):
    # 去掉顶部 llms.txt 提示行
    body = re.sub(r'^> Index of every page on this site:.*?\n+', '', body)
    # 去掉整个 Sitemap 尾巴
    body = re.sub(r'\n*(?:---\s*\n+)?\*?接下来：.*?\n', '\n', body)
    body = re.split(r'\n## Sitemap', body)[0]
    # 去掉指向上游 sitemap 的行
    body = re.sub(r'^\[?sitemap\]\([^)]*\):.*\n', '', body, flags=re.M | re.I)
    body = re.sub(r'See the full \[sitemap\]\([^)]*\) for all pages\.\n?', '', body)
    return body.strip() + '\n'


def rebrand(text):
    text = text.replace('https://github.com/Mystic-Stars/Axolotl', 'https://github.com/maoxinhe/ChronLink')
    text = text.replace('https://axlmc.org/axolotl.png', '/logo.png')
    text = text.replace('Axolotl Launcher', 'ChronLink').replace('Axolotl', 'ChronLink')
    text = text.replace('axolotl-launcher', 'chronlink')
    return text


def rewrite_links(body, sec, slug, lang_prefix):
    def repl(m):
        target = m.group(1)
        tslug = target.rstrip('/').split('/')[-1]
        if tslug in SKIP:
            tslug = 'installation'
        if tslug not in LINK_MAP:
            return m.group(0)
        dest = LINK_MAP[tslug]
        cur = f'{lang_prefix}/docs/{sec}/{slug}.md'
        rel = posixpath.relpath(dest, posixpath.dirname(cur))
        return f']({rel})'
    return re.sub(r'\]\((?:https://axlmc\.org)?/docs/([^)\s#]+)', repl, body)


def build(lang, prefix):
    src_dir = os.path.join(SRC, lang)
    for slug, (sec, order, title) in sorted(PLAN.items(), key=lambda kv: (kv[1][0], kv[1][1])):
        path = os.path.join(src_dir, slug + '.md')
        if not os.path.exists(path):
            print('MISSING', path)
            continue
        raw = open(path, encoding='utf-8').read()
        fm, body = split_front(raw)
        body = clean_body(body)
        body = rebrand(body)
        body = rewrite_links(body, sec, slug, prefix)
        if title:
            body, n = re.subn(r'^(#\s+.+)$', lambda m: '# ' + title, body, count=1, flags=re.M)
            if n == 0:
                body = f'# {title}\n\n' + body
        fm_out = ['---']
        fm_out.append(f'title: "{title or fm.get("title", slug)}"')
        if fm.get('description'):
            fm_out.append(f'description: "{fm["description"]}"')
        fm_out.append(f'order: {order}')
        fm_out.append('pageLayout: doc')
        fm_out.append('---')
        header = '\n'.join(fm_out) + '\n\n'
        dst = os.path.join(OUT, prefix.strip('/'), 'docs', sec, slug + '.md')
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, 'w', encoding='utf-8').write(header + body)
        print('ok', dst.replace(OUT + '/', ''))


build('zh', '/')
build('en', '/en')
print('sections', SECTIONS)
