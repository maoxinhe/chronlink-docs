import { defineClientConfig } from 'vuepress/client'
import './styles/index.css'

export default defineClientConfig({
  setup() {
    if (typeof window === 'undefined') return

    const mount = () => {
      if (document.getElementById('reading-progress')) return
      // 清理任何历史残留实例，保证只有一个
      document.querySelectorAll('#reading-progress').forEach((n) => n.remove())
      const el = document.createElement('div')
      el.id = 'reading-progress'
      el.innerHTML =
        '<svg viewBox="0 0 36 36"><circle class="track" cx="18" cy="18" r="15.5"/>' +
        '<circle class="bar" cx="18" cy="18" r="15.5"/></svg><span>0%</span>'
      document.body.appendChild(el)

      const bar = el.querySelector('.bar') as SVGCircleElement
      const label = el.querySelector('span') as HTMLSpanElement

      const update = () => {
        const root = document.documentElement
        const total = root.scrollHeight - root.clientHeight
        const progress = total > 0 ? Math.min(1, Math.max(0, root.scrollTop / total)) : 0
        bar.style.strokeDashoffset = String(100.5 * (1 - progress))
        label.textContent = `${Math.round(progress * 100)}%`
        const onDoc = !!document.querySelector('.vp-doc')
        el.classList.toggle('is-visible', onDoc && progress > 0.01 && progress < 0.995)
      }

      update()
      window.addEventListener('scroll', update, { passive: true })
      window.addEventListener('resize', update)
    }

    if (document.readyState === 'complete') setTimeout(mount, 400)
    else window.addEventListener('load', () => setTimeout(mount, 400))
  },
})
