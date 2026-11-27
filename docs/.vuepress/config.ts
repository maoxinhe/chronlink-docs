import { defineUserConfig } from 'vuepress'
import { viteBundler } from '@vuepress/bundler-vite'
import { plumeTheme } from 'vuepress-theme-plume'

const start = ['getting-started.md', 'installation.md', 'sign-in.md', 'first-launch.md', 'first-world.md']
const instance = [
  'interface.md',
  'what-is-instance.md',
  'create-instance.md',
  'manage-instances.md',
  'instance-details.md',
  'instance-transfer.md',
  'settings.md',
]
const content = [
  'content-center.md',
  'browse-search.md',
  'install-content.md',
  'modpacks.md',
  'project-details.md',
  'mod-translation.md',
]
const online = ['skins.md', 'change-skin.md', 'gradient-text.md', 'multiplayer.md', 'join-server.md']
const lab = ['lab.md', 'lab-guide.md', 'seed-map.md', 'projection-preview.md', 'recipe-generator.md']
const more = ['faq.md', 'contributing.md']
const tools = ['assistant.md', 'resources.md']
const troubleshoot = ['windows.md', 'java.md', 'crash.md', 'multiplayer.md']

export default defineUserConfig({
  lang: 'zh-CN',
  title: '竹络 | ChronLink',
  description: '竹络 ChronLink 使用手册：安装、实例管理、内容中心、皮肤与联机、实验室。',
  base: process.env.DOCS_BASE || '/',
  bundler: viteBundler(),
  head: [
    ['link', { rel: 'icon', href: '/logo.png' }],
  ],
  theme: plumeTheme({
    hostname: 'https://help.camzy.tech/',
    logo: '/logo.png',
    docsRepo: 'https://github.com/maoxinhe/chronlink-docs',
    docsBranch: 'main',
    docsDir: 'docs',
    editLink: true,
    lastUpdated: true,
    contributors: { mode: 'block' },
    changelog: true,
    copyright: { license: 'CC-BY-4.0', author: { name: '猫星河', url: 'https://launcher.camzy.tech' }, creation: 'original' },
    footer: {
      message: '文档随版本更新，发现问题欢迎到 GitHub 提 Issue。',
      copyright: 'Copyright © 2026 竹络 ChronLink',
    },
    bulletin: {
      id: 'docs-wip',
      title: '文档持续补齐中',
      content: '部分页面还在补截图与细节，发现缺漏可以直接在仓库提 Issue。',
      lifetime: 'once',
      layout: 'bottom-right',
      enablePage: (page: any) => page.path === '/' || page.path === '/en/',
    },
    sidebarMenuLabel: '菜单',
    contributorsText: '贡献者',
    changelogText: '更新日志',
    changelogOnText: '于',
    changelogButtonText: '查看全部更新',
    editLinkText: '编辑此页',
    lastUpdatedText: '最近更新',
    copyrightText: '版权所有',
    copyrightAuthorText: '版权归属',
    copyrightLicenseText: '许可证',
    returnToTopLabel: '回到顶部',
    appearanceText: '外观',
    search: { provider: 'local' },
    autoFrontmatter: false,
    outline: [2, 3],
    navbar: [
      { text: '首页', link: '/' },
      {
        text: '文档',
        prefix: '/docs/',
        items: [
          { text: '快速开始', prefix: '/docs/start/', items: ['getting-started.md', 'installation.md'] },
          { text: '界面与实例', prefix: '/docs/instance/', items: ['interface.md', 'what-is-instance.md'] },
          { text: '内容与模组', prefix: '/docs/content/', items: ['content-center.md', 'install-content.md'] },
          { text: '皮肤与联机', prefix: '/docs/online/', items: ['skins.md', 'multiplayer.md'] },
          { text: '实验室', prefix: '/docs/lab/', items: ['lab.md', 'seed-map.md'] },
          { text: 'AI 助手', link: '/ai/' },
          { text: '故障排查', prefix: '/docs/troubleshoot/', items: ['windows.md', 'java.md', 'crash.md'] },
          { text: '常见问题', link: '/docs/more/faq.md' },
        ],
      },
      { text: '下载', link: 'https://launcher.camzy.tech/' },
      { text: 'GitHub', link: 'https://github.com/maoxinhe/ChronLink', icon: 'github' },
    ],
    sidebar: {
      '/docs/': [
        { text: '助手与工具', prefix: '/docs/tools/', collapsed: false, items: tools },
        { text: '快速开始', prefix: '/docs/start/', collapsed: false, items: start },
        { text: '界面与实例', prefix: '/docs/instance/', collapsed: false, items: instance },
        { text: '内容与模组', prefix: '/docs/content/', collapsed: false, items: content },
        { text: '皮肤与联机', prefix: '/docs/online/', collapsed: false, items: online },
        { text: '实验室', prefix: '/docs/lab/', collapsed: false, items: lab },
        { text: '故障排查', prefix: '/docs/troubleshoot/', collapsed: false, items: troubleshoot },
        { text: '其他', prefix: '/docs/more/', collapsed: false, items: more },
      ],
    },
  }),
})
