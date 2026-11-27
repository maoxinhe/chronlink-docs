import { defineClientConfig } from 'vuepress/client'
import './styles/index.css'
import AiChat from './components/AiChat.vue'

// AI 助手是独立页面（/ai/），不再往文档页右下角塞悬浮窗
export default defineClientConfig({
  enhance({ app }) {
    app.component('AiChat', AiChat)
  },
})
