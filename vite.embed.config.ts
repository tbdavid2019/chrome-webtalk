import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { reactSvg } from './vite.react-svg'

const variant = process.env.WEBTALK_EMBED_VARIANT === 'chat' ? 'chat' : 'hybrid'
const entry = variant === 'chat' ? 'src/app/embed/chat.tsx' : 'src/app/embed/hybrid.tsx'
const fileName = variant === 'chat' ? 'webtalk-chat.js' : 'webtalk.js'

export default defineConfig({
  publicDir: path.resolve('src/app/embed/public'),
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
  plugins: [react(), reactSvg()],
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
