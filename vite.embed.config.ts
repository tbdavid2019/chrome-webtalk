import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
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
  plugins: [react(), svgr({ include: '**/*.svg' })],
  build: {
    outDir: 'output/webtalk',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve('src/app/embed/main.tsx'),
      name: 'WebTalkEmbed',
      formats: ['iife'],
      fileName: () => 'webtalk.js'
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
})
