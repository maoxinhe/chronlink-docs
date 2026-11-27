<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { ask, askVision, compressImage, type Source } from '../ai-core'

type Msg = {
  role: 'user' | 'assistant'
  text: string
  image?: string
  sources?: Source[]
  covered?: boolean
  error?: boolean
}

const messages = ref<Msg[]>([])
const draft = ref('')
const busy = ref(false)
const online = ref(false)
const pickImage = ref<string | null>(null)
const scrollBox = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLTextAreaElement | null>(null)
const fileEl = ref<HTMLInputElement | null>(null)

const QUICK = [
  { label: '怎么安装', q: '启动器怎么安装？' },
  { label: '启动报错', q: '启动时报错打不开怎么办？' },
  { label: '加模组光影', q: '怎么给实例加模组和光影？' },
  { label: 'Java 版本', q: 'Java 要装哪个版本？' },
]

const grow = () => {
  const el = inputEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 180) + 'px'
}

const toBottom = () => {
  nextTick(() => {
    const el = scrollBox.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

const onPick = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    pickImage.value = await compressImage(file)
  } catch {
    pickImage.value = null
  }
  ;(e.target as HTMLInputElement).value = ''
}

const submit = async (forced?: string) => {
  if (busy.value) return
  const q = (forced ?? draft.value).trim()
  if (!q && !pickImage.value) return

  const image = pickImage.value
  messages.value.push({ role: 'user', text: q || '（截图）', image: image || undefined })
  draft.value = ''
  pickImage.value = null
  busy.value = true
  grow()
  toBottom()

  try {
    if (image) {
      const answer = await askVision(image, q)
      messages.value.push({ role: 'assistant', text: answer })
    } else {
      const prefix = online.value ? `请联网检索：${q}` : q
      const res = await ask(prefix)
      messages.value.push({
        role: 'assistant',
        text: res.answer,
        sources: res.sources,
        covered: res.covered,
      })
    }
  } catch (err: any) {
    messages.value.push({ role: 'assistant', text: err?.message || '出了点问题，稍后再试', error: true })
  } finally {
    busy.value = false
    toBottom()
    nextTick(() => inputEl.value?.focus())
  }
}

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}

onMounted(() => {
  inputEl.value?.focus()
})
</script>

