// 文档助手的检索与提问逻辑（与 UI 解耦，独立页面 / 后续复用都走这里）

const API_BASE = 'https://user.camzy.tech'
const API_KEY = 'ak_bA636FVtGVqWTIgY1BBYWWrcLgd-eCMr'

export type DocChunk = { title: string; heading: string; url: string; text: string }
export type Source = { title: string; url: string; kind: 'doc' | 'web' }
export type AskResult = { answer: string; sources: Source[]; covered: boolean }

let indexPromise: Promise<DocChunk[]> | null = null

export const loadIndex = () => {
  if (!indexPromise) {
    const base = (import.meta as any).env?.BASE_URL || '/'
    indexPromise = fetch(`${base}docs-index.json`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
  }
  return indexPromise
}

export const tokenize = (q: string) => {
  const tokens = new Set<string>()
  const lower = q.toLowerCase()
  for (const w of lower.match(/[a-z0-9][a-z0-9.+-]{1,}/g) || []) tokens.add(w)
  const runs = q.match(/[\u4e00-\u9fa5]{2,}/g) || []
  const STOP =
    /^(怎么|如何|什么|为什么|能不能|可以|是否|哪里|哪个|一下|问题|办法|情况|回事|请问|求助|解决|这样|那样|怎样|么样|吗|呢)$/
  for (const run of runs) {
    if (run.length <= 4) tokens.add(run)
    for (let i = 0; i < run.length - 1; i++) tokens.add(run.slice(i, i + 2))
    for (let i = 0; i < run.length - 2; i++) tokens.add(run.slice(i, i + 3))
  }
  return [...tokens].filter((t) => t.length >= 2 && !STOP.test(t)).slice(0, 40)
}

export const searchDocs = (chunks: DocChunk[], q: string) => {
  const tokens = tokenize(q)
  if (!tokens.length || !chunks.length) return { hits: [] as DocChunk[], score: 0 }

  const df = new Map<string, number>()
  for (const t of tokens) {
    let n = 0
    for (const c of chunks) {
      if (c.text.includes(t) || c.heading.includes(t) || c.title.includes(t)) n++
    }
    df.set(t, n)
  }
  const weights = new Map<string, number>()
  for (const t of tokens) {
    const n = df.get(t) || 0
    if (n > 0) weights.set(t, (1 + Math.log(chunks.length / n)) * (1 + 0.5 * (t.length - 2)))
  }
  if (!weights.size) return { hits: [] as DocChunk[], score: 0 }

  const scored = chunks.map((c) => {
    let s = 0
    let matched = 0
    for (const [t, w] of weights) {
      let hit = false
      if (c.heading.toLowerCase().includes(t)) {
        s += 4 * w
        hit = true
      }
      if (c.title.toLowerCase().includes(t)) {
        s += 6 * w
        hit = true
      }
      const n = c.text.toLowerCase().split(t).length - 1
      if (n > 0) {
        s += Math.min(n, 3) * w
        hit = true
      }
      if (hit) matched += 1
    }
    return { c, s, matched }
  })
  scored.sort((a, b) => b.s - a.s)
  const best = scored[0]
  if (!best || best.s <= 0 || best.matched < 1) return { hits: [] as DocChunk[], score: 0 }
  const hits = scored.filter((x) => x.s >= Math.max(6, best.s * 0.35)).slice(0, 6)
  return { hits: hits.map((x) => x.c), score: best.s }
}

export const searchWeb = async (q: string) => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 5000)
  try {
    const url =
      'https://zh.wikipedia.org/w/api.php?action=query&format=json&origin=*&list=search&srlimit=2&srsearch=' +
      encodeURIComponent(q.slice(0, 60))
    const resp = await fetch(url, { signal: ctrl.signal })
    const data = await resp.json()
    return (data?.query?.search || []).slice(0, 2).map((r: any) => ({
      title: String(r.title),
      url: `https://zh.wikipedia.org/wiki/${encodeURIComponent(String(r.title))}`,
      snippet: String(r.snippet || '').replace(/<[^>]+>/g, ''),
    })) as Array<{ title: string; url: string; snippet: string }>
  } catch {
    return [] as Array<{ title: string; url: string; snippet: string }>
  } finally {
    clearTimeout(timer)
  }
}

