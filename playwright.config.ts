import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  use: {
    baseURL: 'http://127.0.0.1:4179',
    channel: 'chrome',
    viewport: { width: 1200, height: 900 }
  },
  projects: [{ name: 'webtalk' }, { name: 'webtalk-chat' }],
  webServer: {
    command: 'pnpm exec vite preview --config vite.embed.config.ts --host 127.0.0.1 --port 4179 --strictPort',
    url: 'http://127.0.0.1:4179',
    reuseExistingServer: false
  }
})