<template>
  <div class="ai-page" :class="{ chatting: messages.length }">
    <header class="ai-bar">
      <a class="back" href="/">← 返回文档</a>
      <img class="brand-logo" src="/logo-ai.png" alt="" />
      <span class="brand">喵科大小助手</span>
    </header>

    <main class="ai-main">
      <div v-if="!messages.length" class="hero">
        <img class="logo" src="/logo-ai.png" alt="ChronLink" />
        <h1>有什么可以帮你？</h1>
      </div>

      <div ref="scrollBox" class="thread">
        <div v-for="(m, i) in messages" :key="i" class="turn" :class="m.role">
          <img v-if="m.image" :src="m.image" class="shot" alt="上传的截图" />
          <p class="txt" :class="{ err: m.error }">{{ m.text }}</p>

          <div v-if="m.sources && m.sources.length" class="srcs">
            <span v-if="!m.covered" class="src-note">文档未收录 · 外部结果</span>
            <a
              v-for="(s, k) in m.sources"
              :key="k"
              class="src"
              :class="s.kind"
              :href="s.url"
              target="_blank"
              rel="noopener"
            >
              <span class="dot"></span>{{ s.title }}
            </a>
          </div>
        </div>

        <div v-if="busy" class="turn assistant">
          <p class="txt typing"><i></i><i></i><i></i></p>
        </div>
      </div>

      <div v-if="!messages.length" class="quick">
        <button v-for="item in QUICK" :key="item.q" type="button" @click="submit(item.q)">{{ item.label }}</button>
      </div>
    </main>

    <div class="composer-wrap">
      <div class="composer">
        <textarea
          ref="inputEl"
          v-model="draft"
          rows="1"
          placeholder="问点什么，或贴报错截图…"
          @input="grow"
          @keydown="onKey"
        />
        <img v-if="pickImage" :src="pickImage" class="pending" alt="待发送截图" />
        <div class="tools">
          <button
            type="button"
            class="tool"
            :class="{ on: online }"
            title="联网检索（文档没收录时用）"
            @click="online = !online"
          >
            <svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 9h-3.2a15 15 0 0 0-1.3-5.6A8 8 0 0 1 18.9 11ZM12 4.2c.9 1.3 1.6 3.7 1.8 6.8h-3.6C10.4 7.9 11.1 5.5 12 4.2ZM4.3 13h3.2c.2 2.2.7 4.1 1.3 5.6A8 8 0 0 1 4.3 13Zm0-2h3.2c.2-2.2.7-4.1 1.3-5.6A8 8 0 0 0 4.3 11Zm7.7 8.8c-.9-1.3-1.6-3.7-1.8-6.8h3.6c-.2 3.1-.9 5.5-1.8 6.8Zm4-3.2c.6-1.5 1.1-3.4 1.3-5.6h3.2a8 8 0 0 1-4.5 5.6Z"/></svg>
            联网
          </button>
          <button type="button" class="tool" title="上传截图" @click="fileEl?.click()">
            <svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M9 3 7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L18 3H9Zm3 5.5A5 5 0 1 1 12 18.5a5 5 0 0 1 0-10Zm0 2.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z"/></svg>
            截图
          </button>
          <input ref="fileEl" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp" hidden @change="onPick" />
          <span class="spacer"></span>
          <button type="button" class="send" :disabled="busy || (!draft.trim() && !pickImage)" @click="submit()">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3.4 20.6 21 12 3.4 3.4l.1 6.6L15 12 3.5 14l-.1 6.6Z"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--vp-c-bg, #fff);
  color: var(--vp-c-text-1, #1c1f23);
}
.ai-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--vp-c-divider, #eee9eb);
  font-size: 13px;
}
.ai-bar .back {
  color: var(--vp-c-text-2, #666);
  text-decoration: none;
}
.ai-bar .back:hover { color: var(--vp-c-brand-1, #d4568f); }
.ai-bar .brand-logo { width: 20px; height: 20px; border-radius: 50%; }
.ai-bar .brand { font-weight: 600; }
.ai-bar .hint { margin-left: auto; color: var(--vp-c-text-3, #999); }

.ai-main {
  flex: 1;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
}
.hero {
  text-align: center;
  margin: auto 0;
  padding: 40px 0 28px;
}
.hero .logo {
  width: 84px;
  height: 84px;
  display: block;
  margin: 0 auto 18px;
  border-radius: 22px;
}
.hero h1 { font-size: 26px; font-weight: 700; margin: 0 0 12px; }
.hero p { font-size: 14px; line-height: 1.8; color: var(--vp-c-text-2, #666); margin: 0; }

.thread { flex: 1; overflow-y: auto; padding: 22px 0 8px; }
.thread:empty { padding: 0; }
.turn { margin-bottom: 22px; max-width: 88%; }
.turn.user { margin-left: auto; }
.turn.user .txt {
  background: var(--vp-c-brand-1, #d4568f);
  color: #fff;
  padding: 10px 14px;
  border-radius: 14px 14px 4px 14px;
  width: fit-content;
  margin-left: auto;
}
.txt {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}
.turn.assistant .txt { padding: 2px 0; }
.txt.err { color: #c0392b; }
.shot {
  display: block;
  max-width: 320px;
  border-radius: 10px;
  margin-bottom: 8px;
  margin-left: auto;
}
.typing i {
  display: inline-block;
  width: 6px; height: 6px;
  margin-right: 5px;
  border-radius: 50%;
  background: var(--vp-c-text-3, #bbb);
  animation: blink 1.2s infinite;
}
.typing i:nth-child(2) { animation-delay: .2s; }
.typing i:nth-child(3) { animation-delay: .4s; }
@keyframes blink { 0%,80%,100% { opacity: .25 } 40% { opacity: .9 } }

.srcs { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 12px; }
.src-note { font-size: 12px; color: var(--vp-c-text-3, #999); width: 100%; }
.src {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid #f0d7e3;
  background: #fff8fa;
  color: #8a4463;
  text-decoration: none;
  max-width: 100%;
}
.src:hover { background: #ffeef4; }
.src .dot { width: 6px; height: 6px; border-radius: 50%; background: #d4568f; flex: 0 0 auto; }
.src.web { border-color: #d8e4f5; background: #f6faff; color: #3b5d8c; }
.src.web .dot { background: #4a7ac2; }

.quick { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; padding: 6px 0 22px; }
.quick button {
  font-size: 12.5px;
  padding: 6px 13px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider, #eee);
  background: transparent;
  color: var(--vp-c-text-2, #666);
  cursor: pointer;
}
.quick button:hover { border-color: #e8b7cc; color: var(--vp-c-brand-1, #d4568f); }

.composer-wrap {
  position: sticky;
  bottom: 0;
  background: linear-gradient(to bottom, transparent, var(--vp-c-bg, #fff) 26%);
  padding: 10px 20px 14px;
}
.composer {
  max-width: 760px;
  margin: 0 auto;
  border: 1px solid #ecd9e2;
  border-radius: 18px;
  background: var(--vp-c-bg, #fff);
  box-shadow: 0 8px 28px rgba(160, 80, 110, .10);
  padding: 12px 12px 10px;
}
.composer textarea {
  width: 100%;
  border: 0;
  outline: none;
  resize: none;
  font: inherit;
  font-size: 14.5px;
  line-height: 1.7;
  background: transparent;
  color: inherit;
  min-height: 26px;
}
.pending { max-height: 120px; border-radius: 10px; margin-top: 8px; }
.tools { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.tool {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider, #eee);
  background: transparent;
  color: var(--vp-c-text-3, #888);
  cursor: pointer;
}
.tool.on { border-color: #e8b7cc; color: var(--vp-c-brand-1, #d4568f); background: #fff5f7; }
.spacer { flex: 1; }
.send {
  width: 34px; height: 34px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: var(--vp-c-brand-1, #d4568f);
  color: #fff;
  cursor: pointer;
}
.send:disabled { opacity: .4; cursor: default; }
.disclaimer { text-align: center; font-size: 11px; color: var(--vp-c-text-3, #aaa); margin: 8px 0 0; }

@media (max-width: 640px) {
  .ai-bar { padding: 12px 16px; }
  .ai-bar .hint { display: none; }
  .hero h1 { font-size: 22px; }
  .ai-main { padding: 0 16px; }
  .composer-wrap { padding: 8px 12px 12px; }
}
</style>

<style>
[data-theme='dark'] .ai-page { background: #16171a; color: #e6e7eb; }
[data-theme='dark'] .ai-bar { border-color: #2a2b30; }
[data-theme='dark'] .composer { border-color: #2f3036; background: #1d1e22; box-shadow: none; }
[data-theme='dark'] .composer-wrap { background: linear-gradient(to bottom, transparent, #16171a 26%); }
[data-theme='dark'] .src { background: #241d22; border-color: #3a2b33; color: #e3aec5; }
[data-theme='dark'] .src.web { background: #1a2029; border-color: #2a3547; color: #9cc0f5; }
[data-theme='dark'] .quick button { border-color: #2f3036; color: #a9abb2; }
[data-theme='dark'] .tool { border-color: #2f3036; color: #8f929a; }
[data-theme='dark'] .tool.on { background: #241d22; border-color: #4a3340; color: #e3aec5; }
</style>