// 确定的硬事实：不做检索、不让模型自由发挥，直接给标准答案并挂原文页
const FACTS: Array<{ re: RegExp; a: string; url: string; t: string }> = [
  {
    re: /win\s?7|win\s?8|win\s?vista|xp/i,
    a: '不支持。ChronLink 依赖 WebView2，最低要 Windows 10 1809，推荐 Windows 11；Win7 / Win8 上打不开或装不上属于正常结果，没有兼容补丁。',
    url: '/docs/more/faq.html',
    t: '常见问题 · 支不支持 Win7 / Win8',
  },
  {
    re: /下载哪个文件|哪个安装包|选哪个包|下哪个/i,
    a: '按系统选：普通 Intel / AMD 电脑用 ChronLink_<版本>_x64_modern-setup.exe；骁龙 X 等 ARM 设备用 _arm64_modern-setup.exe；不想安装就下 _x64_portable.zip 解压即用。全部在 GitHub Releases。',
    url: '/docs/more/faq.html',
    t: '常见问题 · 我该下载哪个文件？',
  },
  {
    re: /便携版|免安装|绿色版/i,
    a: '在 Releases 的 Assets 里下 ChronLink_<版本>_x64_portable.zip 或 _arm64_portable.zip，解压到任意目录双击 ChronLink.exe 即用，不写注册表，删目录就卸载。',
    url: '/docs/more/faq.html',
    t: '常见问题 · 便携版在哪下载？',
  },
  {
    re: /怎么更新|如何更新|自动更新|检查更新/i,
    a: '启动器每次启动都会向云端上报版本号，云端比对后决定是否下发更新，有新版会下载并提示重启；也可以在 设置 → 更新 里手动点「检查更新」。',
    url: '/docs/more/faq.html',
    t: '常见问题 · 启动器怎么更新？',
  },
]

// 常见问法 -> 对应文档页
const INTENTS: Array<[RegExp, string]> = [
  [/win\s?7|win\s?8|win\s?10|win\s?11|系统要求|配置要求|最低配置|什么系统|支持.{0,4}系统/i, '常见问题'],
  [/杀毒|报毒|拦截|白屏|权限|无法写入|被占用|未知来源|smartscreen|virus/i, 'Windows 安装与权限问题'],
  [/java|jdk|jre|运行环境/i, 'Java 环境问题'],
  [/崩溃|闪退|打不开|启动不了|报错|日志|crash/i, '启动崩溃排查'],
  [/正版验证|离线账户|正版账户|登不上|登录失败/i, '联机与正版验证问题'],
  [/联机|开服|服务端|端口|好友|多人/i, '联机与服务端'],
  [/模组|mod|整合包|光影|资源包|材质包/i, '模组与整合包'],
  [/导入|导出|迁移|备份/i, '实例导入与导出'],
  [/安装|装好|卸载|更新|下载哪个|便携版/i, '安装与更新'],
  [/皮肤|外观|主题/i, '皮肤与个性化'],
  [/实例|整合包进不去/i, '管理实例'],
]

