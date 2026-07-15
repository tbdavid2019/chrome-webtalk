import path from 'node:path'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { reactSvg } from './vite.react-svg'
import { resolveWebTalkDomain } from './src/app/embed/domain'

const variant = process.env.WEBTALK_EMBED_VARIANT === 'chat' ? 'chat' : 'hybrid'
const entry = variant === 'chat' ? 'src/app/embed/chat.tsx' : 'src/app/embed/hybrid.tsx'
const fileName = variant === 'chat' ? 'webtalk-chat.js' : 'webtalk.js'
const webtalkDomain = resolveWebTalkDomain()

const createEmbedGuide = (): Plugin => ({
  name: 'webtalk-embed-guide',
  generateBundle() {
    const template = readFileSync(path.resolve('src/app/embed/public/index.html'), 'utf8')
    this.emitFile({
      type: 'asset',
      fileName: 'index.html',
      source: template.replaceAll('__WEBTALK_DOMAIN__', webtalkDomain)
    })
  }
})

export default defineConfig({
  publicDir: false,
  resolve: {
    alias: {
      '@': path.resolve('src')
    }
  },
  define: {
    __DEV__: false,
    __NAME__: JSON.stringify('webtalk-widget'),
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  plugins: [react(), reactSvg(), createEmbedGuide()],
  build: {
    outDir: 'output/webtalk',
    emptyOutDir: variant === 'chat',
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(entry),
      name: variant === 'chat' ? 'WebTalkChatEmbed' : 'WebTalkEmbed',
      formats: ['iife'],
      fileName: () => fileName
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
})
