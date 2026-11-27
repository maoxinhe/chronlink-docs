import { defineClientConfig } from 'vuepress/client'
import './styles/index.css'

const API_BASE = 'https://user.camzy.tech'
const API_KEY = 'ak_bA636FVtGVqWTIgY1BBYWWrcLgd-eCMr'

type DocChunk = { title: string; heading: string; url: string; text: string }
type Source = { title: string; url: string; kind: 'doc' | 'web' }

let indexPromise: Promise<DocChunk[]> | null = null
const loadIndex = () => {
  if (!indexPromise) {
    const base = (import.meta as any).env?.BASE_URL || '/'
    indexPromise = fetch(`${base}docs-index.json`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
  }
  return indexPromise
}

const tokenize = (q: string) => {
  const tokens = new Set<string>()
  const lower = q.toLowerCase()
  for (const w of lower.match(/[a-z0-9][a-z0-9.+-]{1,}/g) || []) tokens.add(w)
  const runs = q.match(/[\u4e00-\u9fa5]{2,}/g) || []
  const STOP = /^(怎么|如何|什么|为什么|能不能|可以|是否|哪里|哪个|一下|问题|办法|情况|回事|请问|求助|解决|这样|那样|怎样|么样|吗|呢)$/
  for (const run of runs) {
    if (run.length <= 4) tokens.add(run)
    for (let i = 0; i < run.length - 1; i++) tokens.add(run.slice(i, i + 2))
    for (let i = 0; i < run.length - 2; i++) tokens.add(run.slice(i, i + 3))
  }
  return [...tokens].filter((t) => t.length >= 2 && !STOP.test(t)).slice(0, 40)
}

const searchDocs = (chunks: DocChunk[], q: string) => {
  const tokens = tokenize(q)
  if (!tokens.length || !chunks.length) return { hits: [] as DocChunk[], score: 0 }

  // 文档频率：词越罕见越有辨识度，但常见词也保留、只是权重低，避免"一个词都不剩"
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
    let headingHit = false
    for (const [t, w] of weights) {
      let hit = false
      if (c.heading.toLowerCase().includes(t)) {
        s += 4 * w
        headingHit = true
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
    return { c, s, matched, headingHit }
  })
  scored.sort((a, b) => b.s - a.s)
  const best = scored[0]
  if (!best || best.s <= 0 || best.matched < 1) return { hits: [] as DocChunk[], score: 0 }
  const hits = scored.filter((x) => x.s >= Math.max(6, best.s * 0.35)).slice(0, 6)
  return { hits: hits.map((x) => x.c), score: best.s }
}

const searchWeb = async (q: string) => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 4000)
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
    }))
  } catch {
    return [] as Array<{ title: string; url: string; snippet: string }>
  } finally {
    clearTimeout(timer)
  }
}