export const callApi = async (endpoint: '/chat' | '/vision', payload: Record<string, unknown>) => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 25000)
  let resp: Response
  try {
    resp = await fetch(`${API_BASE}/api/user/ai${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    })
  } catch (e: any) {
    throw new Error(e?.name === 'AbortError' ? '接口超时了，稍后再试一次' : '网络连不上助手接口')
  } finally {
    clearTimeout(timer)
  }
  let data: any = {}
  try {
    data = await resp.json()
  } catch {}
  if (!resp.ok || !data.ok) {
    const code = data.code ? `（${data.code}）` : ''
    if (resp.status === 429) throw new Error('问得有点快，歇十几秒再发我')
    if (resp.status === 401) throw new Error('助手暂时不可用，请联系维护者检查接口 Key')
    if (data.error) throw new Error(`${data.error}${code}`)
    throw new Error(`请求失败（${resp.status}）${code}`)
  }
  return data as { answer: string; think?: string; model?: string }
}

export const compressImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const max = 1024
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => reject(new Error('图片读取失败'))
    img.src = url
  })

export const askVision = async (image: string, question: string) => {
  const res = await callApi('/vision', {
    image,
    question:
      question ||
      '看看这张截图里是什么，有没有报错，我该怎么处理。只根据截图里实际能看到的画面回答，别整段复述图片文字；如果截图里没有报错信息，就直接说没看到，并告诉我需要截哪一块。',
  })
  return res.answer
}

/**
 * 回答一个问题：先匹配硬事实 → 文档检索 → 必要时联网 → 交给模型组织语言
 * @param q 用户问题
 * @param history 之前的对话（role/content）
 */
export const ask = async (
  q: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
): Promise<AskResult> => {
  const fact = FACTS.find((f) => f.re.test(q))
  if (fact) return { answer: fact.a, sources: [{ title: fact.t, url: fact.url, kind: 'doc' }], covered: true }

  const chunks = await loadIndex()
  const { hits, score } = searchDocs(chunks, q)
  // 用户明确说“上网搜/搜一下/查一下”时，不允许用本站文档抢答
  const wantsWeb = /(上网|网上搜|搜一下|搜索一下|帮我搜|联网|百度一下|查一下|谷歌|google|bing)/i.test(q)
  const covered = !wantsWeb && hits.length > 0 && score >= 12

  let expanded: DocChunk[] = []
  const intentTitle = INTENTS.find(([re]) => re.test(q))?.[1]
  if (intentTitle) {
    const same = chunks.filter((c) => c.title === intentTitle)
    const toks = tokenize(q)
    const rel = same.filter((c) => toks.some((t) => (c.text + (c.heading || '')).includes(t)))
    expanded = (rel.length ? rel : same).slice(0, 6)
  }
  const titles: string[] = []
  for (const h of hits) if (!titles.includes(h.title) && titles.length < 2) titles.push(h.title)
  expanded = [...expanded, ...titles.flatMap((t) => chunks.filter((c) => c.title === t).slice(0, 4))]
  expanded = expanded.filter((c, i, a) => a.findIndex((x) => x === c) === i).slice(0, 8)

  const webHits = covered ? [] : await searchWeb(q)

  const docPart = covered
    ? `【本站文档原文片段】\n${expanded
        .map((h) => `·《${h.title}》${h.heading ? ` - ${h.heading}` : ''}\n${h.text.slice(0, 300)}`)
        .join('\n\n')}`
    : ''
  const webPart = webHits.length
    ? `【本站文档没命中；以下是维基百科检索摘要，仅供参考】\n${webHits
        .map((w) => `· ${w.title}：${w.snippet}`)
        .join('\n')}`
    : ''

  const rule = wantsWeb
    ? webHits.length
      ? '用户要求联网检索：只依据【检索摘要】里的事实作答，开头注明“（以下为外部检索结果，非本站文档原文）”，并保留摘要里的关键数字；摘要里没有的内容不要补。'
      : '用户要求联网检索，但本站只接了维基百科检索、这次没查到条目。不要编造任何具体数据（天气、价格、比分、日期都不许猜）。回答两句话：说明这个问题不在本站文档范围、本次外部检索没有结果；然后告诉用户可以点下面按钮直接去搜索。'
    : covered
    ? '直接依据【本站文档原文片段】回答用户的问题，片段可能来自几篇不同页面：先判断用户问的是哪个对象，只取对应那一篇，不要把不相干的步骤拼进来。不要复述文档里的提问模板或示例话术。用简洁中文列可执行步骤，不编造原文没有的按钮名和路径，正文不写 [1] 这类编号。'
    : '本站文档没有直接对应的内容：能给通用方向就给，但必须说明这部分不是本站文档写的；不要编具体数字。'

  const messages = [
    ...history.slice(-8),
    {
      role: 'user' as const,
      content: `${docPart}${webPart ? `\n\n${webPart}` : ''}\n\n【要求】${rule}\n我的问题：${q}`,
    },
  ]
  const res = await callApi('/chat', { messages })
  history.push({ role: 'user', content: q }, { role: 'assistant', content: res.answer })

  const saysMissing = /未收录|没收录|没有收录|未找到相关|文档中没有|文档里没有|暂未覆盖/.test(
    res.answer.slice(0, 100),
  )
  const finalCovered = covered && !saysMissing
  let web = webHits
  if (!finalCovered && !web.length) web = await searchWeb(q)
  if (!finalCovered && !web.length) {
    web = [
      {
        title: `去搜索：${q.slice(0, 20)}`,
        url: 'https://www.bing.com/search?q=' + encodeURIComponent(q),
        snippet: '外部搜索引擎',
      },
    ]
  }

  const docHits: DocChunk[] = intentTitle ? expanded.slice(0, 2) : hits.slice(0, 4)
  const sources: Source[] = finalCovered
    ? docHits.map((h) => ({
        title: h.heading ? `${h.title} · ${h.heading}` : h.title,
        url: h.url,
        kind: 'doc' as const,
      }))
    : web.map((w) => ({ title: w.title, url: w.url, kind: 'web' as const }))

  return { answer: res.answer, sources, covered: finalCovered }
}
