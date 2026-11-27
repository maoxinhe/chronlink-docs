import { defineClientConfig } from 'vuepress/client'
import './styles/index.css'

const API_BASE = 'https://user.camzy.tech'
const API_KEY = 'ak_bA636FVtGVqWTIgY1BBYWWrcLgd-eCMr'

const mountAssistant = () => {
  if (document.getElementById('cl-ai')) return

  const root = document.createElement('div')
  root.id = 'cl-ai'
  root.innerHTML = `
  <button id="cl-ai-launch" type="button" aria-label="打开 AI 助手">
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 2a2 2 0 0 1 2 2v1h3a4 4 0 0 1 4 4v3h1a2 2 0 0 1 0 4h-1v3a4 4 0 0 1-4 4h-3v1a2 2 0 0 1-4 0v-1H8a4 4 0 0 1-4-4v-3H3a2 2 0 0 1 0-4h1V9a4 4 0 0 1 4-4h3V4a2 2 0 0 1 2-2Zm-2 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm4 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm-5.5 6.2a.9.9 0 0 0 .3 1.3c1.2.7 2.8 1 3.2 1s2-.3 3.2-1a.9.9 0 1 0-.9-1.6c-.9.5-1.9.7-2.3.7s-1.4-.2-2.3-.7a.9.9 0 0 0-1 .1Z"/></svg>
    <span class="label">AI 助手</span>
  </button>
  <div id="cl-ai-panel" hidden>
    <header>
      <div class="ttl">
        <strong>喵科大小助手</strong>
        <span>基于本站文档作答</span>
      </div>
      <button id="cl-ai-close" type="button" aria-label="关闭">✕</button>
    </header>
    <div id="cl-ai-body">
      <div class="msg bot">
        <div class="bubble">我是文档助手。装不上、报错、找不到按钮，直接问，或者把报错截图发我，我帮你对着文档排查。</div>
      </div>
      <div class="chips">
        <button type="button" data-q="启动器怎么安装？">怎么安装</button>
        <button type="button" data-q="启动时报错打不开怎么办？">启动报错</button>
        <button type="button" data-q="怎么给实例添加 mod 和光影？">加模组光影</button>
        <button type="button" data-q="正版和离线账户有什么区别，大型服务器进不去怎么办？">正版验证</button>
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
    <p class="tip">AI 生成内容仅供参考，以文档与官方说明为准。</p>
  </div>`
  document.body.appendChild(root)

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
    panel.hidden = true
    root.classList.remove('open')
  }

  root.querySelector('#cl-ai-launch')!.addEventListener('click', () => (panel.hidden ? open() : close()))
  root.querySelector('#cl-ai-close')!.addEventListener('click', close)

  const scrollBottom = () => {
    body.scrollTop = body.scrollHeight
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
  }

  const addThinking = () => {
    const wrap = document.createElement('div')
    wrap.className = 'msg bot thinking'
    wrap.innerHTML = '<div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>'
    body.appendChild(wrap)
    scrollBottom()
    return wrap
  }

  const pageTitle = () => document.querySelector('h1')?.textContent?.trim() || document.title

  const pageContext = () => {
    const title = pageTitle()
    const doc = document.querySelector('.vp-doc')
    const text = (doc?.textContent || '').replace(/\s+/g, ' ').slice(0, 1200)
    return `【用户正在看的文档页：${title}】\n页面内容摘要：${text}`
  }

  const callApi = async (endpoint: '/chat' | '/vision', payload: Record<string, unknown>) => {
    const resp = await fetch(`${API_BASE}/api/user/ai${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
      body: JSON.stringify(payload),
    })
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
      } else {
        history.push({ role: 'user', content: `${pageContext()}\n\n我的问题：${q}` })
        res = await callApi('/chat', { messages: history.slice(-10) })
        history.push({ role: 'assistant', content: res.answer })
      }
      typing.remove()
      const wrap = document.createElement('div')
      wrap.className = 'msg bot'
      const bubble = document.createElement('div')
      bubble.className = 'bubble'
      const textEl = document.createElement('div')
      textEl.className = 'text'
      textEl.textContent = res.answer
      bubble.appendChild(textEl)
      if (res.think) {
        const details = document.createElement('details')
        details.className = 'think'
        details.innerHTML = '<summary>查看思考过程</summary>'
        const pre = document.createElement('p')
        pre.textContent = res.think
        details.appendChild(pre)
        bubble.appendChild(details)
      }
      wrap.appendChild(bubble)
      body.appendChild(wrap)
      scrollBottom()
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
    if (document.readyState === 'complete') setTimeout(mountAssistant, 400)
    else window.addEventListener('load', () => setTimeout(mountAssistant, 400))
  },
})