// 常见问法 -> 对应文档页（比纯词频检索更稳，避免"怎么安装"被答成某个报错页）
const INTENTS: Array<[RegExp, string]> = [
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

const mountAssistant = (host: HTMLElement | null) => {
  if (document.getElementById('cl-ai')) return
  const embedded = !!host

  const root = document.createElement('div')
  root.id = 'cl-ai'
  if (embedded) root.classList.add('embedded')
  root.innerHTML = `
  <button id="cl-ai-launch" type="button" aria-label="打开 AI 助手">
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 2a2 2 0 0 1 2 2v1h3a4 4 0 0 1 4 4v3h1a2 2 0 0 1 0 4h-1v3a4 4 0 0 1-4 4h-3v1a2 2 0 0 1-4 0v-1H8a4 4 0 0 1-4-4v-3H3a2 2 0 0 1 0-4h1V9a4 4 0 0 1 4-4h3V4a2 2 0 0 1 2-2Zm-2 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm4 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm-5.5 6.2a.9.9 0 0 0 .3 1.3c1.2.7 2.8 1 3.2 1s2-.3 3.2-1a.9.9 0 1 0-.9-1.6c-.9.5-1.9.7-2.3.7s-1.4-.2-2.3-.7a.9.9 0 0 0-1 .1Z"/></svg>
    <span class="label">AI 助手</span>
  </button>
  <div id="cl-ai-panel" hidden>
    <header>
      <div class="ttl">
        <strong>喵科大小助手</strong>
        <span>查本站文档作答，并给出原文位置</span>
      </div>
      <button id="cl-ai-close" type="button" aria-label="关闭">✕</button>
    </header>
    <div id="cl-ai-body">
      <div class="msg bot">
        <div class="bubble">我是文档助手。装不上、报错、找不到按钮，直接问，或者把报错截图发我。回答会附上文档原文位置，没收录的我会标出来。</div>
      </div>
      <div class="chips">
        <button type="button" data-q="启动器怎么安装？">怎么安装</button>
        <button type="button" data-q="启动时报错打不开怎么办？">启动报错</button>
        <button type="button" data-q="怎么给实例添加 mod 和光影？">加模组光影</button>
        <button type="button" data-q="Java 要装哪个版本？">Java 版本</button>
      </div>
    </div>
    <div id="cl-ai-img-preview" hidden>
      <img alt="待发送图片" />
      <button type="button" id="cl-ai-img-remove" aria-label="移除图片">✕</button>
    </div>
    <form id="cl-ai-form">
      <label id="cl-ai-pick" title="上传截图">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M9 3 7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L18 3H9Zm3 5.5A5 5 0 1 1 12 18.5a5 5 0 0 1 0-10Zm0 2.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z"/></svg>
        <input id="cl-ai-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp" hidden />
      </label>
      <textarea id="cl-ai-input" rows="1" placeholder="描述你遇到的问题，或粘贴报错截图…"></textarea>
      <button id="cl-ai-send" type="submit" aria-label="发送">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3.4 20.6 21 12 3.4 3.4l.1 6.6L15 12 3.5 14l-.1 6.6Z"/></svg>
      </button>
    </form>
    <p class="tip">AI 生成内容仅供参考；标注「网络」的来源非本站文档。</p>
  </div>`

  if (embedded) {
    host.appendChild(root)
    root.classList.add('open')
    const p = root.querySelector('#cl-ai-panel') as HTMLElement
    p.hidden = false
    root.querySelector('#cl-ai-launch')?.remove()
  } else {
    document.body.appendChild(root)
  }

  const panel = root.querySelector('#cl-ai-panel') as HTMLElement
  const body = root.querySelector('#cl-ai-body') as HTMLElement
  const form = root.querySelector('#cl-ai-form') as HTMLFormElement
  const input = root.querySelector('#cl-ai-input') as HTMLTextAreaElement
  const sendBtn = root.querySelector('#cl-ai-send') as HTMLButtonElement
  const fileInput = root.querySelector('#cl-ai-file') as HTMLInputElement
  const preview = root.querySelector('#cl-ai-img-preview') as HTMLElement
  const previewImg = preview.querySelector('img') as HTMLImageElement
  const history: Array<{ role: 'user' | 'assistant'; content: string }> = []
  let pendingImage: string | null = null
  let busy = false

  const open = () => {
    panel.hidden = false
    root.classList.add('open')
    setTimeout(() => input.focus(), 60)
  }
  const close = () => {
    if (embedded) return
    panel.hidden = true
    root.classList.remove('open')
  }

  root.querySelector('#cl-ai-launch')?.addEventListener('click', () => (panel.hidden ? open() : close()))
  root.querySelector('#cl-ai-close')!.addEventListener('click', close)

  const scrollBottom = () => {
    body.scrollTop = body.scrollHeight
  }

  const pageTitle = () => document.querySelector('h1')?.textContent?.trim() || document.title

  const pageContext = () => {
    const doc = document.querySelector('.vp-doc')
    const text = (doc?.textContent || '').replace(/\s+/g, ' ').slice(0, 1000)
    return `【用户正在看：${pageTitle()}】\n${text}`
  }

  const addMsg = (role: 'user' | 'assistant', text: string, image?: string) => {
    const wrap = document.createElement('div')
    wrap.className = `msg ${role}`
    const bubble = document.createElement('div')
    bubble.className = 'bubble'
    if (image) {
      const img = document.createElement('img')
      img.src = image
      img.className = 'shot'
      bubble.appendChild(img)
    }
    const p = document.createElement('div')
    p.className = 'text'
    p.textContent = text
    bubble.appendChild(p)
    wrap.appendChild(bubble)
    body.appendChild(wrap)
    scrollBottom()
    return bubble
  }

  const appendThink = (bubble: HTMLElement, think: string) => {
    const details = document.createElement('details')
    details.className = 'think'
    details.innerHTML = '<summary>查看思考过程</summary>'
    const pre = document.createElement('p')
    pre.textContent = think
    details.appendChild(pre)
    bubble.appendChild(details)
    scrollBottom()
  }

  const addSources = (bubble: HTMLElement, sources: Source[], covered: boolean, query: string) => {
    if (sources.length) {
      const box = document.createElement('div')
      box.className = 'src'
      if (!covered) {
        const note = document.createElement('p')
        note.className = 'src-note'
        note.textContent = '本站文档没收录这条，下面是外部检索结果，仅供参照：'
        box.appendChild(note)
      }
      sources.forEach((s) => {
        const a = document.createElement('a')
        a.className = `src-btn ${s.kind}`
        a.href = s.url
        a.target = '_blank'
        a.rel = 'noopener'
        const badge = document.createElement('span')
        badge.className = `badge ${s.kind}`
        badge.textContent = s.kind === 'web' ? '网络' : '文档'
        const txt = document.createElement('span')
        txt.className = 'txt'
        txt.textContent = s.title
        a.appendChild(badge)
        a.appendChild(txt)
        box.appendChild(a)
      })
      bubble.appendChild(box)
    }
    if (!covered) {
      const more = document.createElement('a')
      more.className = 'src-btn plain'
      more.href = `https://www.bing.com/search?q=${encodeURIComponent(`${query} Minecraft`)}`
      more.target = '_blank'
      more.rel = 'noopener'
      more.textContent = '去网上搜更多'
      bubble.appendChild(more)
    }
    scrollBottom()
  }

  const addThinking = () => {
    const wrap = document.createElement('div')
    wrap.className = 'msg bot thinking'
    wrap.innerHTML = '<div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>'
    body.appendChild(wrap)
    scrollBottom()
    return wrap
  }

  const callApi = async (endpoint: '/chat' | '/vision', payload: Record<string, unknown>) => {
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

  const compress = (file: File): Promise<string> =>
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

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    if (!file) return
    try {
      pendingImage = await compress(file)
      previewImg.src = pendingImage
      preview.hidden = false
    } catch {
      addMsg('bot', '这张图我读不了，换个 png / jpg 再试试？')
    }
    fileInput.value = ''
  })

  root.querySelector('#cl-ai-img-remove')!.addEventListener('click', () => {
    pendingImage = null
    preview.hidden = true
    previewImg.src = ''
  })

  const send = async (question: string) => {
    if (busy) return
    const q = question.trim()
    if (!q && !pendingImage) return
    busy = true
    sendBtn.disabled = true
    input.value = ''
    input.style.height = 'auto'

    const image = pendingImage
    pendingImage = null
    preview.hidden = true
    previewImg.src = ''
    addMsg('user', q || '（图片）', image || undefined)

    const typing = addThinking()
    try {
      let res: { answer: string; think?: string }

      if (image) {
        res = await callApi('/vision', {
          image,
          question: `我在看《${pageTitle()}》这篇文档。我的问题：${
            q || '看看这张截图里是什么，有没有报错，我该怎么处理'
          }。只根据截图里实际能看到的画面回答，别整段复述图片文字；如果截图里没有报错信息，就直接说没看到，并告诉我还需要截哪一块。`,
        })
        typing.remove()
        const bubble = addMsg('bot', res.answer)
        if (res.think) appendThink(bubble, res.think)
      } else {
        const chunks = await loadIndex()
        const { hits, score } = searchDocs(chunks, q)
        const covered = hits.length > 0 && score >= 10

        // 按“页面”而不是“片段”取上下文：命中最高的 3 篇整页带进来
        let expanded: DocChunk[] = []
        const intentTitle = INTENTS.find(([re]) => re.test(q))?.[1]
        if (intentTitle) {
          expanded = chunks.filter((c) => c.title === intentTitle).slice(0, 6)
        }
        const titles: string[] = []
        for (const h of hits) if (!titles.includes(h.title) && titles.length < 2) titles.push(h.title)
        expanded = [...expanded, ...titles.flatMap((t) => chunks.filter((c) => c.title === t).slice(0, 4))]
        expanded = expanded.filter((c, i, a) => a.findIndex((x) => x === c) === i).slice(0, 9)

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

        const rule = covered
          ? '直接依据【本站文档原文片段】回答用户的问题，片段可能来自几篇不同页面：先判断用户问的是哪个对象，只取对应那一篇（例如问“启动器怎么安装”就用《安装与更新》里的下载、安装、确认三步），不要把“给实例装模组”“某个具体报错”“怎么更新”的步骤拼进来。不要复述文档里的提问模板或示例话术。用简洁中文列可执行步骤，不编造原文没有的按钮名和路径，正文不写 [1] 这类编号。'
          : '先依据【用户当前所在页面】作答；页面里确实没有，就给通用方向，并说明这部分不是本站文档写的。'

        history.push({
          role: 'user',
          content: `${covered ? `【用户当前在：${pageTitle()}】` : pageContext()}\n\n${docPart}${
            webPart ? `\n\n${webPart}` : ''
          }\n\n【要求】${rule}\n我的问题：${q}`,
        })
        res = await callApi('/chat', { messages: history.slice(-10) })
        history.push({ role: 'assistant', content: res.answer })
        typing.remove()

        const bubble = addMsg('bot', res.answer)

        // 模型自己都说"未收录"，就别挂文档出处，改走网络来源
        const saysMissing = /未收录|没收录|没有收录|未找到相关|文档中没有|文档里没有|暂未覆盖/.test(
          res.answer.slice(0, 100),
        )
        let finalCovered = covered && !saysMissing
        let web = webHits
        if (!finalCovered && !web.length) web = await searchWeb(q)

        ;(window as any).L = ((window as any).L || []).concat([{ stage: 'pre', fc: finalCovered, w: web.length }])
        const docHits: DocChunk[] = intentTitle
          ? [...chunks.filter((c) => c.title === intentTitle).slice(0, 2), ...hits]
          : hits
        const sources: Source[] = finalCovered
          ? docHits.map((h) => ({
              title: h.heading ? `${h.title} · ${h.heading}` : h.title,
              url: h.url,
              kind: 'doc' as const,
            }))
          : web.map((w) => ({ title: w.title, url: w.url, kind: 'web' as const }))
        addSources(bubble, sources, finalCovered, q)
        if (res.think) appendThink(bubble, res.think)
      }
    } catch (e: any) {
      typing.remove()
      addMsg('bot', `出了点问题：${e?.message || '未知错误'}。也可以先翻一下对应文档页。`)
    } finally {
      busy = false
      sendBtn.disabled = false
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    send(input.value)
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault()
      send(input.value)
    }
  })
  input.addEventListener('input', () => {
    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`
  })
  body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const chip = target.closest('.chips button') as HTMLButtonElement | null
    if (chip) send(chip.dataset.q || chip.textContent || '')
  })
}

export default defineClientConfig({
  setup() {
    if (typeof window === 'undefined') return
    const boot = () => setTimeout(() => mountAssistant(document.getElementById('cl-ai-embed')), 400)
    if (document.readyState === 'complete') boot()
    else window.addEventListener('load', boot)
  },
})
